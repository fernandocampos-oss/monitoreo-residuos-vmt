from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Crear motor de conexion de SQLAlchemy
# pool_pre_ping=True ayuda a reconectarse si Railway o Supabase cierran la conexion por inactividad
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# Fabrica de sesiones de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para la declaracion de modelos
Base = declarative_base()

# Dependencia para obtener la sesion en los endpoints de FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
