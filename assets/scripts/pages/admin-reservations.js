/**
 * Giardini Café - Admin Reservations
 * Frontend-only operational panel backed by GET /admin/reservations.
 */

import { requireAuth, initShell, adminFetch } from './admin-auth.js';
import { API_ROUTES, apiFetch } from '../config/api.js';

const currentUser = await requireAuth();

const PAGE_LIMIT = 200;
const SEARCH_DEBOUNCE_MS = 300;
const STATUS_FILTERS = new Set(['confirmed', 'cancelled', 'completed', 'no_show', 'pending']);

const state = {
  reservations: [],
  visibleReservations: [],
  environments: [],
  totalFromBackend: 0,
  activePeriod: 'all',
  loading: false,
  error: null,
  selectedReservationId: null,
  drawerNotice: null,
  searchTimer: null,
};

const DOM = {
  pageNow: document.getElementById('adm-page-now'),
  tbody: document.getElementById('adm-tbody'),
  cards: document.getElementById('adm-cards'),
  count: document.getElementById('adm-count'),
  search: document.getElementById('adm-search'),
  date: document.getElementById('adm-filter-date'),
  status: document.getElementById('adm-filter-status'),
  environment: document.getElementById('adm-filter-env'),
  clear: document.getElementById('adm-clear'),
  refresh: document.getElementById('adm-refresh'),
  createButton: document.getElementById('adm-create-reservation'),
  insights: document.getElementById('adm-insights'),
  metricTotal: document.getElementById('adm-m-total'),
  metricToday: document.getElementById('adm-m-today'),
  metricGuests: document.getElementById('adm-m-guests'),
  metricUpcoming: document.getElementById('adm-m-upcoming'),
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
  updatePageNow();
  window.setInterval(updatePageNow, 30000);
  bindEvents();
  loadCreateEnvironments();
  fetchReservations();
}

async function fetchReservations() {
  state.loading = true;
  state.error = null;
  renderLoading();

  try {
    const data = await adminFetch(buildReservationsPath());
    state.reservations = extractReservations(data).map(normalizeReservation);
    state.totalFromBackend = getResultTotal(data, state.reservations.length);
    state.visibleReservations = applyClientOnlyFilters(state.reservations);
    renderEnvironmentFilter();
    renderAll();
  } catch (error) {
    console.error('[admin-reservations] fetch error:', error);
    state.error = error;
    renderError();
  } finally {
    state.loading = false;
    DOM.refresh?.classList.remove('is-loading');
  }
}

function buildReservationsPath() {
  const params = new URLSearchParams();
  const search = DOM.search?.value.trim() ?? '';
  const date = DOM.date?.value ?? '';
  const status = normalizeStatus(DOM.status?.value ?? '');
  const environmentValue = DOM.environment?.value ?? '';
  const envFilter = parseEnvironmentFilter(environmentValue);

  if (search) params.set('search', search);
  if (state.activePeriod !== 'all') params.set('period', state.activePeriod);
  if (state.activePeriod === 'all' && date) params.set('date', date);
  if (status) params.set('status', status);
  if (envFilter.type === 'id') params.set('environment_id', envFilter.value);
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

function getResultTotal(data, fallback) {
  const total = Number(data?.total ?? data?.count);
  return Number.isFinite(total) ? total : fallback;
}

function applyClientOnlyFilters(list) {
  const envFilter = parseEnvironmentFilter(DOM.environment?.value ?? '');
  if (envFilter.type !== 'name') return list;
  return list.filter(reservation => reservation.environmentName === envFilter.value);
}

function renderAll() {
  renderSummary();
  renderInsights();
  renderReservationsTable();
  renderMobileCards();
  updateCount();
}

function renderSummary() {
  const today = todayISO();
  const source = state.visibleReservations;
  const envFilter = parseEnvironmentFilter(DOM.environment?.value ?? '');
  const total = envFilter.type === 'name'
    ? source.length
    : (state.totalFromBackend || state.reservations.length);
  const upcoming = source.filter(r => isUpcoming(r) && r.status !== 'cancelled').length;
  const guests = source.reduce((sum, r) => sum + r.guests, 0);
  const todayReservations = source.filter(r => r.date === today);

  setMetric(DOM.metricTotal, total);
  setMetric(DOM.metricToday, todayReservations.length);
  setMetric(DOM.metricGuests, guests);
  setMetric(DOM.metricUpcoming, upcoming);
}

function renderInsights() {
  if (!DOM.insights) return;
  const source = state.visibleReservations;
  const next = getNextReservation(source);
  const popularEnvironment = getMostRequestedEnvironment(source);
  const largest = source.slice().sort((a, b) => b.guests - a.guests)[0];
  DOM.insights.innerHTML = `
    <span><strong>Próxima reserva:</strong> ${next ? `${formatTime(next.time)} · ${esc(next.environmentName)}` : 'Nenhuma próxima'}</span>
    <span><strong>Ambiente mais reservado:</strong> ${popularEnvironment ? esc(popularEnvironment.name) : '--'}</span>
    <span><strong>Maior grupo:</strong> ${largest ? `${largest.guests} pessoas` : '--'}</span>
  `;
}

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

function renderReservationsTable() {
  if (!DOM.tbody) return;
  const list = state.visibleReservations;
  if (!list.length) {
    DOM.tbody.innerHTML = `<tr><td colspan="8" class="adm-state-cell">${emptyStateHTML()}</td></tr>`;
    return;
  }

  DOM.tbody.innerHTML = list.map(reservation => `
    <tr class="adm-reservation-row" data-reservation-id="${esc(reservation.id)}" tabindex="0" aria-label="Abrir detalhes da reserva de ${esc(reservation.clientName)}">
      <td class="adm-cell-date">
        <div class="adm-cell-date-d">${formatDate(reservation.date)}</div>
        <div class="adm-cell-date-t">${formatTime(reservation.time)}</div>
      </td>
      <td>
        <div class="adm-cell-client-name">${esc(reservation.clientName)}</div>
        <div class="adm-cell-client-email">${esc(reservation.clientEmail || 'E-mail não informado')}</div>
      </td>
      <td class="adm-cell-phone">${esc(formatPhone(reservation.clientPhone) || 'Não informado')}</td>
      <td class="adm-cell-env">${esc(reservation.environmentName)}</td>
      <td class="adm-cell-guests"><span>${peopleIcon()}${reservation.guests}</span></td>
      <td>${statusBadge(reservation.status)}</td>
      <td class="adm-cell-notes">${reservation.notes ? `<span title="${esc(reservation.notes)}">${noteIcon()}${esc(reservation.notes)}</span>` : '<span class="adm-cell-notes-empty">--</span>'}</td>
      <td class="adm-cell-dim">${formatCreated(reservation.createdAt)}</td>
    </tr>
  `).join('');
}

function renderMobileCards() {
  if (!DOM.cards) return;
  const list = state.visibleReservations;
  if (!list.length) {
    DOM.cards.innerHTML = emptyStateHTML();
    return;
  }

  DOM.cards.innerHTML = list.map(reservation => `
    <button class="adm-card adm-reservation-card" type="button" data-reservation-id="${esc(reservation.id)}">
      <div class="adm-card-top">
        <div>
          <div class="adm-card-date">${formatDate(reservation.date)}</div>
          <div class="adm-card-time">${formatTime(reservation.time)} · ${esc(reservation.environmentName)}</div>
        </div>
        ${statusBadge(reservation.status)}
      </div>
      <div class="adm-card-body">
        <div class="adm-card-primary">${esc(reservation.clientName)}</div>
        <div class="adm-card-row">
          <span class="adm-card-key">Contato</span>
          <span class="adm-card-val">${esc(formatPhone(reservation.clientPhone) || 'Não informado')}</span>
        </div>
        <div class="adm-card-row">
          <span class="adm-card-key">Pessoas</span>
          <span class="adm-card-val adm-card-guests">${peopleIcon()}${reservation.guests}</span>
        </div>
        ${reservation.notes ? `<div class="adm-card-notes">${esc(reservation.notes)}</div>` : ''}
      </div>
    </button>
  `).join('');
}

function renderLoading() {
  DOM.refresh?.classList.add('is-loading');
  [DOM.metricTotal, DOM.metricToday, DOM.metricGuests, DOM.metricUpcoming].forEach(el => {
    if (el) el.textContent = '--';
  });

  if (DOM.insights) {
    DOM.insights.innerHTML = '<span>Carregando leitura operacional...</span>';
  }

  if (DOM.tbody) {
    DOM.tbody.innerHTML = Array.from({ length: 6 }, () => `
      <tr class="adm-skeleton-table-row">
        <td colspan="8">
          <div class="adm-skeleton-line">
            <span class="adm-skel adm-skel--md"></span>
            <span class="adm-skel adm-skel--lg"></span>
            <span class="adm-skel adm-skel--md"></span>
            <span class="adm-skel adm-skel--sm"></span>
            <span class="adm-skel adm-skel--xl"></span>
          </div>
        </td>
      </tr>`).join('');
  }

  if (DOM.cards) {
    DOM.cards.innerHTML = Array.from({ length: 4 }, () => `
      <div class="adm-card adm-card-skeleton">
        <span class="adm-skel adm-skel--lg"></span>
        <span class="adm-skel adm-skel--xl"></span>
        <span class="adm-skel adm-skel--md"></span>
      </div>`).join('');
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
  if (DOM.tbody) DOM.tbody.innerHTML = `<tr><td colspan="8" class="adm-state-cell">${html}</td></tr>`;
  if (DOM.cards) DOM.cards.innerHTML = html;
  if (DOM.insights) DOM.insights.innerHTML = '';
  updateCount(0);
}

function emptyStateHTML() {
  const hasFilters = hasActiveFilters();
  return `
    <div class="adm-state">
      <div class="adm-state-icon adm-state-icon--empty">${calendarIcon()}</div>
      <div class="adm-state-title">Nenhuma reserva encontrada</div>
      <div class="adm-state-sub">${hasFilters ? 'Os filtros atuais podem estar restringindo demais a busca.' : 'Ainda não há reservas cadastradas no período carregado.'}</div>
      ${hasFilters ? '<button class="adm-state-clear-btn" type="button" data-action="clear-filters">Limpar filtros</button>' : ''}
    </div>`;
}

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

function bindEvents() {
  DOM.search?.addEventListener('input', () => {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(fetchReservations, SEARCH_DEBOUNCE_MS);
  });
  DOM.date?.addEventListener('change', () => {
    setActivePeriod('all');
    fetchReservations();
  });
  DOM.status?.addEventListener('change', fetchReservations);
  DOM.environment?.addEventListener('change', fetchReservations);
  DOM.clear?.addEventListener('click', clearFilters);
  DOM.refresh?.addEventListener('click', fetchReservations);
  DOM.createButton?.addEventListener('click', openCreateReservationModal);
  DOM.createClose?.addEventListener('click', closeCreateReservationModal);
  DOM.createCancel?.addEventListener('click', closeCreateReservationModal);
  DOM.createBackdrop?.addEventListener('click', closeCreateReservationModal);
  DOM.createForm?.addEventListener('submit', submitManualReservation);
  DOM.drawerBackdrop?.addEventListener('click', closeReservationDrawer);

  document.querySelectorAll('.adm-filter-chip').forEach(button => {
    button.addEventListener('click', () => {
      setActivePeriod(button.dataset.chip || 'all');
      if (state.activePeriod !== 'all' && DOM.date) DOM.date.value = '';
      fetchReservations();
    });
  });

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);
}

function handleDocumentClick(event) {
  const row = event.target.closest('[data-reservation-id]');
  if (row) {
    const reservation = findReservation(row.dataset.reservationId);
    openReservationDrawer(reservation);
    return;
  }

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'clear-filters') clearFilters();
  if (action === 'retry') fetchReservations();
  if (action === 'close-drawer') closeReservationDrawer();
  if (action === 'cancel-reservation') handleCancelReservation(event.target.closest('[data-action]'));
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeReservationDrawer();
  if (event.key === 'Escape') closeCreateReservationModal();
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const row = event.target.closest('.adm-reservation-row');
  if (!row) return;
  event.preventDefault();
  openReservationDrawer(findReservation(row.dataset.reservationId));
}

function clearFilters() {
  if (DOM.search) DOM.search.value = '';
  if (DOM.date) DOM.date.value = '';
  if (DOM.status) DOM.status.value = '';
  if (DOM.environment) DOM.environment.value = '';
  setActivePeriod('all');
  fetchReservations();
}

function setActivePeriod(period) {
  state.activePeriod = period;
  document.querySelectorAll('.adm-filter-chip').forEach(button => {
    button.classList.toggle('is-active', button.dataset.chip === period);
  });
}

function findReservation(id) {
  return state.reservations.find(reservation => reservation.id === String(id));
}

async function handleCancelReservation(button) {
  if (!button) return;
  const reservation = findReservation(state.selectedReservationId || button.dataset.id);
  if (!reservation || reservation.status === 'cancelled') return;

  const confirmed = window.confirm('Tem certeza que deseja cancelar esta reserva?');
  if (!confirmed) return;

  setCancelButtonLoading(button, true);
  state.drawerNotice = null;

  try {
    await cancelReservation(reservation.id);
    updateReservationStatus(reservation.id, 'cancelled');
    state.drawerNotice = { type: 'success', message: 'Reserva cancelada com sucesso.' };
    renderAll();
    renderDrawer(findReservation(reservation.id));
  } catch (error) {
    console.error('[admin-reservations] cancel reservation error:', error);
    state.drawerNotice = { type: 'error', message: 'Não foi possível cancelar a reserva. Tente novamente.' };
    renderDrawer(reservation);
  } finally {
    const currentButton = DOM.drawerContent?.querySelector('[data-action="cancel-reservation"]');
    setCancelButtonLoading(currentButton, false);
  }
}

async function cancelReservation(reservationId) {
  return adminFetch(`/admin/reservations/${encodeURIComponent(reservationId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'cancelled',
    }),
  });
}

function updateReservationStatus(reservationId, status) {
  const update = reservation => {
    if (reservation.id === String(reservationId)) reservation.status = status;
  };
  state.reservations.forEach(update);
  state.visibleReservations.forEach(update);
  state.visibleReservations = getVisibleReservationsAfterMutation();
}

function getVisibleReservationsAfterMutation() {
  const status = normalizeStatus(DOM.status?.value ?? '');
  return applyClientOnlyFilters(state.reservations).filter(reservation => {
    if (!status) return true;
    return reservation.status === status;
  });
}

function setCancelButtonLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle('is-loading', isLoading);
  button.innerHTML = isLoading
    ? `${spinnerIcon()}Cancelando...`
    : `${cancelIcon()}Cancelar reserva`;
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
  document.body.classList.remove('adm-drawer-open');
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

function updateCount(explicitTotal) {
  if (!DOM.count) return;
  const count = explicitTotal ?? state.visibleReservations.length;
  DOM.count.textContent = `${count} reserva${count === 1 ? '' : 's'}`;
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
    state.activePeriod !== 'all'
  );
}

function parseEnvironmentFilter(value) {
  if (!value) return { type: '', value: '' };
  const [type, ...rest] = value.split(':');
  return { type, value: rest.join(':') };
}

function normalizeStatus(status) {
  return STATUS_FILTERS.has(status) ? status : '';
}

function getNextReservation(list) {
  const now = new Date();
  return list
    .filter(r => r.status !== 'cancelled')
    .map(r => ({ reservation: r, date: reservationDateTime(r) }))
    .filter(item => item.date && item.date >= now)
    .sort((a, b) => a.date - b.date)[0]?.reservation ?? null;
}

function getMostRequestedEnvironment(list) {
  const counts = countBy(list, r => r.environmentName);
  const [name, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return name ? { name, count } : null;
}

function countBy(list, getter) {
  return list.reduce((acc, item) => {
    const key = getter(item) || 'Sem dados';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function isUpcoming(reservation) {
  const date = reservationDateTime(reservation);
  return date ? date >= startOfToday() : false;
}

function reservationDateTime(reservation) {
  if (!reservation.date) return null;
  const time = formatTime(reservation.time);
  const iso = `${reservation.date}T${time === '--' ? '00:00' : time}:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function updatePageNow() {
  if (!DOM.pageNow) return;
  DOM.pageNow.textContent = new Date().toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).replace('.', '');
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatDate(value) {
  if (!value) return '--';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '--';
}

function formatCreated(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateTime(date);
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
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

function peopleIcon() {
  return '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
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
