/// <reference types="vite/client" />
// Auth API helper copied into kl-smartq frontend
const API_BASE = 'http://localhost:8083/api';

async function post(path: string, body: any, includeCredentials = false) {
  const url = `${API_BASE}${path}`;
  console.log('🌐 API Request:', { url, body });
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      credentials: includeCredentials ? 'include' : 'same-origin'
    });
    
    console.log('📡 API Response Status:', res.status, res.statusText);
    
    const data = await res.json().catch(() => ({}));
    console.log('📦 API Response Data:', data);
    
    if (!res.ok) {
      console.error('❌ API Error:', { status: res.status, data });
      throw { status: res.status, data, message: data?.error || data?.message || `HTTP ${res.status}` };
    }
    
    console.log('✅ API Success:', data);
    return data;
  } catch (error: any) {
    console.error('💥 API Exception:', error);
    
    // Network error or fetch failure
    if (!error.status && (error.message?.includes('fetch') || error.message?.includes('Failed to fetch'))) {
      const networkError = { status: 0, data: { error: 'Cannot connect to backend server. Is it running on port 8083?' }, message: 'Network error' };
      console.error('🔌 Network Error:', networkError);
      throw networkError;
    }
    throw error;
  }
}

export function sendVerificationCode(name: string, email: string, password: string) {
  return post('/auth/send-verification-code', { name, email, password });
}

export function verifyCode(email: string, code: string) {
  return post('/auth/verify-code', { email, code });
}

export function completeRegistration(email: string) {
  return post('/auth/complete-registration', { email });
}

export function register(name: string, email: string, password: string, confirmPassword: string) {
  return post('/auth/register', { name, email, password, confirmPassword });
}

export function login(email: string, password: string) {
  return post('/auth/login', { email, password });
}

export async function validateToken(token: string) {
  const res = await fetch(`${API_BASE}/auth/validate`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export default { sendVerificationCode, verifyCode, completeRegistration, login, validateToken };
