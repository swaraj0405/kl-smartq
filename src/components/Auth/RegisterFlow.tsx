import React, { useState } from 'react';
import auth from '../../api/auth';

export default function RegisterFlow() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null); setMessage(null); setLoading(true);
    try {
      // Backend expects name, email, password all at once
      if (!name || !password) {
        setError('Please provide name and password first');
        setLoading(false);
        return;
      }
      await auth.sendVerificationCode(name, email, password);
      setMessage('Verification code sent to your email');
      setStep(2);
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to send code');
    } finally { setLoading(false); }
  }

  async function verify() {
    setError(null); setMessage(null); setLoading(true);
    try {
      await auth.verifyCode(email, code);
      setMessage('Code verified — completing registration');
      setStep(3);
    } catch (err: any) {
      setError(err?.data?.error || 'Invalid code');
    } finally { setLoading(false); }
  }

  async function complete() {
    setError(null); setMessage(null); setLoading(true);
    try {
      const res = await auth.completeRegistration(email);
      // backend returns token and user
      if (res?.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user || {}));
        window.location.href = '/';
      } else {
        setMessage(res?.message || 'Registration complete. You can log in now.');
      }
    } catch (err: any) {
      setError(err?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{maxWidth:480, margin:'0 auto'}}>
      <h2>Register</h2>
      {message && <div style={{color:'green'}}>{message}</div>}
      {error && <div style={{color:'red'}}>{error}</div>}

      {step === 1 && (
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{width:'100%'}} />
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{width:'100%'}} required />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width:'100%'}} required />
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{width:'100%'}} required />
          <button onClick={sendCode} disabled={loading || !email || !name || !password || password !== confirmPassword}>{loading ? 'Sending...' : 'Send Verification Code'}</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label>Verification Code</label>
          <input value={code} onChange={e => setCode(e.target.value)} style={{width:'100%'}} />
          <button onClick={verify} disabled={loading || !code}>{loading ? 'Verifying...' : 'Verify Code'}</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <p>Email verified! Click below to complete registration.</p>
          <button onClick={complete} disabled={loading}>{loading ? 'Completing...' : 'Complete Registration'}</button>
        </div>
      )}
    </div>
  );
}
