import sys
import cv2
import csv
import numpy as np
from datetime import datetime
from pathlib import Path

# Add backend directory to path to import face_engine
sys.path.append(str(Path(__file__).parent.parent))
from face_engine import FaceEngine

class AppRunner:
    def __init__(self, log_dir: str = None):
        if log_dir is None:
            self.log_dir = Path(__file__).parent / 'Attendance'
        else:
            self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.engine = FaceEngine(data_dir=str(Path(__file__).parent.parent / "data"))
        
        # Track micro-movements to detect flat/static picture hacks
        self.yaw_history = {}

    def run(self):
        video = cv2.VideoCapture(0)
        if not video.isOpened():
            raise RuntimeError("Failed to initialize camera pipeline.")

        print("System Online. Press 'o' to log attendance, 'q' to quit.")
        
        try:
            while True:
                ret, frame = video.read()
                if not ret:
                    continue

                faces = self.engine.process_frame(frame)
                current_frame_attendance = []

                for face in faces:
                    box = face["box"]
                    name = face["name"]
                    is_live = face["is_live"]
                    yaw = face["yaw_ratio"]
                    
                    # Track yaw variance to ensure face isn't a completely static printed photo
                    if name != "Unknown":
                        if name not in self.yaw_history:
                            self.yaw_history[name] = []
                        self.yaw_history[name].append(yaw)
                        if len(self.yaw_history[name]) > 30:
                            self.yaw_history[name].pop(0)
                            
                        # If the camera detects a face for > 15 frames, check if there is natural micro-movement.
                        # A real moving human head has minor variations. A stationary photo has near-zero variance.
                        if len(self.yaw_history[name]) >= 15:
                            variance = float(np.var(self.yaw_history[name]))
                            # A flat picture has zero or extremely small depth landmark variations
                            if variance < 1e-5:
                                is_live = False  # Flagged as static spoof
                    
                    # Render and alert logic
                    if not is_live:
                        name = f"SPOOF: {name}"
                        color = (0, 0, 255)  # Red Alert
                    elif name == "Unknown":
                        color = (0, 165, 255)  # Orange for unrecognized
                    else:
                        color = (0, 255, 0)  # Green for recognized live user
                        current_frame_attendance.append(name)

                    # Draw optimized bounding box and name tag
                    cv2.rectangle(frame, (box[0], box[1]), (box[0]+box[2], box[1]+box[3]), color, 2)
                    cv2.putText(frame, name, (box[0], box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

                cv2.imshow("Attendance System", frame)
                
                # Check if user clicked the 'X' window close button
                if cv2.getWindowProperty("Attendance System", cv2.WND_PROP_VISIBLE) < 1:
                    break
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('o') and current_frame_attendance:
                    self._log_attendance(current_frame_attendance)

        finally:
            # Guarantee resources are freed and new learning is saved
            video.release()
            cv2.destroyAllWindows()
            self.engine.save_database()
            print("System shutdown complete. Continuous learning database saved.")

    def _log_attendance(self, names: list):
        """Handles stateful I/O safely."""
        now = datetime.now()
        date_str = now.strftime("%d-%m-%y")
        time_str = now.strftime("%H-%M-%S")
        log_file = self.log_dir / f"Attendance_{date_str}.csv"
        
        file_exists = log_file.exists()
        
        with open(log_file, "a", newline="") as csvfile:
            writer = csv.writer(csvfile)
            if not file_exists:
                writer.writerow(['NAME', 'TIME'])
            
            for name in set(names):  # Deduplicate multiple frames of the same person
                writer.writerow([name, time_str])
        
        print(f"Logged attendance for {len(set(names))} detected user(s).")

if __name__ == "__main__":
    runner = AppRunner()
    runner.run()
