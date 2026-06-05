-- Datos de prueba (Seed Data) para el Sistema de Monitoreo de Residuos - VMT
-- NOTA: La contraseña por defecto para todos los usuarios de prueba es: admin123

-- Limpiar tablas existentes para evitar conflictos de duplicados en la demo
TRUNCATE TABLE report_logs, reports, users, sectors RESTART IDENTITY CASCADE;

-- 1. Insertar Sectores (Zonas de VMT con polígonos de coordenadas en formato JSON)
INSERT INTO sectors (name, coordinates_json) VALUES
('Cercado VMT', '[[ -12.1612, -76.9365 ], [ -12.1580, -76.9240 ], [ -12.1695, -76.9215 ], [ -12.1720, -76.9340 ], [ -12.1612, -76.9365 ]]'),
('Jose Carlos Mariategui', '[[ -12.1480, -76.9240 ], [ -12.1420, -76.9120 ], [ -12.1560, -76.9080 ], [ -12.1610, -76.9220 ], [ -12.1480, -76.9240 ]]'),
('Nueva Esperanza', '[[ -12.1695, -76.9215 ], [ -12.1670, -76.9100 ], [ -12.1800, -76.9080 ], [ -12.1820, -76.9200 ], [ -12.1695, -76.9215 ]]'),
('Tablada de Lurin', '[[ -12.1720, -76.9450 ], [ -12.1700, -76.9340 ], [ -12.1850, -76.9310 ], [ -12.1880, -76.9420 ], [ -12.1720, -76.9450 ]]');

-- 2. Insertar Usuarios de Prueba (Administradores y Operadores)
-- Contraseña hasheada con bcrypt para "admin123": $2b$12$dKqBwK9iH7P4gH/u7vH4Fe2hY5Q6w48TqZg4c1K3H8p8Y4R8N9Y9a
INSERT INTO users (email, hashed_password, first_name, last_name, role, zone_id) VALUES
('admin.sistema@vmt.gob.pe', '$2b$12$D5AQ8n39YZKWDtF8YYIB.urY6N1gXsR3HaaJxE906uJbQWUBn9UN.', 'Juan', 'Perez', 'admin_system', NULL),
('admin.municipal@vmt.gob.pe', '$2b$12$D5AQ8n39YZKWDtF8YYIB.urY6N1gXsR3HaaJxE906uJbQWUBn9UN.', 'Maria', 'Gomez', 'admin_municipal', NULL),
('operador.cercado@vmt.gob.pe', '$2b$12$D5AQ8n39YZKWDtF8YYIB.urY6N1gXsR3HaaJxE906uJbQWUBn9UN.', 'Carlos', 'Ramos', 'operator', 1),
('operador.mariategui@vmt.gob.pe', '$2b$12$D5AQ8n39YZKWDtF8YYIB.urY6N1gXsR3HaaJxE906uJbQWUBn9UN.', 'Luis', 'Flores', 'operator', 2);

-- 3. Insertar Reportes de Prueba (Ubicados dentro de los polígonos de sectores respectivos)
INSERT INTO reports (image_url, description, waste_type, ml_confidence, accumulation_level, latitude, longitude, status, sector_id, citizen_email, assigned_operator_id) VALUES
(
    'https://res.cloudinary.com/demo/image/upload/v1621532000/sample.jpg', 
    'Gran acumulacion de bolsas de basura plastica en la esquina de la berma central.', 
    'plastico', 
    0.94, 
    'critico', 
    -12.1630, 
    -76.9310, 
    'pendiente', 
    1, 
    'vecino.cercado@gmail.com', 
    NULL
),
(
    'https://res.cloudinary.com/demo/image/upload/v1621532000/sample.jpg', 
    'Desechos organicos de mercado acumulados en la vereda publica, genera malos olores.', 
    'organico', 
    0.89, 
    'moderado', 
    -12.1490, 
    -76.9180, 
    'en_proceso', 
    2, 
    'vecino.mariategui@gmail.com', 
    4
),
(
    'https://res.cloudinary.com/demo/image/upload/v1621532000/sample.jpg', 
    'Escombros de construccion dejados al lado del parque infantil.', 
    'escombros', 
    0.92, 
    'critico', 
    -12.1780, 
    -76.9380, 
    'pendiente', 
    4, 
    'vecino.tablada@gmail.com', 
    NULL
),
(
    'https://res.cloudinary.com/demo/image/upload/v1621532000/sample.jpg', 
    'Papeles y carton acumulados cerca al paradero del transporte publico.', 
    'papel_carton', 
    0.85, 
    'leve', 
    -12.1730, 
    -76.9150, 
    'atendido', 
    3, 
    'vecino.esperanza@gmail.com', 
    NULL
);

-- 4. Insertar Historial de Bitacora para los reportes de prueba
INSERT INTO report_logs (report_id, user_id, previous_status, new_status, comment) VALUES
(1, NULL, NULL, 'pendiente', 'Reporte creado por el ciudadano.'),
(2, NULL, NULL, 'pendiente', 'Reporte creado por el ciudadano.'),
(2, 2, 'pendiente', 'en_proceso', 'Reporte asignado al operador Luis Flores para atencion inmediata.'),
(3, NULL, NULL, 'pendiente', 'Reporte creado por el ciudadano.'),
(4, NULL, NULL, 'pendiente', 'Reporte creado por el ciudadano.'),
(4, 3, 'pendiente', 'atendido', 'Limpieza y remocion de residuos completada satisfactoriamente.');
