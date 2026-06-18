# Smart Attendance System — pgvector backend
import psycopg2
import jwt
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from database import init_db, get_db_connection, hash_password, verify_password
import cv2
import numpy as np
import base64
from pathlib import Path

# Load OpenCV DNN Models once
data_dir = Path(__file__).parent / "data"
detector = cv2.FaceDetectorYN_create(
    str(data_dir / 'face_detection_yunet_2023mar.onnx'), 
    "", (320, 320), 0.9, 0.3, 5000
)
recognizer = cv2.FaceRecognizerSF_create(
    str(data_dir / 'face_recognition_sface_2021dec.onnx'), 
    ""
)

def decode_base64_image(b64_string: str) -> np.ndarray:
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def extract_face_embedding(frame: np.ndarray):
    h, w, _ = frame.shape
    detector.setInputSize((w, h))
    _, faces = detector.detect(frame)
    if faces is not None and len(faces) > 0:
        face = faces[0]
        box = face[0:4].astype(np.int32)
        landmarks = face[4:14].astype(np.int32)
        x, y, width, height = box
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(w, x + width), min(h, y + height)
        face_crop = frame[y1:y2, x1:x2]
        
        is_live = False
        if face_crop.size > 0:
            gray_crop = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray_crop, cv2.CV_64F).var()
            r_eye_x, l_eye_x, nose_x = landmarks[0], landmarks[2], landmarks[4]
            dist_r = abs(nose_x - r_eye_x)
            dist_l = abs(nose_x - l_eye_x)
            yaw_ratio = dist_r / max(dist_l, 0.001)
            is_live = laplacian_var > 12.0 and (0.2 < yaw_ratio < 5.0)

        aligned_face = recognizer.alignCrop(frame, face)
        feature = recognizer.feature(aligned_face)
        return feature.flatten().tolist(), box.tolist(), is_live
    return None, None, False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup DB Initialization
    init_db()
    yield

app = FastAPI(title="Smart Attendance System API", lifespan=lifespan)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development we allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
(data_dir / "uploads").mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(data_dir / "uploads")), name="uploads")

# JWT Config
JWT_SECRET = "supersecretkeyforattendanceapp2026"
JWT_ALGORITHM = "HS256"

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=120) # 2 hours
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=401, detail="User account not found")
            
        user_dict = row_to_dict(user)
        if user_dict["status"] == "Pending Verification":
            raise HTTPException(status_code=403, detail="Email verification is pending")
        if user_dict["status"] == "Suspended":
            raise HTTPException(status_code=403, detail="Account is suspended")
            
        return user_dict
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired", headers={"WWW-Authenticate": "Bearer"})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token signature", headers={"WWW-Authenticate": "Bearer"})
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}", headers={"WWW-Authenticate": "Bearer"})

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None

def require_role(allowed_roles: List[str]):
    def dependency(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access forbidden: role '{current_user['role']}' does not have permission"
            )
        return current_user
    return dependency

# Models
class StudentCreate(BaseModel):
    rollNumber: str
    fullName: str
    email: Optional[str] = ""
    contact: Optional[str] = ""
    department: str
    course: Optional[str] = "B.Tech"
    semester: Optional[str] = "1"
    gender: Optional[str] = "Male"
    dob: Optional[str] = ""
    address: Optional[str] = ""
    status: Optional[str] = "Active"

class ScanRequest(BaseModel):
    image: str # Base64 image string
    classCode: Optional[str] = None

class AttendanceMarkRequest(BaseModel):
    studentId: int
    status: bool # True for Present, False for Absent
    date: Optional[str] = None # Defaults to today YYYY-MM-DD

class ToggleSessionRequest(BaseModel):
    classCode: str
    active: bool

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class StudentRegisterRequest(BaseModel):
    rollNumber: str
    fullName: str
    email: str
    contact: Optional[str] = ""
    department: str
    course: Optional[str] = "B.Tech"
    semester: Optional[str] = "1"
    gender: Optional[str] = "Male"
    dob: Optional[str] = ""
    address: Optional[str] = ""
    password: str
    photo: Optional[str] = ""  # base64 face scan from webcam

class TeacherRegisterRequest(BaseModel):
    teacherId: str
    fullName: str
    email: str
    contact: Optional[str] = ""
    department: str
    gender: Optional[str] = "Male"
    dob: Optional[str] = ""
    password: str

class TeacherCreate(BaseModel):
    teacherId: str
    fullName: str
    email: str
    contact: Optional[str] = ""
    department: str
    status: Optional[str] = "Active"

# Helper: Convert DB row dict to camelCase, stripping internal-only columns
def row_to_dict(row):
    if not row: return None
    d = dict(row)
    # Never leak raw embedding vectors to API responses
    d.pop('embedding', None)
    mapping = {
        'rollnumber': 'rollNumber',
        'fullname': 'fullName',
        'teacherid': 'teacherId',
        'referenceid': 'referenceId',
        'createdat': 'createdAt',
        'timein': 'timeIn',
        'timeout': 'timeOut',
        'markedby': 'markedBy'
    }
    return {mapping.get(k, k): v for k, v in d.items()}

# ─── Auth APIs ────────────────────────────────────────────────
@app.post("/api/auth/register/student")
async def register_student(payload: StudentRegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if student already exists
        cursor.execute("SELECT id FROM students WHERE rollNumber = %s OR email = %s", (payload.rollNumber, payload.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Student with this Roll Number or Email already exists")
            
        cursor.execute("SELECT id FROM users WHERE email = %s", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User email already registered")

        if not payload.photo:
            raise HTTPException(status_code=400, detail="Profile photo (face scan) is mandatory for registration.")
            
        frame = decode_base64_image(payload.photo)
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid photo data.")
            
        embedding, _, _ = extract_face_embedding(frame)
        if not embedding:
            raise HTTPException(status_code=400, detail="Could not detect a clear face in the provided scan. Please try again.")

        # Upload photo to Neon-friendly S3 / local fallback
        from storage import upload_profile_photo
        photo_url = upload_profile_photo(payload.photo, payload.rollNumber)

        # Insert student record with pgvector embedding
        cursor.execute("""
            INSERT INTO students (rollNumber, fullName, email, contact, department, course, semester, gender, dob, address, photo, status, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
            RETURNING id
        """, (
            payload.rollNumber, payload.fullName, payload.email, payload.contact,
            payload.department, payload.course, payload.semester, payload.gender, payload.dob,
            payload.address, photo_url, "Active", str(embedding)
        ))
        
        # Get student DB ID
        student_db_id = cursor.fetchone()[0]
        
        # Insert user login account
        hashed = hash_password(payload.password)
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            payload.email, hashed, 'student', payload.rollNumber, payload.fullName, "Active"
        ))
        
        conn.commit()
        conn.close()
        return {"success": True, "id": student_db_id, "rollNumber": payload.rollNumber}
    except psycopg2.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Database integrity error. Student ID or email might be duplicated.")
    except HTTPException:
        conn.close()
        raise
    except Exception as e:
        conn.close()
        print(f"Exception in register_student: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/register/teacher")
async def register_teacher(payload: TeacherRegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if teacher already exists
        cursor.execute("SELECT id FROM teachers WHERE teacherId = %s OR email = %s", (payload.teacherId, payload.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Teacher with this ID or Email already exists")
            
        cursor.execute("SELECT id FROM users WHERE email = %s", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User email already registered")

        # Insert teacher record
        cursor.execute("""
            INSERT INTO teachers (teacherId, fullName, email, contact, department, status, photo)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            payload.teacherId, payload.fullName, payload.email, payload.contact,
            payload.department, "Active", f"https://i.pravatar.cc/40?img={hash(payload.teacherId) % 70 + 50}"
        ))
        
        teacher_db_id = cursor.fetchone()[0]
        
        # Insert user login account
        hashed = hash_password(payload.password)
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            payload.email, hashed, 'teacher', payload.teacherId, payload.fullName, "Active"
        ))
        
        conn.commit()
        conn.close()
        return {"success": True, "id": teacher_db_id, "teacherId": payload.teacherId}
    except psycopg2.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Database integrity error. Teacher ID or email might be duplicated.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (payload.email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    user_dict = row_to_dict(user)
    
    if not verify_password(payload.password, user_dict["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if user_dict["status"] == "Pending Verification":
        raise HTTPException(status_code=400, detail="Email verification pending. Please verify your email first.")
        
    if user_dict["status"] == "Suspended":
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact administrator.")
        
    # Check if specific role requested
    if payload.role and payload.role != user_dict["role"]:
        raise HTTPException(status_code=403, detail=f"Unauthorized role. Access denied for role {payload.role}")
        
    # Generate token
    token = create_access_token({
        "email": user_dict["email"],
        "role": user_dict["role"],
        "fullName": user_dict["fullName"],
        "referenceId": user_dict["referenceId"]
    })
    
    # Fetch extra profile details based on role
    profile_data = {}
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_dict["role"] == "student":
        cursor.execute('SELECT * FROM students WHERE email = %s', (user_dict["email"],))
        student_row = cursor.fetchone()
        if student_row:
            student_dict = row_to_dict(student_row)
            profile_data = {
                "rollNumber": student_dict.get("rollNumber"),
                "contact": student_dict.get("contact"),
                "department": student_dict.get("department"),
                "course": student_dict.get("course"),
                "semester": student_dict.get("semester"),
                "gender": student_dict.get("gender"),
                "dob": student_dict.get("dob"),
                "address": student_dict.get("address"),
                "photo": student_dict.get("photo")
            }
    elif user_dict["role"] == "teacher":
        cursor.execute('SELECT * FROM teachers WHERE email = %s', (user_dict["email"],))
        teacher_row = cursor.fetchone()
        if teacher_row:
            teacher_dict = row_to_dict(teacher_row)
            profile_data = {
                "teacherId": teacher_dict.get("teacherId"),
                "contact": teacher_dict.get("contact"),
                "department": teacher_dict.get("department"),
                "gender": teacher_dict.get("gender"),
                "dob": teacher_dict.get("dob")
            }
    conn.close()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user_dict["email"],
            "role": user_dict["role"],
            "fullName": user_dict["fullName"],
            "referenceId": user_dict["referenceId"],
            **profile_data
        }
    }

# ─── Dashboard Stats API ──────────────────────────────────────
@app.get("/api/dashboard/stats", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Total Students
    cursor.execute("SELECT COUNT(*) FROM students")
    total_students = cursor.fetchone()[0]
    
    # 2. Total Present today
    cursor.execute("SELECT COUNT(*) FROM attendance WHERE date = %s AND status = 'Present'", (today_str,))
    total_present = cursor.fetchone()[0]
    
    # 3. Total Absent today (Active students - Present today)
    cursor.execute("SELECT COUNT(*) FROM students WHERE status = 'Active'")
    active_students = cursor.fetchone()[0]
    total_absent = max(0, active_students - total_present)
    
    # 4. Attendance Rate
    attendance_rate = int((total_present / max(1, active_students)) * 100)
    
    # 5. Recent Attendance Logs
    cursor.execute("""
        SELECT a.id, a.rollNumber, a.studentName, a.department, a.date, a.timeIn, a.timeOut, a.status, a.markedBy
        FROM attendance a
        ORDER BY a.id DESC LIMIT 10
    """)
    recent = [row_to_dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "totalStudents": total_students,
        "totalPresent": total_present,
        "totalAbsent": total_absent,
        "attendanceRate": attendance_rate,
        "recentAttendance": recent
    }

# ─── Students CRUD ───────────────────────────────────────────
@app.get("/api/students", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def get_students(department: Optional[str] = None, semester: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM students WHERE 1=1"
    params = []
    if department:
        query += " AND department = %s"
        params.append(department)
    if semester:
        query += " AND semester = %s"
        params.append(semester)
        
    cursor.execute(query, params)
    students = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"data": students, "total": len(students)}

@app.get("/api/students/{student_id}", dependencies=[Depends(require_role(["admin", "teacher", "student"]))])
async def get_student(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
    student = row_to_dict(cursor.fetchone())
    conn.close()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.post("/api/students", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def create_student(student: StudentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO students (rollNumber, fullName, email, contact, department, course, semester, gender, dob, address, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            student.rollNumber, student.fullName, student.email, student.contact,
            student.department, student.course, student.semester, student.gender, student.dob,
            student.address, student.status
        ))
        
        # Get student DB ID
        new_id = cursor.fetchone()[0]
        
        # Auto-create user credentials for the newly created student
        default_pass = hash_password("student@123")
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            student.email, default_pass, 'student', student.rollNumber, student.fullName, student.status
        ))
        
        conn.commit()
        conn.close()
        return {"id": new_id, "rollNumber": student.rollNumber, "fullName": student.fullName}
    except psycopg2.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Student with this Roll Number or Email already exists")

@app.put("/api/students/{student_id}", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def update_student(student_id: int, student: StudentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM students WHERE id = %s", (student_id,))
    old_student = cursor.fetchone()
    if not old_student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
        
    old_email = old_student["email"]
    
    cursor.execute("""
        UPDATE students
        SET rollNumber=%s, fullName=%s, email=%s, contact=%s, department=%s, course=%s, semester=%s, gender=%s, dob=%s, address=%s, status=%s
        WHERE id=%s
    """, (
        student.rollNumber, student.fullName, student.email, student.contact,
        student.department, student.course, student.semester, student.gender, student.dob,
        student.address, student.status, student_id
    ))
    
    # Also update user login profile
    cursor.execute("""
        UPDATE users
        SET email=%s, fullName=%s, referenceId=%s, status=%s
        WHERE email=%s
    """, (
        student.email, student.fullName, student.rollNumber, student.status, old_email
    ))
    
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/students/{student_id}", dependencies=[Depends(require_role(["admin"]))])
async def delete_student(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get student details to clean up credentials
    cursor.execute("SELECT email FROM students WHERE id = %s", (student_id,))
    student = cursor.fetchone()
    if student:
        email = student["email"]
        cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        conn.commit()
        
    conn.close()
    return {"success": True}

# ─── Teachers CRUD (Admin Hub) ───────────────────────────────
@app.get("/api/teachers", dependencies=[Depends(require_role(["admin"]))])
async def get_teachers(department: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM teachers WHERE 1=1"
    params = []
    if department:
        query += " AND department = %s"
        params.append(department)
        
    cursor.execute(query, params)
    teachers = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"data": teachers, "total": len(teachers)}

@app.get("/api/teachers/{teacher_id}", dependencies=[Depends(require_role(["admin"]))])
async def get_teacher(teacher_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM teachers WHERE id = %s", (teacher_id,))
    teacher = row_to_dict(cursor.fetchone())
    conn.close()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@app.post("/api/teachers", dependencies=[Depends(require_role(["admin"]))])
async def create_teacher(teacher: TeacherCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO teachers (teacherId, fullName, email, contact, department, status, photo)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            teacher.teacherId, teacher.fullName, teacher.email, teacher.contact,
            teacher.department, teacher.status, f"https://i.pravatar.cc/40?img={hash(teacher.teacherId) % 30 + 50}"
        ))
        
        # Auto-create user credentials for the newly created teacher
        default_pass = hash_password("teacher@123")
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            teacher.email, default_pass, 'teacher', teacher.teacherId, teacher.fullName, teacher.status
        ))
        
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"id": new_id, "teacherId": teacher.teacherId, "fullName": teacher.fullName}
    except psycopg2.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Teacher with this ID or Email already exists")

@app.put("/api/teachers/{teacher_id}", dependencies=[Depends(require_role(["admin"]))])
async def update_teacher(teacher_id: int, teacher: TeacherCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM teachers WHERE id = %s", (teacher_id,))
    old_teacher = cursor.fetchone()
    if not old_teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    old_email = old_teacher["email"]
    
    cursor.execute("""
        UPDATE teachers
        SET teacherId=%s, fullName=%s, email=%s, contact=%s, department=%s, status=%s
        WHERE id=%s
    """, (
        teacher.teacherId, teacher.fullName, teacher.email, teacher.contact,
        teacher.department, teacher.status, teacher_id
    ))
    
    # Also update user login profile
    cursor.execute("""
        UPDATE users
        SET email=%s, fullName=%s, referenceId=%s, status=%s
        WHERE email=%s
    """, (
        teacher.email, teacher.fullName, teacher.teacherId, teacher.status, old_email
    ))
    
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/teachers/{teacher_id}", dependencies=[Depends(require_role(["admin"]))])
async def delete_teacher(teacher_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM teachers WHERE id = %s", (teacher_id,))
    teacher = cursor.fetchone()
    if teacher:
        email = teacher["email"]
        cursor.execute("DELETE FROM teachers WHERE id = %s", (teacher_id,))
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        conn.commit()
        
    conn.close()
    return {"success": True}

# ─── Face Biometrics Enrollment (pgvector) ────────────────────
class FaceEnrollRequest(BaseModel):
    images: List[str]  # List of base64 image strings

@app.post("/api/students/{student_id}/face-images", dependencies=[Depends(require_role(["admin", "teacher", "student"]))])
async def enroll_student_faces(student_id: int, request: FaceEnrollRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM students WHERE id = %s", (student_id,))
    student = cursor.fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")

    # Extract the best embedding from the provided images
    for b64_img in request.images:
        frame = decode_base64_image(b64_img)
        if frame is None:
            continue
        embedding, _, _ = extract_face_embedding(frame)
        if embedding:
            cursor.execute(
                "UPDATE students SET embedding = %s::vector WHERE id = %s",
                (str(embedding), student_id)
            )
            conn.commit()
            conn.close()
            return {"success": True, "samples_enrolled": 1}

    conn.close()
    raise HTTPException(status_code=400, detail="Could not detect any faces. Ensure proper lighting and a clear view.")

# ─── Attendance Records ───────────────────────────────────────
@app.get("/api/attendance", dependencies=[Depends(require_role(["admin", "teacher", "student"]))])
async def get_attendance(date: Optional[str] = None):
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all active students
    cursor.execute("SELECT id, rollNumber, fullName, department, semester, photo FROM students WHERE status = 'Active'")
    students_list = cursor.fetchall()
    
    # Get all logs for this date
    cursor.execute("SELECT * FROM attendance WHERE date = %s", (date,))
    attendance_logs = {row["rollNumber"]: row_to_dict(row) for row in cursor.fetchall()}
    
    records = []
    present_count = 0
    absent_count = 0
    
    for s in students_list:
        roll = s["rollNumber"]
        log = attendance_logs.get(roll)
        
        if log:
            records.append({
                "id": log["id"],
                "studentId": s["id"],
                "rollNumber": roll,
                "studentName": s["fullName"],
                "department": s["department"],
                "date": date,
                "timeIn": log["timeIn"],
                "timeOut": log["timeOut"],
                "status": log["status"],
                "markedBy": log["markedBy"],
                "photo": s["photo"]
            })
            if log["status"] == "Present":
                present_count += 1
            else:
                absent_count += 1
        else:
            records.append({
                "id": f"absent-{roll}",
                "studentId": s["id"],
                "rollNumber": roll,
                "studentName": s["fullName"],
                "department": s["department"],
                "date": date,
                "timeIn": "-",
                "timeOut": "-",
                "status": "Absent",
                "markedBy": "-",
                "photo": s["photo"]
            })
            absent_count += 1
            
    conn.close()
    return {"data": records, "total": len(records), "present": present_count, "absent": absent_count}

@app.post("/api/attendance/mark", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def mark_manual(payload: AttendanceMarkRequest):
    if not payload.date:
        payload.date = datetime.now().strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT rollNumber, fullName, department FROM students WHERE id = %s", (payload.studentId,))
    student = cursor.fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
        
    roll_number = student["rollNumber"]
    full_name = student["fullName"]
    dept = student["department"]
    
    time_str = datetime.now().strftime("%I:%M:%S %p")
    status_str = "Present" if payload.status else "Absent"
    
    if payload.status:
        # Mark Present
        cursor.execute("""
            INSERT INTO attendance (rollNumber, studentName, department, date, timeIn, timeOut, status, markedBy)
            VALUES (%s, %s, %s, %s, %s, 'Pending', 'Present', 'Manual')
            ON CONFLICT(rollNumber, date, markedBy) DO UPDATE SET status='Present', timeIn=%s, markedBy='Manual'
        """, (roll_number, full_name, dept, payload.date, time_str, time_str))
    else:
        # Mark Absent
        cursor.execute("""
            INSERT INTO attendance (rollNumber, studentName, department, date, timeIn, timeOut, status, markedBy)
            VALUES (%s, %s, %s, %s, '-', '-', 'Absent', 'Manual')
            ON CONFLICT(rollNumber, date, markedBy) DO UPDATE SET status='Absent', timeIn='-', timeOut='-', markedBy='Manual'
        """, (roll_number, full_name, dept, payload.date))
        
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/student/attendance", dependencies=[Depends(require_role(["student"]))])
async def get_student_attendance(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, rollnumber, studentname, department, date, timein, timeout, status, markedby
        FROM attendance
        WHERE rollnumber = %s
        ORDER BY date DESC
    """, (current_user["referenceId"],))
    rows = cursor.fetchall()
    conn.close()
    
    logs = []
    for r in rows:
        d = row_to_dict(r)
        logs.append({
            "key": str(d["id"]),
            "id": d["id"],
            "date": d["date"],
            "timeIn": d["timeIn"],
            "timeOut": d["timeOut"],
            "status": d["status"],
            "type": d["markedBy"]
        })
    return {"data": logs}

@app.delete("/api/attendance/{record_id}", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def delete_attendance(record_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    if record_id.startswith("absent-"):
        conn.close()
        return {"success": True}
        
    try:
        rid = int(record_id)
        cursor.execute("DELETE FROM attendance WHERE id = %s", (rid,))
        conn.commit()
    except ValueError:
        pass
    finally:
        conn.close()
    return {"success": True}

# ─── Reports and Exports ─────────────────────────────────────
@app.get("/api/reports/stats", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def get_reports_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Total Active Students
    cursor.execute("SELECT COUNT(*) FROM students WHERE status = 'Active'")
    total_students = cursor.fetchone()[0]
    
    # 2. Total Present/Absent logs in range
    cursor.execute("""
        SELECT status, COUNT(*) 
        FROM attendance 
        WHERE date >= %s AND date <= %s
        GROUP BY status
    """, (start_date, end_date))
    logs = cursor.fetchall()
    
    total_present = 0
    total_absent = 0
    for r in logs:
        if r["status"] == "Present":
            total_present = r["count"]
        elif r["status"] == "Absent":
            total_absent = r["count"]
            
    # Calculate average attendance percentage in range
    total_records = total_present + total_absent
    avg_attendance = round((total_present / total_records * 100), 1) if total_records > 0 else 0.0
    
    # 3. Department Wise Stats
    cursor.execute("SELECT DISTINCT department FROM students WHERE status = 'Active'")
    depts = [r["department"] for r in cursor.fetchall() if r["department"]]
    
    dept_stats = []
    for dept in depts:
        cursor.execute("SELECT COUNT(*) FROM students WHERE department = %s AND status = 'Active'", (dept,))
        dept_total = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT status, COUNT(*) 
            FROM attendance 
            WHERE department = %s AND date >= %s AND date <= %s
            GROUP BY status
        """, (dept, start_date, end_date))
        dept_logs = cursor.fetchall()
        
        d_present = 0
        d_absent = 0
        for r in dept_logs:
            if r["status"] == "Present":
                d_present = r["count"]
            elif r["status"] == "Absent":
                d_absent = r["count"]
                
        d_records = d_present + d_absent
        d_pct = round((d_present / d_records * 100), 1) if d_records > 0 else 0.0
        
        dept_stats.append({
            "name": dept,
            "totalStudents": dept_total,
            "present": d_present,
            "absent": d_absent,
            "percentage": d_pct
        })
        
    # 4. Daily attendance trend overview for graph (last 10 active days or daily within range)
    cursor.execute("""
        SELECT date, 
               SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
               COUNT(*) as total
        FROM attendance
        WHERE date >= %s AND date <= %s
        GROUP BY date
        ORDER BY date ASC
    """, (start_date, end_date))
    daily_rows = cursor.fetchall()
    
    trend = []
    for r in daily_rows:
        pct = round((r["present"] / r["total"] * 100), 1) if r["total"] > 0 else 0.0
        trend.append({
            "date": datetime.strptime(r["date"], "%Y-%m-%d").strftime("%d %b") if r["date"] else "-",
            "value": pct
        })
        
    conn.close()
    
    return {
        "totalStudents": total_students,
        "avgAttendance": f"{avg_attendance}%",
        "presentCount": total_present,
        "absentCount": total_absent,
        "departmentStats": dept_stats,
        "attendanceOverview": trend
    }

@app.get("/api/reports/export", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def export_attendance_report(
    department: Optional[str] = None,
    semester: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: Optional[str] = "csv"
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT s.rollNumber, s.fullName, s.department, s.semester, 
               a.date, a.timeIn, a.timeOut, a.status, a.markedBy
        FROM students s
        LEFT JOIN attendance a ON s.rollNumber = a.rollNumber
        WHERE 1=1
    """
    params = []
    if department:
        query += " AND s.department = %s"
        params.append(department)
    if semester:
        query += " AND s.semester = %s"
        params.append(semester)
    if start_date:
        query += " AND a.date >= %s"
        params.append(start_date)
    if end_date:
        query += " AND a.date <= %s"
        params.append(end_date)
        
    query += " ORDER BY a.date DESC, s.rollNumber ASC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    if format == "xlsx":
        import pandas as pd
        from io import BytesIO
        from fastapi.responses import StreamingResponse
        
        data = []
        for r in rows:
            data.append({
                "Roll Number": r["rollnumber"],
                "Full Name": r["fullname"],
                "Department": r["department"],
                "Semester": f"Semester {r['semester']}" if r["semester"] else "-",
                "Date": r["date"] or "-",
                "Time In": r["timein"] or "-",
                "Time Out": r["timeout"] or "-",
                "Status": r["status"] or "Absent",
                "Marked By": r["markedby"] or "-"
            })
            
        df = pd.DataFrame(data)
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Attendance Report')
            
            # Format the Excel sheet using openpyxl
            workbook = writer.book
            worksheet = writer.sheets['Attendance Report']
            
            from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
            header_font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
            header_fill = PatternFill(start_color='1E3A8A', end_color='1E3A8A', fill_type='solid') # Deep blue
            center_align = Alignment(horizontal='center', vertical='center')
            left_align = Alignment(horizontal='left', vertical='center')
            
            thin_side = Side(border_style="thin", color="D1D5DB")
            border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
            
            for col_num in range(1, len(df.columns) + 1):
                cell = worksheet.cell(row=1, column=col_num)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = center_align
                cell.border = border
                
            row_font = Font(name='Segoe UI', size=10)
            for row_num in range(2, len(df) + 2):
                for col_num in range(1, len(df.columns) + 1):
                    cell = worksheet.cell(row=row_num, column=col_num)
                    cell.font = row_font
                    cell.border = border
                    
                    val = str(cell.value or '')
                    if col_num in [1, 4, 5, 6, 7, 9]:
                        cell.alignment = center_align
                    else:
                        cell.alignment = left_align
                        
                    if col_num == 8: # Status
                        cell.alignment = center_align
                        if val == "Present":
                            cell.font = Font(name='Segoe UI', size=10, bold=True, color='15803D')
                            cell.fill = PatternFill(start_color='DCFCE7', end_color='DCFCE7', fill_type='solid')
                        elif val == "Absent":
                            cell.font = Font(name='Segoe UI', size=10, bold=True, color='B91C1C')
                            cell.fill = PatternFill(start_color='FEE2E2', end_color='FEE2E2', fill_type='solid')
                            
            for col in worksheet.columns:
                max_len = 0
                col_letter = col[0].column_letter
                for cell in col:
                    val_str = str(cell.value or '')
                    if len(val_str) > max_len:
                        max_len = len(val_str)
                worksheet.column_dimensions[col_letter].width = max(max_len + 4, 12)
                
        output.seek(0)
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    else:
        # Default to CSV
        import csv
        from io import StringIO
        from fastapi.responses import StreamingResponse
        
        output = StringIO()
        writer = csv.writer(output)
        
        writer.writerow([
            "Roll Number", "Full Name", "Department", "Semester", 
            "Date", "Time In", "Time Out", "Status", "Marked By"
        ])
        
        for r in rows:
            writer.writerow([
                r["rollnumber"],
                r["fullname"],
                r["department"],
                f"Semester {r['semester']}" if r["semester"] else "-",
                r["date"] or "-",
                r["timein"] or "-",
                r["timeout"] or "-",
                r["status"] or "Absent",
                r["markedby"] or "-"
            ])
            
        output.seek(0)
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )



@app.get("/api/attendance/sessions", dependencies=[Depends(require_role(["admin", "teacher", "student"]))])
async def get_active_sessions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT classcode, classname, isactive FROM active_sessions ORDER BY classcode")
    rows = cursor.fetchall()
    conn.close()
    
    sessions = []
    for r in rows:
        sessions.append({
            "classCode": r["classcode"],
            "className": r["classname"],
            "isActive": r["isactive"]
        })
    return {"sessions": sessions}

@app.post("/api/attendance/sessions/toggle", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def toggle_active_session(payload: ToggleSessionRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE active_sessions
        SET isactive = %s
        WHERE classcode = %s
    """, (payload.active, payload.classCode))
    conn.commit()
    conn.close()
    return {"success": True}

# ─── Live Webcam Scan API ─────────────────────────────────────
@app.post("/api/attendance/scan")
async def scan_attendance(request: ScanRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.classCode:
        cursor.execute("SELECT isactive FROM active_sessions WHERE classcode = %s", (request.classCode,))
        row = cursor.fetchone()
        if not row or not row["isactive"]:
            conn.close()
            raise HTTPException(status_code=400, detail="Attendance window is closed for this class.")

    frame = decode_base64_image(request.image)
    if frame is None:
        conn.close()
        return {"faces": []}

    embedding, box, is_live = extract_face_embedding(frame)
    today_str = datetime.now().strftime("%Y-%m-%d")
    time_str = datetime.now().strftime("%I:%M:%S %p")
    
    updated_faces = []
    
    if embedding:
        cursor.execute("""
            SELECT rollnumber, fullname, department, (embedding <=> %s::vector) AS distance 
            FROM students 
            WHERE embedding IS NOT NULL 
            ORDER BY distance ASC LIMIT 1;
        """, (str(embedding),))
        match = cursor.fetchone()
        
        face_info = {
            "box": box,
            "name": "Unknown",
            "is_live": is_live,
            "identity_verified": True,
            "marked": False,
            "distance": 1.0
        }

        if match and match["distance"] < 0.40:
            roll = match["rollnumber"]
            friendly_name = match["fullname"]
            dept = match["department"]
            
            face_info["name"] = friendly_name
            face_info["distance"] = match["distance"]

            if is_live:
                if current_user and current_user.get("role") == "student":
                    expected_roll = current_user.get("referenceId")
                    expected_name = current_user.get("fullName")
                    if roll != expected_roll and friendly_name != expected_name:
                        print(f"Identity mismatch in scan: expected {expected_roll}, got {roll}")
                        face_info["identity_verified"] = False
                        face_info["is_live"] = False
                        face_info["name"] = f"Mismatch: {friendly_name}"
                        updated_faces.append(face_info)
                        conn.close()
                        return {"faces": updated_faces}
                
                marked_by_str = f"Webcam ({request.classCode})" if request.classCode else "Webcam"
                cursor.execute("""
                    SELECT COUNT(*) FROM attendance 
                    WHERE rollNumber = %s AND date = %s AND markedBy = %s AND status = 'Present'
                """, (roll, today_str, marked_by_str))
                
                if cursor.fetchone()[0] == 0:
                    cursor.execute("""
                        INSERT INTO attendance (rollNumber, studentName, department, date, timeIn, timeOut, status, markedBy)
                        VALUES (%s, %s, %s, %s, %s, 'Pending', 'Present', %s)
                        ON CONFLICT(rollNumber, date, markedBy) DO UPDATE SET status='Present', timeIn=%s, markedBy=%s
                    """, (roll, friendly_name, dept, today_str, time_str, marked_by_str, time_str, marked_by_str))
                    conn.commit()
                    face_info["marked"] = True
                
        updated_faces.append(face_info)
        
    conn.close()
    return {"faces": updated_faces}

# ─── Reports Analytics Summary ─────────────────────────────────
@app.get("/api/reports/summary", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def get_reports_summary():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Department attendance distributions
    cursor.execute("SELECT department, COUNT(*) FROM students GROUP BY department")
    dept_totals = {r[0]: r[1] for r in cursor.fetchall()}
    
    cursor.execute("""
        SELECT department, COUNT(*) 
        FROM attendance 
        WHERE status = 'Present' 
        GROUP BY department
    """)
    dept_presents = {r[0]: r[1] for r in cursor.fetchall()}
    
    cursor.execute("""
        SELECT department, COUNT(*) 
        FROM attendance 
        WHERE status = 'Absent' 
        GROUP BY department
    """)
    dept_absents = {r[0]: r[1] for r in cursor.fetchall()}
    
    department_stats = []
    for dept, total in dept_totals.items():
        pres = dept_presents.get(dept, 0)
        absn = dept_absents.get(dept, 0)
        denom = max(1, pres + absn)
        percentage = round((pres / denom) * 100, 1)
        department_stats.append({
            "name": dept,
            "totalStudents": total,
            "present": pres,
            "absent": absn,
            "percentage": percentage
        })
        
    # 2. General numbers
    cursor.execute("SELECT COUNT(*) FROM students")
    total_students = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM attendance WHERE status = 'Present'")
    total_present = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM attendance WHERE status = 'Absent'")
    total_absent = cursor.fetchone()[0]
    
    denom = max(1, total_present + total_absent)
    avg_attendance = round((total_present / denom) * 100, 1)
    
    # 3. Weekly trend (last 7 days of logs)
    cursor.execute("""
        SELECT date, COUNT(case when status='Present' then 1 end) as present, COUNT(*) as total 
        FROM attendance 
        GROUP BY date 
        ORDER BY date DESC LIMIT 7
    """)
    trend_raw = cursor.fetchall()
    overview = []
    for r in reversed(trend_raw):
        dt = datetime.strptime(r[0], "%Y-%m-%d").strftime("%b %d")
        rate = int((r[1] / max(1, r[2])) * 100)
        overview.append({"date": dt, "value": rate})
        
    conn.close()
    return {
        "totalStudents": total_students,
        "averageAttendance": avg_attendance,
        "totalPresent": total_present,
        "totalAbsent": total_absent,
        "overview": overview,
        "departmentStats": department_stats
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
