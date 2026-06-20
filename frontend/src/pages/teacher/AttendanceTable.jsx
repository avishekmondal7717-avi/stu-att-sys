import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Modal,
  Row,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import { attendanceAPI } from '../../services/api';
import './AttendanceTable.css';

const PERIODS = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const AttendanceTable = () => {
  const [period, setPeriod] = useState('day');
  const [anchorDate, setAnchorDate] = useState(dayjs());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getSessionHistory({
        period,
        date: anchorDate.format('YYYY-MM-DD'),
      });
      setSessions(response.sessions || []);
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Failed to load attendance sessions');
    } finally {
      setLoading(false);
    }
  }, [anchorDate, period]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const openSession = async (session) => {
    setSelectedSession(session);
    setDetailLoading(true);
    setRecords([]);
    try {
      const response = await attendanceAPI.getSessionDetail(session.id);
      setSelectedSession(response.session);
      setRecords(response.data || []);
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Failed to load session roster');
      setSelectedSession(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      record.studentName.toLowerCase().includes(needle)
      || record.rollNumber.toLowerCase().includes(needle)
    );
  }, [records, search]);

  const totals = useMemo(() => sessions.reduce((summary, session) => ({
    students: summary.students + session.total,
    present: summary.present + session.present,
    absent: summary.absent + session.absent,
  }), { students: 0, present: 0, absent: 0 }), [sessions]);

  const columns = [
    { title: 'Roll Number', dataIndex: 'rollNumber', key: 'rollNumber', width: 140 },
    { title: 'Student Name', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Stream', dataIndex: 'department', key: 'department' },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      width: 100,
      render: (value) => `Sem ${value}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'Present' ? 'success' : 'error'}>{status}</Tag>
      ),
    },
    { title: 'Verified By', dataIndex: 'markedBy', key: 'markedBy', width: 160 },
  ];

  const picker = period === 'day' ? undefined : period;
  const periodLabel = period === 'day'
    ? anchorDate.format('DD MMM YYYY')
    : period === 'month'
      ? anchorDate.format('MMMM YYYY')
      : anchorDate.format('YYYY');

  return (
    <div>
      <PageHeader
        title="Attendance Sessions"
        subtitle="Classified by teacher, stream, semester, subject, and session"
        breadcrumbs={[{ label: 'Attendance Sessions' }]}
      />

      <div className="attendance-session-toolbar">
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        <DatePicker
          picker={picker}
          value={anchorDate}
          onChange={(value) => value && setAnchorDate(value)}
          allowClear={false}
          format={period === 'day' ? 'DD MMM YYYY' : period === 'month' ? 'MMMM YYYY' : 'YYYY'}
        />
        <Button icon={<ReloadOutlined />} onClick={loadSessions}>Refresh</Button>
        <span className="attendance-period-label">{periodLabel}</span>
      </div>

      <Row gutter={[16, 16]} className="attendance-summary-row">
        {[
          ['Class Sessions', sessions.length, <CalendarOutlined />],
          ['Roster Entries', totals.students, <TeamOutlined />],
          ['Present', totals.present, <CheckCircleOutlined />],
          ['Absent', totals.absent, <ClockCircleOutlined />],
        ].map(([label, value, icon]) => (
          <Col xs={12} lg={6} key={label}>
            <Card size="small" className="attendance-summary-card">
              <Space size={12}>
                <span className="attendance-summary-icon">{icon}</span>
                <span>
                  <span className="attendance-summary-label">{label}</span>
                  <strong className="attendance-summary-value">{value}</strong>
                </span>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Spin spinning={loading}>
        {sessions.length === 0 && !loading ? (
          <Card className="attendance-empty-card">
            <Empty description={`No class sessions found for ${periodLabel}`} />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {sessions.map((session) => {
              const rate = session.total ? Math.round((session.present / session.total) * 100) : 0;
              return (
                <Col xs={24} md={12} xl={8} key={session.id}>
                  <Card
                    className="attendance-session-card"
                    title={
                      <Space>
                        <span>{session.classCode}</span>
                        <Badge status={session.isActive ? 'processing' : 'default'} text={session.isActive ? 'Live' : 'Closed'} />
                      </Space>
                    }
                    extra={<Button type="text" icon={<EyeOutlined />} onClick={() => openSession(session)}>Open</Button>}
                  >
                    <h3>{session.className}</h3>
                    <Space wrap className="attendance-session-tags">
                      <Tag color="blue">{session.department}</Tag>
                      <Tag>Semester {session.semester}</Tag>
                      <Tag>{dayjs(session.date).format('DD MMM YYYY')}</Tag>
                    </Space>
                    <div className="attendance-session-time">
                      <ClockCircleOutlined /> {dayjs(session.startedAt).format('hh:mm A')} by {session.teacherName}
                    </div>
                    <div className="attendance-session-counts">
                      <span><strong>{session.total}</strong> Enrolled</span>
                      <span className="present"><strong>{session.present}</strong> Present</span>
                      <span className="absent"><strong>{session.absent}</strong> Absent</span>
                    </div>
                    <div className="attendance-rate-track">
                      <span style={{ width: `${rate}%` }} />
                    </div>
                    <small>{rate}% attendance</small>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Spin>

      <Modal
        open={!!selectedSession}
        onCancel={() => {
          setSelectedSession(null);
          setSearch('');
        }}
        footer={null}
        width={1050}
        title={selectedSession ? `${selectedSession.classCode} - ${selectedSession.className}` : 'Session Roster'}
      >
        {selectedSession && (
          <>
            <Space wrap className="attendance-detail-meta">
              <Tag color="blue">{selectedSession.department}</Tag>
              <Tag>Semester {selectedSession.semester}</Tag>
              <Tag>{dayjs(selectedSession.date).format('DD MMM YYYY')}</Tag>
              <Tag color={selectedSession.isActive ? 'success' : 'default'}>
                {selectedSession.isActive ? 'Live' : 'Closed'}
              </Tag>
            </Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search this session by name or roll number"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="attendance-detail-search"
            />
            <Table
              columns={columns}
              dataSource={filteredRecords}
              rowKey="rollNumber"
              loading={detailLoading}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              scroll={{ x: 850 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceTable;
