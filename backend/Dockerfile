FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias necesarias del sistema (si las hubiera, por ahora solo compilador basico para psycopg2 si no fuera binary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Comando para ejecutar la aplicacion con Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
