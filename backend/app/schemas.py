from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class PatientBase(CamelModel):
    name: str
    age: int
    gender: str
    condition: Optional[str] = "Awaiting first study"

class PatientCreate(PatientBase):
    pass

class PatientUpdate(CamelModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    condition: Optional[str] = None

class PatientResponse(PatientBase):
    id: str
    last_visit: str
    analyses: int = 0

class Finding(CamelModel):
    label: str
    confidence: int

class ReportDetail(CamelModel):
    findings: str
    impression: str
    recommendations: str

class AnalysisCreate(CamelModel):
    type: str # "chest" or "bone"
    body_part: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    notes: Optional[str] = None

class AnalysisUpdateStatus(CamelModel):
    status: str

class BodyPartDetectionResponse(CamelModel):
    body_part: str
    confidence: int
    method: str

class AnalysisResponse(CamelModel):
    id: str
    date: str
    patient_id: str
    patient_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    type: str
    body_part: Optional[str] = None
    primary: str
    confidence: int
    status: str
    findings: List[Finding]
    report: ReportDetail
    fracture_type: Optional[str] = None
    localization: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None

class WeeklyVolumeItem(CamelModel):
    day: str
    chest: int
    bone: int

class DashboardStats(CamelModel):
    total_analyses: str
    recent_analyses: str
    pending_reviews: str
    model_accuracy: str
    total_delta: str
    recent_delta: str
    pending_delta: str
    accuracy_delta: str
    weekly_volume: List[WeeklyVolumeItem]
    recent_records: List[AnalysisResponse]

class TrainingStartRequest(CamelModel):
    type: str  # "chest" or "bone"
    epochs: int = 5
    lr: float = 0.001

class TrainingMetricItem(CamelModel):
    epoch: int
    loss: float
    accuracy: float

class TrainingStatusResponse(CamelModel):
    status: str
    type: Optional[str] = None
    current_epoch: int = 0
    total_epochs: int = 0
    progress: int = 0
    loss: float = 0.0
    accuracy: float = 0.0
    metrics_history: List[TrainingMetricItem] = []
    error: Optional[str] = None
