from sqlalchemy import Column, Integer, String, Text, Float, Double, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class Sector(Base):
    __tablename__ = "sectors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    coordinates_json = Column(Text, nullable=False) # Guardado como string JSON
    
    # Relaciones
    users = relationship("User", back_populates="zone")
    reports = relationship("Report", back_populates="sector")


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="operator") # admin_system, admin_municipal, operator
    zone_id = Column(Integer, ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relaciones
    zone = relationship("Sector", back_populates="users")
    assigned_reports = relationship("Report", back_populates="assigned_operator", foreign_keys="[Report.assigned_operator_id]")
    logs = relationship("ReportLog", back_populates="user")


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    waste_type = Column(String(100), nullable=False) # plastico, organico, escombros, papel_carton, otros
    ml_confidence = Column(Float, nullable=False)
    accumulation_level = Column(String(50), nullable=False) # leve, moderado, critico
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    status = Column(String(50), nullable=False, default="pendiente") # pendiente, en_proceso, atendido
    sector_id = Column(Integer, ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)
    citizen_email = Column(String(150), nullable=True)
    assigned_operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relaciones
    sector = relationship("Sector", back_populates="reports")
    assigned_operator = relationship("User", back_populates="assigned_reports", foreign_keys=[assigned_operator_id])
    logs = relationship("ReportLog", back_populates="report", cascade="all, delete-orphan")


class ReportLog(Base):
    __tablename__ = "report_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relaciones
    report = relationship("Report", back_populates="logs")
    user = relationship("User", back_populates="logs")
