import { useOutletContext } from 'react-router-dom';
import { Row, Col, Card, Progress, Avatar } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { week: 'Week 1', rate: 70 },
  { week: 'Week 2', rate: 80 },
  { week: 'Week 3', rate: 75 },
  { week: 'Week 4', rate: 85 },
];

export default function StudentDashboard() {
  const { presentCount, absentCount, totalClasses } = useOutletContext();
  const attendanceRate = Math.round((presentCount / totalClasses) * 100);
  
  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const fullName = currentUser ? currentUser.fullName : (localStorage.getItem("userFullName") || "Student");
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <div>
      <PageHeader title="Student Dashboard" subtitle="Overview of your academic attendance details" breadcrumbs={[{ label: 'Dashboard' }]} />

      <div className="welcome-banner" style={{ margin: '0 0 24px 0' }}>
        <div className="welcome-banner-left">
          <Avatar size={72} style={{ backgroundColor: '#1e40af', fontSize: 28, fontWeight: 700, border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{initial}</Avatar>
          <div>
            <h1>Welcome Back, {fullName}!</h1>
            <p>You have a solid attendance rate. Keep attending classes to maintain it!</p>
          </div>
        </div>
        <div className="welcome-banner-right">
          <div className="banner-date" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <CalendarOutlined style={{ marginRight: 6 }} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ color: '#1e3a8a', fontWeight: 700 }}>Attendance Rate</span>} style={{ borderRadius: 12, height: '100%' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={10} style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <Progress
                  type="circle"
                  percent={attendanceRate}
                  strokeColor={{ '0%': '#3b5bdb', '100%': '#10b981' }}
                  strokeWidth={10}
                  width={130}
                />
              </Col>
              <Col xs={24} sm={14}>
                <div className="student-stats-list">
                  <div className="student-stat-item">
                    <div className="stat-icon-wrapper present"><CheckCircleOutlined /></div>
                    <div>
                      <div className="stat-lbl">Present Days</div>
                      <div className="stat-val present">{presentCount} Days</div>
                    </div>
                  </div>
                  <div className="student-stat-item">
                    <div className="stat-icon-wrapper absent"><CloseCircleOutlined /></div>
                    <div>
                      <div className="stat-lbl">Absent Days</div>
                      <div className="stat-val absent">{absentCount} Days</div>
                    </div>
                  </div>
                  <div className="student-stat-item">
                    <div className="stat-icon-wrapper total"><UserOutlined /></div>
                    <div>
                      <div className="stat-lbl">Total Classes</div>
                      <div className="stat-val total">{totalClasses} Classes</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<span style={{ color: '#1e3a8a', fontWeight: 700 }}>Weekly Attendance Trend</span>} style={{ borderRadius: 12, height: '100%' }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={mockChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, 'Rate']} />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
