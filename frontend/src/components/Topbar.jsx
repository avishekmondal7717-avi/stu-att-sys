import { Menu, Bell, ChevronDown } from 'lucide-react';
import './Topbar.css';

export default function Topbar({ onToggleSidebar }) {
  const userFullName = localStorage.getItem("userFullName") || "User";
  const userRole = localStorage.getItem("userRole") || "Role";
  const initial = userFullName.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onToggleSidebar}>
        <Menu size={22} />
      </button>

      <div className="topbar-right">
        <button className="notif-btn">
          <Bell size={20} />
          <span className="notif-badge">3</span>
        </button>

        <div className="admin-profile">
          <div
            className="admin-avatar"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: '#1e40af', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 15
            }}
          >
            {initial}
          </div>
          <span className="admin-name">
            {userFullName} ({userRole})
          </span>
          <ChevronDown size={16} color="#555" />
        </div>
      </div>
    </header>
  );
}