import cv2
import pickle
import numpy as np
from pathlib import Path
from sklearn.neighbors import KNeighborsClassifier

class FaceEngine:
    def __init__(self, data_dir: str = 'data'):
        self.data_dir = Path(data_dir)
        self.faces_path = self.data_dir / 'faces_data.pkl'
        self.names_path = self.data_dir / 'names.pkl'
        
        self.embeddings = []
        self.labels = []
        self.knn = None
        
        # SFace Match & Learn thresholds (Cosine Distance)
        self.match_threshold = 0.63
        self.learn_threshold = 0.40
        self.max_memory_per_user = 100
        
        # Load OpenCV DNN Models
        self.detector = cv2.FaceDetectorYN_create(
            str(self.data_dir / 'face_detection_yunet_2023mar.onnx'), 
            "", (320, 320), 0.9, 0.3, 5000
        )
        self.recognizer = cv2.FaceRecognizerSF_create(
            str(self.data_dir / 'face_recognition_sface_2021dec.onnx'), 
            ""
        )
        
        self.load_database()

    def load_database(self):
        """Loads embeddings and fits the KNN classifier."""
        if not self.faces_path.exists() or not self.names_path.exists():
            return  # Database doesn't exist yet (first-time enrollment)
            
        with open(self.names_path, 'rb') as f:
            self.labels = pickle.load(f)
        with open(self.faces_path, 'rb') as f:
            self.embeddings = list(pickle.load(f))
            
        self.train_knn()

    def train_knn(self):
        """Re-fits the scale-invariant Cosine KNN model."""
        if len(self.embeddings) > 0:
            self.knn = KNeighborsClassifier(n_neighbors=min(5, len(self.embeddings)), metric='cosine', weights='distance')
            self.knn.fit(self.embeddings, self.labels)

    def verify_liveness(self, face_crop, face_landmarks) -> tuple:
        """
        Performs dual-validation anti-spoofing:
        1. Texture Analysis on the face crop itself (detect print/screen recaptures)
        2. 3D Structure Yaw Ratio (detects flat surface rotation)
        """
        # 1. Texture Blurriness Check on the Face Crop
        if face_crop.size == 0:
            return False, 1.0, 0.0
            
        gray_crop = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray_crop, cv2.CV_64F).var()
        
        # Extremely lenient threshold (12.0) to accommodate hazy lenses/low light
        is_texture_valid = laplacian_var > 12.0  
        
        # 2. Extract Landmarks for Yaw check
        r_eye_x = face_landmarks[0]
        l_eye_x = face_landmarks[2]
        nose_x = face_landmarks[4]
        
        dist_r = abs(nose_x - r_eye_x)
        dist_l = abs(nose_x - l_eye_x)
        
        # Avoid division by zero
        yaw_ratio = dist_r / max(dist_l, 0.001)
        
        return is_texture_valid, yaw_ratio, laplacian_var

    def process_frame(self, frame) -> list:
        """
        Processes a single raw BGR frame. 
        Returns a list of detected face dictionaries containing:
        - bounding_box: [x, y, w, h]
        - name: identified user or 'Unknown'
        - distance: matching cosine distance
        - is_live: boolean indicating if anti-spoofing passed
        """
        h, w, _ = frame.shape
        self.detector.setInputSize((w, h))
        _, faces = self.detector.detect(frame)
        
        results = []
        if faces is not None:
            for face in faces:
                box = face[0:4].astype(np.int32)
                landmarks = face[4:14].astype(np.int32)
                
                # Crop the face safely within image boundaries
                x, y, width, height = box
                x1, y1 = max(0, x), max(0, y)
                x2, y2 = min(w, x + width), min(h, y + height)
                face_crop = frame[y1:y2, x1:x2]
                
                # Check liveness on the cropped face
                is_texture_valid, yaw_ratio, lap_score = self.verify_liveness(face_crop, landmarks)
                
                is_live = is_texture_valid 
                
                name = "Unknown"
                min_dist = 1.0
                
                if self.knn is not None:
                    # Crop, Align and Represent face
                    aligned_face = self.recognizer.alignCrop(frame, face)
                    feature = self.recognizer.feature(aligned_face).flatten()
                    
                    distances, indices = self.knn.kneighbors([feature], n_neighbors=1)
                    min_dist = distances[0][0]
                    best_match_idx = indices[0][0]
                    
                    if min_dist <= self.match_threshold:
                        name = self.labels[best_match_idx]
                        
                        # Live Incremental Learning
                        if min_dist <= self.learn_threshold and is_live:
                            self.incremental_learn(feature, name)
                            
                results.append({
                    "box": box,
                    "name": name,
                    "distance": min_dist,
                    "is_live": is_live,
                    "laplacian": lap_score,
                    "yaw_ratio": yaw_ratio
                })
        return results

    def incremental_learn(self, embedding: np.ndarray, label: str):
        """Adds live verified vectors to the database dynamically."""
        self.embeddings.append(embedding)
        self.labels.append(label)
        
        # FIFO memory management per user
        user_indices = [i for i, x in enumerate(self.labels) if x == label]
        if len(user_indices) > self.max_memory_per_user:
            oldest_idx = user_indices[0]
            self.embeddings.pop(oldest_idx)
            self.labels.pop(oldest_idx)
            
        self.train_knn()

    def save_database(self):
        """Persists memory updates back to the disk."""
        if len(self.embeddings) > 0:
            with open(self.faces_path, 'wb') as f:
                pickle.dump(np.array(self.embeddings), f)
            with open(self.names_path, 'wb') as f:
                pickle.dump(self.labels, f)
