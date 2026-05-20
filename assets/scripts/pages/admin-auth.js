/**
 * admin-auth.js
 * Giardini Cafe - Admin authentication utilities.
 */

import { API_ROUTES, buildApiUrl } from '../config/api.js';

const TOKEN_KEY = 'giardini_admin_token';
const USER_KEY = 'giardini_admin_user';

const LEGACY_TOKEN_KEY = 'adm_token';
const LEGACY_USER_KEY = 'adm_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}'); }
  catch { return {}; }
}

export function setUser(userObj) {
  localStorage.setItem(USER_KEY, JSON.stringify(userObj || {}));
}

export async function loginAdmin(email, password) {
  let response;

  try {
    response = await fetch(buildApiUrl(API_ROUTES.adminLogin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw authError('network');
  }

  if (!response.ok) {
    throw authError([400, 401, 403, 422].includes(response.status) ? 'invalid' : 'network');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw authError('network');
  }

  if (!data?.access_token) {
    throw authError('network');
  }

  setToken(data.access_token);
  setUser(data.user || {});
  return data.user || {};
}

export function logout() {
  clearToken();
  window.location.href = '/admin/index.html';
}

export async function validateAdminSession({ redirectOnFail = false } = {}) {
  const token = getToken();

  if (!token) {
    clearToken();
    if (redirectOnFail) redirectToLogin();
    return null;
  }

  let response;
  try {
    response = await fetch(buildApiUrl(API_ROUTES.adminMe), {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    if (redirectOnFail) redirectToLogin();
    return null;
  }

  if (!response.ok) {
    clearToken();
    if (redirectOnFail) redirectToLogin('expired');
    return null;
  }

  const user = await response.json();
  setUser(user);
  return user;
}

export async function requireAuth() {
  const user = await validateAdminSession({ redirectOnFail: true });
  if (!user) return null;

  document.body?.classList.remove('admin-auth-checking');
  return user;
}

export async function adminFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await fetch(buildApiUrl(path), { ...options, headers });
  } catch {
    throw new Error('network');
  }

  if (response.status === 401 || response.status === 403) {
    clearToken();
    redirectToLogin('expired');
    return null;
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function initShell() {
  _startClock();
  _bindHamburger();
  _bindLogout();
  _updateUserDisplay();
}

function redirectToLogin(reason = '') {
  const suffix = reason ? `?auth=${encodeURIComponent(reason)}` : '';
  window.location.href = `/admin/index.html${suffix}`;
}

function authError(type) {
  const err = new Error(type === 'invalid'
    ? 'E-mail ou senha inválidos.'
    : 'Não foi possível conectar ao servidor. Tente novamente.');
  err.type = type;
  return err;
}

function _startClock() {
  const el = document.getElementById('adm-clock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  };
  tick();
  setInterval(tick, 30_000);
}

function _bindHamburger() {
  const btn = document.getElementById('adm-hamburger');
  const sidebar = document.getElementById('adm-sidebar');
  const overlay = document.getElementById('adm-overlay');
  if (!btn || !sidebar) return;

  const close = () => {
    sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
  };

  btn.addEventListener('click', () => {
    const opening = !sidebar.classList.contains('is-open');
    sidebar.classList.toggle('is-open');
    if (overlay) overlay.classList.toggle('is-open', opening);
  });

  overlay?.addEventListener('click', close);
}

function _bindLogout() {
  document.getElementById('adm-logout')?.addEventListener('click', logout);
}

function _updateUserDisplay() {
  const user = getUser();
  const el = document.getElementById('adm-user-name');
  if (el && user.name) el.textContent = user.name;
}
