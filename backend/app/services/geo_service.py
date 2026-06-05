import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.all_models import Sector

def check_point_in_polygon(lat: float, lng: float, coordinates_json_str: str) -> bool:
    """
    Verifica si un punto (latitud, longitud) se encuentra dentro de un polígono 
    de coordenadas representadas en formato JSON, utilizando el algoritmo de Ray-Casting.
    Esta es una implementación en Python puro que no requiere compilar ninguna librería C (como GEOS).
    """
    try:
        # El JSON contiene una lista de puntos: [[lat1, lng1], [lat2, lng2], ...]
        coords = json.loads(coordinates_json_str)
        if len(coords) < 3:
            return False # Un polígono requiere al menos 3 vértices
            
        inside = False
        n = len(coords)
        x, y = lat, lng
        
        # Algoritmo de Ray-Casting
        p1x, p1y = coords[0][0], coords[0][1]
        for i in range(n + 1):
            p2x, p2y = coords[i % n][0], coords[i % n][1]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xints:
                            inside = not inside
            p1x, p1y = p2x, p2y
            
        return inside
    except Exception as e:
        print(f"Error en cálculo de punto en polígono: {e}")
        return False

def find_sector_for_coordinates(lat: float, lng: float, db: Session) -> Optional[int]:
    """
    Recorre todos los sectores en la base de datos y retorna el ID del sector 
    al cual pertenecen las coordenadas indicadas, o None si no pertenece a ninguno.
    """
    sectors = db.query(Sector).all()
    for sector in sectors:
        if check_point_in_polygon(lat, lng, sector.coordinates_json):
            return sector.id
    return None
