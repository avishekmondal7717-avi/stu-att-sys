import os
import sqlite3
import jwt
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from database import init_db, get_db_connection, hash_password, verify_password
from face_service import face_service

app = FastAPI(title="Smart Attendance System API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development we allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB Initialization
@app.on_event("startup")
def startup_event():
    init_db()

# JWT Config
JWT_SECRET = "supersecretkeyforattendanceapp"
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

def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None

# Models
class StudentCreate(BaseModel):
    rollNumber: str
    fullName: str
    fatherName: Optional[str] = ""
    email: Optional[str] = ""
    contact: Optional[str] = ""
    department: str
    course: Optional[str] = "B.Tech"
    semester: Optional[str] = "1"
    gender: Optional[str] = "Male"
    dob: Optional[str] = ""
    status: Optional[str] = "Pending Verification"

class FaceEnrollRequest(BaseModel):
    images: List[str] # List of base64 image strings

class ScanRequest(BaseModel):
    image: str # Base64 image string

class AttendanceMarkRequest(BaseModel):
    studentId: int
    status: bool # True for Present, False for Absent
    date: Optional[str] = None # Defaults to today YYYY-MM-DD

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class StudentRegisterRequest(BaseModel):
    rollNumber: str
    fullName: str
    fatherName: Optional[str] = "Raj Sharma"
    email: str
    contact: Optional[str] = ""
    department: str
    course: Optional[str] = "B.Tech"
    semester: Optional[str] = "1"
    gender: Optional[str] = "Male"
    dob: Optional[str] = ""
    password: str

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

# Helper: Convert sqlite3.Row to dict
def row_to_dict(row):
    return dict(row) if row else None

# ─── Auth APIs ────────────────────────────────────────────────
@app.post("/api/auth/register/student")
async def register_student(payload: StudentRegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if student already exists
        cursor.execute("SELECT id FROM students WHERE rollNumber = ? OR email = ?", (payload.rollNumber, payload.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Student with this Roll Number or Email already exists")
            
        cursor.execute("SELECT id FROM users WHERE email = ?", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User email already registered")

        # Insert student record
        cursor.execute("""
            INSERT INTO students (rollNumber, fullName, fatherName, email, contact, department, course, semester, gender, dob, status, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.rollNumber, payload.fullName, payload.fatherName, payload.email, payload.contact,
            payload.department, payload.course, payload.semester, payload.gender, payload.dob,
            "Pending Verification", f"https://i.pravatar.cc/40?img={hash(payload.rollNumber) % 70}"
        ))
        
        # Get student DB ID
        student_db_id = cursor.lastrowid
        
        # Insert user login account
        hashed = hash_password(payload.password)
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            payload.email, hashed, 'student', payload.rollNumber, payload.fullName, "Pending Verification"
        ))
        
        conn.commit()
        conn.close()
        return {"success": True, "id": student_db_id, "rollNumber": payload.rollNumber}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Database integrity error. Student ID or email might be duplicated.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/register/teacher")
async def register_teacher(payload: TeacherRegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if teacher already exists
        cursor.execute("SELECT id FROM teachers WHERE teacherId = ? OR email = ?", (payload.teacherId, payload.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Teacher with this ID or Email already exists")
            
        cursor.execute("SELECT id FROM users WHERE email = ?", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User email already registered")

        # Insert teacher record
        cursor.execute("""
            INSERT INTO teachers (teacherId, fullName, email, contact, department, status, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.teacherId, payload.fullName, payload.email, payload.contact,
            payload.department, "Pending Verification", f"https://i.pravatar.cc/40?img={hash(payload.teacherId) % 70 + 50}"
        ))
        
        teacher_db_id = cursor.lastrowid
        
        # Insert user login account
        hashed = hash_password(payload.password)
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            payload.email, hashed, 'teacher', payload.teacherId, payload.fullName, "Pending Verification"
        ))
        
        conn.commit()
        conn.close()
        return {"success": True, "id": teacher_db_id, "teacherId": payload.teacherId}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Database integrity error. Teacher ID or email might be duplicated.")
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (payload.email,))
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
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user_dict["email"],
            "role": user_dict["role"],
            "fullName": user_dict["fullName"],
            "referenceId": user_dict["referenceId"]
        }
    }

# ─── Dashboard Stats API ──────────────────────────────────────
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Total Students
    cursor.execute("SELECT COUNT(*) FROM students")
    total_students = cursor.fetchone()[0]
    
    # 2. Total Present today
    cursor.execute("SELECT COUNT(*) FROM attendance WHERE date = ? AND status = 'Present'", (today_str,))
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
@app.get("/api/students")
async def get_students(department: Optional[str] = None, semester: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM students WHERE 1=1"
    params = []
    if department:
        query += " AND department = ?"
        params.append(department)
    if semester:
        query += " AND semester = ?"
        params.append(semester)
        
    cursor.execute(query, params)
    students = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"data": students, "total": len(students)}

@app.get("/api/students/{student_id}")
async def get_student(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    student = row_to_dict(cursor.fetchone())
    conn.close()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.post("/api/students")
async def create_student(student: StudentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO students (rollNumber, fullName, fatherName, email, contact, department, course, semester, gender, dob, status, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            student.rollNumber, student.fullName, student.fatherName, student.email, student.contact,
            student.department, student.course, student.semester, student.gender, student.dob,
            student.status, f"https://i.pravatar.cc/40?img={hash(student.rollNumber) % 70}"
        ))
        
        # Auto-create user credentials for the newly created student
        default_pass = hash_password("student@123")
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            student.email, default_pass, 'student', student.rollNumber, student.fullName, student.status
        ))
        
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"id": new_id, "rollNumber": student.rollNumber, "fullName": student.fullName}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Student with this Roll Number or Email already exists")

@app.put("/api/students/{student_id}")
async def update_student(student_id: int, student: StudentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM students WHERE id = ?", (student_id,))
    old_student = cursor.fetchone()
    if not old_student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
        
    old_email = old_student["email"]
    
    cursor.execute("""
        UPDATE students
        SET rollNumber=?, fullName=?, fatherName=?, email=?, contact=?, department=?, course=?, semester=?, gender=?, dob=?, status=?
        WHERE id=?
    """, (
        student.rollNumber, student.fullName, student.fatherName, student.email, student.contact,
        student.department, student.course, student.semester, student.gender, student.dob,
        student.status, student_id
    ))
    
    # Also update user login profile
    cursor.execute("""
        UPDATE users
        SET email=?, fullName=?, referenceId=?, status=?
        WHERE email=?
    """, (
        student.email, student.fullName, student.rollNumber, student.status, old_email
    ))
    
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/students/{student_id}")
async def delete_student(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get student details to clean up credentials
    cursor.execute("SELECT email FROM students WHERE id = ?", (student_id,))
    student = cursor.fetchone()
    if student:
        email = student["email"]
        cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
        cursor.execute("DELETE FROM users WHERE email = ?", (email,))
        conn.commit()
        
    conn.close()
    return {"success": True}

# ─── Teachers CRUD (Admin Hub) ───────────────────────────────
@app.get("/api/teachers")
async def get_teachers(department: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM teachers WHERE 1=1"
    params = []
    if department:
        query += " AND department = ?"
        params.append(department)
        
    cursor.execute(query, params)
    teachers = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"data": teachers, "total": len(teachers)}

@app.get("/api/teachers/{teacher_id}")
async def get_teacher(teacher_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM teachers WHERE id = ?", (teacher_id,))
    teacher = row_to_dict(cursor.fetchone())
    conn.close()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@app.post("/api/teachers")
async def create_teacher(teacher: TeacherCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO teachers (teacherId, fullName, email, contact, department, status, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            teacher.teacherId, teacher.fullName, teacher.email, teacher.contact,
            teacher.department, teacher.status, f"https://i.pravatar.cc/40?img={hash(teacher.teacherId) % 30 + 50}"
        ))
        
        # Auto-create user credentials for the newly created teacher
        default_pass = hash_password("teacher@123")
        cursor.execute("""
            INSERT INTO users (email, password, role, referenceId, fullName, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            teacher.email, default_pass, 'teacher', teacher.teacherId, teacher.fullName, teacher.status
        ))
        
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"id": new_id, "teacherId": teacher.teacherId, "fullName": teacher.fullName}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Teacher with this ID or Email already exists")

@app.put("/api/teachers/{teacher_id}")
async def update_teacher(teacher_id: int, teacher: TeacherCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM teachers WHERE id = ?", (teacher_id,))
    old_teacher = cursor.fetchone()
    if not old_teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    old_email = old_teacher["email"]
    
    cursor.execute("""
        UPDATE teachers
        SET teacherId=?, fullName=?, email=?, contact=?, department=?, status=?
        WHERE id=?
    """, (
        teacher.teacherId, teacher.fullName, teacher.email, teacher.contact,
        teacher.department, teacher.status, teacher_id
    ))
    
    # Also update user login profile
    cursor.execute("""
        UPDATE users
        SET email=?, fullName=?, referenceId=?, status=?
        WHERE email=?
    """, (
        teacher.email, teacher.fullName, teacher.teacherId, teacher.status, old_email
    ))
    
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/teachers/{teacher_id}")
async def delete_teacher(teacher_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM teachers WHERE id = ?", (teacher_id,))
    teacher = cursor.fetchone()
    if teacher:
        email = teacher["email"]
        cursor.execute("DELETE FROM teachers WHERE id = ?", (teacher_id,))
        cursor.execute("DELETE FROM users WHERE email = ?", (email,))
        conn.commit()
        
    conn.close()
    return {"success": True}

# ─── Face Biometrics Enrollment ────────────────────────────────
@app.post("/api/students/{student_id}/face-images")
async def enroll_student_faces(student_id: int, request: FaceEnrollRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT rollNumber, fullName FROM students WHERE id = ?", (student_id,))
    student = cursor.fetchone()
    conn.close()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    roll_number = student["rollNumber"]
    full_name = student["fullName"]
    
    registered_count = face_service.enroll_student_faces(roll_number, request.images)
    
    if registered_count == 0:
        raise HTTPException(status_code=400, detail="Could not detect or register any faces from the uploaded images. Please ensure the camera capture has proper lighting and clear views.")
        
    return {"success": True, "samples_enrolled": registered_count}

# ─── Attendance Records ───────────────────────────────────────
@app.get("/api/attendance")
async def get_attendance(date: Optional[str] = None):
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all active students
    cursor.execute("SELECT id, rollNumber, fullName, department, semester, photo FROM students WHERE status = 'Active'")
    students_list = cursor.fetchall()
    
    # Get all logs for this date
    cursor.execute("SELECT * FROM attendance WHERE date = ?", (date,))
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

@app.post("/api/attendance/mark")
async def mark_manual(payload: AttendanceMarkRequest):
    if not payload.date:
        payload.date = datetime.now().strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT rollNumber, fullName, department FROM students WHERE id = ?", (payload.studentId,))
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
            VALUES (?, ?, ?, ?, ?, 'Pending', 'Present', 'Manual')
            ON CONFLICT(rollNumber, date) DO UPDATE SET status='Present', timeIn=?, markedBy='Manual'
        """, (roll_number, full_name, dept, payload.date, time_str, time_str))
    else:
        # Mark Absent
        cursor.execute("""
            INSERT INTO attendance (rollNumber, studentName, department, date, timeIn, timeOut, status, markedBy)
            VALUES (?, ?, ?, ?, '-', '-', 'Absent', 'Manual')
            ON CONFLICT(rollNumber, date) DO UPDATE SET status='Absent', timeIn='-', timeOut='-', markedBy='Manual'
        """, (roll_number, full_name, dept, payload.date))
        
    conn.commit()
    conn.close()
    return {"success": True}

# ─── Live Webcam Scan API ─────────────────────────────────────
@app.post("/api/attendance/scan")
async def scan_attendance(request: ScanRequest, current_user: Optional[dict] = Depends(get_current_user)):
    faces = face_service.scan_frame(request.image)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    today_str = datetime.now().strftime("%Y-%m-%d")
    time_str = datetime.now().strftime("%I:%M:%S %p")
    
    updated_faces = []
    
    for face in faces:
        name = face["name"]
        is_live = face["is_live"]
        face["identity_verified"] = True
        
        # If model recognized a face and spoofing check passed
        if name != "Unknown" and is_live:
            # Query db for the student matching either Roll Number or Full Name
            cursor.execute("SELECT rollNumber, fullName, department FROM students WHERE rollNumber = ? OR fullName = ?", (name, name))
            student = cursor.fetchone()
            
            if student:
                roll = student["rollNumber"]
                friendly_name = student["fullName"]
                dept = student["department"]
                
                # Update visual label shown to frontend to friendly full name
                face["name"] = friendly_name
                
                # Enforce identity check for student role
                if current_user and current_user.get("role") == "student":
                    expected_roll = current_user.get("referenceId")
                    expected_name = current_user.get("fullName")
                    if roll != expected_roll and friendly_name != expected_name:
                        print(f"Identity mismatch in scan: logged in as {expected_name} ({expected_roll}), but face is {friendly_name} ({roll})")
                        face["identity_verified"] = False
                        face["is_live"] = False
                        face["marked"] = False
                        face["name"] = f"Mismatch: {friendly_name}"
                        updated_faces.append(face)
                        continue
                
                # Check if already logged today
                cursor.execute("SELECT COUNT(*) FROM attendance WHERE rollNumber = ? AND date = ? AND status = 'Present'", (roll, today_str))
                already_marked = cursor.fetchone()[0] > 0
                
                if not already_marked:
                    # Write presence to database
                    cursor.execute("""
                        INSERT INTO attendance (rollNumber, studentName, department, date, timeIn, timeOut, status, markedBy)
                        VALUES (?, ?, ?, ?, ?, 'Pending', 'Present', 'Webcam')
                        ON CONFLICT(rollNumber, date) DO UPDATE SET status='Present', timeIn=?, markedBy='Webcam'
                    """, (roll, friendly_name, dept, today_str, time_str, time_str))
                    conn.commit()
                    print(f"Logged live face attendance for {friendly_name} ({roll})")
                    face["marked"] = True
                else:
                    face["marked"] = False
                    
        updated_faces.append(face)
        
    conn.close()
    return {"faces": updated_faces}

# ─── Reports Analytics Summary ─────────────────────────────────
@app.get("/api/reports/summary")
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
