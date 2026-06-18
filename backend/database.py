import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "attendance.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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
        email TEXT,
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
