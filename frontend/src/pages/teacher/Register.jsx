import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import "../Register.css";
import { authAPI, teacherAPI } from "../../services/api";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dobError, setDobError] = useState("");
  const [teacherIdError, setTeacherIdError] = useState("");
  const [createdTeacherId, setCreatedTeacherId] = useState(null);
  const [createdTeacherPayload, setCreatedTeacherPayload] = useState(null);

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
    // eslint-disable-next-line no-useless-escape
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
      return "Password must contain at least one special character (e.g. @, #, !).";
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

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const simulateTeacherEmailVerification = async () => {
    try {
      const updatedPayload = { ...createdTeacherPayload, status: "Active" };
      await teacherAPI.update(createdTeacherId, updatedPayload);
      localStorage.removeItem(`pending_verification_${formData.email}`);
      setSuccessMessage("Teacher email verified successfully! You can now log in.");
    } catch (err) {
      console.error(err);
      setEmailError(err.message || "Simulation verification failed.");
    }
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

      message.success("Successfully registered... redirecting to login page");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      setEmailError(err.message || "Teacher registration failed. Teacher ID or email might already exist.");
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
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="brand-gradient-reg-tch" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="8" fill="rgba(255,255,255,0.05)" />
              <path d="M20 8C15.58 8 12 11.58 12 16C12 19.07 13.7 21.74 16.2 23.16C11.58 24.56 8 28.76 8 34H12C12 29.58 15.58 26 20 26C24.42 26 28 29.58 28 34H32C32 28.76 28.42 24.56 23.8 23.16C26.3 21.74 28 19.07 28 16C28 11.58 24.42 8 20 8ZM20 22C17.79 22 16 20.21 16 18C16 15.79 17.79 14 20 14C22.21 14 24 15.79 24 18C24 20.21 22.21 22 20 22Z" fill="url(#brand-gradient-reg-tch)" />
            </svg>
          </div>
          <div>
            <h1 className="register-brand-title">
              Smart <span className="register-brand-accent">Attendance</span> System
            </h1>
            <p className="register-brand-sub">A Face Recognition based Attendance Management System</p>
          </div>
        </div>

        <div className="register-features">
          <div className="register-feature-item">
            <div className="register-feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11.75A1.25 1.25 0 1 0 9 14.25 1.25 1.25 0 0 0 9 11.75ZM15 11.75A1.25 1.25 0 1 0 15 14.25 1.25 1.25 0 0 0 15 11.75ZM12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2ZM12 20a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8Z" /></svg>
            </div>
            <div>
              <h3>Face Recognition</h3>
              <p>Secure and accurate face recognition technology</p>
            </div>
          </div>
          <div className="register-feature-item">
            <div className="register-feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2ZM9 17H7v-7h2v7Zm4 0h-2V7h2v10Zm4 0h-2v-4h2v4Z" /></svg>
            </div>
            <div>
              <h3>Real-time Tracking</h3>
              <p>Monitor attendance in real-time with instant updates</p>
            </div>
          </div>
          <div className="register-feature-item">
            <div className="register-feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6ZM16 18H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z" /></svg>
            </div>
            <div>
              <h3>Detailed Reports</h3>
              <p>Generate comprehensive attendance reports and analytics</p>
            </div>
          </div>
        </div>

        <p className="register-copyright">© 2026 Smart Attendance System. All rights reserved.</p>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="register-right">
        <div className="register-form-card">
          <div className="register-form-header">
            <div className="register-avatar-upload" onClick={() => document.getElementById("photoInput").click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="register-avatar-preview" />
              ) : (
                <div className="register-avatar-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12Zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8Z" />
                  </svg>
                  <span>Upload Photo</span>
                </div>
              )}
              <div className="register-camera-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4ZM20 4h-3.17L15 2H9L7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
                </svg>
              </div>
            </div>
            <input id="photoInput" type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            <h2>Create Account</h2>
            <p>Register as a new teacher</p>
          </div>



          <form onSubmit={handleSubmit} className="register-form">
            {/* Row 1 */}
            <div className="register-row">
              <div className="register-field">
                <label>Full Name</label>
                <div className="register-input-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12Zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8Z" /></svg>
                  <input type="text" name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required />
                </div>
              </div>
              <div className="register-field">
                <label>Teacher ID</label>
                <div className={`register-input-wrap ${teacherIdError ? "input-error" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2ZM8 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 8H4v-1c0-2.7 5.3-4 8-4s8 1.3 8 4v1Zm0-6h-4V9h4v2Zm0-4h-4V5h4v2Z" /></svg>
                  <input type="text" name="teacherId" placeholder="e.g. TCH2026001" value={formData.teacherId} onChange={handleChange} required />
                </div>
                {teacherIdError && <p className="error-msg">{teacherIdError}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="register-row">
              <div className="register-field">
                <label>Email Address</label>
                <div className={`register-input-wrap ${emailError ? "input-error" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" /></svg>
                  <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                </div>
                {emailError && <p className="error-msg">{emailError}</p>}
              </div>
              <div className="register-field">
                <label>Phone Number</label>
                <div className={`register-input-wrap ${phoneError ? "input-error" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.01l-2.2 2.21Z" /></svg>
                  <input type="tel" name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} required />
                </div>
                {phoneError && <p className="error-msg">{phoneError}</p>}
              </div>
            </div>

            {/* Row 3 */}
            <div className="register-row">
              <div className="register-field">
                <label>Department</label>
                <div className="register-input-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3ZM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82Z" /></svg>
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
              </div>
              <div className="register-field">
                <label>Gender</label>
                <div className="register-input-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2Zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4Z" /></svg>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 4 */}
            <div className="register-row">
              <div className="register-field">
                <label>Date of Birth</label>
                <div className={`register-input-wrap ${dobError ? "input-error" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4C2.9 3 2 3.9 2 5v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 18H4V8h16v13Z" /></svg>
                  <input type="date" name="dateOfBirth" min={minDateStr} max={maxDateStr} value={formData.dateOfBirth} onChange={handleChange} required />
                </div>
                {dobError && <p className="error-msg">{dobError}</p>}
              </div>
              <div className="register-field">
                <label>Address</label>
                <div className="register-input-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
                  <input type="text" name="address" placeholder="Enter your address" value={formData.address} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Row 5 - Passwords */}
            <div className="register-row">
              <div className="register-field">
                <label>Password</label>
                <div className={`register-input-wrap ${passwordError ? "input-error" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm3.1-9H8.9V6A3.1 3.1 0 0 1 15.1 8Z" /></svg>
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Create password" value={formData.password} onChange={handleChange} required />
                  <button type="button" className="register-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      {showPassword
                        ? <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                        : <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75C21.27 7.61 17 4.5 12 4.5c-1.77 0-3.45.43-4.93 1.19l2.16 2.16C9.74 7.13 10.35 7 12 7ZM2 4.27l2.28 2.28A11.91 11.91 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l3.18 3.18 1.42-1.42L3.42 2.86 2 4.27ZM7.53 9.8l1.55 1.55A2.82 2.82 0 0 0 9 12a3 3 0 0 0 3 3c.22 0 .44-.03.65-.07l1.55 1.55A4.96 4.96 0 0 1 12 17a5 5 0 0 1-5-5c0-.7.15-1.37.42-1.97l.11-.23Z" />
                      }
                    </svg>
                  </button>
                </div>
                {passwordError && <p className="error-msg">{passwordError}</p>}
              </div>
              <div className="register-field">
                <label>Confirm Password</label>
                <div className={`register-input-wrap ${confirmPasswordError ? "input-error" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm3.1-9H8.9V6A3.1 3.1 0 0 1 15.1 8Z" /></svg>
                  <input type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required />
                  <button type="button" className="register-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                    </svg>
                  </button>
                </div>
                {confirmPasswordError && <p className="error-msg">{confirmPasswordError}</p>}
              </div>
            </div>

            <button type="submit" className="register-submit-btn">Register Now</button>

            <p className="register-login-link">
              Already have an account? <a href="/login">Sign In</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegister;
