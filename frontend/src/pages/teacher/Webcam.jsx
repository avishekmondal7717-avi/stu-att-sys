import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Alert, message, Switch, Row, Col, List, Avatar, Badge, Empty, Tag, Space } from 'antd';
import { CheckCircleOutlined, ControlOutlined, HistoryOutlined, UserOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { attendanceAPI } from '../../services/api';

const Webcam = () => {
  const { theme } = useOutletContext() || {};
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);
  
  const fetchSessions = async (silent = false) => {
    if (!silent && sessions.length === 0) setLoadingSessions(true);
    try {
      const res = await attendanceAPI.getSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load attendance windows status.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchLiveLogs = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await attendanceAPI.getByDate(todayStr);
      if (res && res.data) {
        const checkedIn = res.data
          .filter(r => r.status === 'Present')
          .sort((a, b) => {
            const idA = typeof a.id === 'number' ? a.id : 0;
            const idB = typeof b.id === 'number' ? b.id : 0;
            return idB - idA;
          });
        setLiveLogs(checkedIn);
      }
    } catch (err) {
      console.error("Failed to fetch live check-ins:", err);
    }
  };

  useEffect(() => {
    // Initial fetch shows loaders if first time
    fetchSessions(false);
    fetchLiveLogs();
    
    // Silent polling every 3 seconds for fast updates
    const interval = setInterval(() => {
      fetchSessions(true);
      fetchLiveLogs();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleToggleSession = async (classCode, currentActive) => {
    const nextActive = !currentActive;
    
    // 1. Instantly update UI optimistically (Snappy Response)
    setSessions(prev => 
      prev.map(s => s.classCode === classCode ? { ...s, isActive: nextActive } : s)
    );

    try {
      // 2. Perform API call in background
      await attendanceAPI.toggleSession({ classCode, active: nextActive });
      message.success(`Attendance window for ${classCode} is now ${nextActive ? 'OPEN' : 'CLOSED'}`);
      
      // 3. Silent refresh to make sure state is in sync
      fetchSessions(true);
    } catch (err) {
      console.error(err);
      message.error("Failed to toggle attendance window.");
      
      // Rollback to original state on failure
      setSessions(prev => 
        prev.map(s => s.classCode === classCode ? { ...s, isActive: currentActive } : s)
      );
    }
  };

  const isDark = theme === 'dark';

  return (
    <div style={{ padding: '0 8px' }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .pulse-dot {
          animation: pulse 1.8s infinite ease-in-out;
        }
      `}</style>

      <PageHeader 
        title="Attendance Windows" 
        subtitle="Manage live self-attendance scanning windows and monitor real-time check-ins" 
        breadcrumbs={[{ label: 'Attendance Windows' }]} 
      />
      
      <Row gutter={[24, 24]}>
        {/* Left Side: Attendance Windows Control Panel */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <Space>
                <ControlOutlined style={{ color: isDark ? '#60a5fa' : '#3B5BDB' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>Classroom Session Controls</span>
              </Space>
            }
            loading={loadingSessions}
            bordered={false}
            style={{ 
              borderRadius: 16, 
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <Alert
              message={
                <span style={{ color: isDark ? '#93c5fd' : '#1e3a8a', fontWeight: 500 }}>
                  Active Sessions: Toggle a classroom switch to open its self-attendance window. Registered students will be instantly notified to scan and submit their presence.
                </span>
              }
              type="info" 
              showIcon 
              style={{ 
                marginBottom: 20, 
                borderRadius: 10, 
                border: isDark ? '1px solid #1e3a8a' : '1px solid #bae7ff', 
                backgroundColor: isDark ? '#0c1e3e' : '#e6f7ff' 
              }}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sessions.map((s) => (
                <div 
                  key={s.classCode} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px 20px', 
                    background: s.isActive 
                      ? (isDark ? '#064e3b' : '#f0fdf4') 
                      : (isDark ? '#18181b' : '#f8fafc'), 
                    borderRadius: 12, 
                    borderLeft: `5px solid ${s.isActive ? '#10b981' : (isDark ? '#27272a' : '#cbd5e1')}`,
                    boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{s.classCode}</span>
                      <Badge 
                        status={s.isActive ? 'success' : 'default'} 
                        text={s.isActive ? 'Active' : 'Closed'} 
                        style={{ fontSize: 12, fontWeight: 500, color: s.isActive ? '#10b981' : 'var(--text-secondary)' }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400 }}>{s.className}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {s.isActive && (
                      <span className="pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                    )}
                    <Switch 
                      checked={s.isActive} 
                      onChange={() => handleToggleSession(s.classCode, s.isActive)} 
                      checkedChildren="Open"
                      unCheckedChildren="Closed"
                      style={{ background: s.isActive ? '#10b981' : (isDark ? '#3f3f46' : '#cbd5e1') }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right Side: Real-time Live Detection Feed */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <Space>
                <HistoryOutlined style={{ color: isDark ? '#60a5fa' : '#3B5BDB' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>Live Student Check-Ins</span>
              </Space>
            }
            extra={
              <Badge 
                count={liveLogs.length} 
                overflowCount={99} 
                style={{ backgroundColor: '#10b981', boxShadow: 'none', fontWeight: 700 }} 
              />
            }
            bordered={false}
            style={{ 
              borderRadius: 16, 
              boxShadow: 'var(--shadow-md)',
              minHeight: 480
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Biometric verifications logged today:
            </div>
            
            {liveLogs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 12 }}>
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description={
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      Waiting for students to verify attendance...
                    </span>
                  } 
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: isDark ? '#60a5fa' : '#3B5BDB' }}></span>
                  <span>Polling check-ins in real-time</span>
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                <List
                  itemLayout="horizontal"
                  dataSource={liveLogs}
                  renderItem={(item) => (
                    <List.Item 
                      style={{ 
                        padding: '12px 0', 
                        borderBottom: isDark ? '1px solid #27272a' : '1px solid #f1f5f9',
                        transition: 'background 0.3s'
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            src={item.photo} 
                            icon={<UserOutlined />} 
                            style={{ 
                              border: isDark ? '2px solid #27272a' : '2px solid #e2e8f0', 
                              width: 40, 
                              height: 40,
                              backgroundColor: isDark ? '#18181b' : '#f8fafc'
                            }} 
                          />
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{item.studentName}</span>
                            <Tag color="green" icon={<CheckCircleOutlined />} style={{ borderRadius: 6, marginRight: 0, border: 'none', fontWeight: 600 }}>
                              {item.timeIn}
                            </Tag>
                          </div>
                        }
                        description={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              Roll: {item.rollNumber} • {item.department}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                              {item.markedBy || 'Webcam'}
                            </span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Webcam;
