import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DashboardOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { attendanceAPI } from '../../services/api';
import './Webcam.css';

const Webcam = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const sessionId = params.get('sessionId');
  const classCode = params.get('classCode');
  const subjectName = params.get('subject');
  const stream = params.get('stream');
  const semester = params.get('sem');
  const year = params.get('year');

  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [ending, setEnding] = useState(false);

  // Restore the active session after the teacher visits another sidebar tab.
  useEffect(() => {
    if (sessionId) return;

    try {
      const saved = JSON.parse(localStorage.getItem('teacherAttendanceScope') || 'null');
      if (!saved?.sessionId || !saved?.classCode) return;

      const restoredQuery = new URLSearchParams({
        stream: saved.department || '',
        year: saved.year || '',
        sem: saved.semester || '',
        classCode: saved.classCode,
        subject: saved.subjectName || saved.classCode,
        sessionId: String(saved.sessionId),
      });
      navigate(`/webcam?${restoredQuery.toString()}`, { replace: true });
    } catch (error) {
      console.error('Could not restore active attendance session:', error);
      localStorage.removeItem('teacherAttendanceScope');
    }
  }, [navigate, sessionId]);

  const loadLiveSession = useCallback(async (showError = false) => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const response = await attendanceAPI.getSessionDetail(sessionId);
      setSession(response.session);
      setRecords((response.data || []).filter((record) => record.status === 'Present'));
    } catch (error) {
      console.error('Failed to load live session:', error);
      if (showError) {
        message.error(error.message || 'Failed to load live student check-ins');
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadLiveSession(true);
    if (!sessionId) return undefined;

    const interval = window.setInterval(() => loadLiveSession(false), 3000);
    return () => window.clearInterval(interval);
  }, [loadLiveSession, sessionId]);

  const handleEndSession = async () => {
    if (!classCode || ending) return;
    setEnding(true);
    try {
      await attendanceAPI.toggleSession({ classCode, active: false });
      localStorage.removeItem('teacherAttendanceScope');
      setSession((current) => current ? { ...current, isActive: false } : current);
      message.success(`${classCode} attendance session closed`);
    } catch (error) {
      message.error(error.message || 'Could not close attendance session');
    } finally {
      setEnding(false);
    }
  };

  const columns = [
    {
      title: 'Student',
      key: 'student',
      minWidth: 220,
      render: (_, record) => (
        <Space size={12}>
          <Avatar
            size={42}
            icon={<UserOutlined />}
            className="live-checkin-avatar"
          />
          <div>
            <strong className="live-checkin-name">{record.studentName}</strong>
            <span className="live-checkin-roll">Roll: {record.rollNumber}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'Stream',
      dataIndex: 'department',
      key: 'department',
      minWidth: 170,
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      width: 110,
      render: (value) => <Tag>Semester {value || semester}</Tag>,
    },
    {
      title: 'Subject',
      key: 'subject',
      minWidth: 230,
      render: () => (
        <div>
          <strong className="live-subject-code">{classCode || session?.classCode}</strong>
          <span className="live-subject-name">{subjectName || session?.className}</span>
        </div>
      ),
    },
    {
      title: 'Verification',
      dataIndex: 'markedBy',
      key: 'markedBy',
      width: 170,
      render: (value) => (
        <Space size={6}>
          <CheckCircleOutlined className="live-verified-icon" />
          <span>{value || 'Face recognition'}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 105,
      render: () => <Tag color="success" icon={<CheckCircleOutlined />}>Present</Tag>,
    },
  ];

  const effectiveSession = session || {
    classCode,
    className: subjectName,
    department: stream,
    semester,
    isActive: Boolean(sessionId),
  };

  return (
    <div className="live-attendance-page">
      <PageHeader
        title="Live Student Check-Ins"
        subtitle="Face-verified attendance for the selected classroom session"
        breadcrumbs={[{ label: 'Live Check-Ins' }]}
      />

      {!sessionId ? (
        <Card className="live-attendance-empty">
          <Empty
            description={
              <span>
                Select stream, year, semester, and subject from the Dashboard to open an attendance session.
              </span>
            }
          >
            <Button
              type="primary"
              icon={<DashboardOutlined />}
              onClick={() => navigate('/dashboard')}
            >
              Open Dashboard
            </Button>
          </Empty>
        </Card>
      ) : (
        <Card className="live-attendance-card" bordered={false}>
          <div className="live-session-header">
            <div className="live-session-primary">
              <div className="live-session-title-line">
                <h2>{effectiveSession.classCode}</h2>
                <Badge
                  status={effectiveSession.isActive ? 'processing' : 'default'}
                  text={effectiveSession.isActive ? 'Live attendance window' : 'Session closed'}
                />
              </div>
              <p>{effectiveSession.className}</p>
              <Space wrap size={[8, 8]}>
                <Tag color="blue">{effectiveSession.department || stream}</Tag>
                {year && <Tag>Year {year}</Tag>}
                <Tag>Semester {effectiveSession.semester || semester}</Tag>
              </Space>
            </div>

            <div className="live-session-actions">
              <div className="live-count">
                <strong>{records.length}</strong>
                <span>Verified students</span>
              </div>
              {effectiveSession.isActive && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  loading={ending}
                  onClick={handleEndSession}
                >
                  End Session
                </Button>
              )}
            </div>
          </div>

          <div className="live-feed-heading">
            <div>
              <h3>Live verification feed</h3>
              <p>New biometric matches appear automatically, one student per row.</p>
            </div>
            {effectiveSession.isActive && (
              <span className="live-polling">
                <i />
                Updating every 3 seconds
              </span>
            )}
          </div>

          <Table
            columns={columns}
            dataSource={records}
            rowKey="rollNumber"
            loading={loading}
            pagination={false}
            scroll={{ x: 1120 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    effectiveSession.isActive
                      ? 'Waiting for students to verify attendance'
                      : 'No students were verified in this session'
                  }
                />
              ),
            }}
            className="live-checkin-table"
          />
        </Card>
      )}
    </div>
  );
};

export default Webcam;
