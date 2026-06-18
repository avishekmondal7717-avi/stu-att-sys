import { useState, useRef, useEffect } from 'react';
import { Card, Button, Alert, message, Select } from 'antd';
import { VideoCameraOutlined, PoweroffOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { attendanceAPI } from '../../services/api';

const { Option } = Select;

const Webcam = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setScanning(true);
      message.success('Webcam initialized successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to access camera. Please check permissions.');
    }
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
    
    // Clear canvas overlay
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setCameraActive(false);
    setScanning(false);
  };

  // Scan frame loop
  useEffect(() => {
    if (cameraActive && scanning) {
      scanIntervalRef.current = setInterval(async () => {
        captureAndScan();
      }, 800); // Scan every 800ms
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [cameraActive, scanning]);

  const captureAndScan = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video stream
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    
    // Create a temporary canvas to get the JPEG string
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, width, height);
    const base64Frame = tempCanvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await attendanceAPI.scanFace(base64Frame);
      ctx.clearRect(0, 0, width, height);

      if (res && res.faces) {
        res.faces.forEach(face => {
          const [x, y, w, h] = face.box;
          const name = face.name;
          const is_live = face.is_live;
          
          let color = '#f59e0b'; // unknown: Orange
          if (name !== 'Unknown') {
            color = is_live ? '#10b981' : '#ef4444'; // live: Green, spoof: Red
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

          // If attendance is marked successfully in this scan
          if (face.marked) {
            message.success({
              content: `Attendance registered for ${name}!`,
              icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
              duration: 3
            });
            // Update local detection history log list
            const timeStr = new Date().toLocaleTimeString();
            setLogs(prev => [{ time: timeStr, name: name, status: 'Success' }, ...prev.slice(0, 4)]);
          }
        });
      }
    } catch (err) {
      console.error("Scan error:", err);
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
      <PageHeader title="Webcam" subtitle="Face recognition attendance marking" breadcrumbs={[{ label: 'Webcam' }]} />
      
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Card style={{ borderRadius: 12, flex: 2, minWidth: 320 }}>
          <Alert
            message="Teacher Portal: Start camera scan to take live attendance for the class."
            type="info" showIcon style={{ marginBottom: 20 }}
          />
          
          <div style={{ position: 'relative', width: '100%', maxWidth: 640, height: 480, background: '#1a1a2e', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            {/* HTML5 Video Element */}
            <video 
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }}
              muted
              playsInline
            />
            {/* Canvas Overlay for boxes */}
            <canvas 
              ref={canvasRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
            />

            {!cameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.6)' }}>
                <VideoCameraOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.3)' }} />
                <div style={{ fontSize: 16 }}>Camera feed is currently inactive</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Click "Start Camera" below to begin</div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
            {!cameraActive ? (
              <Button type="primary" icon={<VideoCameraOutlined />} size="large" style={{ background: '#1e40af' }} onClick={startCamera}>
                Start Camera
              </Button>
            ) : (
              <Button type="primary" danger icon={<PoweroffOutlined />} size="large" onClick={stopCamera}>
                Stop Camera
              </Button>
            )}
          </div>
        </Card>

        <Card title="Live Detection Log" style={{ borderRadius: 12, flex: 1, minWidth: 280 }}>
          {logs.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', paddingTop: 40 }}>
              No face detections logged in this session yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logs.map((log, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #10b981' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 14 }}>{log.name}</strong>
                    <span style={{ fontSize: 12, color: '#666' }}>Status: {log.status}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#999', alignSelf: 'center' }}>{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Webcam;
