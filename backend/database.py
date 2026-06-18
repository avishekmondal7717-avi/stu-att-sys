import sqlite3
from pathlib import Path
import hashlib
import secrets

DB_PATH = Path(__file__).parent / "attendance.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hash_val = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        salt.encode('utf-8'), 
        100000
    )
    return f"{salt}:{hash_val.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt, hash_hex = hashed_password.split(":")
        hash_val = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode('utf-8'), 
            salt.encode('utf-8'), 
            100000
        )
        return hash_val.hex() == hash_hex
    except Exception:
        return False

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rollNumber TEXT UNIQUE NOT NULL,
        fullName TEXT NOT NULL,
        fatherName TEXT,
        email TEXT UNIQUE,
        contact TEXT,
        department TEXT,
        course TEXT,
        semester TEXT,
        gender TEXT,
        dob TEXT,
        status TEXT DEFAULT 'Active',
        photo TEXT
    )
    """)
    
    # Create teachers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacherId TEXT UNIQUE NOT NULL,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contact TEXT,
        department TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        photo TEXT
    )
    """)
    
    # Create users table for unified authentication
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        referenceId TEXT,
        fullName TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create attendance table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rollNumber TEXT NOT NULL,
        studentName TEXT NOT NULL,
        department TEXT NOT NULL,
        date TEXT NOT NULL,
        timeIn TEXT NOT NULL,
        timeOut TEXT NOT NULL,
        status TEXT NOT NULL,
        markedBy TEXT NOT NULL,
        UNIQUE(rollNumber, date)
    )
    """)
    
    # Seed dummy students if the table is empty
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        dummy_students = [
            ('CS2024001', 'Aarav Sharma', 'Raj Sharma', 'aarav.sharma@email.com', '9876543210', 'Computer Science', 'B.Tech', '4', 'Male', '2003-04-15', 'Active', 'https://i.pravatar.cc/40?img=11'),
            ('CS2024002', 'Priya Singh', 'Amit Singh', 'priya.singh@email.com', '9876543211', 'Computer Science', 'B.Tech', '4', 'Female', '2003-07-22', 'Active', 'https://i.pravatar.cc/40?img=5'),
            ('IT2024001', 'Rahul Verma', 'Suresh Verma', 'rahul.verma@email.com', '9876543212', 'Information Technology', 'B.Tech', '4', 'Male', '2003-01-10', 'Active', 'https://i.pravatar.cc/40?img=12'),
            ('EC2024003', 'Anjali Kumari', 'Mohan Kumari', 'anjali.kumari@email.com', '9876543213', 'Electronics & Communication', 'B.Tech', '4', 'Female', '2003-09-05', 'Active', 'https://i.pravatar.cc/40?img=9'),
            ('ME2024002', 'Rohit Yadav', 'Vijay Yadav', 'rohit.yadav@email.com', '9876543214', 'Mechanical Engineering', 'B.Tech', '4', 'Male', '2002-12-30', 'Active', 'https://i.pravatar.cc/40?img=15'),
            ('CS2024003', 'Neha Patel', 'Dinesh Patel', 'neha.patel@email.com', '9876543215', 'Computer Science', 'B.Tech', '2', 'Female', '2004-03-18', 'Active', 'https://i.pravatar.cc/40?img=6'),
            ('CE2024001', 'Vikash Kumar', 'Ramesh Kumar', 'vikash.kumar@email.com', '9876543216', 'Civil Engineering', 'B.Tech', '2', 'Male', '2004-06-25', 'Active', 'https://i.pravatar.cc/40?img=13'),
            ('IT2024002', 'Sneha Rathi', 'Prakash Rathi', 'sneha.rathi@email.com', '9876543217', 'Information Technology', 'B.Tech', '2', 'Female', '2004-08-12', 'Active', 'https://i.pravatar.cc/40?img=7'),
            ('EE2024001', 'Manish Gupta', 'Anil Gupta', 'manish.gupta@email.com', '9876543218', 'Electrical Engineering', 'B.Tech', '2', 'Male', '2004-02-08', 'Active', 'https://i.pravatar.cc/40?img=14'),
            ('CS2024004', 'Karan Mehta', 'Sanjay Mehta', 'karan.mehta@email.com', '9876543219', 'Computer Science', 'B.Tech', '6', 'Male', '2002-11-20', 'Active', 'https://i.pravatar.cc/40?img=16')
        ]
        cursor.executemany("""
        INSERT INTO students (rollNumber, fullName, fatherName, email, contact, department, course, semester, gender, dob, status, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, dummy_students)
        
    # Seed dummy teachers if the table is empty
    cursor.execute("SELECT COUNT(*) FROM teachers")
    if cursor.fetchone()[0] == 0:
        dummy_teachers = [
            ('TCH2024001', 'Dr. Sourav Ganguly', 'sourav.ganguly@email.com', '9876543230', 'Computer Science', 'Active', 'https://i.pravatar.cc/40?img=60'),
            ('TCH2024002', 'Prof. Sachin Tendulkar', 'sachin.tendulkar@email.com', '9876543231', 'Information Technology', 'Active', 'https://i.pravatar.cc/40?img=61'),
            ('TCH2024003', 'Dr. Rahul Dravid', 'rahul.dravid@email.com', '9876543232', 'Electronics & Communication', 'Active', 'https://i.pravatar.cc/40?img=62')
        ]
        cursor.executemany("""
        INSERT INTO teachers (teacherId, fullName, email, contact, department, status, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, dummy_teachers)

    # Seed users for credentials if the table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Seed Admin
        admin_pass = hash_password("admin@123")
        cursor.execute("""
        INSERT INTO users (email, password, role, referenceId, fullName, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """, ('admin@email.com', admin_pass, 'admin', 'ADMIN01', 'System Admin', 'Active'))
        
        # Seed Teachers
        teacher_pass = hash_password("teacher@123")
        teachers_to_user = [
            ('sourav.ganguly@email.com', teacher_pass, 'teacher', 'TCH2024001', 'Dr. Sourav Ganguly', 'Active'),
            ('sachin.tendulkar@email.com', teacher_pass, 'teacher', 'TCH2024002', 'Prof. Sachin Tendulkar', 'Active'),
            ('rahul.dravid@email.com', teacher_pass, 'teacher', 'TCH2024003', 'Dr. Rahul Dravid', 'Active')
        ]
        cursor.executemany("""
        INSERT INTO users (email, password, role, referenceId, fullName, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """, teachers_to_user)
        
        # Seed Students
        student_pass = hash_password("student@123")
        students_to_user = [
            ('aarav.sharma@email.com', student_pass, 'student', 'CS2024001', 'Aarav Sharma', 'Active'),
            ('priya.singh@email.com', student_pass, 'student', 'CS2024002', 'Priya Singh', 'Active'),
            ('rahul.verma@email.com', student_pass, 'student', 'IT2024001', 'Rahul Verma', 'Active'),
            ('anjali.kumari@email.com', student_pass, 'student', 'EC2024003', 'Anjali Kumari', 'Active'),
            ('rohit.yadav@email.com', student_pass, 'student', 'ME2024002', 'Rohit Yadav', 'Active'),
            ('neha.patel@email.com', student_pass, 'student', 'CS2024003', 'Neha Patel', 'Active'),
            ('vikash.kumar@email.com', student_pass, 'student', 'CE2024001', 'Vikash Kumar', 'Active'),
            ('sneha.rathi@email.com', student_pass, 'student', 'IT2024002', 'Sneha Rathi', 'Active'),
            ('manish.gupta@email.com', student_pass, 'student', 'EE2024001', 'Manish Gupta', 'Active'),
            ('karan.mehta@email.com', student_pass, 'student', 'CS2024004', 'Karan Mehta', 'Active')
        ]
        cursor.executemany("""
        INSERT INTO users (email, password, role, referenceId, fullName, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """, students_to_user)
        
    # Seed dummy attendance logs if the table is empty
    cursor.execute("SELECT COUNT(*) FROM attendance")
    if cursor.fetchone()[0] == 0:
        dummy_attendance = [
            ('CS2024001', 'Aarav Sharma', 'Computer Science', '2026-06-18', '09:15:30 AM', '04:45:10 PM', 'Present', 'Webcam'),
            ('CS2024002', 'Priya Singh', 'Computer Science', '2026-06-18', '09:14:22 AM', '04:40:05 PM', 'Present', 'Webcam'),
            ('IT2024001', 'Rahul Verma', 'Information Technology', '2026-06-18', '09:16:10 AM', '04:50:20 PM', 'Present', 'Webcam'),
            ('EC2024003', 'Anjali Kumari', 'Electronics & Communication', '2026-06-18', '09:13:45 AM', '04:42:30 PM', 'Present', 'Webcam'),
            ('CS2024003', 'Neha Patel', 'Computer Science', '2026-06-18', '09:17:05 AM', '04:48:15 PM', 'Present', 'Webcam'),
            ('IT2024002', 'Sneha Rathi', 'Information Technology', '2026-06-18', '09:18:40 AM', '04:51:00 PM', 'Present', 'Webcam'),
            ('CS2024004', 'Karan Mehta', 'Computer Science', '2026-06-18', '09:15:00 AM', '04:47:25 PM', 'Present', 'Webcam')
        ]
        cursor.executemany("""
        INSERT INTO attendance (rollNumber, studentName, department, date, timeIn, timeOut, status, markedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, dummy_attendance)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
