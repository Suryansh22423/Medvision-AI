import os
import requests

API_URL = "http://localhost:8000"

def test_backend():
    print("Starting automated API verification...")
    
    # 1. Health check
    try:
        r = requests.get(f"{API_URL}/")
        print(f"Health Check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Error: Backend is not running or unreachable at {API_URL}. Start the server first! ({e})")
        return

    # 2. Create Patient
    print("\nTesting: Create Patient...")
    p_data = {
        "name": "Verification Patient",
        "age": 42,
        "gender": "Male",
        "condition": "Diagnostic test"
    }
    r = requests.post(f"{API_URL}/patients", json=p_data)
    if r.status_code == 200:
        patient = r.json()
        patient_id = patient["id"]
        print(f"Success! Patient created with ID: {patient_id}")
    else:
        print(f"Failed! Status code: {r.status_code}, Body: {r.text}")
        return

    # 3. List Patients
    print("\nTesting: List Patients...")
    r = requests.get(f"{API_URL}/patients")
    if r.status_code == 200:
        patients = r.json()
        print(f"Success! Found {len(patients)} patients in database.")
    else:
        print(f"Failed! Status code: {r.status_code}")
        return

    # 4. Upload Chest X-ray
    print("\nTesting: Upload and Analyze Chest X-ray...")
    # Create a dummy image file for upload
    dummy_img_path = "dummy_test_xray.jpg"
    with open(dummy_img_path, "wb") as f:
        # Write small valid JPEG header or basic bytes
        f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x08\x00\x08\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\x37\x00\x00\x00\x00\x00\x00\x00\x00\xff\xd9")
    
    try:
        with open(dummy_img_path, "rb") as img:
            files = {"image": (dummy_img_path, img, "image/jpeg")}
            data = {
                "patient_id": patient_id,
                "notes": "Testing automated chest classification."
            }
            r = requests.post(f"{API_URL}/analysis/chest", files=files, data=data)
            
        if r.status_code == 200:
            analysis = r.json()
            analysis_id = analysis["id"]
            print(f"Success! Chest X-ray analyzed: {analysis['primary']} ({analysis['confidence']}% confidence)")
            print(f"Findings list: {analysis['findings']}")
        else:
            print(f"Failed! Status code: {r.status_code}, Body: {r.text}")
            return
    finally:
        if os.path.exists(dummy_img_path):
            os.remove(dummy_img_path)

    # 5. List Analyses History
    print("\nTesting: List Analyses History...")
    r = requests.get(f"{API_URL}/analysis/history")
    if r.status_code == 200:
        history = r.json()
        print(f"Success! Found {len(history)} total analyses.")
    else:
        print(f"Failed! Status code: {r.status_code}")
        return

    # 6. Update Analysis Status
    print("\nTesting: Update Analysis Status to Reviewed...")
    status_data = {"status": "reviewed"}
    r = requests.put(f"{API_URL}/analysis/{analysis_id}/status", json=status_data)
    if r.status_code == 200:
        print(f"Success! Status updated to: {r.json()['status']}")
    else:
        print(f"Failed! Status code: {r.status_code}")
        return

    # 7. Dashboard Stats
    print("\nTesting: Fetch Dashboard Stats...")
    r = requests.get(f"{API_URL}/dashboard/stats")
    if r.status_code == 200:
        stats = r.json()
        print(f"Success! Total Analyses Stats: {stats['totalAnalyses']}")
        print(f"Pending Reviews Count: {stats['pendingReviews']}")
        print(f"Recent Records Count: {len(stats['recentRecords'])}")
    else:
        print(f"Failed! Status code: {r.status_code}")
        return

    # 8. Download PDF Report
    print("\nTesting: Generate and Download PDF Report...")
    r = requests.get(f"{API_URL}/reports/{analysis_id}/pdf")
    if r.status_code == 200:
        pdf_path = f"verification_report_{analysis_id}.pdf"
        with open(pdf_path, "wb") as f:
            f.write(r.content)
        print(f"Success! PDF report generated and saved to {pdf_path}")
        # Clean up
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
    else:
        print(f"Failed! Status: {r.status_code}, Body: {r.text}")
        return
        
    print("\n*** API verification complete: ALL ENDPOINTS ARE FULLY FUNCTIONING! ***")

if __name__ == "__main__":
    test_backend()
