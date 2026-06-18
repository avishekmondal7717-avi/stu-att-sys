import { useState } from 'react';
import { Row, Col, Card, Form, Input, Select, DatePicker, Radio, Button, Upload, message, Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { DEPARTMENTS, COURSES, SEMESTERS } from '../../data/dummyData';
import { studentAPI } from '../../services/api';

const { Option } = Select;
const { Dragger } = Upload;

const AddStudent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to read File as Base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Format DOB if selected
      const payload = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : '',
      };
      
      message.loading({ content: 'Creating student record...', key: 'enroll' });
      
      // 1. Create student record in SQL
      const studentRes = await studentAPI.create(payload);
      const studentId = studentRes.id;
      
      // 2. Upload face images if selected
      if (fileList.length > 0) {
        message.loading({ content: `Processing ${fileList.length} face photos...`, key: 'enroll' });
        
        // Convert all files to base64
        const base64Images = await Promise.all(
          fileList.map((file) => fileToBase64(file.originFileObj || file))
        );
        
        // Upload images and trigger KNN training
        await studentAPI.uploadFaceImages(studentId, base64Images);
      }
      
      message.success({ content: 'Student registered & face biometric enrolled successfully!', key: 'enroll', duration: 4 });
      navigate('/students/list');
    } catch (err) {
      console.error(err);
      message.error({ content: err.message || 'Failed to register student biometric details.', key: 'enroll', duration: 4 });
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    accept: '.jpg,.jpeg,.png',
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isImage) { message.error('Only image files allowed!'); return Upload.LIST_IGNORE; }
      if (!isLt5M) { message.error('Image must be smaller than 5MB!'); return Upload.LIST_IGNORE; }
      setFileList((prev) => [...prev, file]);
      return false; // Prevent auto upload
    },
    onRemove: (file) => setFileList((prev) => prev.filter((f) => f.uid !== file.uid)),
  };

  return (
    <div>
      <PageHeader title="Add New Student" subtitle="Enter student details and upload face images" breadcrumbs={[{ label: 'Students', path: '/students/list' }, { label: 'Add Student' }]} />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title={<span style={{ color: '#1e40af', fontWeight: 700 }}>Student Information</span>} style={{ borderRadius: 12, marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Required' }]}>
                    <Input placeholder="Enter full name" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Father's Name" name="fatherName">
                    <Input placeholder="Enter father's name" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Roll Number" name="rollNumber" rules={[{ required: true, message: 'Required' }]}>
                    <Input placeholder="Enter roll number" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Course" name="course" initialValue="B.Tech">
                    <Select placeholder="Select course" size="large">
                      {COURSES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Department" name="department" rules={[{ required: true, message: 'Required' }]}>
                    <Select placeholder="Select department" size="large">
                      {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Year / Semester" name="semester" initialValue="4">
                    <Select placeholder="Select year/semester" size="large">
                      {SEMESTERS.map((s) => <Option key={s} value={s}>Semester {s}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Invalid email' }]}>
                    <Input placeholder="Enter email address" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Contact Number" name="contact">
                    <Input placeholder="Enter contact number" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Date of Birth" name="dob">
                    <DatePicker style={{ width: '100%' }} size="large" format="DD-MM-YYYY" placeholder="dd-mm-yyyy" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Gender" name="gender" initialValue="Male">
                    <Radio.Group>
                      <Radio value="Male">Male</Radio>
                      <Radio value="Female">Female</Radio>
                      <Radio value="Other">Other</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button size="large" style={{ width: 140 }} onClick={() => navigate('/students/list')}>Cancel</Button>
                <Button type="primary" size="large" htmlType="submit" loading={loading} style={{ width: 160, background: '#1e40af' }}>
                  Save Student
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={<span style={{ color: '#1e40af', fontWeight: 700 }}>Upload Face Images</span>} style={{ borderRadius: 12 }}>
              <Alert
                message="Upload clear face images for enrollment. (Recommended: 5-15 images from different angles)"
                type="info"
                showIcon
                style={{ marginBottom: 16, fontSize: 12 }}
              />
              <Dragger {...uploadProps} style={{ borderRadius: 8 }}>
                <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#3b82f6' }} /></p>
                <p style={{ fontSize: 14, color: '#333' }}>Click to upload or drag and drop</p>
                <p style={{ fontSize: 12, color: '#999' }}>JPG, PNG (Max. 5MB each)</p>
              </Dragger>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Uploaded Images ({fileList.length})</div>
                {fileList.length === 0 ? (
                  <div style={{ color: '#999', fontSize: 13 }}>No images uploaded yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {fileList.map((f, i) => (
                      <div key={i} style={{ width: 60, height: 60, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#666', overflow: 'hidden' }}>
                        <img src={URL.createObjectURL(f.originFileObj || f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddStudent;
