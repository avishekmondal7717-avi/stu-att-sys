import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Select, DatePicker, Progress, Spin, Segmented, message } from 'antd';
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

const Reports = () => {
  const [periodMode, setPeriodMode] = useState('Monthly');
  const [periodDate, setPeriodDate] = useState(dayjs());
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [filterDept, setFilterDept] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentLocked, setDepartmentLocked] = useState(false);
  const [exporting, setExporting] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: '0.0%',
    presentCount: 0,
    absentCount: 0,
    departmentStats: [],
    attendanceOverview: []
  });

  const effectiveRange = () => {
    if (periodMode === 'Daily') return [periodDate.startOf('day'), periodDate.endOf('day')];
    if (periodMode === 'Monthly') return [periodDate.startOf('month'), periodDate.endOf('month')];
    if (periodMode === 'Yearly') return [periodDate.startOf('year'), periodDate.endOf('year')];
    return dateRange;
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [start, end] = effectiveRange();
      const data = await reportsAPI.getStats({
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD'),
        department: filterDept,
        group_by: periodMode === 'Yearly' ? 'month' : 'day'
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
  }, [periodMode, periodDate, dateRange, filterDept]);

  useEffect(() => {
    reportsAPI.getDepartments().then((result) => {
      setDepartments(result.departments || []);
      setDepartmentLocked(Boolean(result.locked));
      if (result.locked && result.departments?.[0]) setFilterDept(result.departments[0]);
    }).catch(() => message.error('Could not load departments'));
  }, []);

  const handleExport = async (format = 'csv') => {
    setExporting(format);
    try {
      const [start, end] = effectiveRange();
      const exportParams = {
        department: filterDept,
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD'),
        format: format
      };

      message.loading({ content: `Generating ${format === 'xlsx' ? 'Excel' : 'CSV'} report...`, key: 'export' });
      
      const blob = await reportsAPI.downloadExport(exportParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileExt = format === 'xlsx' ? 'xlsx' : 'csv';
      a.download = `attendance_report_${start.format('YYYYMMDD')}_to_${end.format('YYYYMMDD')}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      message.success({ content: `${format === 'xlsx' ? 'Excel' : 'CSV'} export download started!`, key: 'export' });
    } catch (err) {
      console.error(err);
      message.error({ content: `Failed to export report ${format === 'xlsx' ? 'Excel' : 'CSV'}`, key: 'export' });
    } finally { setExporting(''); }
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

      <div className="surface-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Segmented options={['Daily', 'Monthly', 'Yearly', 'Custom']} value={periodMode} onChange={setPeriodMode} />
        {periodMode === 'Custom' ? (
          <RangePicker value={dateRange} onChange={(value) => value && setDateRange(value)} format="DD MMM YYYY" style={{ width: 280 }} />
        ) : (
          <DatePicker value={periodDate} onChange={(value) => value && setPeriodDate(value)} picker={periodMode === 'Yearly' ? 'year' : periodMode === 'Monthly' ? 'month' : 'date'} style={{ width: 180 }} />
        )}
        <Select placeholder="All Departments" allowClear={!departmentLocked} disabled={departmentLocked} style={{ width: 220 }} value={filterDept || undefined} onChange={(value) => setFilterDept(value || '')}>
          {departments.map((d) => <Option key={d} value={d}>{d}</Option>)}
        </Select>
        <Button type="primary" icon={<FilterOutlined />} onClick={fetchStats} style={{ background: '#1e40af' }}>Filter</Button>
        <Button loading={exporting === 'csv'} disabled={Boolean(exporting)} type="default" icon={<DownloadOutlined />} onClick={() => handleExport('csv')} style={{ marginLeft: 'auto' }}>Export CSV</Button>
        <Button loading={exporting === 'xlsx'} disabled={Boolean(exporting)} type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('xlsx')} style={{ background: '#10b981', borderColor: '#10b981' }}>Export Excel</Button>
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

          <div className="surface-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Department Wise Report</div>
            <Table
              columns={deptColumns}
              dataSource={stats.departmentStats}
              rowKey="name"
              pagination={false}
              scroll={{ x: 650 }}
              size="middle"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
