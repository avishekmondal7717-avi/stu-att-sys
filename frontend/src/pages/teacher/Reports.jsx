import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Select, DatePicker, Progress, Spin, message } from 'antd';
import { FilterOutlined, DownloadOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { reportsAPI } from '../../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DEPT_COLORS = {
  'Computer Science': '#3b82f6',
  'Information Technology': '#10b981',
  'Electronics': '#f59e0b',
  'Mechanical': '#ef4444',
  'Civil': '#6b7280',
};

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];

const Reports = () => {
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [filterDept, setFilterDept] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: '0.0%',
    presentCount: 0,
    absentCount: 0,
    departmentStats: [],
    attendanceOverview: []
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [start, end] = dateRange;
      const data = await reportsAPI.getStats({
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD')
      });
      setStats(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load attendance report stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const handleExport = async () => {
    try {
      const [start, end] = dateRange;
      const token = localStorage.getItem("token");
      const query = new URLSearchParams({
        department: filterDept,
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD')
      }).toString();

      message.loading({ content: 'Generating report...', key: 'export' });
      
      const response = await fetch(`/api/reports/export?${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${start.format('YYYYMMDD')}_to_${end.format('YYYYMMDD')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      message.success({ content: 'Export download started!', key: 'export' });
    } catch (err) {
      console.error(err);
      message.error({ content: 'Failed to export report CSV', key: 'export' });
    }
  };

  const pieData = stats.departmentStats.map((d) => ({ 
    name: d.name, 
    value: d.percentage 
  }));

  const deptColumns = [
    { title: '#', key: 'index', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Department', dataIndex: 'name', key: 'name' },
    { title: 'Total Students', dataIndex: 'totalStudents', key: 'totalStudents', align: 'center' },
    { title: 'Present Logs', dataIndex: 'present', key: 'present', align: 'center' },
    { title: 'Absent Logs', dataIndex: 'absent', key: 'absent', align: 'center' },
    {
      title: 'Attendance %', key: 'percentage',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Progress percent={r.percentage} showInfo={false} strokeColor={DEPT_COLORS[r.name] || '#ccc'} style={{ width: 120 }} strokeWidth={8} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>{r.percentage}%</span>
        </div>
      ),
    }
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="View attendance insights and analytics" breadcrumbs={[{ label: 'Reports' }]} />

      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <RangePicker value={dateRange} onChange={setDateRange} format="DD MMM YYYY" style={{ width: 280 }} />
        <Select placeholder="All Departments" allowClear style={{ width: 200 }} value={filterDept || undefined} onChange={setFilterDept}>
          {DEPARTMENTS.map((d) => <Option key={d} value={d}>{d}</Option>)}
        </Select>
        <Button type="primary" icon={<FilterOutlined />} onClick={fetchStats} style={{ background: '#1e40af' }}>Filter</Button>
        <Button type="default" icon={<DownloadOutlined />} onClick={handleExport} style={{ marginLeft: 'auto' }}>Export CSV</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <StatCard icon={<TeamOutlined />} label="Total Active Students" value={stats.totalStudents} sub=" Roster Strength" iconBg="#eff6ff" iconColor="#3b82f6" />
            </Col>
            <Col xs={12} sm={6}>
              <StatCard icon={<CheckCircleOutlined />} label="Average Attendance" value={stats.avgAttendance} sub="Selected Date Range" iconBg="#f0fdf4" iconColor="#22c55e" />
            </Col>
            <Col xs={12} sm={6}>
              <StatCard icon={<CheckCircleOutlined />} label="Total Present Logs" value={stats.presentCount} sub="Accumulated scans" iconBg="#fff7ed" iconColor="#f59e0b" />
            </Col>
            <Col xs={12} sm={6}>
              <StatCard icon={<CloseCircleOutlined />} label="Total Absent Logs" value={stats.absentCount} sub="Accumulated misses" iconBg="#f5f3ff" iconColor="#8b5cf6" />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={14}>
              <Card title="Attendance Overview" style={{ borderRadius: 12 }}>
                {stats.attendanceOverview.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260, color: '#999' }}>
                    No attendance records for the selected period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={stats.attendanceOverview}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="Attendance by Department" style={{ borderRadius: 12 }}>
                {stats.departmentStats.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260, color: '#999' }}>
                    No department breakdown available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} cx="40%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" paddingAngle={2}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={DEPT_COLORS[entry.name] || '#ccc'} />
                        ))}
                      </Pie>
                      <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 700 }}>{stats.avgAttendance}</text>
                      <text x="40%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#666' }}>Average</text>
                      <Legend
                        layout="vertical" align="right" verticalAlign="middle"
                        formatter={(value) => {
                          const dept = stats.departmentStats.find((d) => d.name === value);
                          return <span style={{ fontSize: 11 }}>{value} <strong>{dept?.percentage}%</strong></span>;
                        }}
                        iconType="circle" iconSize={8}
                      />
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
          </Row>

          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Department Wise Report</div>
            <Table
              columns={deptColumns}
              dataSource={stats.departmentStats}
              rowKey="name"
              pagination={false}
              size="middle"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
