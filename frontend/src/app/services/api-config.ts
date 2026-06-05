// Configuración de la dirección de la API REST del backend
// En producción, Railway proveerá la URL del backend expuesta públicamente.
// Reemplazar la URL de producción aquí o configurarla mediante inyección dinámica.

import { isDevMode } from '@angular/core';

const DEV_API_URL = 'http://localhost:8000';
const PROD_API_URL = 'https://sistema-monitoreo-residuos-backend.up.railway.app'; // Reemplazar con la URL definitiva de Railway

export const API_BASE_URL = isDevMode() ? DEV_API_URL : window.location.origin.replace('vercel.app', 'up.railway.app'); 
// Fallback inteligente: si corre en vercel, intenta apuntar a railway, de lo contrario usa DEV_API_URL.

// Clave de API de Google Maps (Coloca tu clave aquí para quitar la advertencia de 'Esta página no puede cargar Google Maps correctamente')
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCOUOZVaXI6PEUSrlHpgql9Y5gmtkALDlQ';
