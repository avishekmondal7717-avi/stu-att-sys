import { useState } from 'react';
import { message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './AuthRecovery.css';

const FeaturePanel = () => <aside className="recovery-brand">
  <div className="recovery-brand-title"><span>⌾</span><strong>Smart <em>Attendance</em> System</strong></div>
  <p>A Face Recognition based Attendance Management System</p>
  <div className="recovery-features">
    <div><b>⌘</b><span><strong>Face Recognition</strong><small>Secure and accurate face recognition technology</small></span></div>
    <div><b>▥</b><span><strong>Real-time Tracking</strong><small>Monitor attendance in real-time with instant updates</small></span></div>
    <div><b>▤</b><span><strong>Detailed Reports</strong><small>Generate comprehensive attendance reports and analytics</small></span></div>
  </div>
  <small className="recovery-copyright">© 2026 Smart Attendance System. All rights reserved.</small>
</aside>;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (!email.includes('@')) return message.warning('Enter a valid registered email address.');
    setLoading(true);
    try {
      const result = await authAPI.forgotPassword(email);
      setSent(true);
      message.success(result.message);
      if (result.debugResetToken) navigate(`/reset-password?token=${encodeURIComponent(result.debugResetToken)}`);
    } catch (error) { message.error(error.message || 'Could not request password reset.'); }
    finally { setLoading(false); }
  };

  return <main className="recovery-layout">
    <FeaturePanel />
    <section className="recovery-content">
      <div className="recovery-card">
        <div className="recovery-icon">♙</div>
        <h1>Forgot Password?</h1>
        <p>Enter your email and we'll send you a reset link</p>
        <label htmlFor="recovery-email">Email Address</label>
        <input id="recovery-email" type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
        <button type="button" onClick={submit} disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</button>
        {sent && <div className="recovery-notice">If this email is registered, reset instructions are on their way.</div>}
        <Link to="/login" className="recovery-back">← &nbsp; Back to Login</Link>
      </div>
    </section>
  </main>;
}
