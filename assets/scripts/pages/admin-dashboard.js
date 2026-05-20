/**
 * admin-dashboard.js
 * ─────────────────────────────────────────────────────────────────
 * Giardini Café — Admin Dashboard Home (/admin/index.html)
 *
 * Handles:
 *   - Two-state view: login screen vs. authenticated dashboard
 *   - Login form submission (calls admin-auth.js stub)
 *   - Today's reservation metrics (calls /admin/reservations)
 *   - Finance metrics: placeholder until GET /admin/finance/summary
 * ─────────────────────────────────────────────────────────────────
 */

import { isAuthenticated, loginAdmin, validateAdminSession, initShell, adminFetch } from './admin-auth.js';
import { API_ROUTES } from '../config/api.js';

const $ = id => document.getElementById(id);

/* ── Bootstrap ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  bindLoginForm();

  if (isAuthenticated()) {
    const user = await validateAdminSession();
    if (user) showApp();
    else showLogin(getAuthMessage());
  } else {
    showLogin(getAuthMessage());
  }
});

/* ── View switching ──────────────────────────────────────────────── */
function showLogin(message = '') {
  const login = $('adm-view-login');
  const app   = $('adm-view-app');
  document.body.classList.remove('admin-auth-checking');
  if (login) login.style.display = '';
  if (app)   app.style.display   = 'none';
  showLoginError(message);
}

function showApp() {
  const login = $('adm-view-login');
  const app   = $('adm-view-app');
  document.body.classList.remove('admin-auth-checking');
  if (login) login.style.display = 'none';
  if (app)   app.style.display   = '';
  initShell();
  renderPageDate();
  loadDashboard();
}

/* ── Login form ──────────────────────────────────────────────────── */
function bindLoginForm() {
  const form  = $('adm-login-form');
  const btn   = $('adm-login-btn');
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('adm-email')?.value.trim()  ?? '';
    const pass  = $('adm-password')?.value       ?? '';
    const validationError = validateLoginFields(email, pass);

    if (validationError) {
      showLoginError(validationError);
      return;
    }

    setLoginState(btn, true);
    showLoginError('');

    try {
      await loginAdmin(email, pass);
      showApp();
    } catch (err) {
      showLoginError(err.message || 'E-mail ou senha inválidos.');
    } finally {
      setLoginState(btn, false);
    }
  });
}

function validateLoginFields(email, pass) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !email.includes('@') || !emailPattern.test(email)) {
    return 'Informe um e-mail válido.';
  }

  if (!pass.trim()) {
    return 'Informe sua senha.';
  }

  return '';
}

function showLoginError(message) {
  const errEl = $('adm-login-error');
  if (!errEl) return;
  errEl.textContent = message;
  errEl.classList.toggle('is-visible', Boolean(message));
}

function setLoginState(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('is-loading', loading);
  if (loading) {
    btn.innerHTML = `<svg class="adm-login-spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>Autenticando…`;
  } else {
    btn.textContent = 'Entrar';
  }
}

/* ── Dashboard data ──────────────────────────────────────────────── */
async function loadDashboard() {
  let reservations = [];
  try {
    const data = await adminFetch(API_ROUTES.adminReservations);
    reservations = Array.isArray(data) ? data : [];
  } catch {
    // non-critical: metrics stay at "—"
  }
  renderMetrics(reservations);
}

function renderMetrics(reservations) {
  const today     = todayISO();
  const todayList = reservations.filter(r => (r.reservation_date ?? '') === today);
  const guests    = todayList.reduce((s, r) => s + (r.party_size || 0), 0);

  animateNum($('dash-m-res-hoje'), todayList.length);
  animateNum($('dash-m-guests'),   guests);

  // Finance placeholders — wire to GET /admin/finance/summary later
  setText($('dash-m-receita'),   '—');
  setText($('dash-m-despesas'),  '—');
  setText($('dash-m-resultado'), '—');
}

/* ── Page date display ───────────────────────────────────────────── */
function renderPageDate() {
  const now = new Date();
  const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const full    = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  setText($('adm-date-weekday'), weekday.charAt(0).toUpperCase() + weekday.slice(1));
  setText($('adm-date-full'), full);
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2, '0'); }

function animateNum(el, target) {
  if (!el) return;
  const dur = 600;
  const t0  = performance.now();
  const step = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

function setText(el, v) {
  if (el) el.textContent = v;
}

function getAuthMessage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('auth') === 'expired'
    ? 'Sua sessão expirou. Faça login novamente.'
    : '';
}
