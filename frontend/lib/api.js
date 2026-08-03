const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('saas_token');
}

export function setToken(token) {
  if (typeof window !== 'undefined') localStorage.setItem('saas_token', token);
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem('saas_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export function signup({ name, email, password }) {
  return request('/auth/signup', { method: 'POST', body: { name, email, password } });
}

export function login({ email, password }) {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

export function getMe() {
  return request('/protected', { auth: true });
}

export const subscriptionApi = {
  create: (plan, trialDays = 0, billingCycle = 'monthly') =>
    request('/subscription/create', { method: 'POST', body: { plan, trialDays, billingCycle }, auth: true }),
  getMe: () => request('/subscription/me', { auth: true }),
  upgrade: (newPlan) =>
    request('/subscription/upgrade', { method: 'PUT', body: { newPlan }, auth: true }),
  cancel: () => request('/subscription/cancel', { method: 'DELETE', auth: true }),
  portal: () => request('/subscription/portal', { method: 'POST', auth: true }),
  resume: () => request('/subscription/resume', { method: 'PUT', auth: true }),
};
