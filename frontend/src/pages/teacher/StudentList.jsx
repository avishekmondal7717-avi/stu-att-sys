import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Avatar, Space, message, Modal } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { DEPARTMENTS, COURSES, SEMESTERS } from '../../data/dummyData';
import { studentAPI } from '../../services/api';

const { Option } = Select;

const StudentList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [viewStudent, setViewStudent] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll({
        department: filterDept || '',
        semester: filterSem || ''
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      message.error('Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [filterDept, filterSem]);

  const filtered = data.filter((s) => {
    const matchSearch = !search || 
      s.fullName.toLowerCase().includes(search.toLowerCase()) || 
      s.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !filterCourse || s.course === filterCourse;
    return matchSearch && matchCourse;
  });

  const columns = [
    { title: '#', dataIndex: 'id', key: 'id', width: 50 },
    {
      title: 'Student', key: 'fullName', width: 240,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={36} style={{ backgroundColor: '#1e40af' }}>{r.fullName ? r.fullName[0] : 'S'}</Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.fullName}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { title: 'Roll Number', dataIndex: 'rollNumber', key: 'rollNumber', width: 150 },
    { title: 'Department', dataIndex: 'department', key: 'department', width: 180 },
    { title: 'Course', dataIndex: 'course', key: 'course', width: 100 },
    { title: 'Semester', dataIndex: 'semester', key: 'semester', width: 90, align: 'center' },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => <Tag color={s === 'Active' ? 'success' : 'default'}>{s}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setViewStudent(r)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Students List" breadcrumbs={[{ label: 'Students', path: '/students/list' }, { label: 'Student List' }]} />

      <div className="surface-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#ccc' }} />}
            placeholder="Search by name, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <Select placeholder="All Departments" allowClear style={{ width: 180 }} value={filterDept || undefined} onChange={setFilterDept}>
            {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
          </Select>
          <Select placeholder="All Courses" allowClear style={{ width: 150 }} value={filterCourse || undefined} onChange={setFilterCourse}>
            {COURSES.map((c) => <Option key={c} value={c}>{c}</Option>)}
          </Select>
          <Select placeholder="All Semesters" allowClear style={{ width: 150 }} value={filterSem || undefined} onChange={setFilterSem}>
            {SEMESTERS.map((s) => <Option key={s} value={s}>Semester {s}</Option>)}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t, r) => `Showing ${r[0]} to ${r[1]} of ${t} students` }}
          scroll={{ x: 1020 }}
          size="middle"
        />
      </div>

      <Modal title="Student Details" open={!!viewStudent} onCancel={() => setViewStudent(null)} footer={null} width={500}>
        {viewStudent && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar size={64} style={{ backgroundColor: '#1e40af', fontSize: 24 }}>{viewStudent.fullName ? viewStudent.fullName[0] : 'S'}</Avatar>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{viewStudent.fullName}</div>
                <div style={{ color: '#666' }}>{viewStudent.rollNumber}</div>
                <Tag color="success" style={{ marginTop: 4 }}>{viewStudent.status}</Tag>
              </div>
            </div>
            {[
              ['Email', viewStudent.email],
              ['Contact', viewStudent.contact],
              ['Department', viewStudent.department],
              ['Course', viewStudent.course],
              ['Semester', viewStudent.semester],
              ['Gender', viewStudent.gender],
              ['Date of Birth', viewStudent.dob],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '10px 0' }}>
                <span style={{ width: 140, color: '#666', fontSize: 13 }}>{label}</span>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentList;
