import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, BarChart3, LogOut
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Manage Students', icon: Users, to: '/admin/students' },
  { label: 'Manage Teachers', icon: UserCheck, to: '/admin/teachers' },
  { label: 'Full Analytics', icon: BarChart3, to: '/admin/analytics' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar admin-theme">
      <div className="sidebar-logo admin-border">
        <div className="logo-icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#F59E0B" fillOpacity="0.2"/>
            <path d="M20 8C15.6 8 12 11.6 12 16C12 20.4 15.6 24 20 24C24.4 24 28 20.4 28 16C28 11.6 24.4 8 20 8Z" fill="#F59E0B"/>
            <path d="M8 32C8 27.6 13.4 24 20 24C26.6 24 32 27.6 32 32" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <span className="logo-text">Smart Attendance</span>
          <span className="logo-sub admin-sub-text">Admin Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="nav-item logout-btn" onClick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userFullName");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("role");
        navigate('/login');
      }}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <div className="sidebar-illustration">
        <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
          {/* Shield logo instead of table plant */}
          <rect x="10" y="95" width="180" height="6" rx="3" fill="#583d06"/>
          <rect x="55" y="55" width="90" height="55" rx="4" fill="#382603"/>
          <rect x="60" y="60" width="80" height="45" rx="2" fill="#F59E0B" fillOpacity="0.3"/>
          <circle cx="100" cy="82" r="4" fill="#F59E0B" fillOpacity="0.7"/>
          
          <path d="M145 35L133 40v12c0 8 5 16 12 18 7-2 12-10 12-18V40l-12-5z" fill="#F59E0B" fillOpacity="0.8"/>
        </svg>
      </div>
    </aside>
  );
}
