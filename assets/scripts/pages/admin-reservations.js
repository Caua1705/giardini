/**
 * admin-reservations.js
 * ─────────────────────────────────────────────────────────────────
 * Giardini Café — Admin Reservations Dashboard
 *
 * TODO: protect this admin page with authentication/token before
 *       real production use. Currently no auth is enforced.
 * ─────────────────────────────────────────────────────────────────
 */

import { apiFetch, API_ROUTES } from '../config/api.js';

/* ── State ───────────────────────────────────────────────────────── */
let allReservations = [];
let filtered = [];

/* ── DOM refs ────────────────────────────────────────────────────── */
const DOM = {
  tbody:         document.getElementById('adm-tbody'),
  cards:         document.getElementById('adm-cards'),
  tableWrap:     document.getElementById('adm-table-wrap'),
  count:         document.getElementById('adm-count'),
  searchInput:   document.getElementById('adm-search'),
  dateFilter:    document.getElementById('adm-filter-date'),
  statusFilter:  document.getElementById('adm-filter-status'),
  envFilter:     document.getElementById('adm-filter-env'),
  clearBtn:      document.getElementById('adm-clear'),
  refreshBtn:    document.getElementById('adm-refresh'),
  metricTotal:   document.getElementById('adm-m-total'),
  metricToday:   document.getElementById('adm-m-today'),
  metricGuests:  document.getElementById('adm-m-guests'),
  metricUpcoming:document.getElementById('adm-m-upcoming'),
  headerClock:   document.getElementById('adm-clock'),
};

/* ── Bootstrap ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  fetchReservations();
  bindEvents();
});

/* ── Clock ───────────────────────────────────────────────────────── */
function startClock() {
  function tick() {
    if (!DOM.headerClock) return;
    const now = new Date();
    DOM.headerClock.textContent = now.toLocaleString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }
  tick();
  setInterval(tick, 30_000);
}

/* ── Fetch ───────────────────────────────────────────────────────── */
async function fetchReservations() {
  setLoading(true);
  try {
    const data = await apiFetch(API_ROUTES.adminReservations);
    allReservations = Array.isArray(data) ? data.map(normalizeReservation) : [];
    populateEnvFilter();
    applyFilters();
  } catch (err) {
    console.error('[admin] fetchReservations error:', err);
    renderErrorState();
  } finally {
    setLoading(false);
  }
}

/* ── Normalize ───────────────────────────────────────────────────── */
function normalizeReservation(raw) {
  return {
    id:       raw.id ?? '',
    name:     raw.client?.name  ?? raw.name  ?? '—',
    email:    raw.client?.email ?? raw.email ?? '—',
    phone:    raw.client?.phone ?? raw.phone ?? '—',
    env:      raw.environment?.name ?? raw.environment_name ?? '—',
    date:     raw.reservation_date ?? '',
    time:     raw.reservation_time ?? '',
    guests:   raw.party_size ?? 0,
    notes:    raw.notes ?? '',
    status:   raw.status ?? 'unknown',
    created:  raw.created_at ?? '',
  };
}

/* ── Metrics ─────────────────────────────────────────────────────── */
function renderMetrics(list) {
  const today = todayISO();
  const total    = allReservations.length;
  const todayCnt = allReservations.filter(r => r.date === today).length;
  const guests   = allReservations.reduce((s, r) => s + (r.guests || 0), 0);
  const upcoming = allReservations.filter(r => r.date >= today && r.status !== 'cancelled').length;

  animateNumber(DOM.metricTotal,    total);
  animateNumber(DOM.metricToday,    todayCnt);
  animateNumber(DOM.metricGuests,   guests);
  animateNumber(DOM.metricUpcoming, upcoming);
}

function animateNumber(el, target) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const dur = 600;
  const t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(start + (target - start) * easeOut(p));
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ── Env filter options ──────────────────────────────────────────── */
function populateEnvFilter() {
  if (!DOM.envFilter) return;
  const envs = [...new Set(allReservations.map(r => r.env).filter(Boolean))].sort();
  DOM.envFilter.innerHTML = '<option value="">Todos os ambientes</option>';
  envs.forEach(env => {
    const o = document.createElement('option');
    o.value = env; o.textContent = env;
    DOM.envFilter.appendChild(o);
  });
}

/* ── Filter ──────────────────────────────────────────────────────── */
function applyFilters() {
  const q      = (DOM.searchInput?.value  ?? '').toLowerCase().trim();
  const date   =  DOM.dateFilter?.value   ?? '';
  const status =  DOM.statusFilter?.value ?? '';
  const env    =  DOM.envFilter?.value    ?? '';

  filtered = allReservations.filter(r => {
    if (date   && r.date !== date) return false;
    if (status && r.status !== status) return false;
    if (env    && r.env !== env) return false;
    if (q) {
      const hay = `${r.name} ${r.email} ${r.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  renderMetrics(filtered);
  renderReservations(filtered);

  if (DOM.count) {
    DOM.count.textContent = `${filtered.length} reserva${filtered.length !== 1 ? 's' : ''}`;
  }
}

/* ── Render ──────────────────────────────────────────────────────── */
function renderReservations(list) {
  renderTable(list);
  renderCards(list);
}

function renderTable(list) {
  if (!DOM.tbody) return;
  if (!list.length) {
    DOM.tbody.innerHTML = `<tr><td colspan="8" style="padding:0">${emptyStateHTML()}</td></tr>`;
    return;
  }
  DOM.tbody.innerHTML = list.map(r => `
    <tr>
      <td class="adm-cell-date">
        <div class="adm-cell-date-d">${formatDate(r.date)}</div>
        <div class="adm-cell-date-t">${formatTime(r.time)}</div>
      </td>
      <td>
        <div class="adm-cell-client-name">${esc(r.name)}</div>
        <div class="adm-cell-client-email">${esc(r.email)}</div>
      </td>
      <td class="adm-cell-phone">${esc(r.phone)}</td>
      <td class="adm-cell-env">${esc(r.env)}</td>
      <td class="adm-cell-guests">${r.guests}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="adm-cell-notes">
        ${r.notes
          ? `<span>${esc(r.notes)}</span>`
          : `<span class="adm-cell-notes-empty">—</span>`}
      </td>
      <td class="adm-cell-notes" style="font-size:0.70rem;color:var(--adm-text-dim);">
        ${formatCreated(r.created)}
      </td>
    </tr>
  `).join('');
}

function renderCards(list) {
  if (!DOM.cards) return;
  if (!list.length) {
    DOM.cards.innerHTML = emptyStateHTML();
    return;
  }
  DOM.cards.innerHTML = list.map(r => `
    <div class="adm-card">
      <div class="adm-card-top">
        <div class="adm-card-datetime">
          <div class="adm-card-date">${formatDate(r.date)}</div>
          <div class="adm-card-time">${formatTime(r.time)}</div>
        </div>
        ${statusBadge(r.status)}
      </div>
      <div class="adm-card-body">
        <div class="adm-card-row">
          <span class="adm-card-key">Cliente</span>
          <span class="adm-card-val">${esc(r.name)}</span>
        </div>
        <div class="adm-card-row">
          <span class="adm-card-key">Telefone</span>
          <span class="adm-card-val">${esc(r.phone)}</span>
        </div>
        <div class="adm-card-row">
          <span class="adm-card-key">Ambiente</span>
          <span class="adm-card-val">${esc(r.env)}</span>
        </div>
        <div class="adm-card-row">
          <span class="adm-card-key">Pessoas</span>
          <span class="adm-card-val">${r.guests}</span>
        </div>
        ${r.notes ? `<div class="adm-card-notes">${esc(r.notes)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

/* ── States ──────────────────────────────────────────────────────── */
function emptyStateHTML() {
  return `
    <div class="adm-state">
      <div class="adm-state-icon adm-state-icon--empty">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="adm-state-title">Nenhuma reserva encontrada</div>
      <div class="adm-state-sub">Tente ajustar os filtros ou aguarde novas reservas.</div>
    </div>`;
}

function renderErrorState() {
  const html = `
    <div class="adm-state">
      <div class="adm-state-icon adm-state-icon--error">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="adm-state-title">Não foi possível carregar as reservas</div>
      <div class="adm-state-sub">Verifique a conexão com o servidor e tente novamente.</div>
    </div>`;
  if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="8" style="padding:0">${html}</td></tr>`;
  if (DOM.cards) DOM.cards.innerHTML = html;
}

/* ── Loading ─────────────────────────────────────────────────────── */
function setLoading(on) {
  if (!DOM.tbody) return;
  if (!on) return;
  const rows = Array.from({ length: 6 }, () => `
    <tr class="adm-skeleton-row">
      <td colspan="8" style="padding:0">
        <div class="adm-skeleton-row">
          <div class="adm-skel adm-skel--sm"></div>
          <div class="adm-skel adm-skel--lg"></div>
          <div class="adm-skel adm-skel--md"></div>
          <div class="adm-skel adm-skel--md"></div>
          <div class="adm-skel adm-skel--sm"></div>
          <div class="adm-skel adm-skel--xl"></div>
        </div>
      </td>
    </tr>`).join('');
  DOM.tbody.innerHTML = rows;
  if (DOM.cards) DOM.cards.innerHTML = Array.from({length:4}, () => `
    <div class="adm-card" style="padding:1.25rem">
      <div style="display:flex;gap:1rem;margin-bottom:1rem">
        <div class="adm-skel adm-skel--md"></div>
        <div class="adm-skel adm-skel--sm" style="margin-left:auto"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.6rem">
        <div class="adm-skel adm-skel--xl"></div>
        <div class="adm-skel adm-skel--lg"></div>
        <div class="adm-skel adm-skel--md"></div>
      </div>
    </div>`).join('');
  if (DOM.refreshBtn) DOM.refreshBtn.classList.toggle('is-loading', on);
}

/* ── Events ──────────────────────────────────────────────────────── */
function bindEvents() {
  DOM.searchInput?.addEventListener('input',  applyFilters);
  DOM.dateFilter?.addEventListener('change',  applyFilters);
  DOM.statusFilter?.addEventListener('change',applyFilters);
  DOM.envFilter?.addEventListener('change',   applyFilters);

  DOM.clearBtn?.addEventListener('click', () => {
    if (DOM.searchInput)  DOM.searchInput.value  = '';
    if (DOM.dateFilter)   DOM.dateFilter.value   = '';
    if (DOM.statusFilter) DOM.statusFilter.value = '';
    if (DOM.envFilter)    DOM.envFilter.value    = '';
    applyFilters();
  });

  DOM.refreshBtn?.addEventListener('click', () => {
    DOM.refreshBtn.classList.add('is-loading');
    fetchReservations().finally(() => {
      setTimeout(() => DOM.refreshBtn?.classList.remove('is-loading'), 500);
    });
  });
}

/* ── Helpers ─────────────────────────────────────────────────────── */
const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y) return dateStr;
  return `${String(d).padStart(2,'0')} ${MONTHS[m-1]} ${y}`;
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr.slice(0, 5);
}

function formatCreated(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  } catch { return iso; }
}

function todayISO() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2,'0');
  const d = String(t.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function statusBadge(status) {
  const map = {
    confirmed: ['confirmed', 'Confirmada'],
    pending:   ['pending',   'Pendente'],
    cancelled: ['cancelled', 'Cancelada'],
    no_show:   ['no_show',   'No-show'],
  };
  const [cls, label] = map[status] ?? ['unknown', status || 'Desconhecido'];
  return `<span class="adm-badge adm-badge--${cls}">
    <span class="adm-badge-dot"></span>${label}
  </span>`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
