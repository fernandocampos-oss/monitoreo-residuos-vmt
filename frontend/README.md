# Frontend del Sistema de Monitoreo de Residuos - VMT

Este es la aplicación web (PWA) móvil y de escritorio para el "Sistema Web y Móvil de Monitoreo Colaborativo de Residuos en Villa María del Triunfo", construida con Angular.

---

## Requisitos Previos

* Node.js v18 o superior y npm instalados.

---

## Configuración del Entorno Local

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Configurar el endpoint del Backend:**
   * El archivo [api-config.ts](src/app/services/api-config.ts) detecta automáticamente si estás corriendo en local (`http://localhost:8000`) o en producción. 
   * Si desplegaste tu backend en una URL distinta de Railway, actualiza la constante `PROD_API_URL` en ese archivo.

3. **Google Maps API Key:**
   * El script de Google Maps se descarga dinámicamente en el cliente.
   * Si dispones de un API Key con facturación habilitada, puedes añadirlo a la variable `apiKey` en el componente del mapa [map-public.component.ts](src/app/pages/map-public/map-public.component.ts) o configurarla de forma global. 
   * Si no se especifica ninguna clave, el mapa se cargará en modo de desarrollo con marca de agua, lo cual es totalmente funcional para demostraciones.

---

## Ejecutar en Desarrollo

Inicia el servidor local de desarrollo de Angular:

```bash
npm run start
```

Ingresa a `http://localhost:4200` en tu navegador. 

---

## Despliegue en Vercel

Este frontend se despliega automáticamente en Vercel importando el repositorio de GitHub:
1. Crea un proyecto en Vercel.
2. Selecciona la carpeta raíz del monorepo e indica que el directorio raíz de la aplicación es `frontend`.
3. Vercel detectará la configuración de Angular y gestionará el build y despliegue continuo.
