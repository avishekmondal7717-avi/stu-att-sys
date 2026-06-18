import { useState } from 'react';
import { Card, Row, Col, Progress, Select, Table, Button } from 'antd';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { FileDown, FileText } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { departmentStats, attendanceOverview } from '../../data/dummyData';

const { Option } = Select;

const courseStats = [
  { name: 'B.Tech', count: 95, present: 88 },
  { name: 'M.Tech', count: 15, present: 93 },
  { name: 'BCA', count: 22, present: 74 },
  { name: 'MCA', count: 18, present: 81 },
];

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fef3c7'];

const peakDays = [
  { date: 'Mon', count: 142 },
  { date: 'Tue', count: 145 },
  { date: 'Wed', count: 139 },
  { date: 'Thu', count: 148 },
  { date: 'Fri', count: 122 },
];

export default function FullAnalytics() {
  const [selectedSemester, setSelectedSemester] = useState('All');

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

  return (
    <div>
      <PageHeader title="Full Analytics" subtitle="Access system-wide attendance reports and historical performance" breadcrumbs={[{ label: 'Full Analytics' }]} />

      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>Filter Report Semester:</span>
        <Select defaultValue="All" style={{ width: 150 }} onChange={setSelectedSemester}>
          <Option value="All">All Semesters</Option>
          <Option value="Odd">Odd Semesters</Option>
          <Option value="Even">Even Semesters</Option>
        </Select>

        <Button icon={<FileText />} style={{ marginLeft: 'auto', background: '#d97706', color: '#fff', borderColor: '#d97706' }}>
          Generate PDF Report
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={8}>
          <Card title="Course Distribution" style={{ borderRadius: 12, height: 360 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={courseStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {courseStats.map((entry, index) => (
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
          <Card title="Attendance Performance by Course" style={{ borderRadius: 12, height: 360 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={courseStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, 'Average Attendance']} />
                <Bar dataKey="present" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title="Daily Attendance Flow" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={peakDays}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 150]} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} Students`, 'Checkins']} />
                <Line type="monotone" dataKey="count" stroke="#d97706" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Department Statistics Summary" style={{ borderRadius: 12 }}>
            <Table dataSource={departmentStats} columns={reportColumns} rowKey="name" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
