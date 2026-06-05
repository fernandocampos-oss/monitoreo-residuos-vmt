from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña plana coincide con el hash almacenado"""
    try:
        # bcrypt exige comparar en formato de bytes
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Error al verificar contraseña: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Genera un hash bcrypt a partir de una contraseña plana"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], role: str, expires_delta: timedelta = None) -> str:
    """Genera un token de acceso JWT firmado"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Agregar email (sub) y el rol de usuario en la carga útil (payload) del token
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt
