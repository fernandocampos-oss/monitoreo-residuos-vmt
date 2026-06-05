import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def run_seed():
    print(f"Iniciando inicialización de base de datos...")
    print(f"Conexión: {settings.DATABASE_URL}")
    
    # Determinar rutas absolutas de los archivos SQL
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(backend_dir)
    
    schema_path = os.path.join(workspace_dir, "database", "schema.sql")
    seed_path = os.path.join(workspace_dir, "database", "seed.sql")
    
    if not os.path.exists(schema_path):
        print(f"Error: No se encontró el archivo schema.sql en {schema_path}")
        return
        
    if not os.path.exists(seed_path):
        print(f"Error: No se encontró el archivo seed.sql en {seed_path}")
        return
        
    print(f"Cargando {schema_path}...")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
        
    print(f"Cargando {seed_path}...")
    with open(seed_path, "r", encoding="utf-8") as f:
        seed_sql = f.read()
        
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            # Iniciar una transaccion
            trans = conn.begin()
            try:
                print("Ejecutando schema.sql...")
                # Eliminar comentarios de linea vacios o limpiar sentencias para evitar problemas con ciertos drivers
                conn.execute(text(schema_sql))
                
                print("Ejecutando seed.sql...")
                conn.execute(text(seed_sql))
                
                trans.commit()
                print("¡Base de datos estructurada e inicializada exitosamente con datos de prueba!")
            except Exception as e:
                trans.rollback()
                print(f"Error al ejecutar sentencias SQL: {e}")
                raise e
                
    except Exception as e:
        print(f"Error de conexión o inicialización de la base de datos: {e}")

if __name__ == "__main__":
    run_seed()
