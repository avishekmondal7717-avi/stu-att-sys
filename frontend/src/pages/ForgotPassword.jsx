import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (value) => {
    const localPart = value.split("@")[0];
    const validDomains = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"];
    const hasValidDomain = validDomains.some((d) => value.endsWith(d));
    if (!value) return "Email is required.";
    if (localPart.length < 6) return "Email must have at least 6 characters before @.";
    if (!hasValidDomain) return "Email must end with @gmail.com, @yahoo.com, @outlook.com or @hotmail.com.";
    return "";
  };

  const handleSubmit = () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (!err) {
      setSubmitted(true);
    }
  };

  return (
    <div className="fp-wrapper">
      {/* Left Panel */}
      <div className="fp-left">
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
            <h1>Smart <span>Attendance</span> System</h1>
          </div>
        </div>

        <p className="brand-desc">A Face Recognition based Attendance Management System</p>

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
      <div className="fp-right">
        <div className="fp-card">

          {!submitted ? (
            <>
              <div className="fp-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="#3B5BDB" strokeWidth="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="#3B5BDB" strokeWidth="2" />
                </svg>
              </div>

              <h2>Forgot Password?</h2>
              <p className="fp-subtitle">Enter your email and we'll send you a reset link</p>

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

              <button className="btn-submit" onClick={handleSubmit}>
                Send Reset Link
              </button>

              <button className="btn-back" onClick={() => navigate("/login")}>
                ← Back to Login
              </button>
            </>
          ) : (
            <>
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#38a169" strokeWidth="2" />
                  <path d="M7 13l3 3 7-7" stroke="#38a169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2>Email Sent!</h2>
              <p className="fp-subtitle">
                A password reset link has been sent to <strong>{email}</strong>. Please check your inbox.
              </p>
              <button className="btn-submit" onClick={() => navigate("/login")}>
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}