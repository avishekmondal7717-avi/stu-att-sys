import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import { authAPI } from "../services/api";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedAdminEmail");
    const savedRememberMe = localStorage.getItem("rememberAdminMe") === "true";
    if (savedRememberMe) {
      setRememberMe(true);
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const validateEmail = (value) => {
    const localPart = value.split("@")[0];
    const validDomains = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"];
    const hasValidDomain = validDomains.some((d) => value.endsWith(d));
    if (!value) return "Email is required.";
    if (localPart.length < 6) return "Email must have at least 6 characters before @.";
    if (!hasValidDomain) return "Email must end with @gmail.com, @yahoo.com, @outlook.com or @hotmail.com.";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required.";
    if (value.length < 6) return "Password must be at least 6 characters.";
    // eslint-disable-next-line no-useless-escape
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
      return "Password must contain at least one special character (e.g. @, #, !).";
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
        navigate("/admin/dashboard");
      } catch (err) {
        console.error(err);
        setPasswordError(err.message || "Failed to sign in. Please check your credentials.");
      }
    }
  };

  return (
    <div className="admin-wrapper">
      {/* Left Panel */}
      <div className="admin-left">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <path
                d="M26 2L6 12V26C6 37.05 14.68 47.37 26 50C37.32 47.37 46 37.05 46 26V12L26 2Z"
                stroke="#f59e0b"
                strokeWidth="2.5"
                fill="rgba(245,158,11,0.15)"
              />
              <circle cx="26" cy="21" r="6" fill="#f59e0b" />
              <path
                d="M14 38c0-6.627 5.373-10 12-10s12 3.373 12 10"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="admin-brand-text">
            <h1>
              Smart <span>Attendance</span> System
            </h1>
          </div>
        </div>

        <p className="admin-brand-desc">
          A Face Recognition based Attendance Management System
        </p>

        <div className="admin-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.52 3.47 10.69 8 12 4.53-1.31 8-6.48 8-12V6l-8-4z" stroke="#f59e0b" strokeWidth="2" fill="rgba(245,158,11,0.15)" />
          </svg>
          <span>Admin Portal</span>
        </div>

        <div className="admin-features">
          <div className="admin-feature-item">
            <div className="admin-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#f59e0b" strokeWidth="2" />
                <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3>Manage Students & Teachers</h3>
              <p>Add, edit and remove student and teacher records with ease</p>
            </div>
          </div>

          <div className="admin-feature-item">
            <div className="admin-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="12" width="4" height="9" rx="1" fill="#f59e0b" />
                <rect x="10" y="7" width="4" height="14" rx="1" fill="#f59e0b" />
                <rect x="17" y="3" width="4" height="18" rx="1" fill="#f59e0b" />
              </svg>
            </div>
            <div>
              <h3>Full Analytics</h3>
              <p>Access complete attendance reports and insights</p>
            </div>
          </div>

          <div className="admin-feature-item">
            <div className="admin-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="#f59e0b" strokeWidth="2" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#f59e0b" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h3>System Settings</h3>
              <p>Configure system preferences and permissions</p>
            </div>
          </div>
        </div>

        <p className="admin-copyright">© 2026 Smart Attendance System. All rights reserved.</p>
      </div>

      {/* Right Panel */}
      <div className="admin-right">
        <div className="admin-card">
          {/* Shield Icon */}
          <div className="admin-login-avatar">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.52 3.47 10.69 8 12 4.53-1.31 8-6.48 8-12V6l-8-4z" stroke="#b45309" strokeWidth="2" fill="rgba(245,158,11,0.15)" />
              <path d="M9 12l2 2 4-4" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2>Admin Portal</h2>
          <p className="admin-subtitle">Sign in with your admin credentials</p>

          {/* Email */}
          <div className="admin-field">
            <label>Admin Email</label>
            <div className={`admin-input-wrap ${emailError ? "admin-input-error" : ""}`}>
              <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="#9CA3AF" strokeWidth="2" />
                <path d="M2 8l10 7 10-7" stroke="#9CA3AF" strokeWidth="2" />
              </svg>
              <input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              />
            </div>
            {emailError && <p className="admin-error-msg">{emailError}</p>}
          </div>

          {/* Password */}
          <div className="admin-field">
            <label>Admin Password</label>
            <div className={`admin-input-wrap ${passwordError ? "admin-input-error" : ""}`}>
              <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="#9CA3AF" strokeWidth="2" />
                <path d="M8 11V7a4 4 0 018 0v4" stroke="#9CA3AF" strokeWidth="2" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              />
              <button
                className="admin-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18M10.5 10.677A3 3 0 0013.5 13.5M6.362 6.368C4.153 7.84 2.5 10 2.5 12c0 0 3.5 7 9.5 7 2.12 0 3.94-.74 5.44-1.74M9.5 5.18C10.29 5.07 11.1 5 12 5c6 0 9.5 7 9.5 7-.58 1.15-1.34 2.2-2.24 3.1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M2.5 12C2.5 12 6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" stroke="#9CA3AF" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2" />
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.52 3.47 10.69 8 12 4.53-1.31 8-6.48 8-12V6l-8-4z" stroke="white" strokeWidth="2" fill="none" />
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