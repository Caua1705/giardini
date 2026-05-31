/**
 * Giardini Café - Admin Reservations
 * Reservations module with 4 internal views:
 *   Operação · Calendário · Lista · Ambientes
 */

import { requireAuth, initShell, adminFetch } from './admin-auth.js';
import { API_ROUTES, apiFetch } from '../config/api.js';

const currentUser = await requireAuth();

const PAGE_LIMIT = 200;
const SEARCH_DEBOUNCE_MS = 220;
const PERIODS = new Set(['today', 'tomorrow', 'week', 'all']);
const STATUS_CHIPS = new Set(['all', 'confirmed', 'pending', 'cancelled', 'upcoming']);
const VIEWS = new Set(['operacao', 'calendario', 'lista', 'ambientes']);

const state = {
  reservations: [],
  environments: [],
  activeView: 'operacao',
  activePeriod: 'all',
  activeStatusChip: 'all',
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  calendarSelectedDate: null,
  ambientesPeriod: 'today',
  loading: false,
  error: null,
  selectedReservationId: null,
  drawerNotice: null,
  searchTimer: null,
  listaSearchTimer: null,
};

const DOM = {
  // Tabs / views
  tabs: document.getElementById('adm-rsv-tabs'),
  views: document.querySelectorAll('.adm-rsv-view'),

  // Operação
  cards: document.getElementById('adm-cards'),
  agenda: document.getElementById('adm-agenda'),
  agendaTitle: document.getElementById('adm-agenda-title'),
  agendaMeta: document.getElementById('adm-agenda-meta'),
  count: document.getElementById('adm-count'),
  search: document.getElementById('adm-search'),
  date: document.getElementById('adm-filter-date'),
  status: document.getElementById('adm-filter-status'),
  environment: document.getElementById('adm-filter-env'),
  clear: document.getElementById('adm-clear'),
  periodTabs: document.getElementById('adm-period-tabs'),
  statusChips: document.getElementById('adm-status-chips'),
  metricToday: document.getElementById('adm-m-today'),
  metricGuests: document.getElementById('adm-m-guests'),
  metricNextTime: document.getElementById('adm-m-next-time'),
  metricNextSub: document.getElementById('adm-m-next-sub'),
  metricEnv: document.getElementById('adm-m-env'),
  metricEnvSub: document.getElementById('adm-m-env-sub'),

  // Calendário
  calHeading: document.getElementById('adm-cal-heading'),
  calGrid: document.getElementById('adm-cal-grid'),
  calDayPanel: document.getElementById('adm-cal-day-panel'),
  calPrev: document.getElementById('adm-cal-prev'),
  calNext: document.getElementById('adm-cal-next'),
  calToday: document.getElementById('adm-cal-today'),

  // Lista
  listaSearch: document.getElementById('adm-lista-search'),
  listaStatus: document.getElementById('adm-lista-status'),
  listaTbody: document.getElementById('adm-lista-tbody'),
  listaCount: document.getElementById('adm-lista-count'),

  // Ambientes
  envPeriod: document.getElementById('adm-env-period'),
  envGrid: document.getElementById('adm-env-grid'),

  // Page-level actions
  refresh: document.getElementById('adm-refresh'),
  createButton: document.getElementById('adm-create-reservation'),

  // Drawer & create modal
  drawer: document.getElementById('adm-reservation-drawer'),
  drawerContent: document.getElementById('adm-drawer-content'),
  drawerBackdrop: document.getElementById('adm-drawer-backdrop'),
  createModal: document.getElementById('adm-create-modal'),
  createBackdrop: document.getElementById('adm-create-backdrop'),
  createForm: document.getElementById('adm-create-form'),
  createClose: document.getElementById('adm-create-close'),
  createCancel: document.getElementById('adm-create-cancel'),
  createEnvironment: document.getElementById('adm-create-environment'),
  createFeedback: document.getElementById('adm-create-feedback'),
};

if (currentUser) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReservationsPage);
  } else {
    initReservationsPage();
  }
}

function initReservationsPage() {
  initShell();
  bindEvents();
  loadCreateEnvironments();
  fetchReservations();
}

// ─────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────

async function fetchReservations() {
  state.loading = true;
  state.error = null;
  renderLoading();

  try {
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_LIMIT));
    params.set('offset', '0');
    const data = await adminFetch(`${API_ROUTES.adminReservations}?${params.toString()}`);
    const list = extractReservations(data).map(normalizeReservation);
    state.reservations = sortReservations(list);
    renderEnvironmentFilter();
    renderActiveView();
  } catch (error) {
    console.error('[admin-reservations] fetch error:', error);
    state.error = error;
    renderError();
  } finally {
    state.loading = false;
    DOM.refresh?.classList.remove('is-loading');
  }
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

function normalizeReservation(raw) {
  const client = raw.client ?? {};
  const environment = raw.environment ?? {};
  const name = raw.client_name ?? client.name ?? raw.name ?? '';
  const email = raw.client_email ?? client.email ?? raw.email ?? '';
  const phone = raw.client_phone ?? client.phone ?? raw.phone ?? '';
  const envName = raw.environment_name ?? environment.name ?? raw.environmentName ?? '';
  const envId = raw.environment_id ?? environment.id ?? raw.environmentId ?? '';

  return {
    id: String(raw.id ?? ''),
    date: raw.reservation_date ?? '',
    time: raw.reservation_time ?? '',
    guests: Number(raw.party_size ?? 0),
    status: raw.status ?? 'unknown',
    notes: raw.notes ?? '',
    createdAt: raw.created_at ?? '',
    clientName: name || 'Sem nome',
    clientEmail: email || '',
    clientPhone: phone || '',
    environmentName: envName || 'Ambiente não informado',
    environmentId: envId ? String(envId) : '',
    environmentMaxCapacity: Number(raw.environment_max_capacity ?? environment.max_capacity ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────
// Sorting & filtering helpers (shared)
// ─────────────────────────────────────────────────────────────────

function sortReservations(list) {
  return [...list].sort((a, b) => {
    const cancelA = a.status === 'cancelled' ? 1 : 0;
    const cancelB = b.status === 'cancelled' ? 1 : 0;
    if (cancelA !== cancelB) return cancelA - cancelB;
    return reservationSortKey(a) - reservationSortKey(b);
  });
}

function reservationSortKey(reservation) {
  if (!reservation.date) return Number.POSITIVE_INFINITY;
  const time = reservation.time ? String(reservation.time).slice(0, 5) : '00:00';
  const date = new Date(`${reservation.date}T${time}:00`);
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime();
}

function filterByPeriod(list, period) {
  if (period === 'all') return list;
  const today = todayISO();
  if (period === 'today') return list.filter(r => r.date === today);
  if (period === 'tomorrow') {
    const tomorrow = isoDaysFromToday(1);
    return list.filter(r => r.date === tomorrow);
  }
  if (period === 'week') {
    const start = today;
    const end = isoDaysFromToday(7);
    return list.filter(r => r.date >= start && r.date <= end);
  }
  return list;
}

function filterByStatusChip(list, chip) {
  if (chip === 'all') return list;
  if (chip === 'upcoming') {
    return list.filter(r => r.status !== 'cancelled' && isUpcoming(r));
  }
  return list.filter(r => r.status === chip);
}

function groupByDate(list) {
  const map = new Map();
  list.forEach(reservation => {
    const key = reservation.date || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(reservation);
  });
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

// ─────────────────────────────────────────────────────────────────
// View switching
// ─────────────────────────────────────────────────────────────────

function setActiveView(view) {
  if (!VIEWS.has(view)) view = 'operacao';
  state.activeView = view;

  if (view === 'calendario' && !state.calendarSelectedDate) {
    state.calendarSelectedDate = todayISO();
  }

  DOM.tabs?.querySelectorAll('.adm-rsv-tab').forEach(tab => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  document.querySelectorAll('.adm-rsv-view').forEach(section => {
    const isActive = section.dataset.view === view;
    section.hidden = !isActive;
    section.classList.toggle('is-active', isActive);
  });

  renderActiveView();
}

function renderActiveView() {
  if (state.activeView === 'operacao') renderOperacaoView();
  else if (state.activeView === 'calendario') renderCalendarioView();
  else if (state.activeView === 'lista') renderListaView();
  else if (state.activeView === 'ambientes') renderAmbientesView();
}

// ═══════════════════════════════════════════════════════════════════
// VIEW: OPERAÇÃO
// ═══════════════════════════════════════════════════════════════════

function renderOperacaoView() {
  const filtered = getFilteredReservations();
  renderMetrics(filtered);
  renderAgenda(filtered);
  renderReservationCards(filtered);
  updateAgendaTitle();
  updateCount(filtered.length);
}

function getFilteredReservations() {
  let list = state.reservations;

  list = filterByPeriod(list, state.activePeriod);
  list = filterByStatusChip(list, state.activeStatusChip);

  const search = (DOM.search?.value || '').trim().toLowerCase();
  if (search) {
    const digits = search.replace(/\D/g, '');
    list = list.filter(reservation => {
      const phone = cleanPhone(reservation.clientPhone);
      return reservation.clientName.toLowerCase().includes(search) ||
        reservation.clientEmail.toLowerCase().includes(search) ||
        (digits && phone.includes(digits));
    });
  }

  if (DOM.date?.value) {
    list = list.filter(reservation => reservation.date === DOM.date.value);
  }

  const statusValue = DOM.status?.value;
  if (statusValue) {
    list = list.filter(reservation => reservation.status === statusValue);
  }

  const envValue = DOM.environment?.value;
  if (envValue) {
    const envFilter = parseEnvironmentFilter(envValue);
    if (envFilter.type === 'id') {
      list = list.filter(reservation => reservation.environmentId === envFilter.value);
    } else if (envFilter.type === 'name') {
      list = list.filter(reservation => reservation.environmentName === envFilter.value);
    }
  }

  return list;
}

function renderMetrics(filteredList) {
  const today = todayISO();
  const todayReservations = state.reservations.filter(r =>
    r.date === today && r.status !== 'cancelled'
  );
  const guestsToday = todayReservations.reduce((sum, r) => sum + r.guests, 0);
  const next = getNextReservation(state.reservations);
  const popularEnv = getMostRequestedEnvironment(filteredList.length ? filteredList : state.reservations);

  setMetric(DOM.metricToday, todayReservations.length);
  setMetric(DOM.metricGuests, guestsToday);

  if (DOM.metricNextTime && DOM.metricNextSub) {
    if (next) {
      DOM.metricNextTime.textContent = formatTime(next.time);
      const parts = [];
      const datePart = formatNextDate(next.date);
      if (datePart) parts.push(`<strong class="adm-metric-strong">${esc(datePart)}</strong>`);
      parts.push(esc(next.environmentName));
      parts.push(`${next.guests} ${next.guests === 1 ? 'convidado' : 'convidados'}`);
      DOM.metricNextSub.innerHTML = parts.join(' <span class="adm-metric-sep">·</span> ');
    } else {
      DOM.metricNextTime.textContent = '—';
      DOM.metricNextSub.textContent = 'Nenhuma próxima reserva';
    }
  }

  if (DOM.metricEnv && DOM.metricEnvSub) {
    if (popularEnv) {
      DOM.metricEnv.textContent = popularEnv.name;
      DOM.metricEnvSub.textContent = `${popularEnv.count} ${popularEnv.count === 1 ? 'reserva' : 'reservas'} no período selecionado`;
    } else {
      DOM.metricEnv.textContent = '—';
      DOM.metricEnvSub.textContent = 'Sem dados para o período';
    }
  }
}

function updateAgendaTitle() {
  if (!DOM.agendaTitle) return;
  const labels = {
    today: 'Hoje',
    tomorrow: 'Amanhã',
    week: 'Próximos 7 dias',
    all: 'Agenda',
  };
  DOM.agendaTitle.textContent = labels[state.activePeriod] || 'Agenda';
}

function renderAgenda(list) {
  if (!DOM.agenda) return;
  const active = list.filter(r => r.status !== 'cancelled');

  if (!active.length) {
    DOM.agenda.innerHTML = `<div class="adm-agenda-empty">${calendarIcon()}<span>Nenhuma reserva no período.</span></div>`;
    if (DOM.agendaMeta) DOM.agendaMeta.textContent = '0 reservas';
    return;
  }

  if (DOM.agendaMeta) {
    DOM.agendaMeta.textContent = `${active.length} ${active.length === 1 ? 'reserva' : 'reservas'}`;
  }

  const next = getNextReservation(active);
  const flat = state.activePeriod === 'today' || state.activePeriod === 'tomorrow';

  if (flat) {
    DOM.agenda.innerHTML = active
      .map(r => agendaItemHTML(r, r.id === next?.id))
      .join('');
    return;
  }

  const groups = groupByDate(active);
  DOM.agenda.innerHTML = groups
    .map(([date, items]) => `
      <div class="adm-agenda-group">
        <div class="adm-agenda-group-date">
          <span class="adm-agenda-group-day">${formatGroupDate(date)}</span>
          <span class="adm-agenda-group-count">${items.length}</span>
        </div>
        <div class="adm-agenda-group-items">
          ${items.map(r => agendaItemHTML(r, r.id === next?.id)).join('')}
        </div>
      </div>
    `).join('');
}

function agendaItemHTML(reservation, isNext) {
  return `
    <button class="adm-agenda-item${isNext ? ' is-next' : ''}" data-reservation-id="${esc(reservation.id)}" type="button">
      <div class="adm-agenda-time">
        ${formatTime(reservation.time)}
        ${isNext ? '<span class="adm-agenda-next-flag">Próxima</span>' : ''}
      </div>
      <div class="adm-agenda-info">
        <div class="adm-agenda-client">${esc(reservation.clientName)}</div>
        <div class="adm-agenda-sub">${esc(reservation.environmentName)} · ${reservation.guests} ${reservation.guests === 1 ? 'convidado' : 'convidados'}</div>
      </div>
      <div class="adm-agenda-status">${statusBadge(reservation.status)}</div>
    </button>
  `;
}

function renderReservationCards(list) {
  if (!DOM.cards) return;
  if (!list.length) {
    DOM.cards.innerHTML = emptyStateHTML();
    return;
  }
  const today = todayISO();
  const next = getNextReservation(list);
  DOM.cards.innerHTML = list
    .map(r => reservationCardHTML(r, r.id === next?.id, r.date === today))
    .join('');
}

function reservationCardHTML(reservation, isNext, isToday) {
  const cancelled = reservation.status === 'cancelled';
  const classes = [
    'adm-reservation-card',
    isNext ? 'is-next' : '',
    isToday && !cancelled ? 'is-today' : '',
    cancelled ? 'is-cancelled' : '',
  ].filter(Boolean).join(' ');

  const notesPreview = reservation.notes ? truncate(reservation.notes, 110) : '';

  return `
    <article class="${classes}" data-reservation-id="${esc(reservation.id)}" tabindex="0">
      ${isNext ? '<div class="adm-rc-flag">Próxima reserva</div>' : isToday && !cancelled ? '<div class="adm-rc-flag adm-rc-flag--today">Hoje</div>' : ''}
      <div class="adm-rc-head">
        <div class="adm-rc-head-main">
          <div class="adm-rc-client">${esc(reservation.clientName)}</div>
          <div class="adm-rc-when">${formatDate(reservation.date)} <span class="adm-rc-when-sep">·</span> <span class="adm-rc-when-time">${formatTime(reservation.time)}</span></div>
        </div>
        ${statusBadge(reservation.status)}
      </div>
      <div class="adm-rc-meta">
        <span class="adm-rc-pill">${envIcon()}<span>${esc(reservation.environmentName)}</span></span>
        <span class="adm-rc-pill">${peopleIcon()}<span>${reservation.guests} ${reservation.guests === 1 ? 'convidado' : 'convidados'}</span></span>
      </div>
      ${notesPreview ? `<div class="adm-rc-notes">${noteIcon()}<span>${esc(notesPreview)}</span></div>` : ''}
      <div class="adm-rc-actions">
        <button class="adm-rc-action adm-rc-action--primary" type="button" data-action="view-details" data-id="${esc(reservation.id)}">Ver detalhes</button>
        ${!cancelled
          ? `<button class="adm-rc-action adm-rc-action--ghost" type="button" data-action="cancel-reservation" data-id="${esc(reservation.id)}">Cancelar</button>`
          : ''}
      </div>
    </article>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// VIEW: CALENDÁRIO
// ═══════════════════════════════════════════════════════════════════

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function renderCalendarioView() {
  renderCalendar();
}

function renderCalendar() {
  if (!DOM.calGrid || !DOM.calHeading) return;

  const year = state.calendarYear;
  const month = state.calendarMonth;
  DOM.calHeading.textContent = `${MONTH_NAMES[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const byDate = new Map();
  state.reservations
    .filter(r => r.status !== 'cancelled')
    .forEach(r => {
      if (!r.date) return;
      if (!byDate.has(r.date)) byDate.set(r.date, { count: 0, guests: 0 });
      const entry = byDate.get(r.date);
      entry.count++;
      entry.guests += r.guests;
    });

  const today = todayISO();
  const cells = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push('<div class="adm-cal-cell adm-cal-cell--blank" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const stats = byDate.get(iso);
    const isToday = iso === today;
    const isSelected = iso === state.calendarSelectedDate;
    const classes = [
      'adm-cal-cell',
      isToday ? 'is-today' : '',
      isSelected ? 'is-selected' : '',
      stats ? 'has-data' : '',
    ].filter(Boolean).join(' ');
    cells.push(`
      <button type="button" class="${classes}" data-cal-date="${iso}" role="gridcell" aria-label="${day} ${MONTH_NAMES[month]}${stats ? `, ${stats.count} reservas` : ''}">
        <span class="adm-cal-day">${day}</span>
        ${stats ? `
          <span class="adm-cal-count">${stats.count} ${stats.count === 1 ? 'reserva' : 'reservas'}</span>
          <span class="adm-cal-guests">${stats.guests} ${stats.guests === 1 ? 'convidado' : 'convidados'}</span>
        ` : ''}
      </button>
    `);
  }

  DOM.calGrid.innerHTML = cells.join('');
  renderCalendarDayPanel();
}

function renderCalendarDayPanel() {
  if (!DOM.calDayPanel) return;
  const selected = state.calendarSelectedDate;

  if (!selected) {
    DOM.calDayPanel.innerHTML = `
      <div class="adm-cal-empty-pick">
        ${calendarIcon()}
        <span>Selecione um dia no calendário para ver as reservas.</span>
      </div>`;
    return;
  }

  const list = state.reservations
    .filter(r => r.date === selected)
    .sort((a, b) => {
      const cA = a.status === 'cancelled' ? 1 : 0;
      const cB = b.status === 'cancelled' ? 1 : 0;
      if (cA !== cB) return cA - cB;
      return reservationSortKey(a) - reservationSortKey(b);
    });

  const formatted = formatDate(selected);
  const activeCount = list.filter(r => r.status !== 'cancelled').length;

  if (!list.length) {
    DOM.calDayPanel.innerHTML = `
      <header class="adm-cal-day-head">
        <div>
          <span class="adm-cal-day-kicker">Detalhes do dia</span>
          <h3 class="adm-cal-day-title">${esc(formatted)}</h3>
        </div>
      </header>
      <div class="adm-cal-empty-pick">${calendarIcon()}<span>Nenhuma reserva neste dia.</span></div>
    `;
    return;
  }

  DOM.calDayPanel.innerHTML = `
    <header class="adm-cal-day-head">
      <div>
        <span class="adm-cal-day-kicker">Reservas de</span>
        <h3 class="adm-cal-day-title">${esc(formatted)}</h3>
      </div>
      <span class="adm-cal-day-meta">${activeCount} ${activeCount === 1 ? 'reserva ativa' : 'reservas ativas'}</span>
    </header>
    <div class="adm-cal-day-list">
      ${list.map(calendarDayRowHTML).join('')}
    </div>
  `;
}

function calendarDayRowHTML(reservation) {
  const cancelled = reservation.status === 'cancelled';
  return `
    <button type="button" class="adm-cal-day-row${cancelled ? ' is-cancelled' : ''}" data-reservation-id="${esc(reservation.id)}">
      <span class="adm-cal-day-time">${formatTime(reservation.time)}</span>
      <span class="adm-cal-day-info">
        <span class="adm-cal-day-client">${esc(reservation.clientName)}</span>
        <span class="adm-cal-day-sub">${esc(reservation.environmentName)} · ${reservation.guests} ${reservation.guests === 1 ? 'convidado' : 'convidados'}</span>
      </span>
      ${statusBadge(reservation.status)}
    </button>
  `;
}

function navigateCalendar(delta) {
  let month = state.calendarMonth + delta;
  let year = state.calendarYear;
  while (month < 0) { month += 12; year--; }
  while (month > 11) { month -= 12; year++; }
  state.calendarMonth = month;
  state.calendarYear = year;
  renderCalendar();
}

function goToCalendarToday() {
  const now = new Date();
  state.calendarYear = now.getFullYear();
  state.calendarMonth = now.getMonth();
  state.calendarSelectedDate = todayISO();
  renderCalendar();
}

// ═══════════════════════════════════════════════════════════════════
// VIEW: LISTA
// ═══════════════════════════════════════════════════════════════════

function renderListaView() {
  if (!DOM.listaTbody) return;

  const search = (DOM.listaSearch?.value || '').trim().toLowerCase();
  const status = DOM.listaStatus?.value || '';

  let list = state.reservations.slice();
  if (search) {
    const digits = search.replace(/\D/g, '');
    list = list.filter(r => {
      const phone = cleanPhone(r.clientPhone);
      return r.clientName.toLowerCase().includes(search) ||
        r.clientEmail.toLowerCase().includes(search) ||
        (digits && phone.includes(digits));
    });
  }
  if (status) list = list.filter(r => r.status === status);

  if (DOM.listaCount) {
    DOM.listaCount.textContent = `${list.length} ${list.length === 1 ? 'reserva' : 'reservas'}`;
  }

  if (!list.length) {
    DOM.listaTbody.innerHTML = `<tr><td colspan="7" class="adm-state-cell">${emptyStateHTML()}</td></tr>`;
    return;
  }

  DOM.listaTbody.innerHTML = list.map(r => `
    <tr class="adm-reservation-row${r.status === 'cancelled' ? ' is-cancelled' : ''}" data-reservation-id="${esc(r.id)}" tabindex="0">
      <td class="adm-cell-date">
        <div class="adm-cell-date-d">${formatDate(r.date)}</div>
        <div class="adm-cell-date-t">${formatTime(r.time)}</div>
      </td>
      <td><div class="adm-cell-client-name">${esc(r.clientName)}</div></td>
      <td class="adm-cell-phone">${esc(formatPhone(r.clientPhone) || '--')}</td>
      <td class="adm-cell-env">${esc(r.environmentName)}</td>
      <td class="adm-cell-guests"><span>${peopleIcon()}${r.guests}</span></td>
      <td>${statusBadge(r.status)}</td>
      <td class="adm-cell-actions">
        <button class="adm-table-action" type="button" data-action="view-details" data-id="${esc(r.id)}">Detalhes</button>
        ${r.status !== 'cancelled'
          ? `<button class="adm-table-action adm-table-action--danger" type="button" data-action="cancel-reservation" data-id="${esc(r.id)}">Cancelar</button>`
          : ''}
      </td>
    </tr>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════
// VIEW: AMBIENTES
// ═══════════════════════════════════════════════════════════════════

function renderAmbientesView() {
  if (!DOM.envGrid) return;

  const period = state.ambientesPeriod;
  const filtered = filterByPeriod(state.reservations, period)
    .filter(r => r.status !== 'cancelled');

  const map = new Map();

  // Seed with all known environments (so empty ones still show up).
  state.environments.forEach(env => {
    const key = String(env.id);
    map.set(key, {
      key,
      id: String(env.id),
      name: env.name,
      reservations: [],
      guests: 0,
    });
  });

  // Add environments that only appear via reservations (fallback).
  filtered.forEach(r => {
    const key = r.environmentId || `name:${r.environmentName}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        id: r.environmentId,
        name: r.environmentName,
        reservations: [],
        guests: 0,
      });
    }
    const entry = map.get(key);
    entry.reservations.push(r);
    entry.guests += r.guests;
  });

  const envs = [...map.values()].sort((a, b) => {
    if (b.reservations.length !== a.reservations.length) {
      return b.reservations.length - a.reservations.length;
    }
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  if (!envs.length) {
    DOM.envGrid.innerHTML = `
      <div class="adm-env-empty">${calendarIcon()}<span>Nenhum ambiente disponível.</span></div>`;
    return;
  }

  DOM.envGrid.innerHTML = envs.map(environmentCardHTML).join('');
}

function environmentCardHTML(env) {
  const sorted = env.reservations
    .slice()
    .sort((a, b) => reservationSortKey(a) - reservationSortKey(b));
  const next = getNextReservation(sorted);
  const visible = sorted.slice(0, 5);
  const remaining = sorted.length - visible.length;

  const periodLabels = {
    today: 'hoje',
    tomorrow: 'amanhã',
    week: 'na semana',
    all: 'no total',
  };
  const periodLabel = periodLabels[state.ambientesPeriod] || '';

  const isBusy = sorted.length > 0;

  return `
    <article class="adm-env-card${isBusy ? '' : ' is-empty'}">
      <header class="adm-env-card-head">
        <div class="adm-env-card-head-main">
          <h3 class="adm-env-name">${esc(env.name)}</h3>
          <p class="adm-env-period-label">${sorted.length} ${sorted.length === 1 ? 'reserva' : 'reservas'} ${periodLabel}</p>
        </div>
        <span class="adm-env-availability${isBusy ? ' is-busy' : ''}" title="${isBusy ? 'Com reservas' : 'Sem reservas'}">
          <span class="adm-env-availability-dot"></span>
          ${isBusy ? 'Ocupado' : 'Livre'}
        </span>
      </header>
      <div class="adm-env-stats">
        <div class="adm-env-stat">
          <span class="adm-env-stat-key">Convidados</span>
          <span class="adm-env-stat-val">${env.guests}</span>
        </div>
        <div class="adm-env-stat">
          <span class="adm-env-stat-key">Próxima</span>
          <span class="adm-env-stat-val${next ? '' : ' is-empty'}">${next ? formatTime(next.time) : '—'}</span>
        </div>
      </div>
      ${sorted.length ? `
        <div class="adm-env-list">
          ${visible.map(r => `
            <button type="button" class="adm-env-list-row" data-reservation-id="${esc(r.id)}">
              <span class="adm-env-list-time">${formatTime(r.time)}</span>
              <span class="adm-env-list-info">
                <span class="adm-env-list-client">${esc(r.clientName)}</span>
                <span class="adm-env-list-sub">${r.guests} ${r.guests === 1 ? 'convidado' : 'convidados'}</span>
              </span>
            </button>
          `).join('')}
          ${remaining > 0 ? `<span class="adm-env-list-more">+${remaining} ${remaining === 1 ? 'reserva' : 'reservas'}</span>` : ''}
        </div>
      ` : '<div class="adm-env-list-empty">Sem reservas neste período</div>'}
    </article>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// Loading / error / empty
// ═══════════════════════════════════════════════════════════════════

function renderLoading() {
  DOM.refresh?.classList.add('is-loading');
  [DOM.metricToday, DOM.metricGuests, DOM.metricNextTime, DOM.metricEnv].forEach(el => {
    if (el) el.textContent = '—';
  });
  if (DOM.metricNextSub) DOM.metricNextSub.textContent = 'Carregando...';
  if (DOM.metricEnvSub) DOM.metricEnvSub.textContent = 'Carregando...';

  if (DOM.agenda) {
    DOM.agenda.innerHTML = Array.from({ length: 4 }, () => `
      <div class="adm-agenda-skeleton">
        <span class="adm-skel adm-skel--sm"></span>
        <span class="adm-skel adm-skel--xl"></span>
      </div>
    `).join('');
  }

  if (DOM.cards) {
    DOM.cards.innerHTML = Array.from({ length: 4 }, () => `
      <div class="adm-reservation-card adm-rc-skeleton">
        <span class="adm-skel adm-skel--lg"></span>
        <span class="adm-skel adm-skel--md"></span>
        <span class="adm-skel adm-skel--xl"></span>
      </div>
    `).join('');
  }
}

function renderError() {
  const html = `
    <div class="adm-state">
      <div class="adm-state-icon adm-state-icon--error">${alertIcon()}</div>
      <div class="adm-state-title">Não foi possível carregar as reservas</div>
      <div class="adm-state-sub">Verifique a conexão com o servidor e tente novamente.</div>
      <button class="adm-state-clear-btn" type="button" data-action="retry">Tentar novamente</button>
    </div>`;
  if (DOM.cards) DOM.cards.innerHTML = html;
  if (DOM.agenda) DOM.agenda.innerHTML = html;
  if (DOM.listaTbody) DOM.listaTbody.innerHTML = `<tr><td colspan="7" class="adm-state-cell">${html}</td></tr>`;
  if (DOM.calGrid) DOM.calGrid.innerHTML = '';
  if (DOM.calDayPanel) DOM.calDayPanel.innerHTML = html;
  if (DOM.envGrid) DOM.envGrid.innerHTML = html;
  updateCount(0);
}

function emptyStateHTML() {
  const hasFilters = hasActiveFilters();
  return `
    <div class="adm-state">
      <div class="adm-state-icon adm-state-icon--empty">${calendarIcon()}</div>
      <div class="adm-state-title">Nenhuma reserva encontrada</div>
      <div class="adm-state-sub">${hasFilters ? 'Ajuste os filtros ou crie uma nova reserva.' : 'Ainda não há reservas cadastradas.'}</div>
      <div class="adm-state-actions">
        ${hasFilters ? '<button class="adm-state-clear-btn" type="button" data-action="clear-filters">Limpar filtros</button>' : ''}
        <button class="adm-state-clear-btn adm-state-clear-btn--primary" type="button" data-action="open-create">+ Nova reserva</button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// Drawer
// ═══════════════════════════════════════════════════════════════════

function openReservationDrawer(reservation) {
  if (!reservation || !DOM.drawer || !DOM.drawerContent || !DOM.drawerBackdrop) return;
  state.selectedReservationId = reservation.id;
  state.drawerNotice = null;
  renderDrawer(reservation);
  DOM.drawerBackdrop.hidden = false;
  requestAnimationFrame(() => {
    DOM.drawer?.classList.add('is-open');
    DOM.drawerBackdrop?.classList.add('is-open');
  });
  DOM.drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('adm-drawer-open');
}

function renderDrawer(reservation = findReservation(state.selectedReservationId)) {
  if (!reservation || !DOM.drawerContent) return;
  DOM.drawerContent.innerHTML = drawerHTML(reservation);
}

function closeReservationDrawer() {
  if (!DOM.drawer || !DOM.drawerBackdrop) return;
  state.selectedReservationId = null;
  state.drawerNotice = null;
  DOM.drawer.classList.remove('is-open');
  DOM.drawerBackdrop.classList.remove('is-open');
  DOM.drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('adm-drawer-open');
  window.setTimeout(() => {
    if (!DOM.drawer?.classList.contains('is-open')) DOM.drawerBackdrop.hidden = true;
  }, 220);
}

function drawerHTML(reservation) {
  const phone = formatPhone(reservation.clientPhone) || 'Não informado';
  const email = reservation.clientEmail || 'Não informado';
  const whatsappUrl = buildWhatsAppUrl(reservation.clientPhone);
  const isCancelled = reservation.status === 'cancelled';

  return `
    <div class="adm-drawer-head">
      <div>
        <p class="adm-drawer-kicker">Detalhes da reserva</p>
        <h2>${esc(reservation.clientName)}</h2>
        <div class="adm-drawer-sub">${formatDate(reservation.date)} · ${formatTime(reservation.time)}</div>
        <div class="adm-drawer-status">${statusBadge(reservation.status)}</div>
      </div>
      <button class="adm-drawer-close" type="button" data-action="close-drawer" aria-label="Fechar detalhes">×</button>
    </div>

    ${drawerNoticeHTML()}

    ${drawerSection('Reserva', [
      ['Data', formatDate(reservation.date)],
      ['Horário', formatTime(reservation.time)],
      ['Pessoas', `${reservation.guests}`],
      ['Ambiente', reservation.environmentName],
      ['Status', statusLabel(reservation.status)],
      ['Criado em', formatCreated(reservation.createdAt)],
    ])}

    ${drawerSection('Cliente', [
      ['Nome', reservation.clientName],
      ['Telefone', phone],
      ['E-mail', email],
    ])}

    <section class="adm-drawer-section">
      <h3>Observações</h3>
      ${reservation.notes ? `<p class="adm-drawer-notes">${esc(reservation.notes)}</p>` : '<p class="adm-drawer-empty">Sem observações.</p>'}
    </section>

    <section class="adm-drawer-section">
      <h3>Ações rápidas</h3>
      <div class="adm-drawer-actions">
        <a href="${esc(whatsappUrl || '#')}" target="_blank" rel="noopener" class="adm-drawer-action-primary ${whatsappUrl ? '' : 'is-disabled'}">${whatsappIcon()}WhatsApp</a>
        ${isCancelled
          ? `<button class="adm-drawer-action-danger is-disabled" type="button" disabled>${cancelIcon()}Reserva cancelada</button>`
          : `<button class="adm-drawer-action-danger" type="button" data-action="cancel-reservation" data-id="${esc(reservation.id)}">${cancelIcon()}Cancelar reserva</button>`}
      </div>
    </section>`;
}

function drawerNoticeHTML() {
  if (!state.drawerNotice?.message) return '';
  return `<p class="adm-drawer-feedback" data-type="${esc(state.drawerNotice.type || '')}">${esc(state.drawerNotice.message)}</p>`;
}

function drawerSection(title, rows) {
  return `
    <section class="adm-drawer-section">
      <h3>${title}</h3>
      <div class="adm-drawer-list">
        ${rows.map(([label, value]) => `
          <div class="adm-drawer-row">
            <span>${label}</span>
            <strong>${esc(value || '--')}</strong>
          </div>`).join('')}
      </div>
    </section>`;
}

// ═══════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════

function bindEvents() {
  // Operação filters
  DOM.search?.addEventListener('input', () => {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(renderOperacaoView, SEARCH_DEBOUNCE_MS);
  });
  DOM.date?.addEventListener('change', () => {
    setActivePeriod('all');
    renderOperacaoView();
  });
  DOM.status?.addEventListener('change', renderOperacaoView);
  DOM.environment?.addEventListener('change', renderOperacaoView);
  DOM.clear?.addEventListener('click', clearFilters);

  DOM.periodTabs?.addEventListener('click', event => {
    const tab = event.target.closest('.adm-period-tab');
    if (!tab) return;
    setActivePeriod(tab.dataset.period || 'all');
    if (state.activePeriod !== 'all' && DOM.date) DOM.date.value = '';
    renderOperacaoView();
  });

  DOM.statusChips?.addEventListener('click', event => {
    const chip = event.target.closest('.adm-filter-chip');
    if (!chip) return;
    setActiveStatusChip(chip.dataset.status || 'all');
    renderOperacaoView();
  });

  // Tabs
  DOM.tabs?.addEventListener('click', event => {
    const tab = event.target.closest('.adm-rsv-tab');
    if (!tab) return;
    setActiveView(tab.dataset.view || 'operacao');
  });

  // Calendar
  DOM.calPrev?.addEventListener('click', () => navigateCalendar(-1));
  DOM.calNext?.addEventListener('click', () => navigateCalendar(1));
  DOM.calToday?.addEventListener('click', goToCalendarToday);
  DOM.calGrid?.addEventListener('click', event => {
    const cell = event.target.closest('[data-cal-date]');
    if (!cell) return;
    const iso = cell.dataset.calDate;
    state.calendarSelectedDate = state.calendarSelectedDate === iso ? null : iso;
    renderCalendar();
  });

  // Lista
  DOM.listaSearch?.addEventListener('input', () => {
    window.clearTimeout(state.listaSearchTimer);
    state.listaSearchTimer = window.setTimeout(renderListaView, SEARCH_DEBOUNCE_MS);
  });
  DOM.listaStatus?.addEventListener('change', renderListaView);

  // Ambientes
  DOM.envPeriod?.addEventListener('click', event => {
    const btn = event.target.closest('.adm-env-period-btn');
    if (!btn) return;
    state.ambientesPeriod = btn.dataset.envPeriod || 'today';
    DOM.envPeriod.querySelectorAll('.adm-env-period-btn').forEach(b => {
      b.classList.toggle('is-active', b.dataset.envPeriod === state.ambientesPeriod);
    });
    renderAmbientesView();
  });

  // Page-level
  DOM.refresh?.addEventListener('click', fetchReservations);
  DOM.createButton?.addEventListener('click', openCreateReservationModal);
  DOM.createClose?.addEventListener('click', closeCreateReservationModal);
  DOM.createCancel?.addEventListener('click', closeCreateReservationModal);
  DOM.createBackdrop?.addEventListener('click', closeCreateReservationModal);
  DOM.createForm?.addEventListener('submit', submitManualReservation);
  DOM.drawerBackdrop?.addEventListener('click', closeReservationDrawer);

  // Global delegated handlers
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);
}

function handleDocumentClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (actionEl) {
    const action = actionEl.dataset.action;
    if (action === 'view-details') {
      event.stopPropagation();
      const id = actionEl.dataset.id || actionEl.closest('[data-reservation-id]')?.dataset.reservationId;
      openReservationDrawer(findReservation(id));
      return;
    }
    if (action === 'cancel-reservation') {
      event.stopPropagation();
      handleCancelReservation(actionEl);
      return;
    }
    if (action === 'clear-filters') return clearFilters();
    if (action === 'retry') return fetchReservations();
    if (action === 'close-drawer') return closeReservationDrawer();
    if (action === 'open-create') return openCreateReservationModal();
  }

  const interactive = event.target.closest('[data-reservation-id]');
  if (interactive) {
    openReservationDrawer(findReservation(interactive.dataset.reservationId));
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeReservationDrawer();
    closeCreateReservationModal();
    return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (event.target.tagName === 'BUTTON') return;
  const target = event.target.closest('[data-reservation-id]');
  if (!target) return;
  event.preventDefault();
  openReservationDrawer(findReservation(target.dataset.reservationId));
}

function clearFilters() {
  if (DOM.search) DOM.search.value = '';
  if (DOM.date) DOM.date.value = '';
  if (DOM.status) DOM.status.value = '';
  if (DOM.environment) DOM.environment.value = '';
  setActivePeriod('all');
  setActiveStatusChip('all');
  renderOperacaoView();
}

function setActivePeriod(period) {
  state.activePeriod = PERIODS.has(period) ? period : 'all';
  DOM.periodTabs?.querySelectorAll('.adm-period-tab').forEach(tab => {
    const isActive = tab.dataset.period === state.activePeriod;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function setActiveStatusChip(status) {
  state.activeStatusChip = STATUS_CHIPS.has(status) ? status : 'all';
  DOM.statusChips?.querySelectorAll('.adm-filter-chip').forEach(chip => {
    chip.classList.toggle('is-active', chip.dataset.status === state.activeStatusChip);
  });
}

// ═══════════════════════════════════════════════════════════════════
// Cancel reservation
// ═══════════════════════════════════════════════════════════════════

async function handleCancelReservation(button) {
  if (!button) return;
  const reservationId = button.dataset.id || state.selectedReservationId;
  const reservation = findReservation(reservationId);
  if (!reservation || reservation.status === 'cancelled') return;

  const confirmed = window.confirm(`Cancelar a reserva de ${reservation.clientName} para ${formatDate(reservation.date)} às ${formatTime(reservation.time)}?`);
  if (!confirmed) return;

  setCancelButtonLoading(button, true);
  state.drawerNotice = null;

  try {
    await cancelReservation(reservation.id);
    updateReservationStatus(reservation.id, 'cancelled');
    state.drawerNotice = { type: 'success', message: 'Reserva cancelada com sucesso.' };
    renderActiveView();
    if (state.selectedReservationId) {
      renderDrawer(findReservation(reservation.id));
    }
  } catch (error) {
    console.error('[admin-reservations] cancel reservation error:', error);
    state.drawerNotice = { type: 'error', message: 'Não foi possível cancelar a reserva. Tente novamente.' };
    if (state.selectedReservationId) renderDrawer(reservation);
  } finally {
    const currentButton = DOM.drawerContent?.querySelector('[data-action="cancel-reservation"]');
    setCancelButtonLoading(currentButton, false);
  }
}

async function cancelReservation(reservationId) {
  return adminFetch(`/admin/reservations/${encodeURIComponent(reservationId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

function updateReservationStatus(reservationId, status) {
  state.reservations.forEach(reservation => {
    if (reservation.id === String(reservationId)) reservation.status = status;
  });
  state.reservations = sortReservations(state.reservations);
}

function setCancelButtonLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle('is-loading', isLoading);
  button.innerHTML = isLoading
    ? `${spinnerIcon()}Cancelando...`
    : `${cancelIcon()}Cancelar reserva`;
}

// ═══════════════════════════════════════════════════════════════════
// Environments (for filters + create modal)
// ═══════════════════════════════════════════════════════════════════

function renderEnvironmentFilter() {
  if (!DOM.environment) return;
  const selected = DOM.environment.value;
  const environments = new Map();

  state.reservations.forEach(reservation => {
    const name = reservation.environmentName;
    if (!name) return;
    const value = reservation.environmentId ? `id:${reservation.environmentId}` : `name:${name}`;
    environments.set(value, name);
  });

  DOM.environment.innerHTML = '<option value="">Todos os ambientes</option>';
  [...environments.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
    .forEach(([value, name]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = name;
      DOM.environment.appendChild(option);
    });

  DOM.environment.value = [...DOM.environment.options].some(option => option.value === selected)
    ? selected
    : '';
}

async function loadCreateEnvironments() {
  if (!DOM.createEnvironment) return;
  try {
    const data = await apiFetch(API_ROUTES.environments);
    state.environments = extractEnvironments(data)
      .filter(environment => environment?.id != null && environment?.name)
      .sort((a, b) => {
        if (a.display_order != null && b.display_order != null) return a.display_order - b.display_order;
        return String(a.name).localeCompare(String(b.name), 'pt-BR');
      });
    renderCreateEnvironmentOptions();
    // Re-render Ambientes if it's the active view (since we now have full env list).
    if (state.activeView === 'ambientes') renderAmbientesView();
  } catch (error) {
    console.error('[admin-reservations] environments fetch error:', error);
    DOM.createEnvironment.innerHTML = '<option value="">Não foi possível carregar ambientes</option>';
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

function renderCreateEnvironmentOptions() {
  if (!DOM.createEnvironment) return;
  DOM.createEnvironment.innerHTML = '<option value="">Selecione um ambiente</option>';
  state.environments.forEach(environment => {
    const option = document.createElement('option');
    option.value = environment.id;
    option.textContent = environment.name;
    DOM.createEnvironment.appendChild(option);
  });
}

// ═══════════════════════════════════════════════════════════════════
// Create modal
// ═══════════════════════════════════════════════════════════════════

function openCreateReservationModal() {
  if (!DOM.createModal || !DOM.createBackdrop) return;
  resetCreateForm();
  if (!state.environments.length) loadCreateEnvironments();
  DOM.createBackdrop.hidden = false;
  requestAnimationFrame(() => {
    DOM.createModal?.classList.add('is-open');
    DOM.createBackdrop?.classList.add('is-open');
  });
  DOM.createModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('adm-drawer-open');
  DOM.createForm?.elements.name?.focus();
}

function closeCreateReservationModal() {
  if (!DOM.createModal || !DOM.createBackdrop) return;
  DOM.createModal.classList.remove('is-open');
  DOM.createBackdrop.classList.remove('is-open');
  DOM.createModal.setAttribute('aria-hidden', 'true');
  if (!DOM.drawer?.classList.contains('is-open')) document.body.classList.remove('adm-drawer-open');
  window.setTimeout(() => {
    if (!DOM.createModal?.classList.contains('is-open')) DOM.createBackdrop.hidden = true;
  }, 220);
}

function resetCreateForm() {
  DOM.createForm?.reset();
  setCreateFeedback('');
  setCreateSubmitting(false);
}

async function submitManualReservation(event) {
  event.preventDefault();
  if (!DOM.createForm) return;
  const formData = new FormData(DOM.createForm);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    environment_id: String(formData.get('environment_id') || ''),
    reservation_date: String(formData.get('reservation_date') || ''),
    reservation_time: String(formData.get('reservation_time') || ''),
    party_size: Number(formData.get('party_size') || 0),
    notes: String(formData.get('notes') || '').trim() || null,
  };

  const validationError = getCreateValidationError(payload);
  if (validationError) {
    setCreateFeedback(validationError, 'error');
    return;
  }

  setCreateSubmitting(true);
  setCreateFeedback('Criando reserva...', 'muted');

  try {
    await apiFetch(API_ROUTES.reservations, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setCreateFeedback('Reserva criada com sucesso.', 'success');
    await fetchReservations();
    window.setTimeout(closeCreateReservationModal, 700);
  } catch (error) {
    console.error('[admin-reservations] create reservation error:', error);
    setCreateFeedback('Não foi possível criar a reserva. Verifique os dados e tente novamente.', 'error');
  } finally {
    setCreateSubmitting(false);
  }
}

function getCreateValidationError(payload) {
  if (!payload.name) return 'Informe o nome do cliente.';
  if (!payload.email) return 'Informe o e-mail do cliente.';
  if (!payload.phone) return 'Informe o telefone do cliente.';
  if (!payload.environment_id) return 'Selecione um ambiente.';
  if (!payload.reservation_date) return 'Informe a data da reserva.';
  if (!payload.reservation_time) return 'Informe o horário da reserva.';
  if (!Number.isFinite(payload.party_size) || payload.party_size < 1) return 'Informe a quantidade de pessoas.';
  return '';
}

function setCreateFeedback(message, type = '') {
  if (!DOM.createFeedback) return;
  DOM.createFeedback.textContent = message;
  DOM.createFeedback.dataset.type = type;
}

function setCreateSubmitting(isSubmitting) {
  if (!DOM.createForm) return;
  DOM.createForm.classList.toggle('is-submitting', isSubmitting);
  [...DOM.createForm.elements].forEach(element => {
    if (element.type !== 'button') element.disabled = isSubmitting;
  });
}

// ═══════════════════════════════════════════════════════════════════
// Helpers (shared across views)
// ═══════════════════════════════════════════════════════════════════

function updateCount(count) {
  if (!DOM.count) return;
  const value = count ?? 0;
  DOM.count.textContent = `${value} ${value === 1 ? 'reserva' : 'reservas'}`;
}

function setMetric(element, value) {
  if (!element) return;
  element.textContent = Number(value || 0).toLocaleString('pt-BR');
}

function hasActiveFilters() {
  return Boolean(
    DOM.search?.value.trim() ||
    DOM.date?.value ||
    DOM.status?.value ||
    DOM.environment?.value ||
    state.activePeriod !== 'all' ||
    state.activeStatusChip !== 'all'
  );
}

function findReservation(id) {
  return state.reservations.find(reservation => reservation.id === String(id));
}

function parseEnvironmentFilter(value) {
  if (!value) return { type: '', value: '' };
  const [type, ...rest] = value.split(':');
  return { type, value: rest.join(':') };
}

function getNextReservation(list) {
  const now = new Date();
  return list
    .filter(reservation => reservation.status !== 'cancelled')
    .map(reservation => ({ reservation, date: reservationDateTime(reservation) }))
    .filter(item => item.date && item.date >= now)
    .sort((a, b) => a.date - b.date)[0]?.reservation ?? null;
}

function getMostRequestedEnvironment(list) {
  const counts = list
    .filter(reservation => reservation.status !== 'cancelled')
    .reduce((acc, reservation) => {
      const key = reservation.environmentName || 'Sem dados';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  const [name, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return name ? { name, count } : null;
}

function isUpcoming(reservation) {
  const date = reservationDateTime(reservation);
  return date ? date >= startOfToday() : false;
}

function reservationDateTime(reservation) {
  if (!reservation.date) return null;
  const time = reservation.time ? String(reservation.time).slice(0, 5) : '00:00';
  const date = new Date(`${reservation.date}T${time}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function todayISO() {
  return isoDaysFromToday(0);
}

function isoDaysFromToday(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────────────────────────

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function formatDate(value) {
  if (!value) return '--';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
}

function formatGroupDate(value) {
  if (!value) return 'Sem data';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  const today = todayISO();
  const tomorrow = isoDaysFromToday(1);
  if (value === today) return `Hoje · ${String(day).padStart(2, '0')} ${MONTHS[month - 1]}`;
  if (value === tomorrow) return `Amanhã · ${String(day).padStart(2, '0')} ${MONTHS[month - 1]}`;
  return `${WEEKDAYS[date.getDay()]} · ${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '--';
}

function formatNextDate(value) {
  if (!value) return '';
  const today = todayISO();
  const tomorrow = isoDaysFromToday(1);
  if (value === today) return 'Hoje';
  if (value === tomorrow) return 'Amanhã';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]}`;
}

function formatCreated(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).replace('.', '');
}

function formatPhone(value) {
  const digits = cleanPhone(value);
  if (!digits) return '';
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value || digits;
}

function cleanPhone(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function buildWhatsAppUrl(value) {
  let digits = cleanPhone(value);
  if (!digits) return '';
  if (!digits.startsWith('55')) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

function truncate(value, max) {
  const str = String(value ?? '');
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1).trim()}…`;
}

function statusBadge(status) {
  const label = statusLabel(status);
  return `<span class="adm-badge adm-badge--${esc(status || 'unknown')}"><span class="adm-badge-dot"></span>${esc(label)}</span>`;
}

function statusLabel(status) {
  const labels = {
    confirmed: 'Confirmada',
    pending: 'Pendente',
    cancelled: 'Cancelada',
    completed: 'Concluída',
    no_show: 'No-show',
    unknown: 'Desconhecido',
  };
  return labels[status] ?? status ?? 'Desconhecido';
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function peopleIcon() {
  return '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
}

function envIcon() {
  return '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>';
}

function calendarIcon() {
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
}

function alertIcon() {
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
}

function whatsappIcon() {
  return '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.7A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.8 8.6c.2 3.4 2 5.5 5.3 6.4l1.4-1.3"/></svg>';
}

function cancelIcon() {
  return '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6 6 18M6 6l12 12"/></svg>';
}

function spinnerIcon() {
  return '<svg class="adm-inline-spinner" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-6.2-8.56"/></svg>';
}

function noteIcon() {
  return '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>';
}
