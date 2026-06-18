import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentAPI } from "../services/api";
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
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedRole = localStorage.getItem("rememberedRole");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";
    if (savedRememberMe) {
      setRememberMe(true);
      if (savedEmail) setEmail(savedEmail);
      if (savedRole) setRole(savedRole);
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

      if (role === "student") {
        try {
          const res = await authAPI.login({ email, password, role: "student" });
          localStorage.setItem("token", res.access_token);
          localStorage.setItem("userRole", "student");
          localStorage.setItem("userEmail", email);
          localStorage.setItem("userFullName", res.user.fullName);
          
          // Fetch the student details to populate currentUser and check status
          const studentsRes = await studentAPI.getAll({ department: "" });
          const student = studentsRes.data.find(s => s.email === email);
          if (!student) {
            setEmailError("No student account found with this email. Please register first.");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userFullName");
            return;
          }
          
          if (student.status === "Pending Verification") {
            setEmailError("Your email is not verified. Please verify your email first.");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userFullName");
            return;
          }
          if (student.status === "Pending Approval") {
            setEmailError("Your account is pending admin approval.");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userFullName");
            return;
          }

          localStorage.setItem("currentUser", JSON.stringify(student));
          navigate("/student/dashboard");
        } catch (err) {
          console.error(err);
          setEmailError(err.message || "An error occurred during authentication.");
        }
      } else if (role === "teacher") {
        try {
          const res = await authAPI.login({ email, password, role: "teacher" });
          localStorage.setItem("token", res.access_token);
          localStorage.setItem("userRole", "teacher");
          localStorage.setItem("userEmail", email);
          localStorage.setItem("userFullName", res.user.fullName);
          
          // Fetch teacher details to check status
          const teachersRes = await teacherAPI.getAll();
          const teacher = teachersRes.data.find(t => t.email === email);
          if (!teacher) {
            setEmailError("No teacher account found with this email. Please register first.");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userFullName");
            return;
          }
          
          if (teacher.status === "Pending Verification") {
            setEmailError("Your email is not verified. Please verify your email first.");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userFullName");
            return;
          }
          if (teacher.status === "Pending Approval") {
            setEmailError("Your account is pending admin approval.");
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userFullName");
            return;
          }

          localStorage.setItem("currentUser", JSON.stringify(teacher));
          navigate("/dashboard");
        } catch (err) {
          console.error(err);
          setEmailError(err.message || "An error occurred during authentication.");
        }
      }
    }
  };

  return (
    <div className="login-wrapper">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="brand">
          <div className="brand-icon">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <path
                d="M26 2L6 12V26C6 37.05 14.68 47.37 26 50C37.32 47.37 46 37.05 46 26V12L26 2Z"
                stroke="#60A5FA"
                strokeWidth="2.5"
                fill="rgba(96,165,250,0.15)"
              />
              <circle cx="26" cy="21" r="6" fill="#60A5FA" />
              <path
                d="M14 38c0-6.627 5.373-10 12-10s12 3.373 12 10"
                stroke="#60A5FA"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="brand-text">
            <h1>
              Smart <span>Attendance</span> System
            </h1>
          </div>
        </div>

        <p className="brand-desc">
          A Face Recognition based Attendance Management System
        </p>

        <div className="features">
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#60A5FA" strokeWidth="2" />
                <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#60A5FA" strokeWidth="2" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#60A5FA" strokeWidth="2" />
                <circle cx="17" cy="17" r="3" stroke="#60A5FA" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h3>Face Recognition</h3>
              <p>Secure and accurate face recognition technology</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="12" width="4" height="9" rx="1" fill="#60A5FA" />
                <rect x="10" y="7" width="4" height="14" rx="1" fill="#60A5FA" />
                <rect x="17" y="3" width="4" height="18" rx="1" fill="#60A5FA" />
              </svg>
            </div>
            <div>
              <h3>Real-time Tracking</h3>
              <p>Monitor attendance in real-time with instant updates</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="#60A5FA" strokeWidth="2" />
                <path d="M8 8h8M8 12h8M8 16h5" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3>Detailed Reports</h3>
              <p>Generate comprehensive attendance reports and analytics</p>
            </div>
          </div>
        </div>

        <p className="copyright">© 2026 Smart Attendance System. All rights reserved.</p>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="login-card">
          <div className="avatar">
            <div className={`avatar-icon-container ${role === 'student' ? 'active' : ''}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <div className={`avatar-icon-container ${role === 'teacher' ? 'active' : ''}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="12" rx="2" />
                <path d="M9 21h6" />
                <path d="M12 15v6" />
                <circle cx="12" cy="9" r="2" />
                <path d="M8 14c0-1.5 1.5-2 4-2s4 .5 4 2" />
              </svg>
            </div>
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle" key={`sub-${role}`}>
            Sign in as {role === 'student' ? 'Student' : 'Teacher'}
          </p>

          <div className="role-selector">
            <div className={`role-slider ${role === 'teacher' ? 'slide-right' : 'slide-left'}`}></div>
            <button
              className={`role-tab ${role === 'student' ? 'active' : ''}`}
              onClick={() => { setRole('student'); setEmailError(''); setPasswordError(''); }}
              type="button"
            >
              Student Login
            </button>
            <button
              className={`role-tab ${role === 'teacher' ? 'active' : ''}`}
              onClick={() => { setRole('teacher'); setEmailError(''); setPasswordError(''); }}
              type="button"
            >
              Teacher Login
            </button>
          </div>

          <div className="field">
            <label>Email Address</label>
            <div className={`input-wrap ${emailError ? 'input-error' : ''}`}>
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="#9CA3AF" strokeWidth="2" />
                <path d="M2 8l10 7 10-7" stroke="#9CA3AF" strokeWidth="2" />
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
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="#9CA3AF" strokeWidth="2" />
                <path d="M8 11V7a4 4 0 018 0v4" stroke="#9CA3AF" strokeWidth="2" />
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

          {/* ── Admin Button → navigates to /admin-login ── */}
          <button className="btn-admin" onClick={() => navigate("/admin-login")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.52 3.47 10.69 8 12 4.53-1.31 8-6.48 8-12V6l-8-4z" stroke="#3B5BDB" strokeWidth="2" fill="none" />
            </svg>
            Login with Admin Account
          </button>
        </div>
      </div>
    </div>
  );
}