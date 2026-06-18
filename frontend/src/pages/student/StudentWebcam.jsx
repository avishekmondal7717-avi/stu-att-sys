import { useState, useRef, useEffect } from 'react';
import { Card, Button, Select, message } from 'antd';
import { VideoCameraOutlined, ScanOutlined, SmileOutlined, CloseOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { attendanceAPI } from '../../services/api';
import './StudentDashboard.css';

const { Option } = Select;

const AVAILABLE_CLASSES = [
  'CS-401: Data Structures & Algorithms',
  'CS-402: Database Management Systems',
  'CS-403: Operating Systems',
  'CS-404: Formal Language & Automata',
  'HU-401: Values & Ethics in Profession',
];

export default function StudentWebcam() {
  const { logs, setLogs, setPresentCount, setTotalClasses } = useOutletContext();

  const [selectedClass, setSelectedClass] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const handleStartCamera = async () => {
    if (!selectedClass) {
      message.warning('Please select a class first!');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      setCameraActive(true);
      
      // Allow DOM state update so videoRef is bound before assigning stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
      
      message.info('Initializing biometric scanning...');
    } catch (err) {
      console.error(err);
      message.error('Could not access camera. Please check permissions.');
    }
  };

  const handleCancelScan = () => {
    stopCamera();
    setSelectedClass('');
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Scanning loop when camera is active
  useEffect(() => {
    if (cameraActive) {
      scanIntervalRef.current = setInterval(() => {
        captureAndScan();
      }, 800);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [cameraActive]);

  const captureAndScan = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, width, height);
    const base64Frame = tempCanvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await attendanceAPI.scanFace(base64Frame);
      ctx.clearRect(0, 0, width, height);

      if (res && res.faces && res.faces.length > 0) {
        res.faces.forEach(face => {
          const [x, y, w, h] = face.box;
          const name = face.name;
          const is_live = face.is_live;
          
          let color = '#f59e0b'; // unknown
          if (name !== 'Unknown') {
            color = is_live ? '#10b981' : '#ef4444'; // live: green, spoof: red
          }

          // Draw bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          // Draw label background
          ctx.fillStyle = color;
          ctx.font = 'bold 16px sans-serif';
          const text = !is_live && name !== 'Unknown' ? `SPOOF: ${name}` : name;
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(x - 1, y - 28, textWidth + 12, 28);

          // Draw label text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x + 6, y - 8);

          // Auto mark if recognized and live
          if (name !== 'Unknown' && is_live) {
            // Check if already marked for this class session in local UI state
            const classCode = selectedClass.split(':')[0];
            const todayStr = new Date().toISOString().split('T')[0];
            const alreadyMarked = logs.some(l => l.date === todayStr && l.type.includes(classCode));

            if (alreadyMarked) {
              message.warning(`Attendance already logged for ${classCode} today!`);
              stopCamera();
              setSelectedClass('');
              return;
            }

            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newRecord = {
              key: String(logs.length + 1),
              date: todayStr,
              timeIn: currentTime,
              timeOut: 'Pending',
              status: 'Present',
              type: `Face ID (${classCode})`,
            };

            setLogs(prev => [newRecord, ...prev]);
            setPresentCount(prev => prev + 1);
            setTotalClasses(prev => prev + 1);

            message.success(`Face biometric verified! Attendance logged for ${name}.`);
            stopCamera();
            setSelectedClass('');
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div>
      <PageHeader title="Webcam Attendance" subtitle="Mark your attendance instantly using face recognition" breadcrumbs={[{ label: 'Webcam Attendance' }]} />

      <Card title={<span style={{ color: '#1e3a8a', fontWeight: 700 }}>Classroom Scan Viewport</span>} style={{ borderRadius: 12, maxWidth: 640, margin: '0 auto' }}>
        {!cameraActive ? (
          <div className="classroom-setup">
            <p className="scanner-instruction">Select your current class schedule to initialize self face scanning:</p>
            <Select
              placeholder="Choose active classroom session"
              size="large"
              style={{ width: '100%', marginBottom: 20 }}
              value={selectedClass || undefined}
              onChange={setSelectedClass}
            >
              {AVAILABLE_CLASSES.map((c) => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>

            <div className="setup-placeholder" style={{ background: '#f8fafc', height: 320, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, border: '2px dashed #cbd5e1' }}>
              <VideoCameraOutlined className="placeholder-cam-icon" style={{ fontSize: 48, color: '#94a3b8' }} />
              <span style={{ color: '#64748b' }}>Webcam Inactive</span>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<VideoCameraOutlined />}
              onClick={handleStartCamera}
              disabled={!selectedClass}
              style={{ width: '100%', height: 48, background: '#1e3a8a', fontWeight: 600, borderRadius: 8, marginTop: 16 }}
            >
              Enter Classroom & Start Scan
            </Button>
          </div>
        ) : (
          <div className="webcam-scan-container">
            <div className="scan-header-text" style={{ marginBottom: 12, fontSize: 15 }}>
              Classroom Session: <strong>{selectedClass}</strong>
            </div>

            <div style={{ position: 'relative', width: '100%', height: 400, background: '#1a1a2e', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              {/* HTML5 Video Element */}
              <video 
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                muted
                playsInline
              />
              {/* Canvas Overlay for boxes */}
              <canvas 
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
              />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 20, color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ScanOutlined style={{ color: '#10b981' }} />
                Scanning for biometric presence...
              </div>
            </div>

            <div className="scan-actions" style={{ display: 'flex', gap: 12 }}>
              <Button
                size="large"
                danger
                icon={<CloseOutlined />}
                onClick={handleCancelScan}
                style={{ flex: 1, height: 44, borderRadius: 8 }}
              >
                Cancel Scan
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
