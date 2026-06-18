import { useState } from 'react';
import { Card, Select, Switch, Button, InputNumber, Divider, message, Row, Col, Space, Alert } from 'antd';
import { DatabaseOutlined, SafetyOutlined, SlidersOutlined, SaveOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';

const { Option } = Select;

export default function SystemSettings() {
  const [lateThreshold, setLateThreshold] = useState(15);
  const [modelType, setModelType] = useState('ResNet50');
  const [saving, setSaving] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      message.success('System configurations saved successfully');
    }, 800);
  };

  const handleRetrainModel = () => {
    setRetraining(true);
    setTimeout(() => {
      setRetraining(false);
      message.success('Biometric face model retrained and synchronized');
    }, 3000);
  };

  const handleDatabaseBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      message.success('Biometric database backup completed successfully');
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure global thresholds, biometric parameters, and database services" breadcrumbs={[{ label: 'System Settings' }]} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={<Space><SlidersOutlined style={{ color: '#d97706' }} /><span>System Parameters</span></Space>} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Late Arrival Threshold</strong>
                <span style={{ color: '#777', fontSize: 12 }}>Time limit (in minutes) after class start to mark student as late</span>
              </div>
              <InputNumber min={5} max={60} value={lateThreshold} onChange={setLateThreshold} suffix="mins" />
            </div>

            <Divider style={{ margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Weekend Attendance</strong>
                <span style={{ color: '#777', fontSize: 12 }}>Allow attendance tracking on Saturdays and Sundays</span>
              </div>
              <Switch defaultChecked={false} checkedChildren="On" unCheckedChildren="Off" style={{ background: '#d97706' }} />
            </div>

            <Divider style={{ margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Email Notifications</strong>
                <span style={{ color: '#777', fontSize: 12 }}>Send weekly summaries and absent alerts to parents automatically</span>
              </div>
              <Switch defaultChecked={true} checkedChildren="On" unCheckedChildren="Off" style={{ background: '#d97706' }} />
            </div>

            <Divider style={{ margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Webcam Feed Resolution</strong>
                <span style={{ color: '#777', fontSize: 12 }}>Preferred resolution parameters for face scanner feed</span>
              </div>
              <Select defaultValue="720p" style={{ width: 120 }}>
                <Option value="480p">480p (SD)</Option>
                <Option value="720p">720p (HD)</Option>
                <Option value="1080p">1080p (FHD)</Option>
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveSettings} style={{ background: '#d97706', borderColor: '#d97706' }}>
                Save Configuration
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<Space><SafetyOutlined style={{ color: '#d97706' }} /><span>Biometrics Model Engine</span></Space>} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#555', fontSize: 13, marginBottom: 6 }}>Model Engine Architecture:</div>
              <Select value={modelType} onChange={setModelType} style={{ width: '100%' }}>
                <Option value="ResNet50">ResNet-50 (Default)</Option>
                <Option value="MobileNetV2">MobileNet V2 (Lightweight)</Option>
                <Option value="FaceNet">FaceNet (High Precision)</Option>
              </Select>
            </div>

            <Alert
              message="New student registrations require model retraining."
              type="info"
              showIcon
              style={{ marginBottom: 16, fontSize: 12 }}
            />

            <Button type="primary" onClick={handleRetrainModel} loading={retraining} style={{ width: '100%', background: '#d97706', borderColor: '#d97706' }}>
              Retrain Biometric Model
            </Button>
          </Card>

          <Card title={<Space><DatabaseOutlined style={{ color: '#d97706' }} /><span>System Databases</span></Space>} style={{ borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
              Execute backup services of face templates and attendance database tables manually.
            </div>

            <Button type="default" icon={<DatabaseOutlined />} onClick={handleDatabaseBackup} loading={backingUp} style={{ width: '100%' }}>
              Trigger Database Backup
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
