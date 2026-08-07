# MedVision Clarity

Create a modern, professional, clean, and clinical medical web application frontend for "MedVision AI" – an AI-powered medical imaging platform that helps doctors analyze chest X-rays and bone X-rays.

### Overall Design

- Clean, trustworthy medical aesthetic: soft blues, whites, light grays, teal accents.

- Professional, minimal, high-trust UI suitable for healthcare professionals.

- Fully responsive (desktop-first, works great on tablet and mobile).

- Dark mode toggle optional but nice to have.

- Use a modern component library (shadcn/ui style preferred).

- Smooth animations and loading states.

- Excellent accessibility and clear typography.

### Main Pages & Structure

1. **Landing / Home Page**

   - Hero section with strong headline: "AI-Powered Chest & Bone X-ray Analysis"

   - Subheadline explaining it is an AI-assisted second opinion tool (not a replacement for doctors).

   - Key benefits: Fast analysis, multi-disease detection, fracture localization, AI-generated reports.

   - Call-to-action buttons: "Upload X-ray" and "Doctor Login"

   - Section showing supported conditions (chest diseases + bone parts).

   - How it works (simple 4–5 step process).

   - Trust indicators / disclaimer.

2. **Authentication**

   - Login page (email + password)

   - Register page (for doctors)

   - Clean form design with validation feedback.

3. **Doctor Dashboard (main authenticated area)**

   - Sidebar navigation:

     - Dashboard

     - Upload X-ray

     - Analysis History

     - Patients

     - Reports

     - Settings

   - Top bar with user avatar, notifications, logout.

   - Overview cards: Total analyses, Recent cases, Pending reviews, Accuracy stats (mock data).

4. **Upload & Analysis Page** (core feature)

   - Large drag-and-drop zone for X-ray images (supports PNG, JPG, DICOM-style).

   - Toggle or tabs to choose analysis type:

     - Chest X-ray Analysis

     - Bone Fracture Analysis

   - When Bone is selected: dropdown to select body part (Hand, Wrist, Finger, Elbow, Shoulder, Forearm, Femur, Tibia, Knee, Ankle, Foot).

   - Optional patient info fields (Patient ID, Name, Age, Gender, Notes).

   - Big "Analyze" button.

   - After upload: show beautiful loading state with progress (“Preprocessing…”, “Running AI model…”, “Generating report…”).

5. **Results / Analysis Detail Page**

   - Side-by-side layout:

     - Left: Original X-ray image with optional overlay (bounding boxes / heatmaps for localization – mock with placeholders).

     - Right: Structured results panel.

   - Results panel should include:

     - Primary prediction (disease or fracture type) with large confidence percentage.

     - List of all detected conditions with confidence bars/progress indicators.

     - For fractures: fracture type (transverse, oblique, etc.) + localization description.

     - AI-generated preliminary radiology report in a clean card (structured text: Findings, Impression, Recommendations).

     - Download PDF Report button.

     - “Save to Patient History” and “Mark as Reviewed” buttons.

   - Confidence visualization (progress bars or circular gauges).

   - Clear disclaimer: “AI-assisted preliminary report – for clinical decision support only. Final diagnosis by qualified physician.”

6. **Analysis History / Reports Page**

   - Searchable and filterable table of previous analyses.

   - Columns: Date, Patient ID/Name, Type (Chest/Bone), Prediction, Confidence, Status.

   - Click row → go to full results page.

   - Ability to re-download PDF.

7. **Patient Management (simple)**

   - List of patients with basic info.

   - View previous reports linked to a patient.

### Key UI Components to Include

- Modern cards with soft shadows

- Confidence score progress bars / circular indicators

- Image viewer with zoom/pan capability

- Skeleton loaders

- Toast notifications for success/error

- Modal for PDF preview or confirmation

- Empty states with helpful illustrations

- Professional medical icons (lungs, bones, AI, report, etc.)

### Mock Data & Interactivity

- Use realistic mock data for diseases (Pneumonia, Tuberculosis, Pneumothorax, Cardiomegaly, Pleural Effusion, etc.) and fracture types.

- Simulate the analysis flow with a short delay and then show results.

- Make the entire frontend fully interactive and polished even without a real backend.

### Tech Preferences (if applicable)

- React + Tailwind CSS

- Modern component library

- Clean, production-ready code structure

Make the interface feel like a real medical product used in hospitals – calm, precise, trustworthy, and highly usable by busy doctors.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
