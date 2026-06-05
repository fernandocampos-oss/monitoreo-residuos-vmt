from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.dependencies import RoleChecker
from app.models.all_models import User
from app.schemas.all_schemas import UserResponse, UserCreate, UserUpdate

router = APIRouter(prefix="/api/users", tags=["Usuarios"])

# Permisos de roles
admin_system_only = RoleChecker(["admin_system"])
municipal_or_admin = RoleChecker(["admin_system", "admin_municipal"])

@router.get("", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    _ = Depends(municipal_or_admin)
):
    """Listar usuarios. Filtrable por rol (solo para administradores)"""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.id).all()


@router.get("/operators", response_model=List[UserResponse])
def get_operators(
    db: Session = Depends(get_db),
    _ = Depends(municipal_or_admin)
):
    """Retorna la lista de todos los operadores municipales (para la asignación en el panel)"""
    return db.query(User).filter(User.role == "operator").order_by(User.first_name).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _ = Depends(admin_system_only)
):
    """Crear un nuevo usuario municipal (solo disponible para el Administrador del Sistema)"""
    # Verificar si el correo ya existe
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario registrado con este correo electronico"
        )
        
    hashed_pwd = get_password_hash(user_in.password)
    
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=user_in.role,
        zone_id=user_in.zone_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    _ = Depends(municipal_or_admin)
):
    """Obtener detalle de un usuario específico"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    _ = Depends(admin_system_only)
):
    """Editar datos de un usuario (solo para Administrador del Sistema)"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
        
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _ = Depends(admin_system_only)
):
    """Eliminar un usuario del sistema (solo para Administrador del Sistema)"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    db.delete(db_user)
    db.commit()
    return
