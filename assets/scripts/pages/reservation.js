/* ═══════════════════════════════════════════════════════════════════
   RESERVATION PAGE — JavaScript
   Giardini Café · reservation.js
   ═══════════════════════════════════════════════════════════════════ */

import { apiFetch, API_BASE_URL, API_ROUTES } from '../config/api.js';


const MONTHS_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

/* ── CANVAS SEQUENCE CONFIG ── */
// Detect mobile using both width and pointer (touch) for accuracy
const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
const CONFIG_SEQ = {
  // Mobile: 80 frames for faster load; desktop: 150 for cinematic quality
  TOTAL_FRAMES: isMobileDevice ? 80 : 150,
  FRAMES_DIR: isMobileDevice ? 'references/image-frames/reservation-mobile' : 'references/image-frames/reservation',
  scrollVH: isMobileDevice ? 150 : 100,
  // Mobile: tighter scrub = less intermediate frames decoded per tick
  scrub: isMobileDevice ? 0.5 : 1.0,
};

let frames = [];
let currentFrameIndex = -1;
const canvas = document.getElementById('seq-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Throttle helper for mobile resize — avoids canvas redraws on every pixel
// (browser bar hide/show fires many sequential resize events on iOS/Android)
let _resizeTimer = null;
function _doResize() {
  if (!canvas) return;
  const frame = document.getElementById('video-frame');
  const cw = (isMobileDevice && frame) ? frame.offsetWidth  : window.innerWidth;
  const ch = (isMobileDevice && frame) ? frame.offsetHeight : window.innerHeight;
  if (cw > 0 && ch > 0 && (canvas.width !== cw || canvas.height !== ch)) {
    canvas.width  = cw;
    canvas.height = ch;
  }
  if (currentFrameIndex >= 0) redrawCurrentFrame();
}
function resizeCanvas() {
  if (!canvas) return;
  if (isMobileDevice) {
    // Throttle: run at most once per 150ms to prevent scroll-bar-jank redraws
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(_doResize, 150);
  } else {
    _doResize();
  }
}

function redrawCurrentFrame() {
  if (currentFrameIndex < 0 || !ctx) return;
  const img = frames[currentFrameIndex];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  paintCover(img);
}

function paintCover(img) {
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  // Cover fill + 8% zoom to crop out 'Veo' watermark at bottom-right
  const ZOOM = 1.08;
  const scale = Math.max(cw / iw, ch / ih) * ZOOM;
  const dw = Math.ceil(iw * scale);
  const dh = Math.ceil(ih * scale);
  const dx = Math.floor((cw - dw) / 2);
  const dy = Math.floor((ch - dh) / 2);
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawFrame(index) {
  if (index === currentFrameIndex || !ctx) return;
  const img = frames[index];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  currentFrameIndex = index;
  paintCover(img);
}

function preloadFrames() {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = CONFIG_SEQ.TOTAL_FRAMES;
    frames = new Array(total);
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.src = `${CONFIG_SEQ.FRAMES_DIR}/frame_${String(i).padStart(4, '0')}.webp`;
      frames[i] = img;
      img.onload = img.onerror = () => {
        loaded++;
        const pct = Math.round((loaded / total) * 100);
        if (DOM.loaderBar) DOM.loaderBar.style.width = `${pct}%`;
        if (loaded === total) resolve();
      };
    }
  });
}


/* ── GSAP + Lenis ──────────────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

// On mobile: native scroll is used so GSAP ScrollTrigger pin works flawlessly.
// Lenis can prevent the pin from sticking on touch devices.
let lenis = null;
if (!isMobileDevice) {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth: true,
    smoothTouch: false,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
}
gsap.ticker.lagSmoothing(0);

// Safe scroll helper — uses Lenis on desktop, native scrollIntoView on mobile
function safeScrollTo(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: opts.offset || 0, duration: opts.duration || 1.2 });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * scrollToStep — Scroll suave até o próximo step do formulário.
 * Usa GSAP gsap.to(window) para controle preciso de offset tanto
 * em mobile (sem Lenis) quanto em desktop (com Lenis).
 * @param {string|HTMLElement} target - seletor CSS ou elemento
 * @param {number} offset - pixels de offset do topo (default -80)
 * @param {number} delay  - delay em ms antes de scrollar (default 350)
 */
function scrollToStep(target, offset = -80, delay = 350) {
  setTimeout(() => {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    if (lenis) {
      lenis.scrollTo(y, { duration: 1.2 });
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, delay);
}



/* ── DOM ───────────────────────────────────────────────────────── */
const DOM = {
  loader:             document.getElementById('loader'),
  loaderBar:          document.getElementById('loader-bar'),
  hamburger:          document.getElementById('hamburger'),
  mobileMenu:         document.getElementById('mobile-menu'),
  mobileClose:        document.getElementById('mobile-close'),

  // Environment
  environment:        document.getElementById('res-environment'),
  environmentMsg:     document.getElementById('res-environment-msg'),
  envCards:           document.getElementById('res-env-cards'),
  envSelectedBar:     document.getElementById('res-env-selected-bar'),
  envSelectedThumb:   document.getElementById('res-env-selected-thumb'),
  envSelectedName:    document.getElementById('res-env-selected-name'),
  envChangeBtn:       document.getElementById('res-env-change-btn'),

  // Inline form summary (replaces side showcase)
  formEnvSummary:     document.getElementById('res-form-env-summary'),
  formEnvThumb:       document.getElementById('res-form-env-thumb'),
  formEnvName:        document.getElementById('res-form-env-name'),
  formEnvChange:      document.getElementById('res-form-env-change'),
  spillGuests:        document.getElementById('spill-guests'),
  spillDate:          document.getElementById('spill-date'),
  spillTime:          document.getElementById('spill-time'),

  // Steps
  guestsContainer:    document.getElementById('res-guests'),
  guestsSublabel:     document.getElementById('res-guests-sublabel'),
  dateInput:          document.getElementById('res-date'),
  dateMsg:            document.getElementById('res-date-msg'),
  dateSublabel:       document.getElementById('res-date-sublabel'),
  timesEmpty:         document.getElementById('res-times-empty'),
  timesSkeleton:      document.getElementById('res-times-skeleton'),
  timesContainer:     document.getElementById('res-times'),

  // Personal info
  nameInput:          document.getElementById('res-name'),
  emailInput:         document.getElementById('res-email'),
  phoneInput:         document.getElementById('res-phone'),
  notesInput:         document.getElementById('res-notes'),
  infoSublabel:       document.getElementById('res-info-sublabel'),

  // CTA / Feedback
  submitBtn:          document.getElementById('res-submit'),
  successPanel:       document.getElementById('res-success'),
  errorPanel:         document.getElementById('res-error'),

  // Datepicker
  rcdTrigger:         document.getElementById('rcd-trigger'),
  rcdValue:           document.getElementById('rcd-value'),
  rcdCalendar:        document.getElementById('rcd-calendar'),
  rcdMonth:           document.getElementById('rcd-month'),
  rcdDays:            document.getElementById('rcd-days'),
  rcdPrev:            document.getElementById('rcd-prev'),
  rcdNext:            document.getElementById('rcd-next'),
};


/* ── State ─────────────────────────────────────────────────────── */
let environmentsData = [];
let selectedGuests   = null;
let selectedTime     = null;
let dpViewYear       = new Date().getFullYear();
let dpViewMonth      = new Date().getMonth();


/* ══════════════════════════════════════════════════════════════════
   ENVIRONMENT CARD GALLERY
   ══════════════════════════════════════════════════════════════════ */

function renderEnvCards(data) {
  const c = DOM.envCards;
  c.innerHTML = '';

  if (!data || data.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum ambiente disponível no momento.';
    p.style.cssText = 'color:rgba(255,255,255,0.3);font-size:0.85rem;font-style:italic;padding:1rem 0;grid-column:1/-1;';
    c.appendChild(p);
    return;
  }

  data.forEach((env, idx) => {
    let imgSrc = env.imageUrl || env.image_url;
    if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('assets/')) {
      imgSrc = `${API_BASE_URL}/${imgSrc.startsWith('/') ? imgSrc.slice(1) : imgSrc}`;
    }
    const hint   = env.short_description || (env.max_capacity ? `Até ${env.max_capacity} pessoas` : '');

    const card   = document.createElement('div');
    card.className = 'res-env-card';
    card.setAttribute('role', 'option');
    card.setAttribute('aria-label', env.name);
    card.setAttribute('tabindex', '0');
    card.dataset.envId   = env.id;
    card.dataset.envName = env.name;

    card.innerHTML = `
      <img class="res-env-card-img" src="${imgSrc}" alt="${env.name}" loading="lazy" />
      <div class="res-env-card-overlay"></div>
      <div class="res-env-card-hover-cue"><span>Clique para selecionar</span></div>
      <div class="res-env-card-content">
        <span class="res-env-card-name">${env.name}</span>
        ${hint ? `<span class="res-env-card-cap">${hint}</span>` : ''}
      </div>
      <div class="res-env-card-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
    `;

    card.addEventListener('click', () => selectEnvironmentCard(card, env));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectEnvironmentCard(card, env); }
    });

    // Start invisible — entrance handled by initEnvCardsParallax
    gsap.set(card, { opacity: 0, y: 28, scale: 0.96 });
    c.appendChild(card);
  });
}

function selectEnvironmentCard(card, env) {
  // Deselect all
  DOM.envCards.querySelectorAll('.res-env-card').forEach(c => c.classList.remove('is-selected'));
  card.classList.add('is-selected');

  // Sync hidden select
  DOM.environment.value = env.id;
  DOM.environment.dispatchEvent(new Event('change'));

  // Subtle pulse
  gsap.to(card, { scale: 1.025, duration: .18, ease: 'power2.out', yoyo: true, repeat: 1 });

  // Auto-scroll para seção de ambiente selecionado
  scrollToStep('#res-booking-section', -40, 450);
}

function resetEnvCardSelection() {
  DOM.envCards.querySelectorAll('.res-env-card').forEach(c => c.classList.remove('is-selected'));
  hideFormSummary();
  DOM.envSelectedBar.classList.remove('is-visible');
  safeScrollTo('#reservation-flow', { offset: -60, duration: 1.2 });
}


/* ── Inline form summary (compact, no big duplicate image) ───────── */

function showFormSummary(env, imgSrc) {
  if (!DOM.formEnvSummary) return;
  DOM.formEnvThumb.src = imgSrc;
  DOM.formEnvThumb.alt = env.name;
  DOM.formEnvName.textContent = env.name;

  // Populate hint — short_description if available, else derive from max_capacity
  const capEl = document.getElementById('res-form-env-cap');
  if (capEl) {
    capEl.textContent = env.short_description || (env.max_capacity ? `Até ${env.max_capacity} pessoas` : '');
  }

  DOM.formEnvSummary.classList.add('is-visible');
  gsap.fromTo(DOM.formEnvSummary,
    { opacity: 0, y: 14, scale: .98 },
    { opacity: 1, y: 0, scale: 1, duration: .75, ease: 'power3.out' }
  );
}

function hideFormSummary() {
  if (!DOM.formEnvSummary) return;
  DOM.formEnvSummary.classList.remove('is-visible');
}

function updateSummaryPills() {
  /* Summary pills removed — no-op kept for call-site safety */
}


/* ══════════════════════════════════════════════════════════════════
   CUSTOM DATEPICKER
   ══════════════════════════════════════════════════════════════════ */

function rcdOpen() {
  DOM.rcdCalendar.classList.add('is-open');
  DOM.rcdTrigger.closest('.rcd-wrap').classList.add('is-active');
  const step = DOM.rcdTrigger.closest('.res-step');
  if (step) step.classList.add('has-open-widget');
  renderCalendar();
}
function rcdClose() {
  DOM.rcdCalendar.classList.remove('is-open');
  DOM.rcdTrigger.closest('.rcd-wrap').classList.remove('is-active');
  const step = DOM.rcdTrigger.closest('.res-step');
  if (step) step.classList.remove('has-open-widget');
}
function rcdToggle() { DOM.rcdCalendar.classList.contains('is-open') ? rcdClose() : rcdOpen(); }

function renderCalendar() {
  DOM.rcdMonth.textContent = `${MONTHS_PT[dpViewMonth]} ${dpViewYear}`;
  DOM.rcdDays.innerHTML = '';

  const now = new Date();
  const isCurrentMonth = dpViewYear === now.getFullYear() && dpViewMonth === now.getMonth();
  DOM.rcdPrev.disabled = isCurrentMonth;
  DOM.rcdPrev.style.opacity = isCurrentMonth ? '0.2' : '';
  DOM.rcdPrev.style.pointerEvents = isCurrentMonth ? 'none' : '';

  const today     = new Date(); today.setHours(0,0,0,0);
  const firstDay  = new Date(dpViewYear, dpViewMonth, 1).getDay();
  const daysInMonth = new Date(dpViewYear, dpViewMonth + 1, 0).getDate();
  const selectedVal = DOM.dateInput.value;

  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement('button'); e.type = 'button'; e.className = 'rcd-day is-empty';
    DOM.rcdDays.appendChild(e);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn      = document.createElement('button'); btn.type = 'button'; btn.className = 'rcd-day'; btn.textContent = d;
    const cellDate = new Date(dpViewYear, dpViewMonth, d); cellDate.setHours(0,0,0,0);
    const iso      = toISO(dpViewYear, dpViewMonth + 1, d);
    const isMonday = cellDate.getDay() === 1;
    const isPast   = cellDate < today;
    const isToday  = cellDate.getTime() === today.getTime();

    if (isPast)    btn.classList.add('is-past', 'is-disabled');
    else if (isMonday) btn.classList.add('is-disabled');
    if (isToday)   btn.classList.add('is-today');
    if (selectedVal === iso) btn.classList.add('is-selected');

    if (!isPast && !isMonday) {
      btn.addEventListener('click', () => {
        DOM.dateInput.value = iso;
        DOM.rcdValue.textContent = `${d} ${MONTHS_SHORT[dpViewMonth]} ${dpViewYear}`;
        DOM.rcdValue.classList.add('has-date');
        rcdClose();
        handleDateChange();
      });
    }
    DOM.rcdDays.appendChild(btn);
  }
}

function toISO(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function initDatepicker() {
  DOM.rcdTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!DOM.rcdTrigger.disabled) rcdToggle();
  });
  DOM.rcdPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    const now = new Date();
    if (dpViewYear === now.getFullYear() && dpViewMonth <= now.getMonth()) return;
    dpViewMonth--;
    if (dpViewMonth < 0) { dpViewMonth = 11; dpViewYear--; }
    renderCalendar();
  });
  DOM.rcdNext.addEventListener('click', (e) => {
    e.stopPropagation();
    dpViewMonth++;
    if (dpViewMonth > 11) { dpViewMonth = 0; dpViewYear++; }
    renderCalendar();
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.rcd-wrap')) rcdClose(); });
  DOM.rcdCalendar.addEventListener('click', (e) => e.stopPropagation());
}


/* ── Helpers ───────────────────────────────────────────────────── */

function isMonday(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y,m-1,d).getDay() === 1;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m-1]} ${y}`;
}

function resetTimeSlots() {
  DOM.timesEmpty.textContent = 'Selecione uma data para ver os horários disponíveis.';
  DOM.timesEmpty.style.display = '';
  DOM.timesContainer.style.display = 'none';
  DOM.timesSkeleton.style.display = 'none';
  DOM.timesContainer.innerHTML = '';
  // Remove any lingering loading message
  const existingLoader = document.getElementById('res-times-loading');
  if (existingLoader) existingLoader.remove();
  selectedTime = null;
  tryEnablePersonalFields();
  updateSummaryPills();
}

function tryLoadAvailability() {
  if (DOM.environment.value && selectedGuests && DOM.dateInput.value) loadAvailability();
  else resetTimeSlots();
}

function tryEnableDateInput() {
  const ok = DOM.environment.value !== '' && selectedGuests !== null;
  DOM.rcdTrigger.disabled = !ok;
  if (ok) {
    DOM.dateSublabel.textContent = 'Escolha o dia da sua visita.';
  } else {
    DOM.dateInput.value = '';
    DOM.rcdValue.textContent = 'Selecione uma data';
    DOM.rcdValue.classList.remove('has-date');
    DOM.dateSublabel.textContent = 'Selecione primeiro o ambiente e a quantidade de pessoas.';
    DOM.dateMsg.style.display = 'none';
    resetTimeSlots();
  }
}

function tryEnablePersonalFields() {
  const ok = DOM.environment.value !== '' && selectedGuests !== null && DOM.dateInput.value !== '' && selectedTime !== null;
  [DOM.nameInput, DOM.emailInput, DOM.phoneInput, DOM.notesInput].forEach(f => { f.disabled = !ok; });
  DOM.infoSublabel.textContent = ok
    ? 'Precisamos de algumas informações para confirmar sua reserva.'
    : 'Preencha seus dados após selecionar o horário da reserva.';
}

function handleDateChange() {
  const value = DOM.dateInput.value;
  DOM.dateMsg.style.display = 'none';
  if (!value) return;

  if (isMonday(value)) {
    DOM.dateInput.value = '';
    DOM.rcdValue.textContent = 'Selecione uma data';
    DOM.rcdValue.classList.remove('has-date');
    DOM.dateMsg.textContent = 'O Giardini não abre às segundas-feiras. Escolha outro dia.';
    DOM.dateMsg.style.display = 'block';
    resetTimeSlots();
    gsap.to(DOM.rcdTrigger, { x: [-6,6,-4,4,-2,2,0], duration: .4, ease: 'power2.out' });
    return;
  }

  updateSummaryPills();
  loadAvailability();
  // Auto-scroll para step de horários
  scrollToStep('#step-time', -60, 500);
}


/* ── API ───────────────────────────────────────────────────────── */

async function loadEnvironments() {
  DOM.environmentMsg.style.display = 'none';
  DOM.envCards.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('div'); s.className = 'res-env-card-skeleton';
    DOM.envCards.appendChild(s);
  }

  try {
    const data = await apiFetch(API_ROUTES.environments);

    if (!data || data.length === 0) {
      DOM.environment.innerHTML = '<option value="" disabled selected>Nenhum ambiente</option>';
      DOM.environmentMsg.textContent = 'Não há ambientes disponíveis.';
      DOM.environmentMsg.style.display = 'block';
      renderEnvCards([]);
      return;
    }

    // Sort by display_order when provided by the backend
    const sorted = data.slice().sort((a, b) => {
      if (a.display_order != null && b.display_order != null) return a.display_order - b.display_order;
      return 0;
    });
    environmentsData = sorted;

    DOM.environment.innerHTML = '<option value="" disabled selected>Selecione</option>';
    sorted.forEach(env => {
      const o = document.createElement('option'); o.value = env.id; o.textContent = env.name;
      DOM.environment.appendChild(o);
    });
    DOM.environment.disabled = false;
    renderEnvCards(sorted);

  } catch (e) {
    DOM.environment.innerHTML = '<option value="" disabled selected>Indisponível</option>';
    DOM.environmentMsg.textContent = 'Não foi possível carregar os ambientes.';
    DOM.environmentMsg.style.color = '#ef4444';
    DOM.environmentMsg.style.display = 'block';
    renderEnvCards([]);
    console.error(e);
  }
}

function getEnvironmentById(id) {
  return environmentsData.find(e => e.id === id) || null;
}

function renderGuestPills(max) {
  DOM.guestsContainer.innerHTML = '';
  selectedGuests = null;
  for (let i = 1; i <= max; i++) {
    const p = document.createElement('button');
    p.className = 'res-pill'; p.textContent = i; p.dataset.guests = String(i);
    p.addEventListener('click', () => {
      DOM.guestsContainer.querySelectorAll('.res-pill').forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      selectedGuests = p.dataset.guests;
      tryEnableDateInput(); tryLoadAvailability(); updateSummaryPills();
      // Auto-scroll para step de data
      scrollToStep('#step-date', -60, 350);
    });
    DOM.guestsContainer.appendChild(p);
  }
  if (DOM.guestsContainer.children.length) {
    gsap.fromTo(DOM.guestsContainer.children,
      {opacity:0,y:6,scale:.95},
      {opacity:1,y:0,scale:1,duration:.35,ease:'power3.out',stagger:.03}
    );
  }
}

function handleEnvironmentChange() {
  const env = getEnvironmentById(DOM.environment.value);
  updateSummaryPills();

  if (!env || !env.max_capacity || env.max_capacity < 1) {
    DOM.guestsSublabel.textContent = 'Selecione um ambiente para ver a capacidade disponível.';
    DOM.guestsContainer.innerHTML = '';
    selectedGuests = null;
    tryEnableDateInput();
    hideFormSummary();
    return;
  }

  // Show inline form summary — image comes from API or local fallback
  let currentImgSrc = env.imageUrl || env.image_url;
  if (currentImgSrc && !currentImgSrc.startsWith('http') && !currentImgSrc.startsWith('assets/')) {
    currentImgSrc = `${API_BASE_URL}/${currentImgSrc.startsWith('/') ? currentImgSrc.slice(1) : currentImgSrc}`;
  }
  showFormSummary(env, currentImgSrc);

  DOM.guestsSublabel.textContent = `Este ambiente comporta até ${env.max_capacity} pessoas por reserva.`;
  renderGuestPills(env.max_capacity);
  tryEnableDateInput();
  tryLoadAvailability();

  // Scroll to booking section smoothly
  setTimeout(() => {
    safeScrollTo('#res-booking-section', { offset: -80, duration: 1.4 });
  }, 250);
}

function createTimePill(time) {
  const p = document.createElement('button');
  p.className = 'res-time-pill'; p.textContent = time; p.dataset.time = time;
  p.addEventListener('click', () => {
    document.querySelectorAll('.res-time-pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    selectedTime = time;
    tryEnablePersonalFields(); updateSummaryPills();
    // Auto-scroll para step de dados pessoais
    scrollToStep('#step-info', -60, 350);
  });
  return p;
}

async function loadAvailability() {
  const envId = DOM.environment.value, date = DOM.dateInput.value, size = selectedGuests;
  if (!envId || !date || !size) return;

  /* ── 1. CLEAR previous results + show loading state ─────────── */
  DOM.timesEmpty.style.display = 'none';
  DOM.timesContainer.style.display = 'none';
  DOM.timesContainer.innerHTML = '';
  DOM.timesSkeleton.style.display = 'none';
  selectedTime = null;
  tryEnablePersonalFields(); updateSummaryPills();

  // Disable the time area so stale buttons can't be clicked
  const timesArea = document.getElementById('res-times-area');
  if (timesArea) timesArea.style.pointerEvents = 'none';

  // Remove previous loading message if any
  let loadingEl = document.getElementById('res-times-loading');
  if (loadingEl) loadingEl.remove();

  // Create premium loading message
  loadingEl = document.createElement('div');
  loadingEl.id = 'res-times-loading';
  loadingEl.style.cssText = `
    display:flex;align-items:center;gap:1rem;
    padding:1.35rem 1.5rem;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.07);
    border-left:2px solid rgba(183,147,88,.35);
    border-radius:0 14px 14px 0;
    margin:.25rem 0;
    opacity:0;transform:translateY(8px);
    transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .5s cubic-bezier(.22,1,.36,1);
  `;
  loadingEl.innerHTML = `
    <span style="
      display:inline-block;width:18px;height:18px;
      border:2px solid rgba(183,147,88,.2);
      border-top-color:rgba(183,147,88,.7);
      border-radius:50%;
      animation:resSpin .8s linear infinite;
      flex-shrink:0;
    "></span>
    <span style="
      font-family:'Instrument Serif',serif;
      font-size:.95rem;font-weight:300;font-style:italic;
      color:rgba(255,255,255,.45);
      letter-spacing:-.005em;
    ">Consultando horários disponíveis…</span>
  `;
  if (timesArea) timesArea.appendChild(loadingEl);
  // Trigger entrance animation
  requestAnimationFrame(() => {
    loadingEl.style.opacity = '1';
    loadingEl.style.transform = 'translateY(0)';
  });

  /* ── 2. FETCH availability ─────────────────────────────────── */
  try {
    const params = new URLSearchParams({ environment_id: envId, reservation_date: date, party_size: size });
    const slots  = await apiFetch(`${API_ROUTES.availability}?${params}`);

    // Remove loading
    if (loadingEl) {
      loadingEl.style.opacity = '0';
      loadingEl.style.transform = 'translateY(-6px)';
      setTimeout(() => loadingEl.remove(), 350);
    }

    const times = slots.map(s => typeof s === 'string' ? s : s.time);

    /* ── 3a. EMPTY STATE ──────────────────────────────────────── */
    if (!times || times.length === 0) {
      DOM.timesEmpty.textContent = 'Não há horários disponíveis para esta combinação.';
      DOM.timesEmpty.style.display = '';
      if (timesArea) timesArea.style.pointerEvents = '';
      return;
    }

    /* ── 3b. RENDER SLOTS ─────────────────────────────────────── */
    const morning   = times.filter(t => t < '12:00');
    const afternoon = times.filter(t => t >= '12:00');
    DOM.timesContainer.innerHTML = '';
    if (morning.length)   DOM.timesContainer.appendChild(createPeriodGroup('Manhã', morning));
    if (afternoon.length) DOM.timesContainer.appendChild(createPeriodGroup('Tarde', afternoon));
    DOM.timesContainer.style.display = 'flex';

    const pills = DOM.timesContainer.querySelectorAll('.res-time-pill');
    if (pills.length) {
      gsap.fromTo(pills, {opacity:0,y:8,scale:.95}, {opacity:1,y:0,scale:1,duration:.4,ease:'power3.out',stagger:.04});
    }

    // Re-enable interaction
    if (timesArea) timesArea.style.pointerEvents = '';

  } catch (e) {
    /* ── 4. ERROR STATE ────────────────────────────────────────── */
    if (loadingEl) {
      loadingEl.style.opacity = '0';
      loadingEl.style.transform = 'translateY(-6px)';
      setTimeout(() => loadingEl.remove(), 350);
    }
    DOM.timesEmpty.textContent = 'Não foi possível verificar os horários agora. Tente novamente.';
    DOM.timesEmpty.style.display = '';
    if (timesArea) timesArea.style.pointerEvents = '';
    console.error(e);
  }
}

function createPeriodGroup(label, times) {
  const g = document.createElement('div'); g.className = 'res-time-group';
  const h = document.createElement('span'); h.className = 'res-time-group-label'; h.textContent = label; g.appendChild(h);
  const w = document.createElement('div'); w.className = 'res-time-group-pills';
  times.forEach(t => w.appendChild(createTimePill(t)));
  g.appendChild(w);
  return g;
}


/* ── Submit ────────────────────────────────────────────────────── */

async function handleSubmit() {
  const btn    = DOM.submitBtn;
  const textEl = btn.querySelector('.res-submit-text');
  const arrowEl = btn.querySelector('.res-submit-arrow');
  const valMsg  = document.getElementById('res-validation-msg');
  valMsg.style.display = 'none';
  DOM.successPanel.classList.remove('visible');
  DOM.errorPanel.classList.remove('visible');

  const environment = DOM.environment.value, date = DOM.dateInput.value;
  const name  = DOM.nameInput.value.trim();
  const email = DOM.emailInput.value.trim();
  const phone = DOM.phoneInput.value.trim();
  const notes = DOM.notesInput.value.trim();

  const err = getValidationError({environment, date, name, email, phone});
  if (err) {
    valMsg.textContent = err; valMsg.style.display = 'block';
    btn.classList.remove('is-shaking'); // reset so re-trigger works
    void btn.offsetWidth;              // force reflow
    btn.classList.add('is-shaking');
    btn.addEventListener('animationend', () => btn.classList.remove('is-shaking'), { once: true });
    return;
  }

  btn.classList.add('loading'); btn.disabled = true;
  textEl.textContent = 'Confirmando...'; arrowEl.style.display = 'none';

  try {
    await apiFetch(API_ROUTES.reservations, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, phone,
        environment_id:    environment,
        reservation_date:  date,
        reservation_time:  selectedTime,
        party_size:        Number(selectedGuests),
        notes:             notes || null,
      }),
    });

    btn.classList.remove('loading');
    btn.classList.add('success'); textEl.textContent = 'Reserva Confirmada ✓';
    DOM.successPanel.style.display = 'block';
    requestAnimationFrame(() => DOM.successPanel.classList.add('visible'));
    setTimeout(() => safeScrollTo(DOM.successPanel, {offset:-100,duration:1.2}), 300);
  } catch (e) {
    btn.classList.remove('loading');
    // Tenta extrair mensagem de validação do backend (HTTPException do FastAPI)
    let msg = 'Não foi possível processar sua reserva.';
    try {
      if (e.message) {
        const match = e.message.match(/API error \d+/);
        if (!match) msg = e.message;
      }
    } catch (_) {}

    btn.classList.add('error');
    textEl.textContent = 'Erro — Tente novamente';
    DOM.errorPanel.style.display = 'block';
    requestAnimationFrame(() => DOM.errorPanel.classList.add('visible'));
    valMsg.textContent = msg;
    valMsg.style.display = 'block';
    console.error('[reservation] handleSubmit error:', e);
    setTimeout(() => {
      btn.classList.remove('error');
      btn.disabled = false;
      textEl.textContent = 'Confirmar Reserva';
      arrowEl.style.display = '';
    }, 3000);
  }
}

function getValidationError({environment, date, name, email, phone}) {
  if (!environment)  return 'Selecione um ambiente para sua reserva.';
  if (!selectedGuests) return 'Selecione a quantidade de pessoas.';
  if (!date)         return 'Escolha a data da sua reserva.';
  if (!selectedTime) return 'Selecione um horário para sua reserva.';
  if (!name)         return 'Por favor, informe seu nome.';
  if (!email)        return 'Por favor, informe seu e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Por favor, informe um e-mail válido.';
  if (!phone)        return 'Por favor, informe seu telefone.';
  if (phone.replace(/\D/g,'').length < 11) return 'Informe o telefone completo com DDD.';
  return null;
}

function formatPhoneBR(v) {
  const d = v.replace(/\D/g,'').slice(0,11);
  if (!d.length) return '';
  if (d.length <= 2)  return `(${d}`;
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function resetForm() {
  selectedGuests = null; selectedTime = null;

  DOM.environment.selectedIndex = 0;
  DOM.envCards.querySelectorAll('.res-env-card').forEach(c => c.classList.remove('is-selected'));
  DOM.envSelectedBar.classList.remove('is-visible');
  hideFormSummary();

  DOM.guestsSublabel.textContent = 'Selecione um ambiente para ver a capacidade disponível.';
  DOM.guestsContainer.innerHTML = '';
  DOM.dateInput.value = '';
  DOM.rcdTrigger.disabled = true;
  DOM.rcdValue.textContent = 'Selecione uma data';
  DOM.rcdValue.classList.remove('has-date');
  DOM.dateSublabel.textContent = 'Selecione primeiro o ambiente e a quantidade de pessoas.';
  DOM.dateMsg.style.display = 'none';
  resetTimeSlots();

  DOM.nameInput.value = ''; DOM.emailInput.value = ''; DOM.phoneInput.value = ''; DOM.notesInput.value = '';
  tryEnablePersonalFields();

  const btn = DOM.submitBtn, t = btn.querySelector('.res-submit-text'), a = btn.querySelector('.res-submit-arrow');
  btn.classList.remove('loading','success','error'); btn.disabled = false;
  t.textContent = 'Confirmar Reserva'; a.style.display = '';

  const v = document.getElementById('res-validation-msg'); if (v) v.style.display = 'none';
  updateSummaryPills();
}

function handleNewReservation() {
  DOM.successPanel.classList.remove('visible'); DOM.successPanel.style.display = 'none';
  DOM.errorPanel.classList.remove('visible');   DOM.errorPanel.style.display = 'none';
  resetForm();
  setTimeout(() => { safeScrollTo('#reservation-flow', {offset:-60,duration:1.4}); }, 150);
}


/* ── Events ────────────────────────────────────────────────────── */

function bindEvents() {
  if (DOM.hamburger && DOM.mobileMenu) {
    DOM.hamburger.addEventListener('click', () => DOM.mobileMenu.classList.add('open'));
    DOM.mobileClose.addEventListener('click', () => DOM.mobileMenu.classList.remove('open'));
    DOM.mobileMenu.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => DOM.mobileMenu.classList.remove('open')));
  }

  DOM.environment.addEventListener('change', handleEnvironmentChange);

  DOM.phoneInput.addEventListener('input', () => {
    const c = DOM.phoneInput.selectionStart, pl = DOM.phoneInput.value.length;
    DOM.phoneInput.value = formatPhoneBR(DOM.phoneInput.value);
    const d = DOM.phoneInput.value.length - pl;
    DOM.phoneInput.setSelectionRange(c + d, c + d);
  });

  DOM.submitBtn.addEventListener('click', handleSubmit);

  const nb = document.getElementById('res-new-reservation');
  if (nb) nb.addEventListener('click', handleNewReservation);

  // "Alterar" button below cards
  if (DOM.envChangeBtn) DOM.envChangeBtn.addEventListener('click', resetEnvCardSelection);

  // "Alterar" button in env summary — smooth scroll back to gallery
  const alterBtn = document.getElementById('res-form-env-alter-btn');
  if (alterBtn) {
    alterBtn.addEventListener('click', () => {
      safeScrollTo('#reservation-flow', { offset: -80, duration: 1.4 });
    });
  }
}


/* ── Animations ────────────────────────────────────────────────── */

function initAnimations() {
  ScrollTrigger.create({start:'top -80',end:99999,toggleClass:{className:'is-scrolled',targets:'#navbar'}});

  // On mobile: skip GPU-heavy blur filters — use only opacity+y
  const useBlur = !isMobileDevice;

  // Hero element initial state
  gsap.set('#el-kicker', { opacity: 0, y: 22, ...(useBlur && { filter: 'blur(14px)' }) });
  gsap.set('#el-h1',     { opacity: 0, y: 30, ...(useBlur && { filter: 'blur(16px)' }) });
  gsap.set('#el-sep',    { opacity: 0, scaleX: 0, transformOrigin: 'left' });
  gsap.set('#el-body',   { opacity: 0, y: 20, ...(useBlur && { filter: 'blur(12px)' }) });
  gsap.set('#el-cta',    { opacity: 0, y: 16, ...(useBlur && { filter: 'blur(10px)' }) });
  gsap.set('#el-scroll', { opacity: 0, y: 10, ...(useBlur && { filter: 'blur(8px)' }) });
  gsap.set('#video-frame', { opacity: 0, scale: isMobileDevice ? 1 : 0.94 });
  gsap.set('#navbar',    { opacity: 0 });

  // Entrance timeline — simplified on mobile for faster perceived load
  function buildEntranceTl() {
    const tl = gsap.timeline();
    if (isMobileDevice) {
      // Simpler, faster entrance: no blur, shorter durations
      tl
        .to('#navbar',    { opacity: 1, duration: 0.5, ease: 'power2.out' })
        .to('#el-kicker', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
        .to('#video-frame', { opacity: 1, duration: 0.9, ease: 'power3.out' }, '<')
        .to('#el-h1',     { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
        .to('#el-sep',    { opacity: 1, scaleX: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .to('#el-body',   { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
        .to('#el-cta',    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2')
        .to('#el-scroll', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1');
    } else {
      tl
        .to('#navbar', { opacity: 1, duration: 0.8, ease: 'power2.out' })
        .to('#el-kicker', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'expo.out' }, '-=0.5')
        .add('titleShow', '-=0.8')
        .to('#el-h1', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow')
        .to('#video-frame', { opacity: 1, scale: 1, duration: 1.8, ease: 'power4.out' }, 'titleShow')
        .to('#el-sep', { opacity: 1, scaleX: 1, duration: 1.2, ease: 'expo.out' }, 'titleShow+=0.30')
        .to('#el-body', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, 'titleShow+=0.55')
        .to('#el-cta', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' }, 'titleShow+=0.75')
        .to('#el-scroll', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 'titleShow+=1.05');
    }
    return tl;
  }

  // Initialize Canvas — size MUST be set before first draw
  _doResize(); // Use direct call to bypass throttle on init
  window.addEventListener('resize', resizeCanvas);
  // On mobile, the card may not have final dimensions yet — retry after layout
  if (isMobileDevice) {
    requestAnimationFrame(() => { _doResize(); setTimeout(_doResize, 300); });
  }
  // Force-draw frame 0 immediately if it already loaded
  if (frames[0]?.complete && frames[0].naturalWidth > 0) {
    currentFrameIndex = -1; // reset so drawFrame doesn't skip
    drawFrame(0);
  }
  // Canvas ready state:
  // On desktop: add .ready class to trigger CSS unblur animation
  // On mobile: directly set visible state (CSS transitions already disabled)
  if (canvas) {
    if (isMobileDevice) {
      canvas.style.cssText += ';filter:none;transform:none;opacity:1;transition:none';
    } else {
      canvas.classList.add('ready');
    }
  }

  // Hero Scroll Pin + Sequence
  const wrapper = document.getElementById('hero-pin-wrapper');
  const viewport = document.getElementById('hero-viewport');
  const scrollPx = window.innerHeight * (CONFIG_SEQ.scrollVH / 100);

  if (wrapper && viewport && canvas) {
    wrapper.style.height = `${window.innerHeight + scrollPx}px`;

    // On mobile, force the hero to match the real viewport height
    // (CSS 100vh can be taller than the visible area due to browser bar)
    if (isMobileDevice) {
      viewport.style.height = `${window.innerHeight}px`;

      // Paint body dark while hero is visible — any gaps show dark, not cream
      document.body.style.background = '#0C1A10';

      // Restore body bg when hero scrolls out of view
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom top',
        onLeave: () => { document.body.style.background = ''; },
        onEnterBack: () => { document.body.style.background = '#0C1A10'; }
      });
    }

    // Ensure pinned hero covers content below with high z-index
    viewport.style.zIndex = '100';

    ScrollTrigger.create({
      trigger: wrapper,
      start: 'top top',
      end: () => `+=${scrollPx}`,
      pin: viewport,
      // Mobile: pinSpacing true pushes content below the pin zone
      // so section 2 only appears after video finishes.
      // Desktop: false — wrapper height handles spacing.
      pinSpacing: isMobileDevice,
      scrub: CONFIG_SEQ.scrub,
      onUpdate: (self) => {
        const idx = Math.min(
          Math.floor(self.progress * CONFIG_SEQ.TOTAL_FRAMES),
          CONFIG_SEQ.TOTAL_FRAMES - 1
        );
        drawFrame(idx);
      },
      onRefresh: () => {
        // GSAP pin sets explicit pixel width — override to full viewport
        if (isMobileDevice) {
          viewport.style.setProperty('width', '100vw', 'important');
          viewport.style.setProperty('left', '0', 'important');
        }
      }
    });

    // Also force immediately after creation (before first refresh)
    if (isMobileDevice) {
      viewport.style.setProperty('width', '100vw', 'important');
      viewport.style.setProperty('left', '0', 'important');
    }

    // Exit Scrub Animations (Elements fade out as you scroll)
    const scrollSettings = {
      trigger: wrapper,
      start: 'top top',
      scrub: 1.2,
    };

    // Exit animations — no blur on mobile (expensive)
    const bf = (v) => useBlur ? { filter: `blur(${v})` } : {};
    gsap.to('#el-kicker', {
      opacity: 0, y: -28, ...bf('8px'), ease: 'power2.in', immediateRender: false,
      scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.22}` }
    });
    gsap.to('#el-h1', {
      opacity: 0, y: -40, ...bf('12px'), ease: 'power2.in', immediateRender: false,
      scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.3}` }
    });
    gsap.to('#el-sep', {
      scaleX: 0, opacity: 0, ease: 'power2.in', immediateRender: false,
      scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.38}` }
    });
    gsap.to('#el-body', {
      opacity: 0, y: -22, ...bf('8px'), ease: 'power2.in', immediateRender: false,
      scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.43}` }
    });
    gsap.to('#el-cta', {
      opacity: 0, y: -18, ...bf('6px'), ease: 'power2.in', immediateRender: false,
      scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.5}` }
    });
    gsap.to('#el-scroll', {
      opacity: 0, y: -14, ease: 'power2.in', immediateRender: false,
      scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.25}` }
    });

    // Mobile: video is fullscreen from start (CSS handles it).
    // No card expansion needed — just frames + scroll.
  }

  // Entrance
  buildEntranceTl().delay(0.2);

  // Section reveals — skip scale animation on mobile for jank-free scroll
  document.querySelectorAll('.res-reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 90%',
      onEnter: () => {
        el.classList.add('is-visible');
        if (!isMobileDevice && el.classList.contains('res-step')) {
          gsap.fromTo(el, { scale:.988 }, { scale:1, duration:1, ease:'power3.out' });
        }
      }
    });
  });

  // Footer reveals — no blur on mobile
  document.querySelectorAll('.ft-reveal').forEach(el => {
    ScrollTrigger.create({trigger:el,start:'top 92%',onEnter:()=>{
      if (isMobileDevice) {
        gsap.to(el, { opacity:1, y:0, duration:0.6, ease:'power3.out' });
      } else {
        gsap.to(el, { opacity:1, y:0, filter:'blur(0px)', duration:.9, ease:'power3.out' });
      }
    }});
  });

  // Secondary animations:
  // On mobile: defer to idle time so the hero scroll+frames render first
  // On desktop: run immediately after layout
  const scheduleSecondary = (fn) => {
    if (isMobileDevice) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(fn, { timeout: 1500 });
      } else {
        setTimeout(fn, 400);
      }
    } else {
      fn();
    }
  };

  scheduleSecondary(() => {
    initHeroParallax();
    initHeroParticles();   // already no-op on mobile
    initGoldenDust();      // already no-op on mobile
    initEnvSectionParallax(); // no-op on mobile
    initSectionDividerReveal();
    initEnvScrollWord();   // already no-op on mobile
    initFormScrollWord();  // already no-op on mobile
  });

  // Hero CTA
  const heroCta = document.getElementById('res-hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', e => {
      e.preventDefault();
      safeScrollTo('#reservation-flow', {offset:-60,duration:1.8});
    });
  }

  // Env section header reveal
  initEnvHeaderReveal();

  // Env card parallax + fade-in
  initEnvCardsParallax();
}

function initHeroParallax() {
  // Parallax removed in favor of scroll pinning sequence
}

function initHeroParticles() {
  const container = document.getElementById('res-hero-particles');
  if (!container || window.innerWidth < 768) return;
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'res-hero-particle';
    p.style.left              = Math.random() * 100 + '%';
    p.style.bottom            = (Math.random() * 40 + 5) + '%';
    p.style.width             = (1.5 + Math.random() * 2.5) + 'px';
    p.style.height            = p.style.width;
    p.style.animationDuration = (6 + Math.random() * 9) + 's';
    p.style.animationDelay    = (Math.random() * 12) + 's';
    container.appendChild(p);
  }
}

/* ── Golden dust particles — form section atmosphere ──────────── */
function initGoldenDust() {
  const container = document.getElementById('res-golden-dust');
  if (!container || window.innerWidth < 768) return;
  for (let i = 0; i < 12; i++) {
    const mote = document.createElement('div');
    mote.className = 'res-dust-mote';
    mote.style.left              = (Math.random() * 90 + 5) + '%';
    mote.style.bottom            = (Math.random() * 60 + 10) + '%';
    mote.style.width             = (1 + Math.random() * 2) + 'px';
    mote.style.height            = mote.style.width;
    mote.style.animationDuration = (10 + Math.random() * 15) + 's';
    mote.style.animationDelay    = (Math.random() * 18) + 's';
    container.appendChild(mote);
  }
}

/* ── Environment section parallax — desktop only, skip on mobile ── */
function initEnvSectionParallax() {
  if (isMobileDevice) return; // Parallax on scroll is janky on mobile
  const envBg = document.querySelector('.res-env-section-bg');
  if (!envBg) return;
  ScrollTrigger.create({
    trigger: '.res-env-section', start: 'top bottom', end: 'bottom top', scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(envBg, { y: p * 40 - 20 });
    }
  });
}

/* ── Env Section Header Reveal — no blur on mobile ──────────────── */
function initEnvHeaderReveal() {
  const headerEls = document.querySelectorAll('.res-env-header-reveal');
  if (!headerEls.length) return;

  // Set initial hidden state — no blur on mobile
  if (isMobileDevice) {
    gsap.set(headerEls, { opacity: 0, y: 18 });
  } else {
    gsap.set(headerEls, { opacity: 0, y: 30, filter: 'blur(8px)' });
  }

  ScrollTrigger.create({
    trigger: '.res-env-section-header',
    start: 'top 90%',
    once: true,
    onEnter: () => {
      headerEls.forEach(el => {
        const d = isMobileDevice ? 0 : parseFloat(el.dataset.delay || 0);
        const props = isMobileDevice
          ? { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: d }
          : { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', delay: d,
              onComplete: () => gsap.set(el, { clearProps: 'filter' }) };
        gsap.to(el, { ...props, onStart: () => el.classList.add('is-revealed') });
      });
    }
  });
}

/* ── AMBIENTE Scroll-Driven Word — mirrors TEMPO from index ────── */
function initEnvScrollWord() {
  const wordEl = document.querySelector('.res-env-scroll-word-text');
  if (!wordEl || window.innerWidth < 768) return;

  ScrollTrigger.create({
    trigger: '.res-env-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.5,
    onUpdate: (self) => {
      // starts at translateX(30%) → moves left as user scrolls down
      const x = 30 - self.progress * 70; // 30% → -40%
      gsap.set(wordEl, { x: `${x}%` });
    }
  });
}

/* ── RESERVAR Scroll-Driven Word — form section (same mechanic) ─── */
function initFormScrollWord() {
  const wordEl = document.querySelector('.res-scroll-word-text');
  if (!wordEl || window.innerWidth < 768) return;

  ScrollTrigger.create({
    trigger: '.res-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1.5,
    onUpdate: (self) => {
      const x = 30 - self.progress * 70; // 30% → -40%
      gsap.set(wordEl, { x: `${x}%` });
    }
  });
}

/* ── Env Cards — single unified entrance + image parallax ─────── */
function initEnvCardsParallax() {
  const grid = document.getElementById('res-env-cards');
  if (!grid) return;

  let entranceDone = false;

  const runEntrance = () => {
    const cards = grid.querySelectorAll('.res-env-card');
    if (!cards.length) return;

    // Single ScrollTrigger on the grid — all cards animate together with stagger
    ScrollTrigger.create({
      trigger: grid,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        if (entranceDone) return;
        entranceDone = true;

        if (isMobileDevice) {
          // Mobile: no blur, no scale — pure opacity+y for compositor-thread animation
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power3.out',
            stagger: 0.05,
          });
        } else {
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.75,
            ease: 'power3.out',
            stagger: 0.07,
            onComplete: () => {
              cards.forEach(c => gsap.set(c, { clearProps: 'filter' }));
            }
          });
        }
      }
    });

    // Card image parallax — desktop only (scrub on every scroll event is too heavy on mobile)
    if (!isMobileDevice) {
      cards.forEach(card => {
        const img = card.querySelector('.res-env-card-img');
        if (!img) return;
        ScrollTrigger.create({
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            gsap.set(img, { y: (self.progress - 0.5) * 28 });
          }
        });
      });
    }
  };

  // Wait for JS to populate cards (API call), or run immediately if already populated
  const existingCards = grid.querySelectorAll('.res-env-card');
  if (existingCards.length > 0) {
    setTimeout(runEntrance, 80);
  } else {
    const observer = new MutationObserver(() => {
      const cards = grid.querySelectorAll('.res-env-card');
      if (cards.length > 0) {
        observer.disconnect();
        // Small delay ensures gsap.set(opacity:0) from renderEnvCards settled
        setTimeout(runEntrance, 80);
      }
    });
    observer.observe(grid, { childList: true });
  }
}

/* ── Section divider reveal — animate lines in from center ─────── */
function initSectionDividerReveal() {
  const divider = document.querySelector('.res-section-divider');
  if (!divider) return;
  const lines = divider.querySelectorAll('.res-section-divider-line');
  const diamond = divider.querySelector('.res-section-divider-diamond');
  
  gsap.set(lines, { scaleX: 0 });
  gsap.set(diamond, { scale: 0, rotation: 0 });
  
  ScrollTrigger.create({
    trigger: divider, start: 'top 90%',
    onEnter: () => {
      gsap.to(lines, { scaleX: 1, duration: 1.2, ease: 'power3.out', stagger: 0.1 });
      gsap.to(diamond, { scale: 1, rotation: 45, duration: .8, ease: 'back.out(1.7)', delay: .4 });
    }
  });
}


/* ── Init ──────────────────────────────────────────────────────── */

// FETCH ANTECIPADO: inicia a requisição imediatamente,
// sem aguardar a animação do preloader terminar.
loadEnvironments();

function initPage() {
  initAnimations();
}

(async function runPreloader() {
  // Preload frames while simulating percentage
  await preloadFrames();
  
  DOM.loaderBar.style.width = '100%';

  // Mobile: shorter delay before reveal for faster time-to-interactive
  const preloaderDelay = isMobileDevice ? 150 : 400;
  const preloaderDuration = isMobileDevice ? 0.7 : 1.2;

  setTimeout(() => {
    gsap.to(DOM.loader, {yPercent:-100, duration:preloaderDuration, ease:'power4.inOut', onComplete:() => {
      DOM.loader.style.display = 'none';
      document.body.style.opacity = '1';
      initPage();
    }});
  }, preloaderDelay);
})();

bindEvents();
initDatepicker();