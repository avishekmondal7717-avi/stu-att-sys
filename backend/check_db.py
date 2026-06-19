import sys
from database import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

print("--- Students ---")
cur.execute("SELECT id, rollnumber, fullname, email, department, semester, status FROM students")
for row in cur.fetchall():
    print(dict(row))

print("\n--- Users ---")
cur.execute("SELECT id, email, role, referenceid, fullname, status FROM users")
for row in cur.fetchall():
    print(dict(row))

conn.close()
