import os
import shutil
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import Patient, Analysis

# Seed mock data matching the frontend's src/lib/mock-data.ts
MOCK_PATIENTS = [
    {
        "id": "PT-1043",
        "name": "Amara Okafor",
        "age": 54,
        "gender": "Female",
        "last_visit": "2026-07-31",
        "condition": "Pneumonia (active)"
    },
    {
        "id": "PT-0871",
        "name": "Liam Castellanos",
        "age": 31,
        "gender": "Male",
        "last_visit": "2026-07-30",
        "condition": "Distal radius fracture"
    },
    {
        "id": "PT-0662",
        "name": "Sofia Lindqvist",
        "age": 67,
        "gender": "Female",
        "last_visit": "2026-07-30",
        "condition": "Cardiomegaly"
    },
    {
        "id": "PT-1120",
        "name": "Noah Brennan",
        "age": 22,
        "gender": "Male",
        "last_visit": "2026-07-29",
        "condition": "Ankle fracture"
    },
    {
        "id": "PT-0345",
        "name": "Priya Raghavan",
        "age": 45,
        "gender": "Female",
        "last_visit": "2026-07-28",
        "condition": "Suspected TB"
    },
    {
        "id": "PT-0982",
        "name": "Daniel Mwangi",
        "age": 38,
        "gender": "Male",
        "last_visit": "2026-07-27",
        "condition": "Routine screening"
    }
]

MOCK_ANALYSES = [
    {
        "id": "AN-20482",
        "date": "2026-07-31T09:14:00Z",
        "patient_id": "PT-1043",
        "patient_name": "Amara Okafor",
        "age": 54,
        "gender": "Female",
        "type": "chest",
        "body_part": None,
        "primary": "Pneumonia",
        "confidence": 92,
        "status": "pending",
        "notes": "Patient presenting with productive cough, high fever, and dyspnea for 4 days.",
        "image_url": "http://localhost:8000/uploads/sample-xray.jpg",
        "fracture_type": None,
        "localization": None,
        "findings": [
            {"label": "Pneumonia", "confidence": 92},
            {"label": "Consolidation", "confidence": 71},
            {"label": "Pleural Effusion", "confidence": 34},
            {"label": "Cardiomegaly", "confidence": 12},
            {"label": "Pneumothorax", "confidence": 4}
        ],
        "report": {
            "findings": "Patchy airspace opacification within the right lower lobe with air bronchograms. No pneumothorax. Cardiomediastinal silhouette within normal limits. Costophrenic angles preserved bilaterally.",
            "impression": "Findings most consistent with right lower lobe community-acquired pneumonia (92% model confidence).",
            "recommendations": "Correlate with clinical picture, inflammatory markers and sputum culture. Consider follow-up radiograph in 4–6 weeks to confirm resolution."
        }
    },
    {
        "id": "AN-20481",
        "date": "2026-07-30T16:02:00Z",
        "patient_id": "PT-0871",
        "patient_name": "Liam Castellanos",
        "age": 31,
        "gender": "Male",
        "type": "bone",
        "body_part": "Wrist",
        "primary": "Transverse fracture",
        "confidence": 88,
        "status": "reviewed",
        "notes": "Fall on outstretched hand (FOOSH). Severe pain and swelling over lateral wrist.",
        "image_url": "http://localhost:8000/uploads/sample-xray.jpg",
        "fracture_type": "Transverse fracture",
        "localization": "Distal radius, ~2 cm proximal to the articular surface, minimal dorsal angulation.",
        "findings": [
            {"label": "Transverse fracture", "confidence": 88},
            {"label": "Cortical disruption", "confidence": 64},
            {"label": "Soft tissue swelling", "confidence": 41},
            {"label": "Dislocation", "confidence": 9}
        ],
        "report": {
            "findings": "Transverse fracture line through the distal radial metaphysis with intact ulnar styloid. Mild dorsal angulation. No intra-articular extension identified.",
            "impression": "Acute extra-articular distal radius fracture (88% model confidence).",
            "recommendations": "Orthopaedic review for closed reduction and immobilisation. Repeat imaging post-reduction."
        }
    },
    {
        "id": "AN-20478",
        "date": "2026-07-30T11:47:00Z",
        "patient_id": "PT-0662",
        "patient_name": "Sofia Lindqvist",
        "age": 67,
        "gender": "Female",
        "type": "chest",
        "body_part": None,
        "primary": "Cardiomegaly",
        "confidence": 79,
        "status": "reviewed",
        "notes": "History of congestive heart failure. Shortness of breath on minimal exertion.",
        "image_url": "http://localhost:8000/uploads/sample-xray.jpg",
        "fracture_type": None,
        "localization": None,
        "findings": [
            {"label": "Cardiomegaly", "confidence": 79},
            {"label": "Pulmonary Edema", "confidence": 52},
            {"label": "Pleural Effusion", "confidence": 44},
            {"label": "Pneumonia", "confidence": 8}
        ],
        "report": {
            "findings": "Cardiothoracic ratio exceeds 0.55 on this PA projection. Mild perihilar haziness with upper zone vascular redistribution. Small bilateral pleural effusions.",
            "impression": "Cardiomegaly with features suggestive of mild pulmonary venous congestion.",
            "recommendations": "Echocardiography and BNP correlation recommended."
        }
    },
    {
        "id": "AN-20465",
        "date": "2026-07-29T08:20:00Z",
        "patient_id": "PT-1120",
        "patient_name": "Noah Brennan",
        "age": 22,
        "gender": "Male",
        "type": "bone",
        "body_part": "Ankle",
        "primary": "Oblique fracture",
        "confidence": 84,
        "status": "flagged",
        "notes": "Inversion injury of right ankle during basketball game. Inability to bear weight.",
        "image_url": "http://localhost:8000/uploads/sample-xray.jpg",
        "fracture_type": "Oblique fracture",
        "localization": "Lateral malleolus, oblique course extending distally, no talar shift.",
        "findings": [
            {"label": "Oblique fracture", "confidence": 84},
            {"label": "Soft tissue swelling", "confidence": 58},
            {"label": "Joint effusion", "confidence": 27}
        ],
        "report": {
            "findings": "Oblique fracture of the lateral malleolus without significant displacement. Ankle mortise preserved.",
            "impression": "Weber A type lateral malleolar fracture (84% model confidence).",
            "recommendations": "Immobilisation and weight-bearing assessment; clinical follow-up in 10 days."
        }
    },
    {
        "id": "AN-20450",
        "date": "2026-07-28T13:05:00Z",
        "patient_id": "PT-0345",
        "patient_name": "Priya Raghavan",
        "age": 45,
        "gender": "Female",
        "type": "chest",
        "body_part": None,
        "primary": "Tuberculosis",
        "confidence": 76,
        "status": "pending",
        "notes": "Chronic cough for 3 weeks, night sweats, and weight loss.",
        "image_url": "http://localhost:8000/uploads/sample-xray.jpg",
        "fracture_type": None,
        "localization": None,
        "findings": [
            {"label": "Tuberculosis", "confidence": 76},
            {"label": "Nodule / Mass", "confidence": 48},
            {"label": "Atelectasis", "confidence": 22}
        ],
        "report": {
            "findings": "Upper zone reticulonodular opacities with volume loss and possible cavitation on the right apex.",
            "impression": "Pattern suspicious for active pulmonary tuberculosis.",
            "recommendations": "Sputum AFB / GeneXpert testing and infection control precautions."
        }
    },
    {
        "id": "AN-20441",
        "date": "2026-07-27T10:33:00Z",
        "patient_id": "PT-0982",
        "patient_name": "Daniel Mwangi",
        "age": 38,
        "gender": "Male",
        "type": "chest",
        "body_part": None,
        "primary": "No Finding",
        "confidence": 95,
        "status": "reviewed",
        "notes": "Routine pre-employment screening radiograph.",
        "image_url": "http://localhost:8000/uploads/sample-xray.jpg",
        "fracture_type": None,
        "localization": None,
        "findings": [
            {"label": "No Finding", "confidence": 95},
            {"label": "Atelectasis", "confidence": 5},
            {"label": "Pneumonia", "confidence": 3}
        ],
        "report": {
            "findings": "Clear lung fields. Normal cardiomediastinal contours. No pleural abnormality.",
            "impression": "No acute cardiopulmonary abnormality detected.",
            "recommendations": "No radiological follow-up required."
        }
    }
]

def seed_db():
    print("Seeding database...")
    db = SessionLocal()
    
    try:
        # 1. Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # 2. Check if already seeded
        if db.query(Patient).count() > 0:
            print("Database already contains data. Seeding skipped.")
            return

        # 3. Create patients
        for p_data in MOCK_PATIENTS:
            db_patient = Patient(**p_data)
            db.add(db_patient)
        db.commit()
        print(f"Seeded {len(MOCK_PATIENTS)} patients.")

        # 4. Create analyses
        for a_data in MOCK_ANALYSES:
            db_analysis = Analysis(**a_data)
            db.add(db_analysis)
        db.commit()
        print(f"Seeded {len(MOCK_ANALYSES)} analyses.")

        # 5. Set up sample image in upload folder
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        uploads_dir = os.path.join(backend_dir, "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        src_image = os.path.join(backend_dir, "..", "src", "assets", "hero-xray.jpg")
        dest_image = os.path.join(uploads_dir, "sample-xray.jpg")
        
        if os.path.exists(src_image):
            shutil.copy(src_image, dest_image)
            print(f"Copied sample image to {dest_image}")
        else:
            # Fallback empty image file if src doesn't exist
            with open(dest_image, "wb") as f:
                f.write(b"")
            print(f"Created placeholder image at {dest_image}")
            
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
