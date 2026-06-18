import { Card, Form, Input, Button, Select, Switch, Divider, message } from 'antd';
import PageHeader from '../../components/common/PageHeader';

const { Option } = Select;

const Settings = () => {
  const [form] = Form.useForm();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure system preferences" breadcrumbs={[{ label: 'Settings' }]} />
      <Card style={{ borderRadius: 12, maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={() => message.success('Settings saved!')}>
          <Divider orientation="left">General</Divider>
          <Form.Item label="Institution Name" name="institutionName" initialValue="Smart University">
            <Input size="large" />
          </Form.Item>
          <Form.Item label="Academic Year" name="academicYear" initialValue="2024-2025">
            <Input size="large" />
          </Form.Item>
          <Form.Item label="Default Timezone" name="timezone" initialValue="Asia/Kolkata">
            <Select size="large">
              <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
              <Option value="UTC">UTC</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">Attendance</Divider>
          <Form.Item label="Minimum Attendance %" name="minAttendance" initialValue="75">
            <Input size="large" suffix="%" />
          </Form.Item>
          <Form.Item label="Enable Email Alerts" name="emailAlerts" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item label="Auto-mark Absent" name="autoAbsent" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>

          <Divider orientation="left">API</Divider>
          <Form.Item label="Backend API URL" name="apiUrl" initialValue="http://localhost:8000/api">
            <Input size="large" placeholder="http://your-backend/api" />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" style={{ background: '#1e40af', marginTop: 8 }}>
            Save Settings
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
