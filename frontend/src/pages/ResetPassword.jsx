import { useState } from 'react';
import { Button, Card, Input, Typography, message } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (password.length < 8) return message.warning('Password must contain at least 8 characters.');
    if (password !== confirm) return message.warning('Passwords do not match.');
    const token = params.get('token');
    if (!token) return message.error('Reset token is missing.');
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      message.success('Password updated. You can now sign in.');
      navigate('/login');
    } catch (error) { message.error(error.message || 'Password reset failed.'); }
    finally { setLoading(false); }
  };

  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'var(--auth-bg)' }}>
    <Card style={{ width: '100%', maxWidth: 440, borderRadius: 16 }}>
      <Typography.Title level={2}>Create new password</Typography.Title>
      <Input.Password size="large" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <Input.Password size="large" placeholder="Confirm password" value={confirm} onChange={(event) => setConfirm(event.target.value)} onPressEnter={submit} style={{ marginTop: 12 }} />
      <Button block type="primary" size="large" loading={loading} onClick={submit} style={{ marginTop: 16 }}>Update password</Button>
      <div style={{ marginTop: 18, textAlign: 'center' }}><Link to="/login">Back to sign in</Link></div>
    </Card>
  </div>;
}
