const API_BASE = 'http://localhost:8083/api';

function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('token');
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  if (!token) {
    const error = { status: 401, message: 'Not authenticated' };
    throw error;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (init.headers) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = { status: response.status, data, message: data?.error || data?.message || 'Request failed' };
    throw error;
  }

  return data;
}

export function fetchUsers() {
  return authFetch('/admin/users', { method: 'GET' });
}

export function createUser(payload: { name: string; email: string; password: string; role: string; assignedOfficeIds?: string[] }) {
  return authFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: string, payload: { name?: string; email?: string; role?: string; assignedOfficeIds?: string[] }) {
  return authFetch(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(userId: string) {
  return authFetch(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}