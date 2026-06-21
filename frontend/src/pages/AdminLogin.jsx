import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, notification } from "antd";
import "./AdminLogin.css";
import { authAPI } from "../services/api";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    if (token && userRole) {
      if (userRole === "student") navigate("/student/dashboard");
      else if (userRole === "teacher") navigate("/dashboard");
      else if (userRole === "admin") navigate("/admin/dashboard");
      return;
    }

    const savedEmail = localStorage.getItem("rememberedAdminEmail");
    const savedRememberMe = localStorage.getItem("rememberAdminMe") === "true";
    if (savedRememberMe) {
      setRememberMe(true);
      if (savedEmail) setEmail(savedEmail);
    }
  }, [navigate]);

  const validateEmail = (value) => {
    if (!value) return "Email is required.";
    if (!value.includes("@")) return "Please enter a valid email address.";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required.";
    return "";
  };

  const handleAdminSignIn = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (!eErr && !pErr) {
      try {
        const res = await authAPI.login({ email, password, role: "admin" });
        
        localStorage.setItem("token", res.access_token);
        localStorage.setItem("userRole", res.user.role);
        localStorage.setItem("userEmail", res.user.email);
        localStorage.setItem("userFullName", res.user.fullName);

        if (rememberMe) {
          localStorage.setItem("rememberedAdminEmail", email);
          localStorage.setItem("rememberAdminMe", "true");
        } else {
          localStorage.removeItem("rememberedAdminEmail");
          localStorage.setItem("rememberAdminMe", "false");
        }
        
        notification.success({
          message: "Welcome, Administrator!",
          description: `Successfully authenticated as ${res.user.fullName || 'Admin'}. Accessing control center...`,
          placement: "topRight",
          duration: 3
        });
        navigate("/admin/dashboard");
      } catch (err) {
        console.error(err);
        const errMsg = err.message || "Failed to sign in. Please check your credentials.";
        setPasswordError(errMsg);

        // Show premium toast notification with proper error logic
        if (errMsg.includes("Invalid email or password")) {
          notification.warning({
            message: "Authentication Failed",
            description: "Incorrect password or administrator email. Please double-check your credentials and try again.",
            placement: "topRight",
            duration: 4.5
          });
        } else if (errMsg.includes("role") || errMsg.includes("Unauthorized")) {
          notification.error({
            message: "Unauthorized Access",
            description: "This portal is restricted to system administrators. Your account does not have access privileges.",
            placement: "topRight",
            duration: 5
          });
        } else {
          notification.error({
            message: "Sign In Error",
            description: errMsg,
            placement: "topRight",
            duration: 4.5
          });
        }
      }
    } else {
      notification.warning({
        message: "Validation Error",
        description: "Please check the form for errors or blank fields before continuing.",
        placement: "topRight",
        duration: 4
      });
    }
  };

  return (
    <div className="admin-split-container">
      {/* Left Panel */}
      <div className="admin-left-panel">
        <div className="admin-left-content">
          <div className="admin-brand-header">
            <div className="admin-logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <circle cx="12" cy="11" r="3" />
                <path d="M16 18c-1.5-2-4-2-8 0" />
              </svg>
            </div>
            <h1>Smart <span>Attendance</span> System</h1>
          </div>
          <p className="admin-brand-subtitle">
            A Face Recognition based Attendance Management System
          </p>
          
          <div className="admin-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            ADMIN PORTAL
          </div>
          
          <div className="admin-features-list">
            <div className="admin-feature-item">
              <div className="admin-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="admin-feature-text">
                <h3>Manage Students & Teachers</h3>
                <p>Add, edit and remove student and teacher records with ease</p>
              </div>
            </div>
            
            <div className="admin-feature-item">
              <div className="admin-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="admin-feature-text">
                <h3>Full Analytics</h3>
                <p>Access complete attendance reports and insights</p>
              </div>
            </div>
            
            <div className="admin-feature-item">
              <div className="admin-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div className="admin-feature-text">
                <h3>System Settings</h3>
                <p>Configure system preferences and permissions</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="admin-left-footer">
          <p>&copy; 2026 Smart Attendance System. All rights reserved.</p>
        </div>
        
        <div className="admin-bg-shape admin-shape-1"></div>
        <div className="admin-bg-shape admin-shape-2"></div>
      </div>

      {/* Right Panel */}
      <div className="admin-right-panel">
        <button 
          onClick={toggleTheme} 
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 100,
            background: 'var(--auth-input-bg)',
            border: '1px solid var(--auth-input-border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div className="admin-card">
          <div className="admin-logo-wrap">
            <div className="admin-card-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>

          <h2>Admin Portal</h2>
          <p className="admin-subtitle">Sign in with your admin credentials</p>

          <div className="admin-field">
            <label>Admin Email</label>
            <div className={`admin-input-wrap ${emailError ? "admin-input-error" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--auth-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdminSignIn(); }}
              />
            </div>
            {emailError && <p className="admin-error-msg">{emailError}</p>}
          </div>

          <div className="admin-field">
            <label>Admin Password</label>
            <div className={`admin-input-wrap ${passwordError ? "admin-input-error" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--auth-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdminSignIn(); }}
              />
              <button
                className="admin-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && <p className="admin-error-msg">{passwordError}</p>}
          </div>

          <div className="admin-options-row">
            <label className="admin-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button className="admin-btn-signin" onClick={handleAdminSignIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Sign In as Admin
          </button>

          <p className="admin-back-link">
            Not an admin?{" "}
            <a href="/login">Back to Student Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}