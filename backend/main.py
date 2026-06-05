import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base

# Importar modelos para asegurar que se registren en Base.metadata
from app.models.all_models import Sector, User, Report, ReportLog

# Crear tablas en base de datos si no existen (ideal para inicializacion rapida de la demo)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API para el sistema de monitoreo colaborativo de residuos en Villa María del Triunfo",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones desde el frontend de Angular (desarrollo y produccion)
origins = [
    "http://localhost:4200", # Angular local dev server
    "http://localhost:8080",
    "http://127.0.0.1:4200",
    "*" # Puedes refinar esto en produccion con los dominios de Vercel
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Asegurar que el directorio de cargas locales de fallback exista
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Montar ruta estatica para servir las imagenes de fallback localmente
# Esto permitira acceder a las imagenes mediante: http://localhost:8000/static/uploads/filename.jpg
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Importar routers
from app.routers import auth, sectors, reports, users

# Registrar routers en la aplicacion
app.include_router(auth.router)
app.include_router(sectors.router)
app.include_router(reports.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    # Iniciar servidor localmente
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
