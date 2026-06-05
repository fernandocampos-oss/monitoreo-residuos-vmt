// Configuración de la dirección de la API REST del backend
// En producción, Railway proveerá la URL del backend expuesta públicamente.
// Reemplazar la URL de producción aquí o configurarla mediante inyección dinámica.

import { isDevMode } from '@angular/core';

const DEV_API_URL = 'http://localhost:8000';
const PROD_API_URL = 'https://monitoreo-residuos-vmt.onrender.com';


export const API_BASE_URL = isDevMode() ? DEV_API_URL : PROD_API_URL;

// Clave de API de Google Maps (Coloca tu clave aquí para quitar la advertencia de 'Esta página no puede cargar Google Maps correctamente')
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCOUOZVaXI6PEUSrlHpgql9Y5gmtkALDlQ';
