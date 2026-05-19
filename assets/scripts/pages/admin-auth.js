/**
 * admin-auth.js
 * ─────────────────────────────────────────────────────────────────
 * Giardini Café — Admin authentication utilities.
 *
 * Token storage: sessionStorage (cleared when tab is closed).
 * To connect to real backend: replace the body of loginAdmin()
 * with a real POST /admin/login request.
 * ─────────────────────────────────────────────────────────────────
 */

const TOKEN_KEY = 'adm_token';
const USER_KEY  = 'adm_user';

/* ── Token helpers ───────────────────────────────────────────────── */

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || '{}'); }
  catch { return {}; }
}

export function setUser(userObj) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(userObj));
}

/* ── Login ───────────────────────────────────────────────────────── */

/**
 * Authenticate an admin user.
 * Replace this body with a real POST /admin/login call when the
 * backend endpoint is ready.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 * @throws {Error} if credentials are missing or auth fails
 */
export async function loginAdmin(email, password) {
  if (!email || !password) {
    throw new Error('Preencha e-mail e senha.');
  }

  // TODO: replace stub with real call
  // const res = await fetch('/admin/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // if (!res.ok) throw new Error('Credenciais inválidas.');
  // const { token, user } = await res.json();
  // setToken(token);
  // setUser(user);

  // Stub: simulates network delay and accepts any non-empty credentials
  await new Promise(r => setTimeout(r, 650));
  const mockToken = 'mock_adm_' + Date.now();
  setToken(mockToken);
  setUser({ name: 'Admin', email });
}

/* ── Logout ──────────────────────────────────────────────────────── */

export function logout() {
  clearToken();
  window.location.href = '/admin/index.html';
}

/* ── Auth guard ──────────────────────────────────────────────────── */

/**
 * Call at the top of each protected page.
 * Redirects to the login screen if no valid token is present.
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/admin/index.html';
  }
}

/* ── Shell init (shared across all admin pages) ──────────────────── */

/**
 * Wire up the shared admin shell: clock, hamburger toggle, logout.
 * Call this once the shell DOM is present and the user is authenticated.
 */
export function initShell() {
  _startClock();
  _bindHamburger();
  _bindLogout();
  _updateUserDisplay();
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
  const btn     = document.getElementById('adm-hamburger');
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
  const el   = document.getElementById('adm-user-name');
  if (el && user.name) el.textContent = user.name;
}
