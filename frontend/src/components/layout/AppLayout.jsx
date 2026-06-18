import { useState } from 'react';
import { Layout, Menu, Avatar, Badge, Dropdown, Button } from 'antd';
import {
  DashboardOutlined, TeamOutlined, CalendarOutlined, BarChartOutlined,
  VideoCameraOutlined, SettingOutlined, LogoutOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, UserAddOutlined, UnorderedListOutlined,
  TableOutlined, UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    {
      key: '/students', icon: <TeamOutlined />, label: 'Students',
      children: [
        { key: '/students/list', icon: <UnorderedListOutlined />, label: 'Student List' },
        { key: '/students/add', icon: <UserAddOutlined />, label: 'Add Student' },
      ],
    },
    {
      key: '/attendance', icon: <CalendarOutlined />, label: 'Attendance',
      children: [
        { key: '/attendance/mark', icon: <UserOutlined />, label: 'Mark Attendance' },
        { key: '/attendance/table', icon: <TableOutlined />, label: 'Attendance Table' },
      ],
    },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/webcam', icon: <VideoCameraOutlined />, label: 'Webcam' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: '/logout', icon: <LogoutOutlined />, label: 'Logout' },
  ];

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/') return ['/dashboard'];
    return [path];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/students')) return ['/students'];
    if (path.startsWith('/attendance')) return ['/attendance'];
    return [];
  };

  const userMenu = {
    items: [
      { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
      { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{ background: '#1e2a4a', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, overflow: 'auto' }}
      >
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 16px' : '20px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <VideoCameraOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>Smart Attendance</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>System</div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          style={{ background: '#1e2a4a', border: 'none', marginTop: 4 }}
          onClick={({ key }) => { if (key !== '/logout') navigate(key); }}
          items={menuItems}
        />

        {/* Bottom illustration */}
        {!collapsed && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>👨‍💻</div>
              <div style={{ fontWeight: 600, color: '#fff' }}>Welcome, Admin</div>
              <div style={{ fontSize: 11 }}>Have a nice day!</div>
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        {/* Header */}
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 99, height: 64 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar src="https://i.pravatar.cc/32?img=1" size={32} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Admin</span>
                <span style={{ fontSize: 10, color: '#999' }}>▼</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 64px)', padding: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
