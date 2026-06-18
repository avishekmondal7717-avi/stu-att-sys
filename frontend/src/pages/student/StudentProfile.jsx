import { Card, Avatar, Divider, Row, Col } from 'antd';
import PageHeader from '../../components/common/PageHeader';

export default function StudentProfile() {
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
    status: 'Active',
  };
  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage and view your official profile information" breadcrumbs={[{ label: 'My Profile' }]} />

      <Card style={{ borderRadius: 12, maxWidth: 800 }}>
        <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6} style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar size={100} style={{ backgroundColor: '#1e40af', fontSize: 38, border: '3px solid #3b5bdb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {currentStudent.fullName ? currentStudent.fullName[0] : 'S'}
            </Avatar>
          </Col>
          <Col xs={24} sm={18}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 22, fontWeight: 700, color: '#1a202c' }}>{currentStudent.fullName}</h2>
            <p style={{ margin: '0 0 6px 0', color: '#6b7280', fontSize: 14 }}>Student ID: {currentStudent.rollNumber}</p>
            <span style={{ display: 'inline-block', background: '#e6fffa', color: '#00b5ad', fontWeight: 600, padding: '3px 12px', borderRadius: 12, fontSize: 12 }}>
              Status: {currentStudent.status}
            </span>
          </Col>
        </Row>

        <Divider />

        <div className="profile-details" style={{ marginTop: 12 }}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 }}>Department</div>
                <div style={{ fontWeight: 600, color: '#2d3748' }}>{currentStudent.department}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 }}>Course / Class</div>
                <div style={{ fontWeight: 600, color: '#2d3748' }}>{currentStudent.course} (Section {currentStudent.section})</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 }}>Year / Semester</div>
                <div style={{ fontWeight: 600, color: '#2d3748' }}>Semester {currentStudent.semester}</div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 }}>Email Address</div>
                <div style={{ fontWeight: 600, color: '#2d3748' }}>{currentStudent.email}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 }}>Contact Number</div>
                <div style={{ fontWeight: 600, color: '#2d3748' }}>+91 {currentStudent.contact}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 }}>Date of Birth</div>
                <div style={{ fontWeight: 600, color: '#2d3748' }}>{currentStudent.dob}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 }}>Home Address</div>
                <div style={{ fontWeight: 600, color: '#2d3748', lineHeight: 1.4 }}>{currentStudent.address}</div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
}
