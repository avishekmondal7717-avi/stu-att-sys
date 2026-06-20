import { useState, useRef, useEffect } from 'react';
import { Card, Button, Select, message, Alert } from 'antd';
import { VideoCameraOutlined, ScanOutlined, SmileOutlined, CloseOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { attendanceAPI } from '../../services/api';
import './StudentDashboard.css';

const { Option } = Select;

export default function StudentWebcam() {
  const {
    logs,
    setLogs,
    setPresentCount,
    setTotalClasses,
    fetchStudentData,
    dismissSessionNotification,
    activeSessions = []
  } = useOutletContext();

  const [selectedClass, setSelectedClass] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanWarning, setScanWarning] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const scanningRef = useRef(false);
  const attendanceCompletedRef = useRef(false);
  const selectedClassRef = useRef('');
  const locationRef = useRef(null);

  // Keep ref in sync with state for use inside setInterval closure
  useEffect(() => {
    selectedClassRef.current = selectedClass;
  }, [selectedClass]);

  // Monitor activeSessions to auto-close camera if selected class is disabled by teacher
  useEffect(() => {
    if (selectedClass) {
      if (activeSessions.length > 0 && !activeSessions.some(s => s.classCode === selectedClass)) {
        message.warning("The attendance window for this class has been closed by the faculty.");
        stopCamera();
        setSelectedClass('');
      }
    }
  }, [activeSessions, selectedClass]);

  // Pre-select class from search query param if present
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const classCode = queryParams.get('class');
    if (classCode && activeSessions.length > 0) {
      const matched = activeSessions.find(s => s.classCode === classCode);
      if (matched) {
        setSelectedClass(matched.classCode);
      }
    }
  }, [activeSessions]);

  const handleStartCamera = async () => {
    if (!selectedClass) {
      message.warning('Please select a class first!');
      return;
    }
    
    try {
      attendanceCompletedRef.current = false;
      const selectedSession = activeSessions.find((s) => s.classCode === selectedClass);
      if (selectedSession?.locationRequired) {
        locationRef.current = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation is not supported by this browser.'));
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
            () => reject(new Error('Location permission is required to mark attendance.')),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );
        });
      } else {
        locationRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setScanWarning({ text: "No face detected in view", type: "warning" });
      
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
      message.error(err.message || 'Could not access camera or location. Please check permissions.');
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
    setScanWarning(null);
    locationRef.current = null;
  };

  // Scanning loop when camera is active — uses lock to prevent request pile-up
  useEffect(() => {
    if (cameraActive) {
      scanIntervalRef.current = setInterval(() => {
        if (!scanningRef.current) {
          captureAndScan();
        }
      }, 1200);
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
    if (scanningRef.current || attendanceCompletedRef.current) return;
    scanningRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanningRef.current = false;
      return;
    }

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
      const classCode = selectedClassRef.current;
      const res = await attendanceAPI.scanFace(base64Frame, classCode, locationRef.current);
      ctx.clearRect(0, 0, width, height);

      if (res && res.faces && res.faces.length > 0) {
        let primaryWarning = null;

        for (const face of res.faces) {
          const [x, y, w, h] = face.box;
          const name = face.name;
          const is_live = face.is_live;
          const identity_verified = face.identity_verified !== false;
          
          let color = '#f59e0b'; // unknown
          let text = name;
          if (name !== 'Unknown') {
            if (face.liveness_status === 'live' && identity_verified) {
              color = '#10b981'; // Green
              text = name;
            } else if (face.liveness_status === 'spoof') {
              color = '#ef4444'; // Red
              text = `SPOOF: ${name}`;
            } else if (face.liveness_status === 'verifying') {
              color = '#3b82f6'; // Blue
              text = `Verifying: ${name}`;
            } else if (!identity_verified) {
              color = '#ef4444'; // Red
              text = `MISMATCH: ${name.replace('Mismatch: ', '')}`;
            } else {
              color = is_live ? '#10b981' : '#ef4444';
              text = !is_live ? `SPOOF: ${name}` : name;
            }
          }

          // Draw bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          // Draw label background
          ctx.fillStyle = color;
          ctx.font = 'bold 16px sans-serif';
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(x - 1, y - 28, textWidth + 12, 28);

          // Draw label text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x + 6, y - 8);

          // Realtime warnings setup
          if (!identity_verified) {
            primaryWarning = { text: `Identity Mismatch: Another person's face visible`, type: "error" };
          } else if (face.liveness_status === 'verifying' && name !== 'Unknown') {
            primaryWarning = { text: face.liveness_prompt || "Follow the head-turn liveness check", type: "info" };
          } else if (!is_live && name !== 'Unknown') {
            primaryWarning = { text: "Spoof Warning: Biometric liveness check failed!", type: "error" };
          } else if (name === 'Unknown') {
            primaryWarning = { text: "Face not recognized in database", type: "warning" };
          }

          // Auto mark if recognized and live
          if (name !== 'Unknown' && is_live && identity_verified) {
            // Check if already marked for this class session in local UI state
            const localDate = new Date();
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            const alreadyMarked = logs.some(l => l.date === todayStr && l.type && l.type.includes(classCode));

            if (alreadyMarked || !face.marked) {
              primaryWarning = { text: `Attendance already logged for ${classCode} today!`, type: "warning" };
              stopCamera();
              setSelectedClass('');
              attendanceCompletedRef.current = true;
              message.info(`Attendance already logged for ${classCode} today`);
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

            attendanceCompletedRef.current = true;
            setScanWarning({ text: `Attendance marked successfully for ${classCode}`, type: "success" });
            dismissSessionNotification?.(classCode);
            message.success(`Attendance marked successfully for ${classCode}`);
            fetchStudentData?.();
            stopCamera();
            setSelectedClass('');
            return;
          }
        }

        if (!attendanceCompletedRef.current) {
          setScanWarning(primaryWarning);
        }
      } else {
        if (!attendanceCompletedRef.current) {
          setScanWarning({ text: "No face detected in view", type: "warning" });
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || '';
      if (errMsg.includes('closed') || errMsg.includes('window')) {
        message.error("Attendance window has been closed! Stopping scan.");
        stopCamera();
        setSelectedClass('');
      } else {
        setScanWarning({ text: errMsg || "Connection error with scanner", type: "error" });
        if (errMsg.toLowerCase().includes('location') || errMsg.toLowerCase().includes('radius') || errMsg.includes('classroom')) {
          message.error(errMsg);
          stopCamera();
        }
      }
    } finally {
      scanningRef.current = false;
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

      <Card title={<span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Classroom Scan Viewport</span>} style={{ borderRadius: 12, maxWidth: 640, margin: '0 auto' }}>
        {!cameraActive ? (
          <div className="classroom-setup">
            {activeSessions.length === 0 ? (
              <Alert
                message="Self-Attendance Closed"
                description="There are currently no active classroom attendance windows open by the faculty. Please ask your faculty to enable the session."
                type="warning"
                showIcon
                style={{ marginBottom: 20 }}
              />
            ) : (
              <>
                <p className="scanner-instruction" style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Select your current class schedule to initialize self face scanning:</p>
                <Select
                  placeholder="Choose active classroom session"
                  size="large"
                  style={{ width: '100%', marginBottom: 20 }}
                  value={selectedClass || undefined}
                  onChange={setSelectedClass}
                >
                  {activeSessions.map((s) => (
                    <Option key={s.classCode} value={s.classCode}>{s.className}</Option>
                  ))}
                </Select>
              </>
            )}

            <div className="setup-placeholder" style={{ background: 'var(--bg-primary)', height: 320, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, border: '2px dashed var(--border-color)' }}>
              <VideoCameraOutlined className="placeholder-cam-icon" style={{ fontSize: 48, color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Webcam Inactive</span>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<VideoCameraOutlined />}
              onClick={handleStartCamera}
              disabled={!selectedClass || activeSessions.length === 0 || !activeSessions.some(s => s.classCode === selectedClass)}
              style={{ width: '100%', height: 48, background: 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 600, borderRadius: 8, marginTop: 16, border: 'none' }}
            >
              Enter Classroom & Start Scan
            </Button>
          </div>
        ) : (
          <div className="webcam-scan-container">
            <div className="scan-header-text" style={{ marginBottom: 12, fontSize: 15, color: 'var(--text-primary)' }}>
              Classroom Session: <strong>{activeSessions.find(s => s.classCode === selectedClass)?.className || selectedClass}</strong>
            </div>

            <style>{`
              @keyframes scan-pulse {
                0% { opacity: 0.85; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.03); }
                100% { opacity: 0.85; transform: scale(1); }
              }
            `}</style>
            <div style={{ position: 'relative', width: '100%', height: 400, background: '#09090b', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px solid var(--border-color)' }}>
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
              <div style={{ 
                position: 'absolute', 
                top: 12, 
                left: 12, 
                right: 12,
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none',
                zIndex: 11
              }}>
                <div style={{ background: 'rgba(9,9,11,0.85)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20, color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ScanOutlined style={{ color: '#10b981' }} />
                  Scanning for biometric presence...
                </div>
                {scanWarning && (
                  <div style={{ 
                    background: scanWarning.type === 'success' ? 'rgba(16,185,129,0.9)' : scanWarning.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(245,158,11,0.9)', 
                    border: scanWarning.type === 'success' ? '1px solid #10b981' : scanWarning.type === 'error' ? '1px solid #ef4444' : '1px solid #f59e0b', 
                    padding: '6px 14px', 
                    borderRadius: 20, 
                    color: '#fff', 
                    fontSize: 12, 
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: 'scan-pulse 1.5s infinite ease-in-out' 
                  }}>
                    {scanWarning.text}
                  </div>
                )}
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
