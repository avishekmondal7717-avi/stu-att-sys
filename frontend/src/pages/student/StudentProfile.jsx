import { useRef, useState } from 'react';
import { Card, Avatar, Row, Col, Button, Modal, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useOutletContext } from 'react-router-dom';
import { studentAPI } from '../../services/api';

export default function StudentProfile() {
  const { theme } = useOutletContext() || {};
  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopEnrollmentCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const openFaceEnrollment = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      setFaceModalOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      message.error('Camera access is required to re-enroll Face ID.');
    }
  };

  const captureSamples = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return message.warning('Camera is not ready yet.');
    setEnrolling(true);
    try {
      const samples = [];
      for (let index = 0; index < 3; index += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        samples.push(canvas.toDataURL('image/jpeg', 0.9));
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
      const result = await studentAPI.uploadOwnFaceImages(samples);
      message.success(`Face ID updated from ${result.samples_enrolled} clear sample(s).`);
      stopEnrollmentCamera();
      setFaceModalOpen(false);
    } catch (error) {
      message.error(error.message || 'Face ID enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const currentStudent = currentUser ? {
    fullName: currentUser.fullName,
    rollNumber: currentUser.rollNumber,
    department: currentUser.department,
    course: currentUser.course || 'B.Tech',
    semester: currentUser.semester || '1',
    section: currentUser.section || 'A',
    email: currentUser.email || 'N/A',
    contact: currentUser.contact || 'N/A',
    address: currentUser.address || 'N/A',
    dob: currentUser.dob || 'N/A',
    photo: currentUser.photo,
    status: currentUser.status || 'Active',
  } : {
    fullName: 'Student',
    rollNumber: 'N/A',
    department: 'N/A',
    course: 'B.Tech',
    semester: '1',
    section: 'A',
    email: 'N/A',
    contact: 'N/A',
    address: 'N/A',
    dob: 'N/A',
    photo: null,
    status: 'Active',
  };

  // Icon SVG Definitions
  const iconDepartment = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );

  const iconCourse = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );

  const iconSemester = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );

  const iconEmail = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  const iconContact = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );

  const iconDob = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  const iconAddress = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .profile-card {
          border-radius: 20px !important;
          max-width: 900px;
          border: 1px solid var(--border-color) !important;
          background: var(--bg-secondary) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04) !important;
          overflow: hidden;
        }
        .dark .profile-card {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .profile-header-bg {
          height: 150px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          position: relative;
        }
        .profile-header-content {
          padding: 0 40px 32px;
          position: relative;
          margin-top: -60px;
        }
        .profile-avatar-wrap {
          position: relative;
          display: inline-block;
        }
        .profile-avatar-glow {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          z-index: 0;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }
        .profile-details-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          height: 100%;
          transition: all 0.2s ease;
        }
        .profile-details-section:hover {
          border-color: #6366f1;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.05);
        }
        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-icon {
          width: 38px;
          height: 38px;
          background: rgba(99, 102, 241, 0.08);
          color: #6366f1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .info-content {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>

      <PageHeader title="My Profile" subtitle="Manage and view your official profile information" breadcrumbs={[{ label: 'My Profile' }]} />

      <Card className="profile-card" bodyStyle={{ padding: 0 }}>
        {/* Banner strip */}
        <div className="profile-header-bg"></div>

        {/* Header content with avatar */}
        <div className="profile-header-content">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={6} style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="profile-avatar-wrap">
                <div className="profile-avatar-glow"></div>
                <Avatar size={110} src={currentStudent.photo} style={{ backgroundColor: '#1e40af', fontSize: 44, border: '4px solid var(--bg-secondary)', zIndex: 1, position: 'relative' }}>
                  {!currentStudent.photo && (currentStudent.fullName ? currentStudent.fullName[0] : 'S')}
                </Avatar>
              </div>
            </Col>
            <Col xs={24} sm={18} style={{ textAlign: 'left', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '6px' }}>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                  {currentStudent.fullName}
                </h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.25)', color: '#10b981', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', fontSize: 11, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginRight: 6 }}></span>
                  {currentStudent.status}
                </span>
              </div>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: 600 }}>
                Student ID: {currentStudent.rollNumber}
              </p>
              <Button icon={<CameraOutlined />} onClick={openFaceEnrollment} style={{ marginTop: 14 }}>
                Re-enroll Face ID
              </Button>
            </Col>
          </Row>
        </div>

        {/* Detailed Grid Info */}
        <div style={{ padding: '0 40px 40px' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div className="profile-details-section">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  Academic Information
                </h3>
                
                <div className="info-row">
                  <div className="info-icon">{iconDepartment}</div>
                  <div className="info-content">
                    <span className="info-label">Department</span>
                    <span className="info-value">{currentStudent.department}</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">{iconCourse}</div>
                  <div className="info-content">
                    <span className="info-label">Course / Class</span>
                    <span className="info-value">{currentStudent.course} (Section {currentStudent.section})</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">{iconSemester}</div>
                  <div className="info-content">
                    <span className="info-label">Year / Semester</span>
                    <span className="info-value">Semester {currentStudent.semester}</span>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="profile-details-section">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  Personal Details
                </h3>

                <div className="info-row">
                  <div className="info-icon">{iconEmail}</div>
                  <div className="info-content">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">{currentStudent.email}</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">{iconContact}</div>
                  <div className="info-content">
                    <span className="info-label">Contact Number</span>
                    <span className="info-value">+91 {currentStudent.contact}</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">{iconDob}</div>
                  <div className="info-content">
                    <span className="info-label">Date of Birth</span>
                    <span className="info-value">{currentStudent.dob}</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">{iconAddress}</div>
                  <div className="info-content">
                    <span className="info-label">Home Address</span>
                    <span className="info-value" style={{ lineHeight: 1.4 }}>{currentStudent.address}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
      <Modal
        title="Re-enroll Face ID"
        open={faceModalOpen}
        onCancel={() => { stopEnrollmentCamera(); setFaceModalOpen(false); }}
        footer={null}
        destroyOnClose
      >
        <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
          Use normal front lighting, remove strong glare, look straight at the camera, and keep your face still.
        </p>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 12, background: '#09090b' }} />
        <Button type="primary" block size="large" loading={enrolling} onClick={captureSamples} style={{ marginTop: 16 }}>
          Capture 3 Samples & Update Face ID
        </Button>
      </Modal>
    </div>
  );
}
