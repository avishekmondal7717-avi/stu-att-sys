import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

const PageHeader = ({ title, subtitle, breadcrumbs = [] }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{subtitle}</p>}
      </div>
      <Breadcrumb items={[
        { title: <Link to="/dashboard">Home</Link> },
        ...breadcrumbs.map((b, i) => ({
          title: i < breadcrumbs.length - 1 ? <Link to={b.path}>{b.label}</Link> : b.label,
        })),
      ]} />
    </div>
  </div>
);

export default PageHeader;
