from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.all_models import Report, User, Sector, ReportLog
from app.schemas.all_schemas import ReportResponse, ReportUpdateStatus, GeneralStats, SectorStats
from app.services.cloudinary_service import upload_image
from app.services.geo_service import find_sector_for_coordinates
import datetime

router = APIRouter(prefix="/api/reports", tags=["Reportes"])

# Verificación de roles
municipal_or_admin = RoleChecker(["admin_system", "admin_municipal", "operator"])
municipal_admin_only = RoleChecker(["admin_system", "admin_municipal"])

@router.get("", response_model=List[ReportResponse])
def get_reports(
    status: Optional[str] = None,
    sector_id: Optional[int] = None,
    accumulation_level: Optional[str] = None,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna la lista de todos los reportes, con opción a filtrar por 
    estado, sector, nivel de acumulación o por operador asignado.
    """
    query = db.query(Report)
    
    if status:
        query = query.filter(Report.status == status)
    if sector_id:
        query = query.filter(Report.sector_id == sector_id)
    if accumulation_level:
        query = query.filter(Report.accumulation_level == accumulation_level)
    if operator_id:
        query = query.filter(Report.assigned_operator_id == operator_id)
        
    reports = query.order_by(Report.created_at.desc()).all()
    
    # Enriquecer la respuesta con nombres correspondientes para el listado
    response_reports = []
    for report in reports:
        # Sector name
        sec_name = report.sector.name if report.sector else "Sin Sector"
        # Operator name
        op_name = None
        if report.assigned_operator:
            op_name = f"{report.assigned_operator.first_name} {report.assigned_operator.last_name}"
            
        r_dict = report.__dict__.copy()
        r_dict["sector_name"] = sec_name
        r_dict["assigned_operator_name"] = op_name
        response_reports.append(r_dict)
        
    return response_reports


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    waste_type: str = Form(...),
    ml_confidence: float = Form(...),
    accumulation_level: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    citizen_email: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Registra un reporte de acumulación de residuos (flujo ciudadano).
    Sube la foto (a Cloudinary o almacenamiento local), geolocaliza e identifica 
    el sector de VMT automáticamente mediante Shapely.
    """
    # 1. Leer bytes de la imagen
    file_bytes = await file.read()
    
    # 2. Subir imagen (usa Cloudinary o guarda en servidor si no hay credenciales)
    image_url = await upload_image(file_bytes, file.filename)
    
    # 3. Buscar sector geoespacial correspondiente
    sector_id = find_sector_for_coordinates(latitude, longitude, db)
    
    # 4. Crear el registro en la BD
    db_report = Report(
        image_url=image_url,
        description=description,
        waste_type=waste_type,
        ml_confidence=ml_confidence,
        accumulation_level=accumulation_level,
        latitude=latitude,
        longitude=longitude,
        status="pendiente",
        sector_id=sector_id,
        citizen_email=citizen_email
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    # 5. Agregar registro en la bitácora
    log_entry = ReportLog(
        report_id=db_report.id,
        user_id=None, # Creado de forma anónima por ciudadano
        previous_status=None,
        new_status="pendiente",
        comment="Reporte registrado por el ciudadano con ubicación geoespacial."
    )
    db.add(log_entry)
    db.commit()
    
    # Enriquecer la respuesta
    sec_name = db_report.sector.name if db_report.sector else "Sin Sector"
    r_dict = db_report.__dict__.copy()
    r_dict["sector_name"] = sec_name
    r_dict["assigned_operator_name"] = None
    r_dict["logs"] = [log_entry]
    
    return r_dict


@router.get("/stats/summary", response_model=GeneralStats)
def get_statistics(
    db: Session = Depends(get_db),
    _ = Depends(municipal_or_admin)
):
    """
    Retorna métricas y estadísticas agregadas para el dashboard de administración.
    """
    total = db.query(Report).count()
    pending = db.query(Report).filter(Report.status == "pendiente").count()
    in_process = db.query(Report).filter(Report.status == "en_proceso").count()
    atendido = db.query(Report).filter(Report.status == "atendido").count()
    
    # Agrupación por tipo de residuo
    waste_types = db.query(Report.waste_type).all()
    by_waste = {}
    for wt in waste_types:
        name = wt[0]
        by_waste[name] = by_waste.get(name, 0) + 1
        
    # Agrupación por sectores
    sectors = db.query(Sector).all()
    by_sector_stats = []
    for sector in sectors:
        s_reports = db.query(Report).filter(Report.sector_id == sector.id).all()
        
        s_total = len(s_reports)
        s_pending = sum(1 for r in s_reports if r.status == "pendiente")
        s_in_process = sum(1 for r in s_reports if r.status == "en_proceso")
        s_atendido = sum(1 for r in s_reports if r.status == "atendido")
        
        s_leve = sum(1 for r in s_reports if r.accumulation_level == "leve")
        s_moderado = sum(1 for r in s_reports if r.accumulation_level == "moderado")
        s_critico = sum(1 for r in s_reports if r.accumulation_level == "critico")
        
        by_sector_stats.append(SectorStats(
            sector_name=sector.name,
            total_reports=s_total,
            pending_reports=s_pending,
            in_process_reports=s_in_process,
            atendido_reports=s_atendido,
            leve_reports=s_leve,
            moderado_reports=s_moderado,
            critico_reports=s_critico
        ))
        
    return GeneralStats(
        total_reports=total,
        pending_reports=pending,
        in_process_reports=in_process,
        atendido_reports=atendido,
        by_waste_type=by_waste,
        by_sector=by_sector_stats
    )


@router.get("/{report_id}", response_model=ReportResponse)
def get_report_by_id(report_id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle completo de un reporte, incluyendo su historial de bitácora"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )
        
    # Enriquecer nombres de sector y operador
    sec_name = report.sector.name if report.sector else "Sin Sector"
    op_name = None
    if report.assigned_operator:
        op_name = f"{report.assigned_operator.first_name} {report.assigned_operator.last_name}"
        
    # Formatear logs para incluir el nombre del usuario
    formatted_logs = []
    for log in report.logs:
        log_dict = log.__dict__.copy()
        if log.user:
            log_dict["user_name"] = f"{log.user.first_name} {log.user.last_name} ({log.user.role})"
        else:
            log_dict["user_name"] = "Ciudadano"
        formatted_logs.append(log_dict)
        
    r_dict = report.__dict__.copy()
    r_dict["sector_name"] = sec_name
    r_dict["assigned_operator_name"] = op_name
    r_dict["logs"] = formatted_logs
    
    return r_dict


@router.patch("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status_update: ReportUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(municipal_or_admin)
):
    """
    Actualiza el estado de un reporte (pendiente -> en_proceso -> atendido), 
    asigna un operador y registra el evento en la bitácora.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )
        
    # Restricción: Los operadores solo pueden actualizar reportes que tengan asignados
    if current_user.role == "operator" and report.assigned_operator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Un operador solo puede actualizar los reportes asignados a su cuenta."
        )
        
    previous_status = report.status
    
    # Actualizar estado
    report.status = status_update.status
    
    # Asignar operador si se envía (solo administradores pueden asignar)
    if status_update.assigned_operator_id is not None:
        if current_user.role not in ["admin_system", "admin_municipal"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los administradores pueden asignar operadores a los reportes."
            )
        # Verificar que el usuario asignado existe y es un operador
        operator = db.query(User).filter(User.id == status_update.assigned_operator_id).first()
        if not operator or operator.role != "operator":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El ID asignado no corresponde a un operador válido."
            )
        report.assigned_operator_id = status_update.assigned_operator_id
        
    report.updated_at = datetime.datetime.utcnow()
    
    # Crear log en la bitácora
    log_comment = status_update.comment or f"Estado actualizado de {previous_status} a {status_update.status}."
    log_entry = ReportLog(
        report_id=report.id,
        user_id=current_user.id,
        previous_status=previous_status,
        new_status=status_update.status,
        comment=log_comment
    )
    
    db.add(log_entry)
    db.commit()
    db.refresh(report)
    
    # Responder con el reporte enriquecido
    return get_report_by_id(report.id, db)
