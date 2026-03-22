const BASE = '/api';

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function setAccessToken(token: string): void  { accessToken = token; }
export function clearAccessToken(): void             { accessToken = null; }
export function getAccessToken(): string | null      { return accessToken; }

async function doRefresh(): Promise<string> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    clearAccessToken();
    throw new Error('Session expired');
  }
  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

async function request<T = unknown>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    await refreshPromise;
    return request<T>(method, path, body, false);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data as T;
}

export const api = {
  get:    <T = unknown>(path: string) => request<T>('GET', path),
  post:   <T = unknown>(path: string, body: unknown) => request<T>('POST', path, body),
  put:    <T = unknown>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T = unknown>(path: string) => request<T>('DELETE', path),

  auth: {
    register: (body: unknown) => request('POST', '/auth/register', body),
    login:    (body: unknown) => request('POST', '/auth/login', body),
    logout:   () => request('POST', '/auth/logout'),
    me:       () => request('GET', '/auth/me'),
  },

  trades: {
    list:   (params: Record<string, unknown> = {}) => request('GET', '/trades?' + new URLSearchParams(params as Record<string, string>).toString()),
    get:    (id: string | number) => request('GET', `/trades/${id}`),
    create: (body: unknown) => request('POST', '/trades', body),
    update: (id: string | number, body: unknown) => request('PUT', `/trades/${id}`, body),
    delete: (id: string | number) => request('DELETE', `/trades/${id}`),
  },

  stats: {
    get: (params: Record<string, unknown> = {}) => request('GET', '/stats?' + new URLSearchParams(params as Record<string, string>).toString()),
  },

  tags: {
    list:   () => request('GET', '/tags'),
    create: (body: unknown) => request('POST', '/tags', body),
    delete: (id: string | number) => request('DELETE', `/tags/${id}`),
  },

  notes: {
    list:  () => request('GET', '/notes'),
    get:   (date: string) => request('GET', `/notes/${date}`),
    save:  (date: string, body: unknown) => request('PUT', `/notes/${date}`, body),
  },
};
