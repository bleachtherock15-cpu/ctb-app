// ═══════════════════════════════════════════════
//  api.js — Centralized API client
// ═══════════════════════════════════════════════

// Dev: Live Server runs on :5500, API on :3001
// Prod: same origin, so just use /api
const API_BASE = (window.location.port === '5500' || window.location.port === '3000')
  ? 'http://localhost:3001/api'
  : '/api';

function getToken() {
  return localStorage.getItem('ss_token');
}

function setToken(t) {
  localStorage.setItem('ss_token', t);
}

function clearToken() {
  localStorage.removeItem('ss_token');
  localStorage.removeItem('ss_user');
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `HTTP_${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────
const Auth = {
  async register(email, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    localStorage.setItem('ss_user', JSON.stringify(data.user));
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    localStorage.setItem('ss_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    clearToken();
    window.location.reload();
  },

  getUser() {
    const u = localStorage.getItem('ss_user');
    return u ? JSON.parse(u) : null;
  },

  isLoggedIn() {
    return !!getToken();
  },
};

// ── Shares ────────────────────────────────────
const Shares = {
  async list() {
    return apiFetch('/shares');
  },

  async upload(file, { ttl, maxDownloads, password } = {}, onProgress) {
    const form = new FormData();
    form.append('file', file);
    if (ttl) form.append('ttl', ttl);
    if (maxDownloads) form.append('maxDownloads', maxDownloads);
    if (password) form.append('password', password);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/shares`);
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.error || `HTTP_${xhr.status}`));
        } catch { reject(new Error('PARSE_ERROR')); }
      };

      xhr.onerror = () => reject(new Error('NETWORK_ERROR'));
      xhr.send(form);
    });
  },

  async delete(id) {
    return apiFetch(`/shares/${id}`, { method: 'DELETE' });
  },

  getShareLink(token) {
    const base = window.location.href.replace(/\/[^/]*(\?.*)?$/, '');
    return `${base}/download.html?token=${token}`;
  },

  getDownloadUrl(token) {
    return `${API_BASE}/shares/dl/${token}`;
  },

  async getInfo(token) {
    return apiFetch(`/shares/info/${token}`);
  },

  async getLogs(shareId) {
    return apiFetch(`/shares/${shareId}/logs`);
  },

  async downloadWithPassword(token, password) {
    const res = await fetch(`${API_BASE}/shares/dl/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP_${res.status}`);
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') || '';
    const match = cd.match(/filename="?([^"]+)"?/);
    const filename = match ? decodeURIComponent(match[1]) : 'download';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};

// expose globally
window.Auth   = Auth;
window.Shares = Shares;
