import { Menu, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import './Topbar.css';

export default function Topbar({ onToggleSidebar, theme, setTheme }) {
  const userFullName = localStorage.getItem("userFullName") || "User";
  const userRole = localStorage.getItem("userRole") || "Role";
  const initial = userFullName.charAt(0).toUpperCase();

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const userPhoto = currentUser ? currentUser.photo : null;

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onToggleSidebar}>
        <Menu size={22} />
      </button>

      <div className="topbar-right">
        <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Light/Dark Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

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
              fontWeight: 700, fontSize: 15,
              overflow: 'hidden'
            }}
          >
            {userPhoto ? (
              <img src={userPhoto} alt={userFullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initial
            )}
          </div>
          <span className="admin-name">
            {userFullName} ({userRole})
          </span>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}