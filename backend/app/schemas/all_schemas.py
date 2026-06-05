from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- SCHEMAS DE AUTENTICACION ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    email: str
    first_name: str
    last_name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# --- SCHEMAS DE SECTORES ---
class SectorBase(BaseModel):
    name: str
    coordinates_json: str

class SectorCreate(SectorBase):
    pass

class SectorResponse(SectorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE USUARIOS ---
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str # admin_system, admin_municipal, operator
    zone_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    zone_id: Optional[int] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    zone: Optional[SectorResponse] = None
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE BITACORA ---
class ReportLogResponse(BaseModel):
    id: int
    report_id: int
    user_id: Optional[int] = None
    previous_status: Optional[str] = None
    new_status: str
    comment: Optional[str] = None
    created_at: datetime
    
    # Nombre del usuario que realizo la accion
    user_name: Optional[str] = None 
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE REPORTES ---
class ReportCreate(BaseModel):
    description: Optional[str] = None
    waste_type: str
    ml_confidence: float
    accumulation_level: str # leve, moderado, critico
    latitude: float
    longitude: float
    citizen_email: Optional[EmailStr] = None

class ReportUpdateStatus(BaseModel):
    status: str # pendiente, en_proceso, atendido
    comment: Optional[str] = None
    assigned_operator_id: Optional[int] = None

class ReportResponse(BaseModel):
    id: int
    image_url: str
    description: Optional[str] = None
    waste_type: str
    ml_confidence: float
    accumulation_level: str
    latitude: float
    longitude: float
    status: str
    sector_id: Optional[int] = None
    citizen_email: Optional[str] = None
    assigned_operator_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Datos extras enriquecidos
    sector_name: Optional[str] = None
    assigned_operator_name: Optional[str] = None
    logs: List[ReportLogResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE ESTADISTICAS ---
class SectorStats(BaseModel):
    sector_name: str
    total_reports: int
    pending_reports: int
    in_process_reports: int
    atendido_reports: int
    leve_reports: int
    moderado_reports: int
    critico_reports: int

class GeneralStats(BaseModel):
    total_reports: int
    pending_reports: int
    in_process_reports: int
    atendido_reports: int
    by_waste_type: dict
    by_sector: List[SectorStats]
