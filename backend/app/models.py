import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from .database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, index=True) # e.g., PT-1043
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    condition = Column(String, default="Awaiting first study")
    last_visit = Column(String, default=lambda: datetime.date.today().isoformat())
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    analyses = relationship("Analysis", back_populates="patient", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True) # e.g., AN-20482
    date = Column(String, default=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    patient_name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    type = Column(String, nullable=False) # "chest" or "bone"
    body_part = Column(String, nullable=True) # optional, for bone
    primary = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False)
    status = Column(String, default="pending") # "pending", "reviewed", "flagged", "archived"
    notes = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    fracture_type = Column(String, nullable=True)
    localization = Column(Text, nullable=True)
    
    # Store lists of dicts e.g., [{"label": "Pneumonia", "confidence": 92}]
    findings = Column(JSON, nullable=False)
    
    # Store dict e.g., {"findings": "...", "impression": "...", "recommendations": "..."}
    report = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="analyses")
