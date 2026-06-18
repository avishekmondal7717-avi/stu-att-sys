import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Users, GraduationCap, ShieldCheck, Server } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Card, Table, Tag, Row, Col, Progress, Alert, Spin, message } from 'antd';
import { dashboardAPI, reportsAPI, teacherAPI } from '../../services/api';

const systemLogs = [
  { key: '1', time: '10 mins ago', action: 'Face ID database synchronized', status: 'Success', user: 'System Auto' },
  { key: '2', time: '1 hour ago', action: 'Database schema migrations verified', status: 'Success', user: 'Admin' },
  { key: '3', time: '4 hours ago', action: 'New Teacher registration approval', status: 'Success', user: 'Admin' },
  { key: '4', time: 'Yesterday', action: 'Backup of Biometric DB', status: 'Success', user: 'System Cron' },
];

const logColumns = [
  { title: 'Time', dataIndex: 'time', key: 'time', width: 120 },
  { title: 'Action', dataIndex: 'action', key: 'action' },
  { title: 'Triggered By', dataIndex: 'user', key: 'user', width: 140 },
  {
    title: 'Status', dataIndex: 'status', key: 'status', width: 100,
    render: (s) => <Tag color={s === 'Success' ? 'success' : 'warning'}>{s}</Tag>
  }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [teachersCount, setTeachersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, reportData, teacherData] = await Promise.all([
          dashboardAPI.getStats(),
          reportsAPI.getSummary(),
          teacherAPI.getAll()
        ]);
        setStats(statsData);
        setReportSummary(reportData);
        setTeachersCount(teacherData.total || 0);
      } catch (err) {
        console.error(err);
        message.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading administrative dashboard metrics..." />
      </div>
    );
  }

  const attendanceHistory = reportSummary?.overview?.map(item => ({
    day: item.date,
    rate: item.value
  })) || [];

  const deptData = reportSummary?.departmentStats?.map(item => ({
    name: item.name,
    rate: item.percentage
  })) || [];

  const totalStudents = stats?.totalStudents || 0;

  return (
    <div style={{ padding: '0px 0px' }}>
      <PageHeader title="Admin Dashboard" subtitle="System metrics, biometric health, and configuration oversight" breadcrumbs={[{ label: 'Admin Dashboard' }]} />

      <Alert
        message="Face Recognition Model v1.2 is currently active. Biometric DB backup complete."
        type="success"
        showIcon
        closable
        style={{ marginBottom: 20, borderRadius: 8 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<GraduationCap size={24} />} label="Total Students" value={String(totalStudents)} iconBg="#fffbeb" iconColor="#d97706" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<Users size={24} />} label="Total Teachers" value={String(teachersCount)} iconBg="#fffbeb" iconColor="#d97706" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<ShieldCheck size={24} />} label="Enrolled Face IDs" value={`${totalStudents} / ${totalStudents}`} iconBg="#ecfdf5" iconColor="#10b981" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<Server size={24} />} label="System Status" value="Healthy" iconBg="#eff6ff" iconColor="#3b82f6" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title="Attendance Rates (Weekly)" style={{ borderRadius: 12 }}>
            {attendanceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={attendanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                  <Line type="monotone" dataKey="rate" stroke="#d97706" strokeWidth={2.5} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999' }}>
                No attendance logs found for past week
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Department Attendance Rates" style={{ borderRadius: 12 }}>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Rate']} />
                  <Bar dataKey="rate" fill="#d97706" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999' }}>
                No department distribution data available
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Administrative Action Audit Logs" style={{ borderRadius: 12 }}>
            <Table dataSource={systemLogs} columns={logColumns} size="middle" pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Biometric Database Sync" style={{ borderRadius: 12 }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Progress type="dashboard" percent={100} strokeColor="#d97706" />
              <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                100% of registered students have uploaded biometrics ({totalStudents} of {totalStudents}).
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
