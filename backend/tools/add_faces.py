import sys
import cv2
import pickle
import numpy as np
from pathlib import Path

# Add backend directory to path to import face_engine
sys.path.append(str(Path(__file__).parent.parent))
from face_engine import FaceEngine

# Instantiate our modular face engine using backend/data directory
engine = FaceEngine(data_dir=str(Path(__file__).parent.parent / "data"))

video = cv2.VideoCapture(0)
if not video.isOpened():
    raise RuntimeError("Failed to open camera.")

faces_data = []
target_frames = 50
name = input("Enter your name: ")
print("Look at the camera. Follow the on-screen instructions to register different distances and angles...")

while len(faces_data) < target_frames:
    ret, frame = video.read()
    if not ret:
        continue
    
    h, w, _ = frame.shape
    engine.detector.setInputSize((w, h))
    _, faces = engine.detector.detect(frame)
    
    if faces is not None and len(faces) > 0:
        face = faces[0]  # Take the first face
        
        # Crop and align face to get the 128-d embedding
        aligned_face = engine.recognizer.alignCrop(frame, face)
        feature = engine.recognizer.feature(aligned_face)
        faces_data.append(feature.flatten())
        
        # Determine dynamic instruction text based on progress
        count = len(faces_data)
        if count < 15:
            instruction = "Step 1: Normal distance (slowly tilt/turn head)"
        elif count < 35:
            instruction = "Step 2: Move CLOSER to camera (tilt head)"
        else:
            instruction = "Step 3: Move FARTHER back (tilt head)"
        
        # Draw UI
        box = face[0:4].astype(np.int32)
        cv2.rectangle(frame, (box[0], box[1]), (box[0]+box[2], box[1]+box[3]), (50, 50, 255), 2)
        
        # Render text on frame
        cv2.putText(frame, f"Captured: {count}/{target_frames}", (30, 40), 
                    cv2.FONT_HERSHEY_COMPLEX, 0.7, (50, 50, 255), 2)
        cv2.putText(frame, instruction, (30, 80), 
                    cv2.FONT_HERSHEY_COMPLEX, 0.6, (0, 255, 255), 2)
        
        # Short delay to prevent capturing identical consecutive frames
        import time
        time.sleep(0.15)
            
    cv2.imshow("Enrollment", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video.release()
cv2.destroyAllWindows()

if not faces_data:
    print("No faces captured. Exiting.")
    exit()

faces_data = np.array(faces_data)
names_file = engine.names_path
faces_file = engine.faces_path
names = [name] * len(faces_data)

# Update names
if names_file.exists():
    with open(names_file, 'rb') as f:
        existing_names = pickle.load(f)
    existing_names.extend(names)
    with open(names_file, 'wb') as f:
        pickle.dump(existing_names, f)
else:
    with open(names_file, 'wb') as f:
        pickle.dump(names, f)

# Update embeddings
if faces_file.exists():
    with open(faces_file, 'rb') as f:
        existing_faces = pickle.load(f)
    if isinstance(existing_faces, np.ndarray):
        existing_faces = existing_faces.tolist()
    existing_faces.extend(faces_data.tolist())
    with open(faces_file, 'wb') as f:
        pickle.dump(np.array(existing_faces), f)
else:
    with open(faces_file, 'wb') as f:
        pickle.dump(faces_data, f)

print(f"Successfully enrolled {name} with {len(faces_data)} samples.")