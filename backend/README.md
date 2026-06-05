# Backend del Sistema de Monitoreo de Residuos - VMT

Este es el servidor API REST para el "Sistema Web y Móvil de Monitoreo Colaborativo de Residuos en Villa María del Triunfo", construido utilizando Python y el framework FastAPI.

---

## Requisitos Previos

* Python 3.10 o superior instalado.
* Base de datos PostgreSQL activa.

---

## Configuración del Entorno Local

1. **Crear un entorno virtual:**
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activar el entorno virtual:**
   * En Windows (PowerShell):
     ```bash
     .\venv\Scripts\Activate.ps1
     ```
   * En macOS / Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno:**
   * Copia el archivo `.env.example` y renombralo a `.env`.
   * Edita el archivo `.env` configurando la cadena de conexión de tu base de datos PostgreSQL local en `DATABASE_URL`.
   * Puedes omitir las credenciales de Cloudinary; el backend activará automáticamente el fallback de almacenamiento local de imágenes.

---

## Inicializar y Poblar la Base de Datos

Hemos provisto un script automatizado para crear la estructura de las tablas e inyectar usuarios, sectores y reportes de prueba:

```bash
python seed_db.py
```

* **Usuarios de Prueba creados:**
  * Administrador del Sistema: `admin.sistema@vmt.gob.pe` (Contraseña: `admin123`)
  * Administrador Municipal: `admin.municipal@vmt.gob.pe` (Contraseña: `admin123`)
  * Operador del sector Cercado: `operador.cercado@vmt.gob.pe` (Contraseña: `admin123`)
  * Operador del sector Mariátegui: `operador.mariategui@vmt.gob.pe` (Contraseña: `admin123`)

---

## Ejecutar el Servidor de Desarrollo

Inicia el servidor local de Uvicorn:

```bash
python main.py
```

El servidor estará disponible en `http://localhost:8000`.

### Documentación Interactiva de la API
Una vez encendido el servidor, puedes ingresar a las siguientes URL para probar y visualizar todos los endpoints de forma interactiva:
* Swagger UI: `http://localhost:8000/docs`
* Redoc: `http://localhost:8000/redoc`

---

## Despliegue en Railway

El proyecto contiene un archivo `Dockerfile` optimizado. Para desplegar en Railway:
1. Crea un nuevo proyecto en Railway enlazado a tu repositorio de GitHub.
2. Agrega un servicio de PostgreSQL si no lo tienes.
3. En el servicio del Backend, configura las siguientes Variables de Entorno en Railway:
   * `DATABASE_URL`: La URL de conexión provista por tu base de datos PostgreSQL.
   * `JWT_SECRET`: Una clave secreta alfanumérica segura para firmar los tokens JWT.
   * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Opcional, para producción).
