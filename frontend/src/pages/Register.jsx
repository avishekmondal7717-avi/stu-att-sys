import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { message, Button, Steps } from "antd";
import { studentAPI, authAPI } from "../services/api";
import "./Register.css";

const { Step } = Steps;

const Register = () => {
  const navigate = useNavigate();
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
      message.error("Please fix the errors before proceeding.");
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
      
      message.success("Successfully registered! Redirecting to login...");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.detail || "Registration failed. Student ID or email might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      {/* Left Panel */}
      <div className="register-left">
        <div className="register-brand">
          <div className="register-brand-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="rgba(255,255,255,0.15)" />
              <path d="M20 8C15.58 8 12 11.58 12 16C12 19.07 13.7 21.74 16.2 23.16C11.58 24.56 8 28.76 8 34H12C12 29.58 15.58 26 20 26C24.42 26 28 29.58 28 34H32C32 28.76 28.42 24.56 23.8 23.16C26.3 21.74 28 19.07 28 16C28 11.58 24.42 8 20 8ZM20 22C17.79 22 16 20.21 16 18C16 15.79 17.79 14 20 14C22.21 14 24 15.79 24 18C24 20.21 22.21 22 20 22Z" fill="white"/>
            </svg>
          </div>
          <div>
            <h1 className="register-brand-title">Smart <span className="register-brand-accent">Attendance</span></h1>
            <p className="register-brand-sub">PostgreSQL Vector Face Recognition</p>
          </div>
        </div>
        <div className="register-features">
          <div className="register-feature-item">
            <div className="register-feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11.75A1.25 1.25 0 1 0 9 14.25 1.25 1.25 0 0 0 9 11.75ZM15 11.75A1.25 1.25 0 1 0 15 14.25 1.25 1.25 0 0 0 15 11.75ZM12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2ZM12 20a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8Z"/></svg>
            </div>
            <div>
              <h3>AI Vector Embeddings</h3>
              <p>Your face is securely encrypted into an irreversible mathematical vector.</p>
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
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
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