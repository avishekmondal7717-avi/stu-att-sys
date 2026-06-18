import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
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
        
        message.success("Login successful!");
        navigate("/admin/dashboard");
      } catch (err) {
        console.error(err);
        setPasswordError(err.message || "Failed to sign in. Please check your credentials.");
      }
    }
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-right">
        <div className="admin-card">
          <div className="admin-login-avatar">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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