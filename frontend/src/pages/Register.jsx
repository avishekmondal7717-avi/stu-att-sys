import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Steps } from "antd";
import { message, notification } from "../components/AntdGlobalHelper";
import { authAPI } from "../services/api";
import "./Register.css";

const { Step } = Steps;

const Register = () => {
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    semester: "",
    section: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  const [errors, setErrors] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDOBBoundaries = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return { minDateStr: `${yyyy - 80}-${mm}-${dd}`, maxDateStr: `${yyyy - 18}-${mm}-${dd}` };
  };
  const { minDateStr, maxDateStr } = getDOBBoundaries();

  const validateStep1 = () => {
    let newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full Name is required.";
    if (!formData.studentId?.startsWith("STU")) newErrors.studentId = "Student ID must start with 'STU'.";
    if (!formData.email?.includes("@")) newErrors.email = "Valid email is required.";
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone must be exactly 10 digits.";
    if (!formData.department) newErrors.department = "Department is required.";
    if (!formData.semester) newErrors.semester = "Semester is required.";
    if (!formData.gender) newErrors.gender = "Gender is required.";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of Birth is required.";
    if (!formData.address) newErrors.address = "Home Address is required.";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleNext = () => {
    if (validateStep1()) {
       setCurrentStep(1);
       startCamera();
    } else {
      notification.warning({
        message: "Validation Failed",
        description: "Please review the highlighted errors on the form before continuing to the biometrics step.",
        placement: "topRight",
        duration: 4.5
      });
    }
  };

  const handleBack = () => {
    stopCamera();
    setCurrentStep(0);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      message.error("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setProfilePhoto(dataUrl);
      message.success("Face captured successfully!");
      stopCamera();
    }
  }, []);

  const retakePhoto = () => {
    setProfilePhoto(null);
    startCamera();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profilePhoto) {
      message.error("Please capture your face before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rollNumber: formData.studentId,
        fullName: formData.fullName,
        email: formData.email,
        contact: formData.phone,
        department: formData.department,
        course: "B.Tech",
        semester: formData.semester.replace("Semester ", ""),
        gender: formData.gender,
        dob: formData.dateOfBirth,
        address: formData.address,
        status: "Active",
        photo: profilePhoto
      };

      await authAPI.registerStudent({
        ...payload,
        password: formData.password
      });

      message.success("Registration successful");
      notification.success({
        message: "Registration Successful",
        description: "Your student profile and login account have been successfully created! Redirecting to login...",
        placement: "topRight",
        duration: 5
      });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      console.error(err);
      const errMsg = err.message || "Registration failed. Please try again.";
      
      // Categorize student registration errors for beautiful toasts
      if (errMsg.includes("already exists") || errMsg.includes("already registered") || errMsg.includes("duplicated")) {
        notification.warning({
          message: "Registration Failed",
          description: "A student account with this Roll Number or Email already exists. Please verify and log in.",
          placement: "topRight",
          duration: 5
        });
      } else if (errMsg.includes("detect a clear face")) {
        notification.error({
          message: "Biometrics Verification Failed",
          description: "Could not detect a clear face. Please position yourself in a well-lit area and capture your face scan again.",
          placement: "topRight",
          duration: 5.5
        });
      } else if (errMsg.includes("photo") || errMsg.includes("photo data")) {
        notification.error({
          message: "Missing Profile Photo",
          description: "A valid face scan is mandatory to train the AI face recognition system. Please complete the face scan step.",
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
    } finally {
      setIsSubmitting(false);
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
        Smart <span className="register-brand-accent">Attendance</span> Sytem
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

      {/* Right Panel */}
      <div className="register-right">
        <div className="register-form-card" style={{ maxWidth: '600px', width: '100%' }}>
          <Steps current={currentStep} style={{ marginBottom: '30px' }}>
            <Step title="Personal Details" />
            <Step title="Face Scan" />
          </Steps>

          <form onSubmit={handleSubmit} className="register-form">
            {currentStep === 0 && (
              <div className="step-1">
                <div className="register-row">
                  <div className="register-field">
                    <label>Full Name</label>
                    <input type="text" name="fullName" placeholder="Enter full name" value={formData.fullName} onChange={handleChange} required className={errors.fullName ? "input-error" : ""} />
                    {errors.fullName && <p className="error-msg">{errors.fullName}</p>}
                  </div>
                  <div className="register-field">
                    <label>Student ID</label>
                    <input type="text" name="studentId" placeholder="e.g. STU2026001" value={formData.studentId} onChange={handleChange} required className={errors.studentId ? "input-error" : ""} />
                    {errors.studentId && <p className="error-msg">{errors.studentId}</p>}
                  </div>
                </div>

                <div className="register-row">
                  <div className="register-field">
                    <label>Email Address</label>
                    <input type="email" name="email" placeholder="Enter email" value={formData.email} onChange={handleChange} required className={errors.email ? "input-error" : ""} />
                    {errors.email && <p className="error-msg">{errors.email}</p>}
                  </div>
                  <div className="register-field">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" placeholder="Enter phone" value={formData.phone} onChange={handleChange} required className={errors.phone ? "input-error" : ""} />
                    {errors.phone && <p className="error-msg">{errors.phone}</p>}
                  </div>
                </div>

                <div className="register-row">
                  <div className="register-field">
                    <label>Department</label>
                    <select name="department" value={formData.department} onChange={handleChange} required className={errors.department ? "input-error" : ""}>
                      <option value="">Select Department</option>
                      <option>Computer Science</option>
                      <option>Information Technology</option>
                      <option>Electronics</option>
                      <option>Mechanical</option>
                      <option>Civil</option>
                    </select>
                    {errors.department && <p className="error-msg">{errors.department}</p>}
                  </div>
                  <div className="register-field">
                    <label>Semester</label>
                    <select name="semester" value={formData.semester} onChange={handleChange} required className={errors.semester ? "input-error" : ""}>
                      <option value="">Select Semester</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s}>Semester {s}</option>)}
                    </select>
                    {errors.semester && <p className="error-msg">{errors.semester}</p>}
                  </div>
                </div>

                <div className="register-row">
                  <div className="register-field">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} required className={errors.gender ? "input-error" : ""}>
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    {errors.gender && <p className="error-msg">{errors.gender}</p>}
                  </div>
                  <div className="register-field">
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" min={minDateStr} max={maxDateStr} value={formData.dateOfBirth} onChange={handleChange} required className={errors.dateOfBirth ? "input-error" : ""} />
                    {errors.dateOfBirth && <p className="error-msg">{errors.dateOfBirth}</p>}
                  </div>
                </div>

                <div className="register-field" style={{ width: '100%', marginBottom: '15px' }}>
                  <label>Home Address</label>
                  <input type="text" name="address" placeholder="Enter home address" value={formData.address} onChange={handleChange} required className={errors.address ? "input-error" : ""} />
                  {errors.address && <p className="error-msg">{errors.address}</p>}
                </div>

                <div className="register-row">
                  <div className="register-field">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Create password" value={formData.password} onChange={handleChange} required className={errors.password ? "input-error" : ""} />
                    {errors.password && <p className="error-msg">{errors.password}</p>}
                  </div>
                  <div className="register-field">
                    <label>Confirm</label>
                    <input type="password" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required className={errors.confirmPassword ? "input-error" : ""} />
                    {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <Button type="primary" size="large" onClick={handleNext} style={{ width: '100%', marginTop: 20 }}>
                  Next: Face Scan Verification
                </Button>
                <p className="register-login-link" style={{ textAlign: "center", marginTop: 15 }}>
                  Already have an account? <a href="/login">Sign In</a>
                </p>
              </div>
            )}

            {currentStep === 1 && (
              <div className="step-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ marginBottom: 15 }}>Capture Your Face</h3>
                <p style={{ textAlign: "center", marginBottom: 20, color: "#666" }}>
                  Please ensure your face is clearly visible, well-lit, and directly facing the camera.
                </p>

                <div className="webcam-container" style={{ position: 'relative', width: '320px', height: '240px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%' }}>
                  <Button size="large" onClick={handleBack} style={{ flex: 1 }}>Back</Button>
                  {!profilePhoto ? (
                    <Button type="primary" size="large" onClick={capturePhoto} style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}>
                      Capture Face
                    </Button>
                  ) : (
                    <Button size="large" onClick={retakePhoto} style={{ flex: 1 }}>
                      Retake
                    </Button>
                  )}
                </div>

                {profilePhoto && (
                  <Button type="primary" size="large" onClick={handleSubmit} loading={isSubmitting} style={{ width: '100%', marginTop: '15px' }}>
                    Complete Registration
                  </Button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
