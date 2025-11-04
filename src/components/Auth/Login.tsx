import React, { useState } from 'react';
import auth from '../../api/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await auth.login(email, password);
      // backend returns AuthResponse with token and user
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        // optional: store user
        localStorage.setItem('user', JSON.stringify(res.user || {}));
        // redirect or update app state as needed
        window.location.href = '/';
      } else {
        setError('Login succeeded but no token received');
      }
    } catch (err: any) {
      setError(err?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth:400, margin:'0 auto'}}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom:8}}>
          <label>Email</label>
          <input style={{width:'100%'}} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{marginBottom:8}}>
          <label>Password</label>
          <input style={{width:'100%'}} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{color:'red', marginBottom:8}}>{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  );
}
