import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- Casing Accesses in main.py ---")
for idx, line in enumerate(lines, 1):
    if ('["rollNumber"]' in line or '["fullName"]' in line or "['rollNumber']" in line or "['fullName']" in line or '["teacherId"]' in line or "['teacherId']" in line):
        # Print the context
        print(f"Line {idx}: {line.strip()}")
