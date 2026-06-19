import jwt
import urllib.request
import json
import time
from datetime import datetime, timedelta

JWT_SECRET = "supersecretkeyforattendanceapp2026"
JWT_ALGORITHM = "HS256"

# Generate JWT Token for teacher Sagar
payload = {
    "email": "sagar@gmail.com",
    "role": "teacher",
    "fullName": "Sagar",
    "referenceId": "TCH234543",
    "exp": datetime.utcnow() + timedelta(hours=2)
}
token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Make authenticated request to get attendance
url = f"http://localhost:8000/api/attendance?date={datetime.now().strftime('%Y-%m-%d')}"
req = urllib.request.Request(url)
req.add_header("Authorization", f"Bearer {token}")

print("Sending request to /api/attendance...")
start_time = time.time()
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        status_code = response.getcode()
        body = response.read().decode('utf-8')
        duration = time.time() - start_time
        print(f"Response received in {duration:.2f} seconds.")
        print(f"Status: {status_code}")
        print(f"Body: {body[:300]}...")
except Exception as e:
    duration = time.time() - start_time
    print(f"Request failed after {duration:.2f} seconds: {e}")
