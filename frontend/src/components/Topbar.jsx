import { Menu, Bell, ChevronDown } from 'lucide-react';
import './Topbar.css';

export default function Topbar({ onToggleSidebar }) {
  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const userFullName = localStorage.getItem("userFullName") || "User";
  const userRole = localStorage.getItem("userRole") || "Role";

  const photoUrl = (currentUser && currentUser.photo)
    ? currentUser.photo
    : `https://i.pravatar.cc/36?img=${Math.abs(userFullName.charCodeAt(0)) % 70}`;

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
            src={photoUrl}
            alt="Profile"
            className="admin-avatar"
          />
          <span className="admin-name">
            {userFullName} ({userRole})
          </span>
          <ChevronDown size={16} color="#555" />
        </div>
      </div>
    </header>
  );
}