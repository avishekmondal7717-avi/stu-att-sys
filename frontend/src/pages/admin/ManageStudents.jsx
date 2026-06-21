import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Avatar, Space, Popconfirm, message, Modal, Form, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { DEPARTMENTS, COURSES, SEMESTERS } from '../../data/dummyData';
import { studentAPI } from '../../services/api';
import { Button as ChakraButton, Switch as ChakraSwitch, HStack, useToast } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';

// Biometric & Status override controls component
export function StudentActionControls({ student, onRefresh }) {
  const toast = useToast();

  const handleFlushEmbedding = async () => {
    try {
      // Sets embedding = NULL and status = 'Pending Verification'
      await studentAPI.update(student.id, { ...student, status: 'Pending Verification', flushBiometrics: true });
      toast({ title: 'Biometric template flushed. Re-scan required.', status: 'info', duration: 3000, isClosable: true });
      onRefresh();
    } catch (err) {
      toast({ title: 'Operation failed.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleToggleStatus = async (e) => {
    const newStatus = e.target.checked ? 'Active' : 'Suspended';
    try {
      await studentAPI.update(student.id, { ...student, status: newStatus });
      toast({ title: `Account status updated to ${newStatus}`, status: 'success', duration: 3000, isClosable: true });
      onRefresh();
    } catch (err) {
      toast({ title: 'Status sync failed.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <HStack spacing={4}>
      <ChakraSwitch 
        isChecked={student.status === 'Active'} 
        colorScheme="green" 
        onChange={handleToggleStatus}
      />
      <ChakraButton 
        leftIcon={<Trash2 size={16} />} 
        colorScheme="red" 
        variant="ghost" 
        size="sm" 
        onClick={handleFlushEmbedding}
      >
        Flush Face ID
      </ChakraButton>
    </HStack>
  );
}

const { Option } = Select;

export default function ManageStudents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [viewStudent, setViewStudent] = useState(null);
  
  // Modal states for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form] = Form.useForm();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll();
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Failed to fetch students directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = data.filter((s) => {
    const sName = s.fullName || '';
    const sRoll = s.rollNumber || '';
    const matchSearch = !search || sName.toLowerCase().includes(search.toLowerCase()) || sRoll.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || s.department === filterDept;
    const matchCourse = !filterCourse || s.course === filterCourse;
    const matchSem = !filterSem || String(s.semester) === String(filterSem);
    return matchSearch && matchDept && matchCourse && matchSem;
  });

  const handleDelete = async (id) => {
    try {
      await studentAPI.delete(id);
      setData(data.filter((s) => s.id !== id));
      message.success('Student record deleted successfully');
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Failed to delete student record');
    }
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    form.setFieldsValue(student);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingStudent) {
          // Edit existing student record
          await studentAPI.update(editingStudent.id, { 
            ...values, 
            status: editingStudent.status,
            semester: String(values.semester)
          });
          message.success('Student record updated successfully');
        }
        setIsModalOpen(false);
        fetchStudents();
      } catch (err) {
        console.error(err);
        message.error(err.message || 'Failed to save student record');
      }
    });
  };

  const columns = [
    {
      title: 'Student', key: 'fullName',
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
    { title: 'Roll Number', dataIndex: 'rollNumber', key: 'rollNumber' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Course', dataIndex: 'course', key: 'course' },
    { title: 'Semester', dataIndex: 'semester', key: 'semester', width: 90, align: 'center' },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => <Tag color={s === 'Active' ? 'success' : s === 'Suspended' ? 'error' : 'warning'}>{s}</Tag>,
    },
    {
      title: 'Biometrics Override', key: 'biometrics', width: 200,
      render: (_, r) => (
        <StudentActionControls student={r} onRefresh={fetchStudents} />
      ),
    },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setViewStudent(r)} />
          <Button type="text" icon={<EditOutlined style={{ color: '#d97706' }} />} size="small" onClick={() => handleOpenEdit(r)} />
          <Popconfirm title="Delete this student record?" onConfirm={() => handleDelete(r.id)} okType="danger">
            <Button type="text" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Manage Students" subtitle="Centralized student registration directory and CRUD hub" breadcrumbs={[{ label: 'Manage Students' }]} />

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
          scroll={{ x: 1180 }}
          size="middle"
        />
      </div>

      {/* View Student details Modal */}
      <Modal title="Student Details" open={!!viewStudent} onCancel={() => setViewStudent(null)} footer={null} width={500}>
        {viewStudent && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar size={64} style={{ backgroundColor: '#1e40af', fontSize: 24 }}>{viewStudent.fullName ? viewStudent.fullName[0] : 'S'}</Avatar>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{viewStudent.fullName}</div>
                <div style={{ color: '#666' }}>{viewStudent.rollNumber}</div>
                <Tag color={viewStudent.status === 'Active' ? 'success' : viewStudent.status === 'Suspended' ? 'error' : 'warning'} style={{ marginTop: 4 }}>{viewStudent.status}</Tag>
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
              ['Home Address', viewStudent.address || 'N/A'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '10px 0' }}>
                <span style={{ width: 140, color: '#666', fontSize: 13 }}>{label}</span>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{val}</span>
              </div>
            ))}

            <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 10 }}>Biometric Override & Status Controls</div>
              <StudentActionControls student={viewStudent} onRefresh={() => { fetchStudents(); setViewStudent(null); }} />
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        title="Edit Student Details"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save Record"
        okButtonProps={{ style: { background: '#d97706', borderColor: '#d97706' } }}
        width={650}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Please enter name' }]}>
                <Input placeholder="E.g. Aarav Sharma" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rollNumber" label="Roll Number" rules={[{ required: true, message: 'Please enter roll number' }]}>
                <Input placeholder="E.g. CS2024001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                <Input placeholder="E.g. student@email.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact" label="Contact Number" rules={[{ required: true, message: 'Please enter contact number' }]}>
                <Input placeholder="E.g. 9876543210" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Please select department' }]}>
                <Select placeholder="Choose Department">
                  {DEPARTMENTS.map(d => <Option key={d} value={d}>{d}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="course" label="Course" rules={[{ required: true, message: 'Please select course' }]}>
                <Select placeholder="Choose Course">
                  {COURSES.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="semester" label="Semester" rules={[{ required: true, message: 'Please select semester' }]}>
                <Select placeholder="Choose Sem">
                  {SEMESTERS.map(s => <Option key={s} value={s}>Semester {s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Please select gender' }]}>
                <Select placeholder="Choose Gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: 'Please enter DOB' }]}>
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="address" label="Home Address" rules={[{ required: true, message: 'Please enter address' }]}>
                <Input.TextArea rows={2} placeholder="E.g. 123 Main Street, New York, NY 10001" />
              </Form.Item>
            </Col>
          </Row>

          {/* Father's name removed */}
        </Form>
      </Modal>
    </div>
  );
}
