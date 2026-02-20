const API_URL = process.env.NEXT_PUBLIC_LICENSING_API_URL || 'http://localhost:4000';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pulse_access_token');
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  if (data.access_token) localStorage.setItem('pulse_access_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('pulse_refresh_token', data.refresh_token);
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Login failed');
  if (data.access_token) localStorage.setItem('pulse_access_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('pulse_refresh_token', data.refresh_token);
  return data;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('pulse_refresh_token');
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) return null;
  localStorage.setItem('pulse_access_token', data.access_token);
  return data.access_token;
}

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token = getStoredToken();
  if (!token) {
    token = await refreshAccessToken();
  }
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(input, { ...init, headers });
    }
  }
  return res;
}

export async function getMe() {
  const res = await fetchWithAuth(`${API_URL}/auth/me`);
  if (!res.ok) return null;
  return res.json();
}

export async function createCheckoutSession() {
  const res = await fetchWithAuth(`${API_URL}/billing/create-checkout-session`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to create checkout');
  return data;
}

export async function getPortalSession() {
  const res = await fetchWithAuth(`${API_URL}/billing/portal-session`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to open portal');
  return data;
}

export async function getBillingStatus(): Promise<{ status: string; premium_active: boolean }> {
  const res = await fetchWithAuth(`${API_URL}/billing/status`);
  if (!res.ok) return { status: 'inactive', premium_active: false };
  return res.json();
}

export async function getSignedDownloadUrl() {
  const res = await fetchWithAuth(`${API_URL}/downloads/signed-url`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to get download URL');
  return data;
}

export function logout() {
  localStorage.removeItem('pulse_access_token');
  localStorage.removeItem('pulse_refresh_token');
}
