import { useState } from 'react';
import { Button, Card, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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
    } catch (error) {
      message.error(error.message || 'Could not request password reset.');
    } finally { setLoading(false); }
  };

  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'var(--auth-bg)' }}>
    <Card style={{ width: '100%', maxWidth: 440, borderRadius: 16 }}>
      <Typography.Title level={2}>Forgot password</Typography.Title>
      <Typography.Paragraph type="secondary">Enter your student or teacher account email. Reset links expire after 15 minutes.</Typography.Paragraph>
      <Input size="large" type="email" placeholder="Registered email" value={email} onChange={(event) => setEmail(event.target.value)} onPressEnter={submit} />
      <Button block type="primary" size="large" loading={loading} onClick={submit} style={{ marginTop: 16 }}>Send reset link</Button>
      {sent && <Typography.Paragraph style={{ marginTop: 14 }}>Check your email or the backend terminal in development mode.</Typography.Paragraph>}
      <div style={{ marginTop: 18, textAlign: 'center' }}><Link to="/login">Back to sign in</Link></div>
    </Card>
  </div>;
}
