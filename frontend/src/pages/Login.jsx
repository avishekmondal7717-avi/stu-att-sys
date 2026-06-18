import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
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

        message.success("Login successful!");

        if (res.user.role === "student") {
          navigate("/student/dashboard");
        } else if (res.user.role === "teacher") {
          navigate("/dashboard");
        } else if (res.user.role === "admin") {
          navigate("/admin/dashboard");
        }
      } catch (err) {
        console.error(err);
        setEmailError(err.message || "An error occurred during authentication.");
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="right-panel">
        <div className="login-card">
          <div className="card-logo">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <h2>Smart Attendance</h2>
          <p className="subtitle">
            Sign in to access your portal
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
            <a href="/forgot-password" className="forgot">Forgot Password?</a>
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