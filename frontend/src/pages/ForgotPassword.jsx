import { useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();

  // ================= VALIDATION =================
  const validateEmail = (value) => {
    if (!value) return "Email is required.";
    if (!value.includes("@"))
      return "Enter a valid registered email address.";
    return "";
  };

  // ================= SUBMIT =================
  const submit = async () => {
    const err = validateEmail(email);
    setEmailError(err);

    if (err) {
      message.warning("Please enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.forgotPassword(email);

      setSent(true);
      message.success(result.message);

      // Dev/debug flow (kept from old version)
      if (result.debugResetToken) {
        navigate(
          `/reset-password?token=${encodeURIComponent(
            result.debugResetToken
          )}`
        );
      }
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Could not request password reset."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* ================= LEFT PANEL (NEW UI PRESERVED) ================= */}
      <div className="login-left-panel">
        <div className="left-panel-content">
          <div className="brand-header">
            <div className="brand-logo-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>

            <h1>
              Smart <span>Attendance</span> System
            </h1>
          </div>

          <p className="brand-subtitle">
            A Face Recognition based Attendance Management System
          </p>

          <div className="features-list">
            <div className="feature-item">
              <h3>Face Recognition</h3>
              <p>Secure and accurate recognition system</p>
            </div>

            <div className="feature-item">
              <h3>Real-time Tracking</h3>
              <p>Instant attendance updates</p>
            </div>

            <div className="feature-item">
              <h3>Detailed Reports</h3>
              <p>Analytics and reporting tools</p>
            </div>
          </div>
        </div>

        <div className="left-panel-footer">
          <p>&copy; 2026 Smart Attendance System</p>
        </div>

        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="login-right-panel">
        <div className="login-card">
          <div className="card-logo-wrap">
            <div className="card-logo">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <h2>Forgot Password?</h2>
          <p className="subtitle">
            Enter your email and we’ll send a reset link
          </p>

          {/* EMAIL FIELD */}
          <div className="field">
            <label>Email Address</label>

            <div
              className={`input-wrap ${
                emailError ? "input-error" : ""
              }`}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && submit()
                }
              />
            </div>

            {emailError && (
              <p className="error-msg">{emailError}</p>
            )}
          </div>

          {/* SUBMIT */}
          <button
            className="btn-signin"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {/* SUCCESS MESSAGE */}
          {sent && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#10b981",
                textAlign: "center",
                marginTop: "12px",
              }}
            >
              Check your email for the reset link.
            </p>
          )}

          {/* BACK LINK */}
          <button
            className="btn-admin"
            onClick={() => navigate("/login")}
            style={{
              marginTop: "16px",
              color: "#6366f1",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}