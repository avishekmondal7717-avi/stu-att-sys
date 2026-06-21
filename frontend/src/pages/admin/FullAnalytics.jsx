import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Table, Button, Spin, Alert } from 'antd';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { FileText } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { reportsAPI } from '../../services/api';

const { Option } = Select;
const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fef3c7', '#fcd34d', '#fb923c'];

export default function FullAnalytics() {
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    departmentStats: [],
    overview: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await reportsAPI.getSummary();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedSemester]);

  const reportColumns = [
    { title: 'Department', dataIndex: 'name', key: 'name', fontWeight: 600 },
    { title: 'Students', dataIndex: 'totalStudents', key: 'totalStudents', align: 'center' },
    { title: 'PresentsLogged', dataIndex: 'present', key: 'present', align: 'center' },
    { title: 'AbsentsLogged', dataIndex: 'absent', key: 'absent', align: 'center' },
    {
      title: 'Average %', dataIndex: 'percentage', key: 'percentage', align: 'center',
      render: (pct) => <strong style={{ color: pct >= 75 ? '#10b981' : '#f59e0b' }}>{pct}%</strong>
    }
  ];

  const generatePdf = () => {
    const previousTitle = document.title;
    document.title = `attendance-analytics-${new Date().toISOString().slice(0, 10)}`;
    window.print();
    document.title = previousTitle;
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon style={{ margin: 20 }} />;
  }

  return (
    <div id="analytics-print-root">
      <div className="analytics-print-heading">
        <h1>Smart Attendance — Full Analytics Report</h1>
        <p>Generated {new Date().toLocaleString()}</p>
      </div>
      <PageHeader title="Full Analytics" subtitle="Access system-wide attendance reports and historical performance" breadcrumbs={[{ label: 'Full Analytics' }]} />

      <div className="surface-card analytics-report-controls" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>Filter Report Semester:</span>
        <Select defaultValue="All" style={{ width: 150 }} onChange={setSelectedSemester}>
          <Option value="All">All Semesters</Option>
          <Option value="Odd">Odd Semesters</Option>
          <Option value="Even">Even Semesters</Option>
        </Select>

        <Button icon={<FileText />} onClick={generatePdf} style={{ marginLeft: 'auto', background: '#d97706', color: '#fff', borderColor: '#d97706' }}>
          Generate PDF Report
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={8}>
          <Card title="Department Distribution" style={{ borderRadius: 12, height: 360 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.departmentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="totalStudents"
                  nameKey="name"
                >
                  {data.departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} Students`, 'Total']} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Attendance Performance by Department" style={{ borderRadius: 12, height: 360 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, 'Average Attendance']} />
                <Bar dataKey="percentage" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title="Daily Attendance Flow (%)" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.overview}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, 'Attendance Rate']} />
                <Line type="monotone" dataKey="value" stroke="#d97706" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Department Statistics Summary" style={{ borderRadius: 12 }}>
            <Table dataSource={data.departmentStats} columns={reportColumns} rowKey="name" pagination={false} size="small" scroll={{ x: 620 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
