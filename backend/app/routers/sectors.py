from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.models.all_models import Sector
from app.schemas.all_schemas import SectorResponse, SectorCreate

router = APIRouter(prefix="/api/sectors", tags=["Sectores"])

# Dependencias de roles
admin_only = RoleChecker(["admin_system"])

@router.get("", response_model=List[SectorResponse])
def get_all_sectors(db: Session = Depends(get_db)):
    """Retorna la lista de todos los sectores (zonas de VMT)"""
    return db.query(Sector).order_by(Sector.name).all()

@router.post("", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_sector(
    sector_in: SectorCreate, 
    db: Session = Depends(get_db),
    _ = Depends(admin_only)
):
    """Crea un nuevo sector (solo disponible para el Administrador del Sistema)"""
    db_sector = db.query(Sector).filter(Sector.name == sector_in.name).first()
    if db_sector:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un sector con este nombre"
        )
        
    new_sector = Sector(
        name=sector_in.name,
        coordinates_json=sector_in.coordinates_json
    )
    db.add(new_sector)
    db.commit()
    db.refresh(new_sector)
    return new_sector

@router.get("/{sector_id}", response_model=SectorResponse)
def get_sector_by_id(sector_id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle de un sector específico"""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sector no encontrado"
        )
    return sector
