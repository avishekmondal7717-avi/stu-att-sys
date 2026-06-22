import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, notification } from "../components/AntdGlobalHelper";
import { authAPI } from "../services/api";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("student");
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

    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedRole = localStorage.getItem("rememberedRole");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";
    if (savedRememberMe) {
      setRememberMe(true);
      if (savedEmail) setEmail(savedEmail);
      if (savedRole) setRole(savedRole);
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

  const handleSignIn = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (!eErr && !pErr) {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedRole", role);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedRole");
        localStorage.setItem("rememberMe", "false");
      }

      try {
        const res = await authAPI.login({ email, password, role });
        
        localStorage.setItem("token", res.access_token);
        localStorage.setItem("userRole", res.user.role);
        localStorage.setItem("userEmail", res.user.email);
        localStorage.setItem("userFullName", res.user.fullName);
        localStorage.setItem("currentUser", JSON.stringify(res.user));

        notification.success({
          message: "Welcome Back!",
          description: `Successfully signed in as ${res.user.fullName || 'User'}. Redirecting to your dashboard...`,
          placement: "topRight",
          duration: 3
        });

        setTimeout(() => {
          if (res.user.role === "student") {
            navigate("/student/dashboard");
          } else if (res.user.role === "teacher") {
            navigate("/dashboard");
          } else if (res.user.role === "admin") {
            navigate("/admin/dashboard");
          }
        }, 1000);
      } catch (err) {
        console.error(err);
        const errMsg = err.message || "An error occurred during authentication.";
        setEmailError(errMsg);

        // Show premium toast notification with proper error logic
        if (errMsg.includes("Invalid email or password")) {
          notification.warning({
            message: "Authentication Failed",
            description: "Incorrect password or email address. Please double-check your credentials and try again.",
            placement: "topRight",
            duration: 4.5
          });
        } else if (errMsg.includes("suspended")) {
          notification.error({
            message: "Account Suspended",
            description: "Your portal access has been suspended. Please contact the administrator for support.",
            placement: "topRight",
            duration: 5
          });
        } else if (errMsg.includes("role")) {
          notification.error({
            message: "Role Unauthorized",
            description: `You are not authorized to log in as a ${role === 'student' ? 'Student' : 'Teacher'}.`,
            placement: "topRight",
            duration: 5
          });
        } else {
          notification.error({
            message: "Login Error",
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
    <div className="login-split-container">
      {/* Left Panel */}
      <div className="login-left-panel">
        <div className="left-panel-content">
          <div className="brand-header">
            <div className="brand-logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <circle cx="12" cy="11" r="3" />
                <path d="M16 18c-1.5-2-4-2-8 0" />
              </svg>
            </div>
            <h1>Smart <span>Attendance</span> System</h1>
          </div>
          <p className="brand-subtitle">
            A Face Recognition based Attendance Management System
          </p>
          
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <path d="M9 14v7" />
                  <path d="M6 17.5h6" />
                </svg>
              </div>
              <div className="feature-text">
                <h3>Face Recognition</h3>
                <p>Secure and accurate face recognition technology</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="feature-text">
                <h3>Real-time Tracking</h3>
                <p>Monitor attendance in real-time with instant updates</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="feature-text">
                <h3>Detailed Reports</h3>
                <p>Generate comprehensive attendance reports and analytics</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="left-panel-footer">
          <p>&copy; 2026 Smart Attendance System. All rights reserved.</p>
        </div>
        
        {/* Decorative background shapes */}
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
      </div>

      {/* Right Panel */}
      <div className="login-right-panel">
        <button 
          onClick={toggleTheme} 
          className="login-theme-toggle-btn"
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

        <div className="login-card">
          <div className="card-logo-wrap">
            <div className="card-logo">
              {role === 'student' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle">
            Sign in as {role === 'student' ? 'Student' : 'Teacher'}
          </p>

          <div className="role-selector">
            <div className={`role-slider ${role === 'teacher' ? 'slide-right' : 'slide-left'}`}></div>
            <button
              className={`role-tab ${role === 'student' ? 'active' : ''}`}
              onClick={() => { setRole('student'); setEmailError(''); setPasswordError(''); }}
              type="button"
            >
              Student
            </button>
            <button
              className={`role-tab ${role === 'teacher' ? 'active' : ''}`}
              onClick={() => { setRole('teacher'); setEmailError(''); setPasswordError(''); }}
              type="button"
            >
              Teacher
            </button>
          </div>

          <div className="field">
            <label>Email Address</label>
            <div className={`input-wrap ${emailError ? 'input-error' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--auth-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
              />
            </div>
            {emailError && <p className="error-msg">{emailError}</p>}
          </div>

          <div className="field">
            <label>Password</label>
            <div className={`input-wrap ${passwordError ? 'input-error' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--auth-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              <button
                className="eye-btn"
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
            {passwordError && <p className="error-msg">{passwordError}</p>}
          </div>

          <div className="options-row">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span>Remember me</span>
            </label>
            <button type="button" onClick={() => navigate('/forgot-password')} style={{ border: 0, background: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>
              Forgot password?
            </button>
          </div>

          <button className="btn-signin" onClick={handleSignIn}>Sign In</button>

          {/* ── Register Link ── */}
          <p className="register-link" key={`reg-${role}`}>
            Don't have an account?{" "}
            <a href={role === "teacher" ? "/teacher/register" : "/register"}>Register</a>
          </p>

          <div className="divider"><span>or</span></div>

          {/* ── Admin Button ── */}
          <button className="btn-admin" onClick={() => navigate("/admin-login")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Sign in as Administrator
          </button>
        </div>
      </div>
    </div>
  );
}
