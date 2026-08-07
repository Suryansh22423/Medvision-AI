import random
import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models, schemas

def generate_patient_id(db: Session) -> str:
    while True:
        pid = f"PT-{random.randint(1000, 9999)}"
        exists = db.query(models.Patient).filter(models.Patient.id == pid).first()
        if not exists:
            return pid

def generate_analysis_id(db: Session) -> str:
    while True:
        aid = f"AN-{random.randint(30000, 39999)}"
        exists = db.query(models.Analysis).filter(models.Analysis.id == aid).first()
        if not exists:
            return aid

def get_patient(db: Session, patient_id: str):
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()

def list_patients(db: Session, query: Optional[str] = None):
    q = db.query(models.Patient)
    if query:
        search = f"%{query}%"
        q = q.filter(
            or_(
                models.Patient.name.like(search),
                models.Patient.id.like(search),
                models.Patient.condition.like(search)
            )
        )
    return q.all()

def create_patient(db: Session, patient: schemas.PatientCreate):
    pid = generate_patient_id(db)
    db_patient = models.Patient(
        id=pid,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        condition=patient.condition
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: str, patient_update: schemas.PatientUpdate):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        return None
    
    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient

def get_analysis(db: Session, analysis_id: str):
    return db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()

def list_analyses(
    db: Session,
    type: Optional[str] = None,
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
):
    q = db.query(models.Analysis)
    if type:
        q = q.filter(models.Analysis.type == type)
    if patient_id:
        q = q.filter(models.Analysis.patient_id == patient_id)
    if status:
        q = q.filter(models.Analysis.status == status)
    
    # Sort by date / creation time descending (most recent first)
    return q.order_by(models.Analysis.date.desc()).all()

def create_analysis(db: Session, analysis_data: dict):
    aid = generate_analysis_id(db)
    analysis_data["id"] = aid
    
    db_analysis = models.Analysis(**analysis_data)
    db.add(db_analysis)
    
    # Update linked patient's condition and last visit
    patient = db.query(models.Patient).filter(models.Patient.id == db_analysis.patient_id).first()
    if patient:
        patient.last_visit = datetime.date.today().isoformat()
        if db_analysis.type == "chest":
            patient.condition = f"{db_analysis.primary} (active)" if db_analysis.primary != "No Finding" else "Routine screening"
        else:
            patient.condition = f"{db_analysis.primary} of the {db_analysis.body_part}" if db_analysis.primary != "No fracture detected" else "Routine screening"
            
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

def update_analysis_status(db: Session, analysis_id: str, status: str):
    db_analysis = get_analysis(db, analysis_id)
    if not db_analysis:
        return None
    db_analysis.status = status
    db.commit()
    db.refresh(db_analysis)
    return db_analysis
