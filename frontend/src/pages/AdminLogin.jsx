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
    const localPart = value.split("@")[0];
    const validDomains = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@email.com"];
    const hasValidDomain = validDomains.some((d) => value.endsWith(d));
    if (!value) return "Email is required.";
    if (localPart.length < 3) return "Email must have at least 3 characters before @.";
    if (!hasValidDomain) return "Email must end with @gmail.com, @yahoo.com, @outlook.com, @hotmail.com, or @email.com.";
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
    <div className="admin-wrapper">
      <button 
        onClick={toggleTheme} 
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: theme === 'dark' ? '#fbbf24' : '#9ca3af',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.transform = 'scale(1)';
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
      <div className="admin-right">
        <div className="admin-card">
          <div className="admin-login-avatar">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="brand-gradient-admin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="url(#brand-gradient-admin)" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="url(#brand-gradient-admin)" />
            </svg>
          </div>

          <h2>Admin Portal</h2>
          <p className="admin-subtitle">Sign in with your admin credentials</p>

          <div className="admin-field">
            <label>Admin Email</label>
            <div className={`admin-input-wrap ${emailError ? "admin-input-error" : ""}`}>
              <input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              />
            </div>
            {emailError && <p className="admin-error-msg">{emailError}</p>}
          </div>

          <div className="admin-field">
            <label>Admin Password</label>
            <div className={`admin-input-wrap ${passwordError ? "admin-input-error" : ""}`}>
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