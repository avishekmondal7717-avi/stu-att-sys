import psycopg2
from psycopg2.extras import DictCursor
import hashlib
import secrets

DATABASE_URL = "postgresql://neondb_owner:npg_N4GUC0fvbPaF@ep-blue-bonus-adni75hf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    conn.cursor_factory = DictCursor
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
        status TEXT DEFAULT 'Active',
        embedding VECTOR(128)
    )
    """)
    
    # Create teachers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        teacherid TEXT UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
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
        UNIQUE(rollnumber, date)
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

    # Seed active sessions
    cursor.execute("SELECT COUNT(*) FROM active_sessions")
    if cursor.fetchone()[0] == 0:
        classes = [
            ("CS-401", "CS-401: Data Structures & Algorithms"),
            ("CS-402", "CS-402: Database Management Systems"),
            ("CS-403", "CS-403: Operating Systems"),
            ("CS-404", "CS-404: Formal Language & Automata"),
            ("HU-401", "HU-401: Values & Ethics in Profession")
        ]
        cursor.executemany("INSERT INTO active_sessions (classcode, classname, isactive) VALUES (%s, %s, FALSE)", classes)
    
    # Seed Admin if the table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        admin_pass = hash_password("admin@123")
        cursor.execute("""
        INSERT INTO users (email, password, role, referenceid, fullname, status)
        VALUES (%s, %s, %s, %s, %s, %s)
        """, ('admin@email.com', admin_pass, 'admin', 'ADMIN01', 'System Admin', 'Active'))
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    # Drop existing tables to recreate them with lowercase column names cleanly
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS students, teachers, users, attendance CASCADE;")
    conn.commit()
    conn.close()
    
    init_db()
    print("PostgreSQL Database recreated with lowercase columns and initialized successfully.")
