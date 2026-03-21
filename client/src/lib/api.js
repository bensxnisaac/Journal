// Lightweight fetch wrapper with JWT refresh logic

const BASE = '/api';

let accessToken = localStorage.getItem('smc_access') || null;
let refreshToken = localStorage.getItem('smc_refresh') || null;
let refreshPromise = null;

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('smc_access', access);
  localStorage.setItem('smc_refresh', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('smc_access');
  localStorage.removeItem('smc_refresh');
  localStorage.removeItem('smc_user');
}

export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }

async function doRefresh() {
  if (!refreshToken) throw new Error('No refresh token');
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function request(method, path, body, retry = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 → try refresh once
  if (res.status === 401 && retry) {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    await refreshPromise;
    return request(method, path, body, false);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path)         => request('DELETE', path),

  // Auth
  auth: {
    register: (body) => request('POST', '/auth/register', body),
    login:    (body) => request('POST', '/auth/login',    body),
    logout:   ()     => request('POST', '/auth/logout', { refreshToken }),
    me:       ()     => request('GET',  '/auth/me'),
  },

  // Trades
  trades: {
    list:   (params = {}) => request('GET', '/trades?' + new URLSearchParams(params).toString()),
    get:    (id)          => request('GET', `/trades/${id}`),
    create: (body)        => request('POST', '/trades', body),
    update: (id, body)    => request('PUT',  `/trades/${id}`, body),
    delete: (id)          => request('DELETE', `/trades/${id}`),
  },

  // Stats
  stats: {
    get: (params = {}) => request('GET', '/stats?' + new URLSearchParams(params).toString()),
  },

  // Tags
  tags: {
    list:   ()     => request('GET',    '/tags'),
    create: (body) => request('POST',   '/tags', body),
    delete: (id)   => request('DELETE', `/tags/${id}`),
  },

  // Notes
  notes: {
    list:  ()     => request('GET', '/notes'),
    get:   (date) => request('GET', `/notes/${date}`),
    save:  (date, body) => request('PUT', `/notes/${date}`, body),
  },
};
