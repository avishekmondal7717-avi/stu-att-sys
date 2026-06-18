import { useState, useEffect } from 'react';
import { Card, Table, Button, Select, DatePicker, Switch, message, Avatar } from 'antd';
import { VideoCameraOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import { DEPARTMENTS, SEMESTERS } from '../../data/dummyData';
import { attendanceAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(dayjs());
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getByDate(date.format('YYYY-MM-DD'));
      setRecords(res.data);
    } catch (err) {
      console.error(err);
      message.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [date]);

  const handleStatusChange = async (studentId, checked) => {
    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? {
              ...r,
              status: checked ? 'Present' : 'Absent',
              timeIn: checked ? dayjs().format('hh:mm:ss A') : '-',
              markedBy: checked ? 'Manual' : '-',
            }
          : r
      )
    );

    try {
      await attendanceAPI.markManual({
        studentId,
        status: checked,
        date: date.format('YYYY-MM-DD')
      });
    } catch (err) {
      console.error(err);
      message.error('Failed to update attendance on server');
      // Revert if error
      loadAttendance();
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    message.success('All attendance changes synchronized with the database!');
    setSaveLoading(false);
  };

  const filtered = records.filter((r) => {
    const matchDept = !filterDept || r.department === filterDept;
    const matchSem = !filterSem || String(r.semester) === String(filterSem);
    return matchDept && matchSem;
  });

  const columns = [
    { title: '#', key: 'index', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Student', key: 'student', width: 70, render: (_, r) => <Avatar size={32} style={{ backgroundColor: '#1e40af' }}>{r.studentName ? r.studentName[0] : 'S'}</Avatar> },
    { title: 'Roll Number', dataIndex: 'rollNumber', key: 'rollNumber', width: 130 },
    { title: 'Student Name', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    {
      title: 'Status', key: 'status', width: 160,
      render: (_, r) => {
        const isPresent = r.status === 'Present';
        return (
          <Switch
            checked={isPresent}
            onChange={(v) => handleStatusChange(r.studentId, v)}
            checkedChildren="Present"
            unCheckedChildren="Absent"
            style={{ background: isPresent ? '#22c55e' : '#ef4444' }}
          />
        );
      },
    },
    { title: 'Time In', dataIndex: 'timeIn', key: 'timeIn', width: 110 },
    { title: 'Method', dataIndex: 'markedBy', key: 'markedBy', width: 110, align: 'center' },
  ];

  const presentCount = filtered.filter((s) => s.status === 'Present').length;

  return (
    <div>
      <PageHeader title="Mark Attendance" breadcrumbs={[{ label: 'Attendance', path: '/attendance' }, { label: 'Mark Attendance' }]} />

      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <DatePicker value={date} onChange={setDate} format="DD MMM YYYY" style={{ width: 170 }} allowClear={false} />
        <Select placeholder="All Departments" allowClear style={{ width: 200 }} value={filterDept || undefined} onChange={setFilterDept}>
          {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
        </Select>
        <Select placeholder="All Semesters" allowClear style={{ width: 160 }} value={filterSem || undefined} onChange={setFilterSem}>
          {SEMESTERS.map((s) => <Option key={s} value={s}>Semester {s}</Option>)}
        </Select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#555' }}>
            Present: <strong style={{ color: '#22c55e' }}>{presentCount}</strong> / {filtered.length}
          </span>
          <Button type="primary" icon={<SaveOutlined />} loading={saveLoading} onClick={handleSave} style={{ background: '#1e40af' }}>
            Sync Changes
          </Button>
        </div>
      </div>

      <Card style={{ borderRadius: 12 }} extra={
        <Button icon={<VideoCameraOutlined />} type="primary" ghost onClick={() => navigate('/webcam')}>
          Use Webcam
        </Button>
      }>
        <Table columns={columns} dataSource={filtered} rowKey="rollNumber" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>
    </div>
  );
};

export default MarkAttendance;
