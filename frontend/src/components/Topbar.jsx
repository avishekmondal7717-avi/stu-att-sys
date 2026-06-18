import { Menu, Bell, ChevronDown } from 'lucide-react';
import './Topbar.css';

export default function Topbar({ onToggleSidebar }) {
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
          <img
            src="https://i.pravatar.cc/36?img=12"
            alt="Admin"
            className="admin-avatar"
          />
          <span className="admin-name">Admin</span>
          <ChevronDown size={16} color="#555" />
        </div>
      </div>
    </header>
  );
}