const crypto = require('crypto');
let keytar;
function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
try {
  keytar = require('keytar');
} catch (_) {
  keytar = null;
}

const SERVICE_NAME = 'com.pickle.glass';
const DEVICE_ID_ACCOUNT = 'pulse_device_id';
const REFRESH_TOKEN_ACCOUNT = 'pulse_licensing_refresh';

const LICENSING_API_URL = process.env.LICENSING_API_URL || process.env.PULSE_LICENSING_API_URL || 'http://localhost:4000';

let inMemoryAccessToken = null;

async function getOrCreateDeviceId() {
  if (keytar) {
    try {
      const existing = await keytar.getPassword(SERVICE_NAME, DEVICE_ID_ACCOUNT);
      if (existing && existing.length > 0) return existing;
    } catch (_) {}
  }
  const deviceId = uuidv4();
  if (keytar) {
    try {
      await keytar.setPassword(SERVICE_NAME, DEVICE_ID_ACCOUNT, deviceId);
    } catch (err) {
      console.warn('[LicensingService] Could not store device_id in keychain:', err.message);
    }
  }
  return deviceId;
}

async function getStoredRefreshToken() {
  if (!keytar) return null;
  try {
    return await keytar.getPassword(SERVICE_NAME, REFRESH_TOKEN_ACCOUNT);
  } catch (_) {
    return null;
  }
}

async function setLicensingTokens(accessToken, refreshToken) {
  inMemoryAccessToken = accessToken;
  if (keytar && refreshToken) {
    try {
      await keytar.setPassword(SERVICE_NAME, REFRESH_TOKEN_ACCOUNT, refreshToken);
    } catch (err) {
      console.warn('[LicensingService] Could not store refresh token:', err.message);
    }
  }
}

async function clearLicensingTokens() {
  inMemoryAccessToken = null;
  if (keytar) {
    try {
      await keytar.deletePassword(SERVICE_NAME, REFRESH_TOKEN_ACCOUNT);
    } catch (_) {}
  }
}

async function refreshAccessToken() {
  const refresh = await getStoredRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${LICENSING_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) return null;
  inMemoryAccessToken = data.access_token;
  return data.access_token;
}

async function getAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  return await refreshAccessToken();
}

async function activateDevice(accessToken) {
  const deviceId = await getOrCreateDeviceId();
  const deviceName = `Pulse ${process.platform === 'darwin' ? 'Mac' : process.platform === 'win32' ? 'Windows' : 'App'}`;
  const res = await fetch(`${LICENSING_API_URL}/device/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ device_id: deviceId, device_name: deviceName }),
  }).catch(() => null);
  if (!res) return { success: false, error: 'Network error' };
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { success: true };
  return { success: false, error: data.error || `HTTP ${res.status}`, code: data.code };
}

async function ensureActivated() {
  const token = await getAccessToken();
  if (!token) return { success: false, error: 'Not logged in to licensing' };
  return await activateDevice(token);
}

async function loginWithCredentials(email, password) {
  const res = await fetch(`${LICENSING_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  }).catch(() => null);
  if (!res || !res.ok) {
    const data = await res?.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  const data = await res.json();
  await setLicensingTokens(data.access_token, data.refresh_token);
  const activated = await activateDevice(data.access_token);
  if (!activated.success) throw new Error(activated.error || 'Device activation failed');
  return { user: data.user };
}

async function loginWithTokens(accessToken, refreshToken) {
  await setLicensingTokens(accessToken, refreshToken);
  const activated = await activateDevice(accessToken);
  if (!activated.success) throw new Error(activated.error || 'Device activation failed');
  return { success: true };
}

async function logout() {
  await clearLicensingTokens();
}

async function isLicensed() {
  const token = await getAccessToken();
  if (!token) return false;
  const res = await fetch(`${LICENSING_API_URL}/billing/status`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!res || !res.ok) return false;
  const data = await res.json().catch(() => ({}));
  return data.premium_active === true;
}

async function callLicensedApi(path, options = {}) {
  let token = await getAccessToken();
  if (!token) {
    token = await refreshAccessToken();
    if (!token) throw new Error('Not logged in');
  }
  const deviceId = await getOrCreateDeviceId();
  const url = path.startsWith('http') ? path : `${LICENSING_API_URL}${path}`;
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'X-Device-ID': deviceId,
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      const retry = await fetch(url, { ...options, headers });
      return retry;
    }
  }
  return res;
}

module.exports = {
  getOrCreateDeviceId,
  getAccessToken,
  setLicensingTokens,
  clearLicensingTokens,
  activateDevice,
  ensureActivated,
  loginWithCredentials,
  loginWithTokens,
  logout,
  isLicensed,
  callLicensedApi,
  LICENSING_API_URL,
};
