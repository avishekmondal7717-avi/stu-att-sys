import { Card } from 'antd';

const StatCard = ({ icon, label, value, sub, iconBg = '#eff6ff', iconColor = '#3b82f6' }) => (
  <Card bodyStyle={{ padding: '20px 24px' }} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 22, color: iconColor }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: iconColor, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  </Card>
);

export default StatCard;
