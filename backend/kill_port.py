import os
import sys
import subprocess

ports = [8000, 5173]
netstat_path = r"C:\Windows\System32\netstat.exe"
taskkill_path = r"C:\Windows\System32\taskkill.exe"

for port in ports:
    try:
        # Find process IDs on the port
        cmd = f'"{netstat_path}" -ano'
        output = subprocess.check_output(cmd, shell=True).decode('utf-8')
        pids = set()
        for line in output.strip().split('\n'):
            if f":{port}" in line:
                parts = line.split()
                if len(parts) >= 5:
                    pids.add(parts[-1])
        
        for pid in pids:
            if pid != '0':
                print(f"Killing process {pid} on port {port}...")
                subprocess.call(f'"{taskkill_path}" /F /PID {pid}', shell=True)
    except Exception as e:
        print(f"No process found or failed to kill on port {port}: {e}")
