-- Esquema de la Base de Datos para el Sistema de Monitoreo de Residuos - VMT
-- Base de datos: PostgreSQL Estándar (Sin PostGIS)

-- 1. Tabla de Sectores (Zonas de Villa María del Triunfo)
CREATE TABLE IF NOT EXISTS sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    coordinates_json TEXT NOT NULL -- Polígono en formato JSON: [[lat, lng], [lat, lng], ...]
);

-- 2. Tabla de Usuarios (Administradores y Operadores de Limpieza)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'operator', -- admin_system, admin_municipal, operator
    zone_id INT REFERENCES sectors(id) ON DELETE SET NULL, -- Zona asignada (principalmente para operadores)
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- 3. Tabla de Reportes de Acumulación de Residuos
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    description TEXT,
    waste_type VARCHAR(100) NOT NULL, -- plastico, organico, escombros, papel_carton, otros
    ml_confidence DOUBLE PRECISION NOT NULL, -- Confianza del modelo de ML (0.0 a 1.0)
    accumulation_level VARCHAR(50) NOT NULL, -- leve, moderado, critico
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- pendiente, en_proceso, atendido
    sector_id INT REFERENCES sectors(id) ON DELETE SET NULL, -- Asignado automáticamente en el backend
    citizen_email VARCHAR(150), -- Opcional para enviar alertas de atención
    assigned_operator_id INT REFERENCES users(id) ON DELETE SET NULL, -- Operador a cargo de la limpieza
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- 4. Tabla de Bitácora de Acciones (Historial de estados y comentarios)
CREATE TABLE IF NOT EXISTS report_logs (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL, -- Usuario municipal que realizó el cambio
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    comment TEXT, -- Comentarios o detalles de la acción
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);
