import os
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env si existe
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Sistema Web y Móvil de Monitoreo Colaborativo de Residuos - VMT"
    
    # Base de Datos (Mapear a pg8000 que es puro Python para evitar problemas de compilación en Windows)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/residuos_vmt")
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    
    # JWT Seguridad
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_key_for_development_purposes_only_123456")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "180"))
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # Fallback Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

settings = Settings()
