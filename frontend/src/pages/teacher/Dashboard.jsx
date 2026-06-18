import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, CheckCircle, XCircle, PieChart, ChevronDown } from 'lucide-react';
import { dashboardAPI, reportsAPI } from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [range, setRange] = useState('Last 7 Days');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    attendanceRate: 0,
    recentAttendance: []
  });
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({
    averageAttendance: 0,
    highestAttendance: 92,
    lowestAttendance: 45
  });
  const [loading, setLoading] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await dashboardAPI.getStats();
      setStats(statsRes);

      // Load analytics summary for charts
      const summaryRes = await reportsAPI.getSummary();
      setChartData(summaryRes.overview || []);
      setSummary(prev => ({
        ...prev,
        averageAttendance: summaryRes.averageAttendance,
      }));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const statCards = [
    {
      label: 'Total Students',
      value: String(stats.totalStudents),
      icon: <Users size={28} color="#3B5BDB" />,
      iconBg: '#eef2ff',
      sub: <a href="/students/list" className="stat-link">View all students →</a>,
      valueColor: '#3B5BDB',
    },
    {
      label: 'Present Today',
      value: String(stats.totalPresent),
      icon: <CheckCircle size={28} color="#38a169" />,
      iconBg: '#f0fff4',
      sub: `${stats.attendanceRate}% of total`,
      valueColor: '#38a169',
    },
    {
      label: 'Absent Today',
      value: String(stats.totalAbsent),
      icon: <XCircle size={28} color="#e53e3e" />,
      iconBg: '#fff5f5',
      sub: `${100 - stats.attendanceRate}% of total`,
      valueColor: '#e53e3e',
    },
    {
      label: 'Attendance %',
      value: `${stats.attendanceRate}%`,
      icon: <PieChart size={28} color="#805ad5" />,
      iconBg: '#faf5ff',
      sub: 'Today\'s Rate',
      valueColor: '#805ad5',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <span className="breadcrumb">
          <span className="breadcrumb-link">Home</span> / Dashboard
        </span>
      </div>

      <div className="stat-cards">
        {statCards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-card-top">
              <div className="stat-icon" style={{ background: card.iconBg }}>
                {card.icon}
              </div>
              <div>
                <p className="stat-label">{card.label}</p>
                <p className="stat-value" style={{ color: card.valueColor }}>{card.value}</p>
              </div>
            </div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-middle">
        <div className="chart-card">
          <div className="chart-card-header">
            <h2 className="section-title">Attendance Overview</h2>
            <div className="range-select">
              <select value={range} onChange={e => setRange(e.target.value)}>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Month</option>
              </select>
              <ChevronDown size={14} className="select-icon" />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                No historical attendance records found
              </div>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 12, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #eee', fontSize: 13 }}
                  formatter={(v) => [`${v}%`, 'Attendance']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B5BDB"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#3B5BDB', strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>

          <div className="chart-summary">
            <div className="summary-item">
              <p className="summary-label">Average Attendance</p>
              <p className="summary-value blue">{summary.averageAttendance}%</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Highest Attendance</p>
              <p className="summary-value green">{summary.highestAttendance}%</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Lowest Attendance</p>
              <p className="summary-value red">{summary.lowestAttendance}%</p>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <div className="activity-header">
            <h2 className="section-title">Recent Activity</h2>
            <a href="/attendance" className="view-all-link">View All</a>
          </div>

          <div className="activity-list">
            {stats.recentAttendance.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', paddingTop: 60 }}>
                No attendance activity logged yet.
              </div>
            ) : (
              stats.recentAttendance.map((item, i) => (
                <div className="activity-item" key={i}>
                  <Avatar size={40} style={{ background: item.status === 'Present' ? '#10b981' : '#ef4444' }}>
                    {item.studentName ? item.studentName[0] : '?'}
                  </Avatar>
                  <div className="activity-info" style={{ marginLeft: 12 }}>
                    <p className="activity-name">{item.studentName}</p>
                    <p className={`activity-status ${item.status === 'Absent' ? 'absent' : 'present'}`}>
                      {item.status === 'Present' ? `Marked Present (${item.markedBy})` : 'Marked Absent'}
                    </p>
                  </div>
                  <span className="activity-time">{item.timeIn}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
