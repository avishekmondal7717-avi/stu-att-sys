import sys
sys.path.append('d:/downloads/dfs-backend/backend')
from database import get_db_connection, verify_password

def check_user():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, role, status, password FROM users WHERE email='tamaghnog@gmail.com'")
        user = cur.fetchone()
        
        if user:
            print("Hash:", user['password'])
        else:
            print("User not found.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    check_user()
