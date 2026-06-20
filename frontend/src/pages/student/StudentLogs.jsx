import { useState, useEffect } from 'react';
import { Table, Tag, Card, Select, Segmented, Empty } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';

const { Option } = Select;

export default function StudentLogs() {
  const { logs } = useOutletContext();
  const [selectedMonth, setSelectedMonth] = useState(''); // e.g. "2026-06"
  const [selectedWeek, setSelectedWeek] = useState('All'); // "All", "1", "2", "3", "4", "5"
  
  // Calculate unique months from logs
  const getMonthsList = () => {
    const monthsMap = {};
    logs.forEach(log => {
      if (!log.date) return;
      const parts = log.date.split('-');
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`; // YYYY-MM
        const dateObj = new Date(log.date);
        const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthsMap[key] = label;
      }
    });
    
    // Add current month if empty
    const keys = Object.keys(monthsMap);
    if (keys.length === 0) {
      const now = new Date();
      const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthsMap[currentKey] = currentLabel;
    }
    
    return Object.entries(monthsMap).map(([value, label]) => ({ value, label }));
  };

  const months = getMonthsList();

  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0].value);
    }
  }, [logs]);

  // Helper to determine the week of the month (1 to 5)
  const getWeekOfMonth = (dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const day = date.getDate();
    return Math.ceil(day / 7);
  };

  // Filter logs based on selection
  const getFilteredLogs = () => {
    return logs.filter(log => {
      if (!log.date) return false;
      const parts = log.date.split('-');
      const logMonthKey = `${parts[0]}-${parts[1]}`;
      const matchMonth = logMonthKey === selectedMonth;
      
      if (!matchMonth) return false;
      if (selectedWeek === 'All') return true;
      
      const logWeek = getWeekOfMonth(log.date);
      return String(logWeek) === selectedWeek;
    });
  };

  const filteredLogs = getFilteredLogs();

  const columns = [
    { 
      title: 'Date', 
      dataIndex: 'date', 
      key: 'date', 
      render: (text) => {
        const dateObj = new Date(text);
        const dayName = dateObj.toLocaleString('default', { weekday: 'short' });
        return (
          <span style={{ fontWeight: 500 }}>
            <CalendarOutlined style={{ marginRight: 6, color: '#4f46e5' }} />
            {text} ({dayName})
          </span>
        );
      } 
    },
    {
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (s) => (
        <Tag color={s === 'Present' ? 'success' : s === 'Pending' ? 'warning' : 'error'} style={{ borderRadius: 6, padding: '2px 8px' }}>
          {s === 'Present' ? <CheckCircleOutlined style={{ marginRight: 4 }} /> : s === 'Pending' ? <ClockCircleOutlined style={{ marginRight: 4 }} /> : <CloseCircleOutlined style={{ marginRight: 4 }} />}
          {s}
        </Tag>
      ),
    },
    { 
      title: 'Class / Faculty',
      key: 'type',
      render: (_, record) => <div><div style={{ fontWeight: 600 }}>{record.className || record.type}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{record.classCode} · {record.teacherName}</div></div>
    },
  ];

  const weekOptions = [
    { label: 'All Weeks', value: 'All' },
    { label: 'Week 1 (1-7)', value: '1' },
    { label: 'Week 2 (8-14)', value: '2' },
    { label: 'Week 3 (15-21)', value: '3' },
    { label: 'Week 4 (22-28)', value: '4' },
    { label: 'Week 5 (29+)', value: '5' },
  ];

  return (
    <div>
      <PageHeader 
        title="Attendance Logs" 
        subtitle="Month-wise and week-wise academic attendance history" 
        breadcrumbs={[{ label: 'Attendance Logs' }]} 
      />

      <Card 
        style={{ 
          borderRadius: 12, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
          border: '1px solid #e2e8f0',
          marginBottom: 24 
        }}
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Select Month</span>
            <Select
              style={{ width: 220 }}
              size="large"
              placeholder="Select Month"
              value={selectedMonth}
              onChange={setSelectedMonth}
            >
              {months.map(m => (
                <Option key={m.value} value={m.value}>{m.label}</Option>
              ))}
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 280 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Select Week</span>
            <Segmented
              size="large"
              options={weekOptions}
              value={selectedWeek}
              onChange={setSelectedWeek}
              style={{ background: '#f1f5f9', padding: 3 }}
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <Empty 
            description="No attendance records found for the selected month and week." 
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredLogs}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            size="middle"
            rowKey="key"
            scroll={{ x: 760 }}
            style={{ marginTop: 12 }}
          />
        )}
      </Card>
    </div>
  );
}
