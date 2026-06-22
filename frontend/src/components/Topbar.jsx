import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import './Topbar.css';

export default function Topbar({ onToggleSidebar, theme, setTheme, activeSessions = [], onNotificationRead }) {
  const navigate = useNavigate();
  const userFullName = localStorage.getItem("userFullName") || "User";
  const userRole = localStorage.getItem("userRole") || "Role";
  const initial = userFullName.charAt(0).toUpperCase();

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const userPhoto = currentUser ? currentUser.photo : null;

  const activeCount = activeSessions.length;
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  useEffect(() => {
    if (!notifDropdownOpen) return;
    const handleClose = () => setNotifDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [notifDropdownOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setNotifDropdownOpen(prev => !prev);
  };

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onToggleSidebar}>
        <Menu size={22} />
      </button>

      <div className="topbar-right">
        <button className="topbar-theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Light/Dark Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button className="notif-btn" onClick={toggleDropdown} title="Notifications">
            <Bell size={20} />
            {activeCount > 0 && <span className="notif-badge">{activeCount}</span>}
          </button>
          
          {notifDropdownOpen && (
            <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="notif-dropdown-header">
                <h3>Notifications</h3>
                {activeCount > 0 && <span className="notif-count-badge">{activeCount} active</span>}
              </div>
              <div className="notif-dropdown-body">
                {activeSessions.length === 0 ? (
                  <div className="notif-empty-state">
                    <p>No active attendance sessions.</p>
                  </div>
                ) : (
                  activeSessions.map((session) => (
                    <div 
                      key={session.classCode} 
                      className="notif-item"
                      onClick={() => {
                        onNotificationRead?.(session.classCode);
                        navigate(`/student/webcam?class=${session.classCode}`);
                        setNotifDropdownOpen(false);
                      }}
                    >
                      <div className="notif-item-icon">⏰</div>
                      <div className="notif-item-content">
                        <div className="notif-item-title">{session.className}</div>
                        <div className="notif-item-desc">Attendance session is now live. Click to scan.</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
