# MedVision AI Backend

FastAPI backend application for the **MedVision AI** medical imaging platform.

## Features

- **Patient Directory Management**: CRUD operations for patient demographics and histories.
- **Chest X-ray Analysis**: Multi-label screening utilizing PyTorch + TorchVision DenseNet121, running inference for 10 common thoracic findings.
- **Bone Fracture Analysis**: Fracture screening and classification across 11 different body parts (Hand, Wrist, Elbow, Foot, etc.).
- **Local Database Setup**: persistence layer using SQLAlchemy SQLite.
- **Radiology PDF Reports**: On-the-fly generation of stylized clinical radiology report PDFs utilizing ReportLab.
- **Secure File Storage**: Uploaded radiographs are handled, saved, and served securely on the local filesystem.
- **CORS Enabled**: Configured for cross-origin React/Vite frontend connection.

## Technology Stack

- **Framework**: FastAPI (Python 3.8+)
- **OR/M**: SQLAlchemy
- **DB**: SQLite (`medvision.db`)
- **Deep Learning**: PyTorch + TorchVision
- **Image Processing**: OpenCV + Albumentations
- **PDF Engine**: ReportLab

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py        # FastAPI Application Routing & CORS
│   ├── database.py    # SQLAlchemy Engine & Session Setup
│   ├── models.py      # SQLAlchemy ORM schemas (Patient, Analysis)
│   ├── schemas.py     # Pydantic validation schemas
│   ├── crud.py        # Database CRUD utilities
│   ├── ml.py          # PyTorch/OpenCV Machine Learning Service
│   ├── pdf.py         # ReportLab PDF report generation
│   └── seed.py        # Seeding mock medical data
├── uploads/           # Uploaded radiographs
├── requirements.txt   # Dependencies file
└── README.md          # Technical documentation
```

## Quick Start & Setup

### 1. Prerequisites
- Python 3.8 or higher installed on your workstation.

### 2. Create Virtual Environment
Run from the `backend/` directory:
```powershell
python -m venv venv
```

### 3. Activate Environment & Install Dependencies
On Windows (PowerShell):
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. Database Initialization & Seeding
Populate the local database with initial patients and studies matching the React frontend's mock profile:
```powershell
python -m app.seed
```
This creates a local `medvision.db` file in the `backend/` directory and sets up sample imaging directories.

### 5. Running the Application
Launch the Uvicorn ASGI server:

**Recommended (Windows — auto-frees port 8000 if already in use):**
```powershell
.\run.ps1
```

**Manual start:**
```powershell
uvicorn app.main:app --reload --port 8000
```

> **Port already in use?** Error `[Errno 10048]` means another process (often a previous backend instance) is bound to port 8000. Use `.\run.ps1` to stop it automatically, or run `netstat -ano | findstr :8000` to find the PID and stop it in Task Manager.

The server will start on [http://localhost:8000](http://localhost:8000). The interactive API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## API Documentation

| Endpoint | Method | Description |
|---|---|---|
| `/patients` | `GET` | List patients with optional search query |
| `/patients` | `POST` | Create a new patient profile |
| `/patients/{id}` | `GET` | Fetch specific patient detail |
| `/patients/{id}` | `PUT` | Update patient details |
| `/analysis/detect-body-part` | `POST` | Auto-detect anatomical region from an uploaded bone X-ray |
| `/analysis/chest` | `POST` | Upload and analyze a Chest X-ray (PyTorch CNN) |
| `/analysis/bone` | `POST` | Upload and analyze a Bone X-ray (Fracture classifier) |
| `/analysis/history` | `GET` | List all previous analyses with filters |
| `/analysis/{id}` | `GET` | Fetch detailed analysis record |
| `/analysis/{id}/status`| `PUT` | Update analysis status (Reviewed/Flagged/Archived) |
| `/reports/{id}/pdf` | `GET` | Generate and download stylized ReportLab PDF report |
| `/dashboard/stats` | `GET` | Dynamic overview stats and volume metrics for dashboard |

---

## ML Inference & Fallback
The `MLService` attempts to load a pretrained DenseNet121 model. If you are running in an offline environment or do not have weights cached, the system automatically uses an intelligent fallback. 

The fallback analyzes OpenCV statistics (intensity histograms, color profiles, resolution) to generate deterministic, clinical predictions, ensuring that the service is robust and runs immediately without network delays.
