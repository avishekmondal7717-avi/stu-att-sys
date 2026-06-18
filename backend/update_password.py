import sys
sys.path.append('d:/downloads/dfs-backend/backend')
from database import get_db_connection, hash_password

def update_password():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        new_hash = hash_password('Tamaghno@0852')
        cur.execute("UPDATE users SET password = %s WHERE email = 'tamaghnog@gmail.com'", (new_hash,))
        conn.commit()
        print("Password successfully updated.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    update_password()
