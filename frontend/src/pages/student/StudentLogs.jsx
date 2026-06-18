import { Table, Tag, Card } from 'antd';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';

export default function StudentLogs() {
  const { logs } = useOutletContext();

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (text) => <span style={{ fontWeight: 500 }}>{text}</span> },
    { title: 'Time In', dataIndex: 'timeIn', key: 'timeIn' },
    { title: 'Time Out', dataIndex: 'timeOut', key: 'timeOut' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={s === 'Present' ? 'success' : 'error'}>{s}</Tag>,
    },
    { title: 'Method', dataIndex: 'type', key: 'type', render: (text) => <Tag color="blue" style={{ fontSize: 12 }}>{text}</Tag> },
  ];

  return (
    <div>
      <PageHeader title="Attendance Logs" subtitle="Historical log of your classroom attendance" breadcrumbs={[{ label: 'Attendance Logs' }]} />

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={logs}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
