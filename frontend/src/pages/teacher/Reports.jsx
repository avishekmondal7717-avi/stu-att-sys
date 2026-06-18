import { useState } from 'react';
import { Row, Col, Card, Table, Button, Select, DatePicker, Progress } from 'antd';
import { FilterOutlined, EyeOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { departmentStats, attendanceOverview, DEPARTMENTS, COURSES, DEPT_COLORS } from '../../data/dummyData';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const [dateRange, setDateRange] = useState([dayjs('2026-05-01'), dayjs('2026-05-31')]);
  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const pieData = departmentStats.map((d) => ({ name: d.name, value: d.percentage }));

  const deptColumns = [
    { title: '#', key: 'index', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Department', dataIndex: 'name', key: 'name' },
    { title: 'Total Students', dataIndex: 'totalStudents', key: 'totalStudents', align: 'center' },
    { title: 'Present', dataIndex: 'present', key: 'present', align: 'center' },
    { title: 'Absent', dataIndex: 'absent', key: 'absent', align: 'center' },
    {
      title: 'Attendance %', key: 'percentage',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Progress percent={r.percentage} showInfo={false} strokeColor={DEPT_COLORS[r.name]} style={{ width: 120 }} strokeWidth={8} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>{r.percentage}%</span>
        </div>
      ),
    },
    {
      title: 'Action', key: 'action', width: 80, align: 'center',
      render: () => <Button type="text" icon={<EyeOutlined />} size="small" />,
    },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="View attendance insights and analytics" breadcrumbs={[{ label: 'Reports' }]} />

      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <RangePicker value={dateRange} onChange={setDateRange} format="DD MMM YYYY" style={{ width: 280 }} />
        <Select placeholder="All Departments" allowClear style={{ width: 200 }} value={filterDept || undefined} onChange={setFilterDept}>
          {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
        </Select>
        <Select placeholder="All Courses" allowClear style={{ width: 160 }} value={filterCourse || undefined} onChange={setFilterCourse}>
          {COURSES.map((c) => <Option key={c} value={c}>{c}</Option>)}
        </Select>
        <Button type="primary" icon={<FilterOutlined />} style={{ background: '#1e40af' }}>Filter</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <StatCard icon={<TeamOutlined />} label="Total Students" value={150} sub="100%" iconBg="#eff6ff" iconColor="#3b82f6" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={<CheckCircleOutlined />} label="Average Attendance" value="75.5%" sub="↑ 5.2% from last month" iconBg="#f0fdf4" iconColor="#22c55e" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={<CheckCircleOutlined />} label="Total Present" value="3,398" sub="↑ 8.1% from last month" iconBg="#fff7ed" iconColor="#f59e0b" />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={<CloseCircleOutlined />} label="Total Absent" value="1,102" sub="↓ 3.4% from last month" iconBg="#f5f3ff" iconColor="#8b5cf6" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Attendance Overview" extra={
            <Select defaultValue="Daily" size="small" style={{ width: 100 }}>
              <Option value="Daily">Daily</Option>
              <Option value="Weekly">Weekly</Option>
              <Option value="Monthly">Monthly</Option>
            </Select>
          } style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={attendanceOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Attendance by Department" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="40%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={DEPT_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Pie>
                <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 700 }}>75.5%</text>
                <text x="40%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#666' }}>Average</text>
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  formatter={(value) => {
                    const dept = departmentStats.find((d) => d.name === value);
                    return <span style={{ fontSize: 11 }}>{value} <strong>{dept?.percentage}%</strong></span>;
                  }}
                  iconType="circle" iconSize={8}
                />
                <Tooltip formatter={(v, n) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Department Wise Report</div>
        <Table
          columns={deptColumns}
          dataSource={departmentStats}
          rowKey="name"
          pagination={false}
          size="middle"
        />
      </div>
    </div>
  );
};

export default Reports;
