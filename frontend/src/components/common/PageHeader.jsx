import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import './PageHeader.css';

const PageHeader = ({ title, subtitle, breadcrumbs = [] }) => (
  <div className="page-header">
    <div className="page-header-row">
      <div className="page-header-copy">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>{subtitle}</p>}
      </div>
      <Breadcrumb className="page-breadcrumb" items={[
        { title: <Link to="/dashboard">Home</Link> },
        ...breadcrumbs.map((b, i) => ({
          title: i < breadcrumbs.length - 1
            ? <Link to={b.path}>{b.label}</Link>
            : <span className="page-breadcrumb-current">{b.label}</span>,
        })),
      ]} />
    </div>
  </div>
);

export default PageHeader;
