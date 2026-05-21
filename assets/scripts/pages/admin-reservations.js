/**
 * admin-reservations.js
 * ─────────────────────────────────────────────────────────────────
 * Giardini Café — Admin Reservations (/admin/reservations.html)
 *
 * Protected by /admin/me before rendering reservation data.
 * ─────────────────────────────────────────────────────────────────
 */

import { requireAuth, initShell, adminFetch } from './admin-auth.js';
import { API_ROUTES, apiFetch } from '../config/api.js';

/* ── Auth guard ──────────────────────────────────────────────────── */
const currentUser = await requireAuth();

/* ── State ───────────────────────────────────────────────────────── */
let allReservations = [];
let filtered        = [];
let activeChip      = 'all';
let searchTimer     = null;
let envOptionsReady = false;

const PAGE_LIMIT = 200;
const SEARCH_DEBOUNCE_MS = 300;
const SUPPORTED_STATUS_FILTERS = ['confirmed', 'cancelled', 'completed', 'no_show'];

/* ── DOM refs ────────────────────────────────────────────────────── */
const DOM = {
  tbody:          document.getElementById('adm-tbody'),
  cards:          document.getElementById('adm-cards'),
  tableWrap:      document.getElementById('adm-table-wrap'),
  count:          document.getElementById('adm-count'),
  searchInput:    document.getElementById('adm-search'),
  dateFilter:     document.getElementById('adm-filter-date'),
  statusFilter:   document.getElementById('adm-filter-status'),
  envFilter:      document.getElementById('adm-filter-env'),
  clearBtn:       document.getElementById('adm-clear'),
  refreshBtn:     document.getElementById('adm-refresh'),
  metricTotal:    document.getElementById('adm-m-total'),
  metricToday:    document.getElementById('adm-m-today'),
  metricGuests:   document.getElementById('adm-m-guests'),
  metricUpcoming: document.getElementById('adm-m-upcoming'),
};

/* ── Bootstrap ───────────────────────────────────────────────────── */
if (currentUser) {
  document.addEventListener('DOMContentLoaded', () => {
    initShell();
    loadEnvironmentFilterOptions();
    fetchReservations();
    bindEvents();
  });
}

/* ── Clock is handled by initShell ──────────────────────────────── */

/* ── Fetch ───────────────────────────────────────────────────────── */
async function fetchReservations() {
  setLoading(true);
  try {
    const data = await adminFetch(buildReservationsPath());
    allReservations = extractReservations(data).map(normalizeReservation);
    filtered = allReservations;
    renderMetrics();
    renderReservations(filtered, hasActiveFilters());
    updateCount(getResultTotal(data));
  } catch (err) {
    console.error('[admin-reservations] fetch error:', err);
    renderErrorState();
  } finally {
    setLoading(false);
  }
}

/* ── Normalize ───────────────────────────────────────────────────── */
function buildReservationsPath() {
  const params = new URLSearchParams();
  const search = DOM.searchInput?.value.trim() ?? '';
  const date = DOM.dateFilter?.value ?? '';
  const status = normalizeStatusFilter(DOM.statusFilter?.value ?? '');
  const environmentId = DOM.envFilter?.value ?? '';

  if (search) params.set('search', search);
  if (activeChip !== 'all') params.set('period', activeChip);
  if (activeChip === 'all' && date) params.set('date', date);
  if (status) params.set('status', status);
  if (environmentId) params.set('environment_id', environmentId);
  params.set('limit', String(PAGE_LIMIT));
  params.set('offset', '0');

  const query = params.toString();
  return query ? `${API_ROUTES.adminReservations}?${query}` : API_ROUTES.adminReservations;
}

function extractReservations(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.reservations)) return data.reservations;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getResultTotal(data) {
  const total = Number(data?.total ?? data?.count);
  return Number.isFinite(total) ? total : filtered.length;
}

function normalizeStatusFilter(status) {
  if (!status) return '';
  return SUPPORTED_STATUS_FILTERS.includes(status) ? status : '';
}

function hasActiveFilters() {
  return Boolean(
    DOM.searchInput?.value.trim() ||
    (activeChip === 'all' && DOM.dateFilter?.value) ||
    DOM.statusFilter?.value ||
    DOM.envFilter?.value ||
    activeChip !== 'all'
  );
}

function updateCount(total = filtered.length) {
  if (!DOM.count) return;
  DOM.count.textContent = `${total} reserva${total !== 1 ? 's' : ''}`;
}

function normalizeReservation(raw) {
  const clientName =
    raw.client_name ||
    raw.client?.name ||
    raw.name ||
    '';
  const clientPhone =
    raw.client_phone ||
    raw.client?.phone ||
    raw.phone ||
    '';
  const clientEmail =
    raw.client_email ||
    raw.client?.email ||
    raw.email ||
    '';

  return {
    id:      raw.id ?? '',
    name:    clientName || '—',
    email:   clientEmail || '—',
    phone:   clientPhone || '—',
    env:     raw.environment?.name ?? raw.environment_name ?? raw.environmentName ?? '—',
    envId:   raw.environment?.id ?? raw.environment_id ?? raw.environmentId ?? '',
    date:    raw.reservation_date ?? '',
    time:    raw.reservation_time ?? '',
    guests:  raw.party_size ?? 0,
    notes:   raw.notes ?? '',
    status:  raw.status ?? 'unknown',
    created: raw.created_at ?? '',
  };
}

/* ── Metrics ─────────────────────────────────────────────────────── */
function renderMetrics() {
  const today    = todayISO();
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

/* ── Env filter ──────────────────────────────────────────────────── */
async function loadEnvironmentFilterOptions() {
  if (!DOM.envFilter || envOptionsReady) return;

  try {
    const data = await apiFetch(API_ROUTES.environments);
    const envs = extractEnvironments(data)
      .filter(env => env?.id != null && env?.name)
      .slice()
      .sort((a, b) => {
        if (a.display_order != null && b.display_order != null) return a.display_order - b.display_order;
        return String(a.name).localeCompare(String(b.name), 'pt-BR');
      });

    const selected = DOM.envFilter.value;
    DOM.envFilter.innerHTML = '<option value="">Todos os ambientes</option>';

    envs.forEach(env => {
      const o = document.createElement('option');
      o.value = env.id;
      o.textContent = env.name;
      DOM.envFilter.appendChild(o);
    });

    DOM.envFilter.value = [...DOM.envFilter.options].some(option => option.value === selected)
      ? selected
      : '';
    envOptionsReady = true;
  } catch (err) {
    console.error('[admin-reservations] environments fetch error:', err);
  }
}

function extractEnvironments(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.environments)) return data.environments;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/* ── Filters ─────────────────────────────────────────────────────── */
function applyFilters() {
  fetchReservations();
}

/* ── Render ──────────────────────────────────────────────────────── */
function renderReservations(list, hasFilters = false) {
  renderTable(list, hasFilters);
  renderCards(list, hasFilters);
}

function renderTable(list, hasFilters = false) {
  if (!DOM.tbody) return;
  if (!list.length) {
    DOM.tbody.innerHTML = `<tr><td colspan="8" style="padding:0">${emptyStateHTML(hasFilters)}</td></tr>`;
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
      <td class="adm-cell-dim">${formatCreated(r.created)}</td>
    </tr>
  `).join('');
}

function renderCards(list, hasFilters = false) {
  if (!DOM.cards) return;
  if (!list.length) {
    DOM.cards.innerHTML = emptyStateHTML(hasFilters);
    return;
  }
  DOM.cards.innerHTML = list.map(r => `
    <div class="adm-card">
      <div class="adm-card-top">
        <div>
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
function emptyStateHTML(hasFilters = false) {
  const sub = hasFilters
    ? 'Nenhuma reserva corresponde aos filtros aplicados.'
    : 'Ainda não há reservas cadastradas.';
  const clearBtn = hasFilters
    ? `<button class="adm-state-clear-btn" type="button">Limpar filtros</button>`
    : '';
  return `
    <div class="adm-state">
      <div class="adm-state-icon adm-state-icon--empty">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="adm-state-title">Nenhuma reserva encontrada</div>
      <div class="adm-state-sub">${sub}</div>
      ${clearBtn}
    </div>`;
}

function renderErrorState() {
  const html = `
    <div class="adm-state">
      <div class="adm-state-icon adm-state-icon--error">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="adm-state-title">Não foi possível carregar as reservas</div>
      <div class="adm-state-sub">Verifique a conexão com o servidor e tente novamente.</div>
    </div>`;
  if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="8" style="padding:0">${html}</td></tr>`;
  if (DOM.cards) DOM.cards.innerHTML = html;
}

/* ── Loading skeletons ───────────────────────────────────────────── */
function setLoading(on) {
  if (DOM.refreshBtn) DOM.refreshBtn.classList.toggle('is-loading', on);
  if (!on || !DOM.tbody) return;

  DOM.tbody.innerHTML = Array.from({ length: 6 }, () => `
    <tr>
      <td colspan="8" style="padding:0">
        <div style="display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div class="adm-skel adm-skel--sm"></div>
          <div class="adm-skel adm-skel--lg"></div>
          <div class="adm-skel adm-skel--md"></div>
          <div class="adm-skel adm-skel--md"></div>
          <div class="adm-skel adm-skel--sm"></div>
          <div class="adm-skel adm-skel--xl"></div>
        </div>
      </td>
    </tr>`).join('');

  if (DOM.cards) {
    DOM.cards.innerHTML = Array.from({ length: 4 }, () => `
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
  }
}

/* ── Events ──────────────────────────────────────────────────────── */
function bindEvents() {
  DOM.searchInput?.addEventListener('input',  queueSearch);
  DOM.statusFilter?.addEventListener('change', applyFilters);
  DOM.envFilter?.addEventListener('change',   applyFilters);

  DOM.dateFilter?.addEventListener('change', () => {
    resetChip();
    applyFilters();
  });

  DOM.clearBtn?.addEventListener('click', clearAllFilters);

  DOM.refreshBtn?.addEventListener('click', () => {
    fetchReservations().finally(() => {
      setTimeout(() => DOM.refreshBtn?.classList.remove('is-loading'), 400);
    });
  });

  /* Event delegation for dynamically rendered clear button inside empty state */
  document.addEventListener('click', e => {
    if (e.target.matches('.adm-state-clear-btn')) clearAllFilters();
  });

  bindChips();
}

function queueSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, SEARCH_DEBOUNCE_MS);
}

function bindChips() {
  document.querySelectorAll('.adm-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeChip = btn.dataset.chip ?? 'all';
      document.querySelectorAll('.adm-filter-chip').forEach(b =>
        b.classList.toggle('is-active', b === btn)
      );
      if (activeChip !== 'all' && DOM.dateFilter) DOM.dateFilter.value = '';
      applyFilters();
    });
  });
}

function resetChip() {
  activeChip = 'all';
  document.querySelectorAll('.adm-filter-chip').forEach(b =>
    b.classList.toggle('is-active', b.dataset.chip === 'all')
  );
}

function clearAllFilters() {
  if (DOM.searchInput)  DOM.searchInput.value  = '';
  if (DOM.dateFilter)   DOM.dateFilter.value   = '';
  if (DOM.statusFilter) DOM.statusFilter.value = '';
  if (DOM.envFilter)    DOM.envFilter.value    = '';
  resetChip();
  applyFilters();
}

/* ── Formatting helpers ──────────────────────────────────────────── */
const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y) return dateStr;
  return `${String(d).padStart(2,'0')} ${MONTHS[m-1]} ${y}`;
}

function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : '—';
}

function formatCreated(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function statusBadge(status) {
  const map = {
    confirmed: ['confirmed', 'Confirmada'],
    cancelled: ['cancelled', 'Cancelada'],
    completed: ['completed', 'Concluída'],
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
