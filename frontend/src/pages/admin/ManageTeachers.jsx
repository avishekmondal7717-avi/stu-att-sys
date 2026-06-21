import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Avatar, Space, Popconfirm, message, Modal, Form, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { DEPARTMENTS } from '../../data/dummyData';
import { teacherAPI } from '../../services/api';

const { Option } = Select;

export default function ManageTeachers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [viewTeacher, setViewTeacher] = useState(null);

  // Modal states for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form] = Form.useForm();

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getAll();
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Failed to fetch teachers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filtered = data.filter((t) => {
    const matchSearch = !search || t.fullName.toLowerCase().includes(search.toLowerCase()) || t.teacherId.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || t.department === filterDept;
    return matchSearch && matchDept;
  });

  const handleDelete = async (id) => {
    try {
      await teacherAPI.delete(id);
      setData(data.filter((t) => t.id !== id));
      message.success('Teacher record deleted successfully');
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Failed to delete teacher record');
    }
  };

  const handleOpenEdit = (teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue(teacher);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      // Validate teacherId prefix
      if (!values.teacherId.startsWith('TCH')) {
        message.error("Teacher ID must start with 'TCH'");
        return;
      }

      try {
        if (editingTeacher) {
          // Edit existing record
          await teacherAPI.update(editingTeacher.id, { ...values, status: editingTeacher.status });
          message.success('Teacher record updated successfully');
        }
        setIsModalOpen(false);
        fetchTeachers();
      } catch (err) {
        console.error(err);
        message.error(err.message || 'Failed to save teacher record');
      }
    });
  };

  const columns = [
    {
      title: 'Teacher', key: 'fullName',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={36} style={{ backgroundColor: '#d97706' }}>{r.fullName ? r.fullName[0] : 'T'}</Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.fullName}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { title: 'Teacher ID', dataIndex: 'teacherId', key: 'teacherId' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Contact Number', dataIndex: 'contact', key: 'contact' },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 90,
      render: (s) => <Tag color={s === 'Active' ? 'success' : 'default'}>{s}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setViewTeacher(r)} />
          <Button type="text" icon={<EditOutlined style={{ color: '#d97706' }} />} size="small" onClick={() => handleOpenEdit(r)} />
          <Popconfirm title="Delete this teacher record?" onConfirm={() => handleDelete(r.id)} okType="danger">
            <Button type="text" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Manage Teachers" subtitle="Centralized teacher registry directory and CRUD hub" breadcrumbs={[{ label: 'Manage Teachers' }]} />

      <div className="surface-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#ccc' }} />}
            placeholder="Search by name, teacher ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <Select placeholder="All Departments" allowClear style={{ width: 200 }} value={filterDept || undefined} onChange={setFilterDept}>
            {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t, r) => `Showing ${r[0]} to ${r[1]} of ${t} teachers` }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </div>

      {/* View Details Modal */}
      <Modal title="Teacher Details" open={!!viewTeacher} onCancel={() => setViewTeacher(null)} footer={null} width={500}>
        {viewTeacher && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar size={64} style={{ backgroundColor: '#d97706', fontSize: 24 }}>{viewTeacher.fullName ? viewTeacher.fullName[0] : 'T'}</Avatar>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{viewTeacher.fullName}</div>
                <div style={{ color: '#666' }}>{viewTeacher.teacherId}</div>
                <Tag color="success" style={{ marginTop: 4 }}>{viewTeacher.status}</Tag>
              </div>
            </div>
            {[
              ['Email Address', viewTeacher.email],
              ['Contact Number', viewTeacher.contact],
              ['Department', viewTeacher.department],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '10px 0' }}>
                <span style={{ width: 140, color: '#666', fontSize: 13 }}>{label}</span>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        title="Edit Teacher Details"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save Record"
        okButtonProps={{ style: { background: '#d97706', borderColor: '#d97706' } }}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
                <Input placeholder="E.g. Dr. Sourav Ganguly" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="teacherId" label="Teacher ID" rules={[{ required: true, message: 'Please enter teacher ID' }]}>
                <Input placeholder="E.g. TCH2024001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                <Input placeholder="E.g. teacher@email.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact" label="Contact Number" rules={[{ required: true, message: 'Please enter contact number' }]}>
                <Input placeholder="E.g. 9876543210" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Please select department' }]}>
            <Select placeholder="Choose Department">
              {DEPARTMENTS.map(d => <Option key={d} value={d}>{d}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
