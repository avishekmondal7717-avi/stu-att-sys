import { useState, useEffect } from 'react';
import { Row, Col, Table, Tag, Button, Select, DatePicker, Input, message, Popconfirm } from 'antd';
import { SearchOutlined, FileExcelOutlined, CalendarOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { DEPARTMENTS, SEMESTERS } from '../../data/dummyData';
import { attendanceAPI } from '../../services/api';

const { Option } = Select;

const AttendanceTable = () => {
  const [date, setDate] = useState(dayjs());
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

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

  const handleDelete = async (recordId) => {
    try {
      await attendanceAPI.deleteRecord(recordId);
      message.success('Attendance record deleted successfully');
      loadAttendance();
    } catch (err) {
      console.error(err);
      message.error('Failed to delete attendance record');
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [date]);

  const filtered = records.filter((r) => {
    const matchSearch = !search || 
      r.studentName.toLowerCase().includes(search.toLowerCase()) || 
      r.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || r.department === filterDept;
    const matchSem = !filterSem || String(r.semester) === String(filterSem);
    return matchSearch && matchDept && matchSem;
  });

  const present = filtered.filter((r) => r.status === 'Present').length;
  const absent = filtered.filter((r) => r.status === 'Absent').length;
  const total = filtered.length;

  const handleExport = async () => {
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const token = localStorage.getItem("token");
      const query = new URLSearchParams({
        department: filterDept || '',
        semester: filterSem || '',
        start_date: formattedDate,
        end_date: formattedDate,
        format: 'xlsx'
      }).toString();

      message.loading({ content: 'Generating Excel report...', key: 'export' });
      
      const response = await fetch(`/api/reports/export?${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${date.format('YYYYMMDD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      message.success({ content: 'Excel export download started!', key: 'export' });
    } catch (err) {
      console.error(err);
      message.error({ content: 'Failed to export report to Excel', key: 'export' });
    }
  };

  const columns = [
    { title: '#', key: 'index', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Roll Number', dataIndex: 'rollNumber', key: 'rollNumber', width: 130 },
    { title: 'Student Name', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Time In', dataIndex: 'timeIn', key: 'timeIn', width: 130 },
    { title: 'Time Out', dataIndex: 'timeOut', key: 'timeOut', width: 130 },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => <Tag color={s === 'Present' ? 'success' : 'error'}>{s}</Tag>,
    },
    { title: 'Marked By', dataIndex: 'markedBy', key: 'markedBy', width: 110 },
  ];

  if (isAdmin) {
    columns.push({
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => {
        const isAbsentRecord = String(record.id).startsWith('absent-');
        return (
          <Popconfirm
            title="Delete this record?"
            onConfirm={() => handleDelete(record.id)}
            disabled={isAbsentRecord}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              disabled={isAbsentRecord}
            >
              Delete
            </Button>
          </Popconfirm>
        );
      }
    });
  }

  return (
    <div>
      <PageHeader title="Attendance Table" breadcrumbs={[{ label: 'Attendance', path: '/attendance/table' }, { label: 'Attendance Table' }]} />

      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <DatePicker value={date} onChange={setDate} format="DD MMM YYYY" style={{ width: 170 }} allowClear={false} />
        <Select placeholder="All Departments" allowClear style={{ width: 180 }} value={filterDept || undefined} onChange={setFilterDept}>
          {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
        </Select>
        <Select placeholder="All Semesters" allowClear style={{ width: 150 }} value={filterSem || undefined} onChange={setFilterSem}>
          {SEMESTERS.map((s) => <Option key={s} value={s}>Semester {s}</Option>)}
        </Select>
        <Input
          prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          placeholder="Search by name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={loadAttendance} style={{ background: '#1e40af' }}>Refresh</Button>
        <Button icon={<FileExcelOutlined />} onClick={handleExport} style={{ background: '#16a34a', color: '#fff', borderColor: '#16a34a', marginLeft: 'auto' }}>
          Export Excel
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <StatCard icon={<TeamOutlined />} label="Total Students" value={total} iconBg="#eff6ff" iconColor="#3b82f6" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={<CheckCircleOutlined />} label="Present" value={`${present} (${total ? Math.round((present / total) * 100) : 0}%)`} iconBg="#f0fdf4" iconColor="#22c55e" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={<CloseCircleOutlined />} label="Absent" value={`${absent} (${total ? Math.round((absent / total) * 100) : 0}%)`} iconBg="#fef2f2" iconColor="#ef4444" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={<CalendarOutlined />} label="Attendance Date" value={date ? date.format('DD MMM YYYY') : '-'} iconBg="#f5f3ff" iconColor="#8b5cf6" />
        </Col>
      </Row>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="rollNumber"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t, r) => `Showing ${r[0]} to ${r[1]} of ${t} entries` }}
          size="middle"
        />
      </div>
    </div>
  );
};

export default AttendanceTable;
