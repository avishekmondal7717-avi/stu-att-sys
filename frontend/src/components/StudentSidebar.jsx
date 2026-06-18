import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Camera, FileText, User, LogOut
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/student/dashboard' },
  { label: 'Webcam Attendance', icon: Camera, to: '/student/webcam' },
  { label: 'Attendance Logs', icon: FileText, to: '/student/logs' },
  { label: 'My Profile', icon: User, to: '/student/profile' },
];

export default function StudentSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#3B5BDB" fillOpacity="0.2"/>
            <path d="M20 8C15.6 8 12 11.6 12 16C12 20.4 15.6 24 20 24C24.4 24 28 20.4 28 16C28 11.6 24.4 8 20 8Z" fill="#7BA7FF"/>
            <path d="M8 32C8 27.6 13.4 24 20 24C26.6 24 32 27.6 32 32" stroke="#7BA7FF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <span className="logo-text">Smart Attendance</span>
          <span className="logo-sub">Student Portal</span>
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
        navigate('/login');
      }}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <div className="sidebar-illustration">
        <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
          {/* Desk */}
          <rect x="10" y="95" width="180" height="6" rx="3" fill="#2d3f6e"/>
          {/* Laptop body */}
          <rect x="55" y="55" width="90" height="55" rx="4" fill="#1e3a6e"/>
          <rect x="60" y="60" width="80" height="45" rx="2" fill="#3B5BDB" fillOpacity="0.4"/>
          <circle cx="100" cy="82" r="4" fill="#7BA7FF" fillOpacity="0.7"/>
          {/* Laptop base */}
          <rect x="45" y="110" width="110" height="5" rx="2" fill="#2d3f6e"/>
          {/* Person */}
          <circle cx="145" cy="45" r="18" fill="#4a6fa5"/>
          <circle cx="145" cy="40" r="10" fill="#f5c5a3"/>
          {/* Shirt */}
          <path d="M130 70 Q145 60 160 70 L163 95 H127 Z" fill="#3B5BDB"/>
          {/* Plant */}
          <rect x="165" y="75" width="8" height="20" rx="2" fill="#4a3728"/>
          <ellipse cx="169" cy="68" rx="10" ry="12" fill="#2d7a4f"/>
          <ellipse cx="160" cy="72" rx="8" ry="10" fill="#38a169"/>
          <ellipse cx="178" cy="72" rx="8" ry="10" fill="#38a169"/>
        </svg>
      </div>
    </aside>
  );
}
