# Smart Face Recognition Attendance System (DFR-Sys)

A modern, high-accuracy, local face-recognition attendance system utilizing state-of-the-art OpenCV DNN (Deep Neural Network) models, an adaptive KNN classifier, dual-layer anti-spoofing (liveness checks), and an auto-refreshing Streamlit dashboard.

---

## Quick Start Guide

### 1. Installation & Environment Setup
Open your terminal in the `D:\DFR-Sys` directory and run:

```bash
# 1. Create a virtual environment (if not already done)
python -m venv .venv

# 2. Activate the virtual environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Windows CMD:
.venv\Scripts\activate.bat

# 3. Install required packages
pip install opencv-python numpy scikit-learn pandas streamlit streamlit-autorefresh
```

### 2. Run the System

Follow these three simple steps to run the application:

#### **Step 1: Enroll a User (`add_faces.py`)**
Run this script to register a new user:
```bash
python add_faces.py
```
* **How it works:** Enter your name. The camera will turn on. Follow the on-screen text instructions to tilt and turn your head at different distances (normal, close-up, far-back). It will capture 50 scale-diverse samples.

#### **Step 2: Start Camera Recognition & Logging (`test.py`)**
Run this script to open the active surveillance screen:
```bash
python test.py
```
* **How it works:** Look at the camera. If recognized, your name will appear in a **Green Box**.
  * Press **`o`** to log your attendance into today's CSV file.
  * Press **`q`** or click the **'X' close button** on the window to exit safely.

#### **Step 3: Launch Web Dashboard (`app.py`)**
Run this command in a separate terminal to view recorded attendance records:
```bash
python -m streamlit run app.py
```
* **How it works:** This will open a browser window displaying today's attendance logs. The table refreshes automatically every 2 seconds whenever someone punches in using `test.py`.

---

## 🛠️ Tech Stack & Dependencies
* **Python 3.11+**
* **OpenCV (cv2):** For image processing and running the neural network inference.
* **Scikit-Learn (sklearn):** Powers the K-Nearest Neighbors (KNN) classifier.
* **Streamlit:** Creates the interactive web interface dashboard.
* **Pandas:** Handles reading, processing, and formatting the logged CSV data.

---

## 🧠 Under-the-Hood Algorithms (Simplified)

### 1. Face Detection: **YuNet**
* **What it does:** YuNet is an extremely fast, lightweight neural network optimized for finding face boundaries (bounding boxes) and 5 key coordinates (eyes, nose tip, mouth corners) in real-time.

### 2. Face Recognition (Feature Extraction): **SFace**
* **What it does:** SFace takes the detected face, crops and aligns it (using the 5 coordinate landmarks), and converts it into a **128-dimensional mathematical fingerprint** (an embedding vector). If two images are of the same person, their 128-d vectors will point in almost the exact same direction.

### 3. Classification: **K-Nearest Neighbors (KNN) with Cosine Metric**
* **What it does:** Instead of raw matching, the system uses a KNN classifier configured with a **Cosine Distance metric** ($1 - \text{cosine similarity}$). 
* **Why it matters:** SFace outputs vectors that are not normalized to unit length. Cosine distance evaluates the *angle* between face vectors rather than their length, making it 100% immune to variations in lighting, exposure, or distance.
  * **Match Threshold (0.63):** If the cosine distance is $\le 0.63$, the face is recognized.
  * **Learn Threshold (0.40):** If the match is extremely confident ($\le 0.40$), the system triggers *Continuous Learning*.

### 4. Smart Continuous Learning
* **What it does:** As your face lighting shifts throughout the day, the AI automatically appends your high-confidence live vectors into its database. It utilizes a **FIFO (First-In-First-Out) Buffer** (limited to 100 frames per user) to keep the system memory-efficient while adapting to your face over time.

### 5. Dual-Layer Anti-Spoofing (Liveness Check)
To prevent people from checking in using paper photos or mobile screen playbacks:
* **Texture Sharpness Analysis:** Recaptured screens and paper prints lose high-frequency sharpness. The system computes the **Laplacian Variance** of the face crop. If the variance is too low ($< 35.0$), it flags it as a flat spoof.
* **Yaw Movement Variance:** A static photo has rigid landmark spacing. A live person naturally breathes and tilts their head. The system monitors the nose-to-eyes horizontal ratio over 15 frames. If there is zero mathematical variation, it triggers a **SPOOF ALERT**.

---

## 📁 Project Directory Structure
```
D:\DFR-Sys\
├── .venv\                     # Python Virtual Environment
├── Attendance\                # Logged CSV files (e.g. Attendance_16-06-26.csv)
├── data\                      # Saved face signatures and models
│   ├── face_detection_yunet_2023mar.onnx
│   ├── face_recognition_sface_2021dec.onnx
│   ├── faces_data.pkl         # Stored mathematical signatures
│   └── names.pkl              # Stored names corresponding to signatures
├── add_faces.py               # Enrolls new users (multi-distance & angle)
├── app.py                     # Streamlit dashboard
├── face_engine.py             # Modular AI Core (anti-spoofing + recognition)
├── test.py                    # Surveillance & attendance logger
└── README.md                  # System manual (this file)
```
