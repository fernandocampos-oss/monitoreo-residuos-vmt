# Plan y Análisis Técnico: Sistema de Monitoreo de Residuos - VMT

Este documento consolida el análisis de requerimientos, la arquitectura, el diseño de la base de datos y el plan de desarrollo para el proyecto, adaptado a FastAPI (Backend), Angular (Frontend) y PostgreSQL estándar.

---

## 1. Análisis de la Propuesta y Cambios Realizados

A partir de los documentos del proyecto y tus indicaciones, se definieron los siguientes ajustes técnicos para el desarrollo y posterior despliegue en Vercel y Railway:

* **Frontend en Angular:** La interfaz web responsiva y PWA se desarrollará en Angular utilizando el módulo `@angular/google-maps` para la geolocalización.
* **Base de datos estándar (Sin PostGIS):** Railway no requiere PostGIS para este diseño. Almacenaremos las coordenadas geográficas de los reportes en dos columnas estándar: `latitude` (FLOAT) y `longitude` (FLOAT).
* **Sectores automáticos en FastAPI:** Para clasificar automáticamente los reportes por sector de VMT sin usar PostGIS, implementaremos la librería `shapely` en FastAPI. Al recibir las coordenadas del reporte, el backend ejecutará una validación geométrica de "punto en polígono" (Point-in-Polygon) y guardará el identificador del sector (`sector_id`) en PostgreSQL.
* **Seguridad y Prevención de Spam:** Implementaremos Rate Limiting en FastAPI y un filtro anti-bots (como Cloudflare Turnstile o Google reCAPTCHA v3) en el formulario de reporte para proteger los límites de almacenamiento gratuito de Cloudinary y la base de datos de envíos masivos automatizados.
* **Placeholder de Machine Learning:** Integraremos el modelo MobileNet v2 estándar desde el CDN de TensorFlow.js en Angular. Este clasificará las imágenes de forma preliminar mediante etiquetas (p. ej., "trash", "waste") para comprobar si contienen residuos antes del envío, sirviendo de placeholder hasta que entrenes el modelo final.
* **Diseño Responsivo y Estilo:** La interfaz será adaptable a dispositivos móviles (mobile-first), con diseño limpio y profesional, sin el uso de emojis en ningún componente visual ni de documentación.

---

## 2. Roles del Sistema

El acceso y permisos se gestionarán mediante roles validados por JSON Web Tokens (JWT) desde FastAPI:

| Rol | Método de Acceso | Permisos y Acciones |
| :--- | :--- | :--- |
| **Ciudadano** | Público (Sin login) | - Ver mapa público de reportes.<br>- Registrar reportes con foto y GPS. |
| **Operador de Limpieza** | Autenticado | - Ver reportes de su zona asignada.<br>- Registrar acciones de limpieza.<br>- Marcar reportes como "Atendido". |
| **Administrador Municipal** | Autenticado | - Panel con mapa completo y estadísticas.<br>- Asignar reportes a operadores.<br>- Modificar estados de reportes.<br>- Exportar datos a Excel/CSV. |
| **Administrador del Sistema** | Autenticado | - Gestión total de cuentas de usuarios (creación, edición).<br>- Configuración de parámetros de la plataforma. |

---

## 3. Diseño de la Base de Datos (PostgreSQL Estándar)

```sql
-- Tabla de Sectores (Zonas de VMT)
CREATE TABLE sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    coordinates_json TEXT NOT NULL -- Almacena el polígono de coordenadas para el cálculo de Shapely
);

-- Tabla de Usuarios (Administradores y Operadores)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'operator', -- admin_system, admin_municipal, operator
    zone_id INT REFERENCES sectors(id) ON DELETE SET NULL, -- Zona asignada (para operadores)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Reportes
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    description TEXT,
    waste_type VARCHAR(100) NOT NULL,
    ml_confidence FLOAT NOT NULL,
    accumulation_level VARCHAR(50) NOT NULL, -- leve, moderado, critico
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- pendiente, en_proceso, atendido
    sector_id INT REFERENCES sectors(id), -- Calculado automáticamente en FastAPI
    citizen_email VARCHAR(150),
    assigned_operator_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Estructura del Repositorio

El código se organizará como un monorepo preparado para despliegue automático:

```text
/sistema-monitoreo-residuos
  ├── /backend               # API REST en FastAPI
  │     ├── /app
  │     │     ├── /core      # Configuración, seguridad (JWT), base de datos
  │     │     ├── /models    # Modelos SQLModel/SQLAlchemy
  │     │     ├── /schemas   # Esquemas Pydantic
  │     │     ├── /routers   # Endpoints de reportes, usuarios y sectores
  │     │     └── /services  # Lógica de Shapely, Cloudinary y correos
  │     ├── main.py
  │     ├── requirements.txt
  │     └── Dockerfile       # Para despliegue automático en Railway
  ├── /frontend              # Aplicación Web y PWA en Angular
  │     ├── /src
  │     │     ├── /app
  │     │     │     ├── /components # Componentes de interfaz
  │     │     │     ├── /pages       # Vistas (Mapa, Dashboard, Reporte)
  │     │     │     ├── /services    # Conexión API, TensorFlow.js, Maps
  │     │     │     └── /guards      # Protección de rutas por roles
  │     │     └── /assets
  │     ├── package.json
  │     └── angular.json
  ├── .gitignore             # Evita subir archivos .env y node_modules
  └── README.md
```

---

## 5. Cronograma de Sprints

* **Sprint 1: Cimientos y Despliegue Inicial (Semanas 1-4):** Configuración del repositorio Git. Creación de la base de datos PostgreSQL. Desarrollo de la API inicial de FastAPI y despliegue a Railway.
* **Sprint 2: PWA Ciudadano (Semanas 5-8):** Construcción del formulario de reportes en Angular. Integración de Google Maps para ubicar incidentes. Configuración de Cloudinary para subida de imágenes y cálculo de sectores con Shapely en el backend.
* **Sprint 3: IA y Panel de Gestión (Semanas 9-12):** Integración de TensorFlow.js con MobileNet en Angular. Desarrollo del sistema de autenticación por roles y el panel de administración municipal para filtrado e historial.
* **Sprint 4: Piloto y Pruebas (Semanas 13-16):** Pruebas de usabilidad responsiva en móviles. Ejecución del piloto con un mínimo de 30 reportes reales. Ajustes finales del sistema y cierre del proyecto.
