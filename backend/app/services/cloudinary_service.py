import os
import uuid
import cloudinary
import cloudinary.uploader
from app.core.config import settings

# Inicializar Cloudinary si están presentes las credenciales
cloudinary_configured = False
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    try:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        cloudinary_configured = True
    except Exception as e:
        print(f"Error al configurar Cloudinary: {e}")

async def upload_image(file_bytes: bytes, file_name: str) -> str:
    """
    Sube una imagen. Si Cloudinary está configurado, la sube a la nube.
    De lo contrario, la guarda localmente en el servidor y retorna una URL local de fallback.
    """
    if cloudinary_configured:
        try:
            # Subir a Cloudinary directamente los bytes en memoria
            result = cloudinary.uploader.upload(
                file_bytes,
                folder="monitoreo_residuos",
                resource_type="image"
            )
            return result.get("secure_url")
        except Exception as e:
            print(f"Fallo subida a Cloudinary, aplicando fallback local. Detalle: {e}")

    # Fallback local: Guardar en disco
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Obtener extensión del archivo o por defecto .jpg
    _, ext = os.path.splitext(file_name)
    if not ext:
        ext = ".jpg"
        
    unique_name = f"{uuid.uuid4()}{ext}"
    local_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    
    with open(local_path, "wb") as f:
        f.write(file_bytes)
        
    # URL local expuesta por la ruta estática de FastAPI
    return f"/static/uploads/{unique_name}"
