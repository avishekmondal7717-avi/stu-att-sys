import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3

from database import init_db, get_db_connection
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

class FaceEnrollRequest(BaseModel):
    images: List[str] # List of base64 image strings

class ScanRequest(BaseModel):
    image: str # Base64 image string

class AttendanceMarkRequest(BaseModel):
    studentId: int
    status: bool # True for Present, False for Absent
    date: Optional[str] = None # Defaults to today YYYY-MM-DD

# Helper: Convert sqlite3.Row to dict
def row_to_dict(row):
    return dict(row) if row else None

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
            INSERT INTO students (rollNumber, fullName, fatherName, email, contact, department, course, semester, gender, dob, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            student.rollNumber, student.fullName, student.fatherName, student.email, student.contact,
            student.department, student.course, student.semester, student.gender, student.dob,
            f"https://i.pravatar.cc/40?img={hash(student.rollNumber) % 70}"
        ))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"id": new_id, "rollNumber": student.rollNumber, "fullName": student.fullName}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Student with this Roll Number already exists")

@app.put("/api/students/{student_id}")
async def update_student(student_id: int, student: StudentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE students
        SET rollNumber=?, fullName=?, fatherName=?, email=?, contact=?, department=?, course=?, semester=?, gender=?, dob=?
        WHERE id=?
    """, (
        student.rollNumber, student.fullName, student.fatherName, student.email, student.contact,
        student.department, student.course, student.semester, student.gender, student.dob,
        student_id
    ))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/students/{student_id}")
async def delete_student(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
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
    
    # Register faces using Roll Number as label in the classifier
    # This prevents collisions between different students with similar names
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
        # Mark Absent (just delete log or update status to Absent)
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
async def scan_attendance(request: ScanRequest):
    faces = face_service.scan_frame(request.image)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    today_str = datetime.now().strftime("%Y-%m-%d")
    time_str = datetime.now().strftime("%I:%M:%S %p")
    
    updated_faces = []
    
    for face in faces:
        name = face["name"]
        is_live = face["is_live"]
        
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
