import psycopg2
from psycopg2.extras import DictCursor
from psycopg2.pool import ThreadedConnectionPool
import hashlib
import secrets
import os
from pathlib import Path

# Load environment variables from .env if present
def load_dotenv():
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is missing. Please set it in backend/.env")

# Global thread-safe connection pool
db_pool = None

def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = ThreadedConnectionPool(1, 20, DATABASE_URL)
    return db_pool

def get_db_connection():
    conn = get_db_pool().getconn()
    conn.cursor_factory = DictCursor
    return conn

def release_db_connection(conn):
    get_db_pool().putconn(conn)

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
    
    # We do NOT quote column names so PostgreSQL defaults to lowercase.
    # Our row_to_dict function in main.py will map them back to camelCase.
    
    # Enable pgvector
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # Create students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        rollnumber TEXT UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE,
        contact TEXT,
        department TEXT,
        course TEXT,
        semester TEXT,
        gender TEXT,
        dob TEXT,
        address TEXT,
        photo TEXT,
        status TEXT DEFAULT 'Active',
        embedding VECTOR(128)
    )
    """)
    
    # Run migrations for existing DB instances
    cursor.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;")
    cursor.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS photo TEXT;")
    
    # Create HNSW index for sub-millisecond similarity search
    try:
        cursor.execute("""
        CREATE INDEX IF NOT EXISTS students_embedding_hnsw_idx 
        ON students USING hnsw (embedding vector_l2_ops) 
        WITH (m = 16, ef_construction = 64);
        """)
    except Exception as e:
        print(f"Warning: Could not create HNSW index: {e}. If pgvector version is older, index might need manual updates.")
    
    # Create teachers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        teacherid TEXT UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contact TEXT,
        department TEXT NOT NULL,
        subjects TEXT,
        status TEXT DEFAULT 'Active',
        photo TEXT
    )
    """)
    
    # Create users table for unified authentication
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        referenceid TEXT,
        fullname TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create attendance table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        rollnumber TEXT NOT NULL,
        studentname TEXT NOT NULL,
        department TEXT NOT NULL,
        date TEXT NOT NULL,
        timein TEXT NOT NULL,
        timeout TEXT NOT NULL,
        status TEXT NOT NULL,
        markedby TEXT NOT NULL,
        UNIQUE(rollnumber, date, markedby)
    )
    """)
    
    # Create active sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS active_sessions (
        classcode TEXT PRIMARY KEY,
        classname TEXT NOT NULL,
        isactive BOOLEAN DEFAULT FALSE
    )
    """)

    # Each classroom opening is a distinct historical session. This allows the
    # same student to attend several subjects on the same day without overwrites.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance_sessions (
        id SERIAL PRIMARY KEY,
        classcode TEXT NOT NULL,
        classname TEXT NOT NULL,
        department TEXT NOT NULL,
        semester TEXT NOT NULL,
        teacher_email TEXT NOT NULL,
        teacher_name TEXT NOT NULL,
        session_date TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMPTZ,
        isactive BOOLEAN NOT NULL DEFAULT TRUE
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance_session_roster (
        sessionid INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        studentid INTEGER REFERENCES students(id) ON DELETE SET NULL,
        rollnumber TEXT NOT NULL,
        studentname TEXT NOT NULL,
        department TEXT NOT NULL,
        semester TEXT NOT NULL,
        PRIMARY KEY (sessionid, rollnumber)
    )
    """)
    cursor.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS sessionid INTEGER;")
    cursor.execute("ALTER TABLE attendance_session_roster ALTER COLUMN studentid DROP NOT NULL;")
    cursor.execute("ALTER TABLE attendance_session_roster DROP CONSTRAINT IF EXISTS attendance_session_roster_studentid_fkey;")
    cursor.execute("""
        ALTER TABLE attendance_session_roster
        ADD CONSTRAINT attendance_session_roster_studentid_fkey
        FOREIGN KEY (studentid) REFERENCES students(id) ON DELETE SET NULL
    """)
    cursor.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS submitted_latitude DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS submitted_longitude DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS distance_meters DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_confidence DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS verification_method TEXT;")
    cursor.execute("ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS allowed_radius_meters DOUBLE PRECISION NOT NULL DEFAULT 100;")
    cursor.execute("ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS location_required BOOLEAN NOT NULL DEFAULT FALSE;")
    cursor.execute("ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_rollnumber_date_markedby_key;")
    cursor.execute("ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_rollnumber_date_key;")
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS attendance_session_roll_unique
        ON attendance(sessionid, rollnumber)
        WHERE sessionid IS NOT NULL
    """)
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS attendance_legacy_roll_date_unique
        ON attendance(rollnumber, date)
        WHERE sessionid IS NULL
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS attendance_sessions_teacher_date_idx
        ON attendance_sessions(teacher_email, session_date DESC)
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS attendance_sessions_department_date_idx ON attendance_sessions(department, session_date DESC);")
    cursor.execute("CREATE INDEX IF NOT EXISTS attendance_roster_session_roll_idx ON attendance_session_roster(sessionid, rollnumber);")
    cursor.execute("CREATE INDEX IF NOT EXISTS attendance_session_status_idx ON attendance(sessionid, rollnumber, status);")
    cursor.execute("""
        WITH ranked_live_sessions AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY teacher_email ORDER BY id DESC) AS position
            FROM attendance_sessions
            WHERE isactive = TRUE
        )
        UPDATE attendance_sessions session
        SET isactive = FALSE, ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP)
        FROM ranked_live_sessions ranked
        WHERE session.id = ranked.id AND ranked.position > 1
    """)
    cursor.execute("""
        WITH ranked_live_cohorts AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY LOWER(department), semester
                       ORDER BY id DESC
                   ) AS position
            FROM attendance_sessions
            WHERE isactive = TRUE
        )
        UPDATE attendance_sessions session
        SET isactive = FALSE, ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP)
        FROM ranked_live_cohorts ranked
        WHERE session.id = ranked.id AND ranked.position > 1
    """)
    cursor.execute("""
        UPDATE active_sessions active
        SET isactive = FALSE
        WHERE active.isactive = TRUE
          AND NOT EXISTS (
              SELECT 1
              FROM attendance_sessions history
              WHERE history.classcode = active.classcode
                AND history.isactive = TRUE
          )
    """)

    # Ensure teachers.subjects column exists for storing comma-separated subjects
    try:
        cursor.execute("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subjects TEXT;")
        # Teacher self-registration is immediately active; migrate legacy
        # accounts created under the former email-verification workflow.
        cursor.execute("UPDATE teachers SET status = 'Active' WHERE status = 'Pending Verification';")
        cursor.execute("UPDATE users SET status = 'Active' WHERE role = 'teacher' AND status = 'Pending Verification';")
    except Exception as e:
        print(f"Warning: could not ensure teachers.subjects column: {e}")

    # Create audit_logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        action TEXT NOT NULL,
        actor TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS password_reset_email_idx ON password_reset_tokens(user_email, created_at DESC);")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance_verification_audit (
        id SERIAL PRIMARY KEY,
        sessionid INTEGER REFERENCES attendance_sessions(id) ON DELETE SET NULL,
        user_email TEXT,
        classcode TEXT,
        outcome TEXT NOT NULL,
        reason TEXT NOT NULL,
        submitted_latitude DOUBLE PRECISION,
        submitted_longitude DOUBLE PRECISION,
        location_accuracy DOUBLE PRECISION,
        distance_meters DOUBLE PRECISION,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """)


    # Seed/refresh active sessions. CS-* codes keep department + semester filtering simple.
    classes = [
        ("CS-101", "Mathematics-IA (BS-M101)"),
        ("CS-102", "Physics-I (BS-PH101)"),
        ("CS-103", "Basic Electrical Engineering (ES-EE101)"),
        ("CS-104", "Physics-I Laboratory (BS-PH191)"),
        ("CS-105", "Basic Electrical Engineering Lab (ES-EE191)"),
        ("CS-106", "Workshop (ES-ME192)"),
        ("CS-201", "Chemistry-I (BS-CH201)"),
        ("CS-202", "Mathematics-IIA (BS-M201)"),
        ("CS-203", "Programming for Problem Solving (ES-CS201)"),
        ("CS-204", "English (HM-HU201)"),
        ("CS-205", "Chemistry-I Laboratory (BS-CH291)"),
        ("CS-206", "Programming for Problem Solving Lab (ES-CS291)"),
        ("CS-207", "Engineering Graphics & Design (ES-ME291)"),
        ("CS-208", "Language Laboratory (HM-HU291)"),
        ("CS-301", "Analog and Digital Electronics (ESC 301)"),
        ("CS-302", "Data Structure & Algorithms (PCC-CS301)"),
        ("CS-303", "Computer Organisation (PCC-CS302)"),
        ("CS-304", "Mathematics-III (BSC 301)"),
        ("CS-305", "Economics for Engineers (HSMC 301)"),
        ("CS-306", "Analog and Digital Electronics Lab (ESC 391)"),
        ("CS-307", "Data Structure & Algorithm Lab (PCC-CS391)"),
        ("CS-308", "Computer Organization Lab (PCC-CS392)"),
        ("CS-309", "IT Workshop (PCC-CS393)"),
        ("CS-401", "Discrete Mathematics (PCC-CS401)"),
        ("CS-402", "Computer Architecture (PCC-CS402)"),
        ("CS-403", "Formal Language & Automata Theory (PCC-CS403)"),
        ("CS-404", "Design and Analysis of Algorithms (PCC-CS404)"),
        ("CS-405", "Biology (BSC 401)"),
        ("CS-406", "Environmental Sciences (MC-401)"),
        ("CS-407", "Computer Architecture Lab (PCC-CS492)"),
        ("CS-408", "Design & Analysis Algorithm Lab (PCC-CS494)"),
        ("CS-501", "Software Engineering (ESC501)"),
        ("CS-502", "Compiler Design (PCC-CS501)"),
        ("CS-503", "Operating Systems (PCC-CS502)"),
        ("CS-504", "Object Oriented Programming (PCC-CS503)"),
        ("CS-505", "Introduction to Industrial Management (HSMC-501)"),
        ("CS-506", "Artificial Intelligence (PEC-IT501B)"),
        ("CS-507", "Constitution of India (MC-CS501)"),
        ("CS-508", "Software Engineering Lab (ESC591)"),
        ("CS-509", "Operating System Lab (PCC-CS592)"),
        ("CS-510", "Object Oriented Programming Lab (PCC-CS593)"),
        ("CS-601", "Database Management Systems (PCC-CS601)"),
        ("CS-602", "Computer Networks (PCC-CS602)"),
        ("CS-603", "Research Methodology (PROJ-CS601)"),
        ("CS-604", "Distributed Systems (PEC-IT601B)"),
        ("CS-605", "Image Processing (PEC-IT601D)"),
        ("CS-606", "Pattern Recognition (PEC-IT602D)"),
        ("CS-607", "Numerical Methods (OEC-IT601A)"),
        ("CS-608", "Database Management System Lab (PCC-CS691)"),
        ("CS-609", "Computer Networks Lab (PCC-CS692)"),
        ("CS-701", "Project Management and Entrepreneurship (HSMC 701)"),
        ("CS-702", "Machine Learning (PEC-CS701E)"),
        ("CS-703", "Soft Computing (PEC-CS702B)"),
        ("CS-704", "Adhoc-Sensor Network (PEC-CS702C)"),
        ("CS-705", "Operation Research (OEC-CS701A)"),
        ("CS-706", "Multimedia Technology (OEC-CS701B)"),
        ("CS-707", "Project-II (PROJ-CS781)"),
        ("CS-801", "Cryptography and Network Security (PEC-CS801B)"),
        ("CS-802", "Internet of Things (PEC-CS801E)"),
        ("CS-803", "Big Data Analytics (OEC-CS801A)"),
        ("CS-804", "Mobile Computing (OEC-CS801C)"),
        ("CS-805", "E-Commerce & ERP (OEC-CS802A)"),
        ("CS-806", "Project-III (PROJ-CS881)"),
        ("HU-401", "HU-401: Values & Ethics in Profession"),
    ]
    cursor.executemany("""
        INSERT INTO active_sessions (classcode, classname, isactive)
        VALUES (%s, %s, FALSE)
        ON CONFLICT (classcode) DO UPDATE SET classname = EXCLUDED.classname
    """, classes)
    
    # Bootstrap the first administrator only from explicit environment values.
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        admin_email = os.environ.get("ADMIN_EMAIL")
        admin_password = os.environ.get("ADMIN_PASSWORD")
        admin_name = os.environ.get("ADMIN_NAME", "System Admin")
        if not admin_email or not admin_password or len(admin_password) < 12:
            conn.rollback()
            release_db_connection(conn)
            raise ValueError(
                "ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters "
                "are required to initialize an empty database"
            )
        admin_pass = hash_password(admin_password)
        cursor.execute("""
        INSERT INTO users (email, password, role, referenceid, fullname, status)
        VALUES (%s, %s, %s, %s, %s, %s)
        """, (admin_email, admin_pass, 'admin', 'ADMIN01', admin_name, 'Active'))
        
    conn.commit()
    release_db_connection(conn)

if __name__ == "__main__":
    init_db()
    print("Neon DB tables verified and initialized successfully.")
