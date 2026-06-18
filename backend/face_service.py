import base64
import cv2
import numpy as np
import pickle
from pathlib import Path

from face_engine import FaceEngine

class FaceServiceWrapper:
    def __init__(self):
        # Configure FaceEngine to use the local backend/data directory
        self.data_dir = Path(__file__).parent / "data"
        self.engine = FaceEngine(data_dir=str(self.data_dir))
        
        # Track micro-movements to detect spoofing in video streams
        self.yaw_history = {}

    def decode_base64_image(self, b64_string: str) -> np.ndarray:
        """Decodes base64 string to a cv2 BGR frame."""
        if "," in b64_string:
            b64_string = b64_string.split(",")[1]
        img_bytes = base64.b64decode(b64_string)
        nparr = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    def scan_frame(self, b64_frame: str) -> list:
        """
        Scans a single frame from the browser.
        Returns a list of detected face metadata:
        [{"box": [x,y,w,h], "name": name, "is_live": is_live, "distance": dist}]
        """
        try:
            frame = self.decode_base64_image(b64_frame)
            if frame is None:
                return []
            
            faces = self.engine.process_frame(frame)
            results = []
            
            for face in faces:
                box = face["box"].tolist() if isinstance(face["box"], np.ndarray) else list(face["box"])
                name = face["name"]
                is_live = face["is_live"]
                yaw = face["yaw_ratio"]
                dist = face["distance"]
                
                # Run liveness tracking across frames
                if name != "Unknown":
                    if name not in self.yaw_history:
                        self.yaw_history[name] = []
                    self.yaw_history[name].append(yaw)
                    if len(self.yaw_history[name]) > 30:
                        self.yaw_history[name].pop(0)
                        
                    if len(self.yaw_history[name]) >= 15:
                        variance = float(np.var(self.yaw_history[name]))
                        if variance < 1e-5:
                            is_live = False
                            
                results.append({
                    "box": box, # [x, y, w, h]
                    "name": name,
                    "is_live": bool(is_live),
                    "distance": float(dist)
                })
            return results
        except Exception as e:
            print(f"Error in scan_frame: {e}")
            return []

    def enroll_student_faces(self, label: str, b64_images: list) -> int:
        """
        Enrolls a student by processing a batch of base64 images.
        Extracts face embeddings and updates the pickle database.
        Returns the count of successfully registered face samples.
        """
        faces_data = []
        
        for b64_str in b64_images:
            try:
                frame = self.decode_base64_image(b64_str)
                if frame is None:
                    continue
                
                h, w, _ = frame.shape
                self.engine.detector.setInputSize((w, h))
                _, faces = self.engine.detector.detect(frame)
                
                if faces is not None and len(faces) > 0:
                    face = faces[0]  # Take the first face
                    aligned_face = self.engine.recognizer.alignCrop(frame, face)
                    feature = self.engine.recognizer.feature(aligned_face)
                    faces_data.append(feature.flatten())
            except Exception as e:
                print(f"Failed to process image during enrollment: {e}")
                
        if not faces_data:
            return 0
            
        faces_data = np.array(faces_data)
        names = [label] * len(faces_data)
        
        # Load existing database
        existing_names = []
        existing_faces = []
        
        names_file = self.data_dir / 'names.pkl'
        faces_file = self.data_dir / 'faces_data.pkl'
        
        if names_file.exists():
            with open(names_file, 'rb') as f:
                existing_names = pickle.load(f)
        
        if faces_file.exists():
            with open(faces_file, 'rb') as f:
                existing_faces = pickle.load(f)
                if isinstance(existing_faces, np.ndarray):
                    existing_faces = existing_faces.tolist()
                    
        # Append and save
        existing_names.extend(names)
        existing_faces.extend(faces_data.tolist())
        
        with open(names_file, 'wb') as f:
            pickle.dump(existing_names, f)
            
        with open(faces_file, 'wb') as f:
            pickle.dump(np.array(existing_faces), f)
            
        # Re-train KNN on updated database
        self.engine.load_database()
        
        return len(faces_data)

# Singleton instance
face_service = FaceServiceWrapper()
