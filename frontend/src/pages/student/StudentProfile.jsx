import { Card, Avatar, Divider, Row, Col } from 'antd';
import PageHeader from '../../components/common/PageHeader';

import { useOutletContext } from 'react-router-dom';

export default function StudentProfile() {
  const { theme } = useOutletContext() || {};
  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

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

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage and view your official profile information" breadcrumbs={[{ label: 'My Profile' }]} />

      <Card style={{ borderRadius: 12, maxWidth: 800 }}>
        <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6} style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar size={100} src={currentStudent.photo} style={{ backgroundColor: '#1e40af', fontSize: 38, border: '3px solid #3b5bdb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {!currentStudent.photo && (currentStudent.fullName ? currentStudent.fullName[0] : 'S')}
            </Avatar>
          </Col>
          <Col xs={24} sm={18}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{currentStudent.fullName}</h2>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: 14 }}>Student ID: {currentStudent.rollNumber}</p>
            <span style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600, padding: '4px 12px', borderRadius: 12, fontSize: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              Status: {currentStudent.status}
            </span>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'var(--border-color)' }} />

        <div className="profile-details" style={{ marginTop: 12 }}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Department</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{currentStudent.department}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Course / Class</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{currentStudent.course} (Section {currentStudent.section})</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Year / Semester</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Semester {currentStudent.semester}</div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Email Address</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{currentStudent.email}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Contact Number</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>+91 {currentStudent.contact}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Date of Birth</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{currentStudent.dob}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Home Address</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.4 }}>{currentStudent.address}</div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
}
