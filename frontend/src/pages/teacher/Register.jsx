import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { message, notification } from "../../components/AntdGlobalHelper";
import "../Register.css";
import { authAPI } from "../../services/api";

const TeacherRegister = () => {
  const navigate = useNavigate();
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
  const [formData, setFormData] = useState({
    fullName: "",
    teacherId: "",
    email: "",
    phone: "",
    department: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dobError, setDobError] = useState("");
  const [teacherIdError, setTeacherIdError] = useState("");

  const getDOBBoundaries = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const minDateStr = `${yyyy - 80}-${mm}-${dd}`;
    const maxDateStr = `${yyyy - 18}-${mm}-${dd}`;
    return { minDateStr, maxDateStr };
  };
  const { minDateStr, maxDateStr } = getDOBBoundaries();

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
    return "";
  };

  const validatePhone = (value) => {
    if (!value) return "Phone number is required.";
    if (!/^\d{10}$/.test(value)) {
      return "Phone number must be exactly 10 digits.";
    }
    return "";
  };

  const validateDOB = (value) => {
    if (!value) return "Date of Birth is required.";
    const dob = new Date(value);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      return "You must be at least 18 years old to register.";
    }
    if (age > 80) {
      return "Age cannot exceed 80 years.";
    }
    return "";
  };

  const validateTeacherId = (value) => {
    if (!value) return "Teacher ID is required.";
    if (!value.startsWith("TCH")) {
      return "Teacher ID must start with 'TCH'.";
    }
    return "";
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "email") setEmailError("");
    if (e.target.name === "password") setPasswordError("");
    if (e.target.name === "phone") setPhoneError("");
    if (e.target.name === "confirmPassword" || e.target.name === "password") setConfirmPasswordError("");
    if (e.target.name === "dateOfBirth") setDobError("");
    if (e.target.name === "teacherId") setTeacherIdError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);
    const phoneErr = validatePhone(formData.phone);
    const dobErr = validateDOB(formData.dateOfBirth);
    const teacherIdErr = validateTeacherId(formData.teacherId);
    let confirmPasswordErr = "";
    if (formData.password !== formData.confirmPassword) {
      confirmPasswordErr = "Passwords do not match!";
    }


    if (emailErr || passwordErr || phoneErr || confirmPasswordErr || dobErr || teacherIdErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      setPhoneError(phoneErr);
      setConfirmPasswordError(confirmPasswordErr);
      setDobError(dobErr);
      setTeacherIdError(teacherIdErr);
      setSuccessMessage("");
      return;
    }

    try {
      const payload = {
        teacherId: formData.teacherId,
        fullName: formData.fullName,
        email: formData.email,
        contact: formData.phone,
        department: formData.department,
        gender: formData.gender,
        dob: formData.dateOfBirth,
        status: "Active"
      };

      await authAPI.registerTeacher({
        ...payload,
        password: formData.password
      });

      notification.success({
        message: "Registration Successful",
        description: "Your teacher profile and account have been successfully created! Redirecting to login...",
        placement: "topRight",
        duration: 4
      });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      console.error(err);
      const errMsg = err.message || "Teacher registration failed. Please try again.";
      setEmailError(errMsg);

      // Categorize teacher registration errors for beautiful toasts
      if (errMsg.includes("already exists") || errMsg.includes("already registered") || errMsg.includes("duplicated")) {
        notification.warning({
          message: "Registration Failed",
          description: "A teacher account with this Teacher ID or Email already exists. Please verify and log in.",
          placement: "topRight",
          duration: 5
        });
      } else {
        notification.error({
          message: "Registration Error",
          description: errMsg,
          placement: "topRight",
          duration: 4.5
        });
      }
    }
  };

  return (
    <div className="register-container">
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

      {/* Left Panel */}
      <div className="register-left">
        <div className="register-brand">
          <div className="register-brand-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <defs>
                <linearGradient id="brand-gradient-reg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="25%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="8" fill="rgba(255,255,255,0.05)" />
              <path
                d="M20 8C15.58 8 12 11.58 12 16C12 19.07 13.7 21.74 16.2 23.16C11.58 24.56 8 28.76 8 34H12C12 29.58 15.58 26 20 26C24.42 26 28 29.58 28 34H32C32 28.76 28.42 24.56 23.8 23.16C26.3 21.74 28 19.07 28 16C28 11.58 24.42 8 20 8Z"
                fill="url(#brand-gradient-reg)"
              />
            </svg>
          </div>

          <div>
            <h1 className="register-brand-title">
              Smart <span className="register-brand-accent">Attendance</span> System
            </h1>
            <p className="register-brand-sub">
              A Face Recognition based Attendance System
            </p>
          </div>
        </div>

        {/* FEATURES */}
        <div className="register-features">
          <div className="register-feature-item">
            <div className="register-feature-icon">👤</div>
            <div>
              <h3>Face Recognition</h3>
              <p>Secure and accurate face recognition technology</p>
            </div>
          </div>

          <div className="register-feature-item">
            <div className="register-feature-icon">📡</div>
            <div>
              <h3>Real-time Tracking</h3>
              <p>Monitor attendance in real-time with instant updates</p>
            </div>
          </div>

          <div className="register-feature-item">
            <div className="register-feature-icon">📊</div>
            <div>
              <h3>Detailed Reports</h3>
              <p>Generate comprehensive attendance reports and analytics</p>
            </div>
          </div>
        </div>

        {/* BOTTOM FEATURE */}
        <div className="register-ai-box">
          <div className="register-feature-item">
            <div className="register-feature-icon">🧠</div>
            <div>
              <h3>AI Vector Embeddings</h3>
              <p>Your face is converted into secure mathematical vectors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="register-right">
        <div className="register-form-card" style={{ maxWidth: '600px', width: '100%' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--auth-text)', margin: '0 0 8px 0' }}>Teacher Registration</h2>
            <p style={{ color: 'var(--auth-text-secondary)', margin: 0 }}>Please fill in your details to create an account</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Row 1 */}
            <div className="register-row">
              <div className="register-field">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Enter full name" 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="register-field">
                <label>Teacher ID</label>
                <input 
                  type="text" 
                  name="teacherId" 
                  placeholder="e.g. TCH2026001" 
                  value={formData.teacherId} 
                  onChange={handleChange} 
                  required 
                  className={teacherIdError ? "input-error" : ""} 
                />
                {teacherIdError && <p className="error-msg">{teacherIdError}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="register-row">
              <div className="register-field">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className={emailError ? "input-error" : ""} 
                />
                {emailError && <p className="error-msg">{emailError}</p>}
              </div>
              <div className="register-field">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Enter phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                  className={phoneError ? "input-error" : ""} 
                />
                {phoneError && <p className="error-msg">{phoneError}</p>}
              </div>
            </div>

            {/* Row 3 */}
            <div className="register-row">
              <div className="register-field">
                <label>Department</label>
                <select name="department" value={formData.department} onChange={handleChange} required>
                  <option value="">Select Department</option>
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                  <option>Electronics & Communication</option>
                  <option>Mechanical Engineering</option>
                  <option>Civil Engineering</option>
                  <option>Electrical Engineering</option>
                </select>
              </div>
              <div className="register-field">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Row 4 */}
            <div className="register-row">
              <div className="register-field">
                <label>Date of Birth</label>
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  min={minDateStr} 
                  max={maxDateStr} 
                  value={formData.dateOfBirth} 
                  onChange={handleChange} 
                  required 
                  className={dobError ? "input-error" : ""} 
                />
                {dobError && <p className="error-msg">{dobError}</p>}
              </div>
            </div>

            {/* Row 5 */}
            <div className="register-field" style={{ width: '100%', marginBottom: '15px' }}>
              <label>Home Address</label>
              <input 
                type="text" 
                name="address" 
                placeholder="Enter home address" 
                value={formData.address} 
                onChange={handleChange} 
              />
            </div>

            {/* Row 6 - Passwords */}
            <div className="register-row">
              <div className="register-field">
                <label>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Create password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className={passwordError ? "input-error" : ""} 
                />
                {passwordError && <p className="error-msg">{passwordError}</p>}
              </div>
              <div className="register-field">
                <label>Confirm</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  placeholder="Confirm password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  className={confirmPasswordError ? "input-error" : ""} 
                />
                {confirmPasswordError && <p className="error-msg">{confirmPasswordError}</p>}
              </div>
            </div>

            <Button type="primary" htmlType="submit" size="large" style={{ width: '100%', marginTop: 20 }}>
              Register Now
            </Button>

            <p className="register-login-link" style={{ textAlign: "center", marginTop: 15 }}>
              Already have an account? <a href="/login">Sign In</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegister;
