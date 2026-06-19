import sys
from database import get_db_connection

try:
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Query current active connections
    cur.execute("SELECT pid, state, query, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE datname = 'neondb';")
    print("--- Active PG Connections ---")
    rows = cur.fetchall()
    for row in rows:
        print(dict(row))
        
    conn.close()
except Exception as e:
    print("Failed to fetch pg_stat_activity:", e)
