/* ═══════════════════════════════════════════════════════════════════
   RESERVATION PAGE — JavaScript
   Giardini Café · reservation.js
   ═══════════════════════════════════════════════════════════════════ */

/* ── Configuration ─────────────────────────────────────────────── */

const API_BASE_URL = "http://127.0.0.1:8000";

// Image mapping by environment ID — populated after API returns environments.
// Fallback: maps by name if ID is not found.
const ENVIRONMENT_IMAGES_BY_NAME = {
  'Jardim Externo':          'assets/images/space.webp',
  'Salão Principal':         'assets/images/_MG_2011.jpg',
  'Lounge Reservado':        'assets/images/_MG_2064.jpg',
  'Sala Privativa Pequena':  'assets/images/_MG_1994.jpg',
  'Sala Privativa Média':    'assets/images/_MG_2008.jpg',
  'Sala Privativa Grande':   'assets/images/_MG_2005 (1).jpg',
};

// Will be built as { envId: imagePath } after loadEnvironments()
let ENVIRONMENT_IMAGES = {};

const DEFAULT_PREVIEW_IMAGE = 'assets/images/space.webp';

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];


/* ── GSAP & Lenis Setup ───────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  smooth: true,
  smoothTouch: false,
});

function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);


/* ── DOM References ────────────────────────────────────────────── */

const DOM = {
  loader: document.getElementById('loader'),
  loaderBar: document.getElementById('loader-bar'),
  hamburger: document.getElementById('hamburger'),
  mobileMenu: document.getElementById('mobile-menu'),
  mobileClose: document.getElementById('mobile-close'),
  environment: document.getElementById('res-environment'),
  environmentMsg: document.getElementById('res-environment-msg'),
  guestsContainer: document.getElementById('res-guests'),
  guestsSublabel: document.getElementById('res-guests-sublabel'),
  dateInput: document.getElementById('res-date'),
  dateMsg: document.getElementById('res-date-msg'),
  dateSublabel: document.getElementById('res-date-sublabel'),
  timesEmpty: document.getElementById('res-times-empty'),
  timesSkeleton: document.getElementById('res-times-skeleton'),
  timesContainer: document.getElementById('res-times'),
  nameInput: document.getElementById('res-name'),
  emailInput: document.getElementById('res-email'),
  phoneInput: document.getElementById('res-phone'),
  notesInput: document.getElementById('res-notes'),
  infoSublabel: document.getElementById('res-info-sublabel'),
  submitBtn: document.getElementById('res-submit'),
  successPanel: document.getElementById('res-success'),
  errorPanel: document.getElementById('res-error'),
  envPreviewImg: document.getElementById('res-env-preview-img'),
  envPreviewName: document.getElementById('res-env-preview-envname'),
  envShowcaseImg: document.getElementById('res-env-showcase-img'),
  envShowcaseName: document.getElementById('res-env-showcase-name'),
  summaryEnv: document.getElementById('summary-env'),
  summaryGuests: document.getElementById('summary-guests'),
  summaryDate: document.getElementById('summary-date'),
  summaryTime: document.getElementById('summary-time'),
  // Custom select
  rcsTrigger: document.getElementById('rcs-trigger'),
  rcsValue: document.getElementById('rcs-value'),
  rcsDropdown: document.getElementById('rcs-dropdown'),
  rcsOptions: document.getElementById('rcs-options'),
  // Custom datepicker
  rcdTrigger: document.getElementById('rcd-trigger'),
  rcdValue: document.getElementById('rcd-value'),
  rcdCalendar: document.getElementById('rcd-calendar'),
  rcdMonth: document.getElementById('rcd-month'),
  rcdDays: document.getElementById('rcd-days'),
  rcdPrev: document.getElementById('rcd-prev'),
  rcdNext: document.getElementById('rcd-next'),
};


/* ── State ─────────────────────────────────────────────────────── */

let environmentsData = [];
let selectedGuests   = null;
let selectedTime     = null;

// Datepicker state
let dpViewYear  = new Date().getFullYear();
let dpViewMonth = new Date().getMonth();


/* ══════════════════════════════════════════════════════════════════
   CUSTOM SELECT — Environment picker
   ══════════════════════════════════════════════════════════════════ */

function rcsOpen() {
  DOM.rcsTrigger.setAttribute('aria-expanded', 'true');
  DOM.rcsDropdown.classList.add('is-open');
  DOM.rcsTrigger.closest('.rcs-wrap').classList.add('is-active');
  const step = DOM.rcsTrigger.closest('.res-step');
  if (step) step.classList.add('has-open-widget');
}

function rcsClose() {
  DOM.rcsTrigger.setAttribute('aria-expanded', 'false');
  DOM.rcsDropdown.classList.remove('is-open');
  DOM.rcsTrigger.closest('.rcs-wrap').classList.remove('is-active');
  const step = DOM.rcsTrigger.closest('.res-step');
  if (step) step.classList.remove('has-open-widget');
}

function rcsToggle() {
  const isOpen = DOM.rcsDropdown.classList.contains('is-open');
  isOpen ? rcsClose() : rcsOpen();
}

function rcsSelect(envId, envName) {
  // Update hidden native select
  DOM.environment.value = envId;
  DOM.environment.dispatchEvent(new Event('change'));

  // Update custom trigger text
  DOM.rcsValue.textContent = envName;
  DOM.rcsValue.classList.remove('is-placeholder');

  // Update option states
  DOM.rcsOptions.querySelectorAll('.rcs-option').forEach(opt => {
    opt.classList.toggle('is-selected', opt.dataset.value === envId);
  });

  rcsClose();
}

function rcsPopulate(data) {
  DOM.rcsOptions.innerHTML = '';

  if (!data || data.length === 0) {
    DOM.rcsValue.textContent = 'Nenhum ambiente disponível';
    DOM.rcsValue.classList.add('is-placeholder');
    DOM.rcsTrigger.disabled = true;
    return;
  }

  DOM.rcsValue.textContent = 'Selecione um ambiente';
  DOM.rcsValue.classList.add('is-placeholder');
  DOM.rcsTrigger.disabled = false;

  data.forEach(env => {
    const opt = document.createElement('div');
    opt.className = 'rcs-option';
    opt.dataset.value = env.id;
    opt.textContent = env.name;
    opt.setAttribute('role', 'option');
    opt.addEventListener('click', () => rcsSelect(env.id, env.name));
    DOM.rcsOptions.appendChild(opt);
  });
}

function initCustomSelect() {
  DOM.rcsTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!DOM.rcsTrigger.disabled) rcsToggle();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.rcs-wrap')) rcsClose();
  });
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

function rcdToggle() {
  DOM.rcdCalendar.classList.contains('is-open') ? rcdClose() : rcdOpen();
}

function renderCalendar() {
  DOM.rcdMonth.textContent = `${MONTHS_PT[dpViewMonth]} ${dpViewYear}`;
  DOM.rcdDays.innerHTML = '';

  // Disable prev-month button if viewing the current month
  const now = new Date();
  const isCurrentMonth = dpViewYear === now.getFullYear() && dpViewMonth === now.getMonth();
  DOM.rcdPrev.disabled = isCurrentMonth;
  DOM.rcdPrev.style.opacity = isCurrentMonth ? '0.25' : '';
  DOM.rcdPrev.style.pointerEvents = isCurrentMonth ? 'none' : '';

  const today = new Date();
  today.setHours(0,0,0,0);

  const firstDay = new Date(dpViewYear, dpViewMonth, 1).getDay();
  const daysInMonth = new Date(dpViewYear, dpViewMonth + 1, 0).getDate();
  const selectedVal = DOM.dateInput.value;

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('button');
    empty.type = 'button';
    empty.className = 'rcd-day is-empty';
    DOM.rcdDays.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rcd-day';
    btn.textContent = d;

    const cellDate = new Date(dpViewYear, dpViewMonth, d);
    cellDate.setHours(0,0,0,0);
    const iso = toISO(dpViewYear, dpViewMonth + 1, d);
    const isMonday = cellDate.getDay() === 1;
    const isPast = cellDate < today;
    const isToday = cellDate.getTime() === today.getTime();
    const isSelected = selectedVal === iso;

    if (isPast) btn.classList.add('is-past', 'is-disabled');
    else if (isMonday) btn.classList.add('is-disabled');
    if (isToday) btn.classList.add('is-today');
    if (isSelected) btn.classList.add('is-selected');

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
    // Block navigation to months before the current month
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

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.rcd-wrap')) rcdClose();
  });

  // Prevent closing when clicking inside calendar
  DOM.rcdCalendar.addEventListener('click', (e) => e.stopPropagation());
}


/* ── Helpers ───────────────────────────────────────────────────── */

function getTodayISO() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

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
  DOM.timesEmpty.style.display = '';
  DOM.timesContainer.style.display = 'none';
  DOM.timesSkeleton.style.display = 'none';
  DOM.timesContainer.innerHTML = '';
  selectedTime = null;
  tryEnablePersonalFields();
  updateBookingSummary();
}

function tryLoadAvailability() {
  const hasEnv = DOM.environment.value !== '';
  const hasGuests = selectedGuests !== null;
  const hasDate = DOM.dateInput.value !== '';
  if (hasEnv && hasGuests && hasDate) loadAvailability();
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
    gsap.to(DOM.rcdTrigger, { x: [-6,6,-4,4,-2,2,0], duration: 0.4, ease: 'power2.out' });
    return;
  }

  updateBookingSummary();
  loadAvailability();
}


/* ── Booking Summary ──────────────────────────────────────────── */

function updateBookingSummary() {
  if (!DOM.summaryEnv) return;

  const env = getEnvironmentById(DOM.environment.value);
  const eSpan = DOM.summaryEnv.querySelector('span');
  if (env) { eSpan.textContent = env.name; DOM.summaryEnv.classList.add('is-filled'); }
  else { eSpan.textContent = 'Ambiente não selecionado'; DOM.summaryEnv.classList.remove('is-filled'); }

  const gSpan = DOM.summaryGuests.querySelector('span');
  if (selectedGuests) { gSpan.textContent = `${selectedGuests} ${selectedGuests==='1'?'pessoa':'pessoas'}`; DOM.summaryGuests.classList.add('is-filled'); }
  else { gSpan.textContent = '— pessoas'; DOM.summaryGuests.classList.remove('is-filled'); }

  const dSpan = DOM.summaryDate.querySelector('span');
  if (DOM.dateInput.value) { dSpan.textContent = formatDateDisplay(DOM.dateInput.value); DOM.summaryDate.classList.add('is-filled'); }
  else { dSpan.textContent = 'Data não selecionada'; DOM.summaryDate.classList.remove('is-filled'); }

  const tSpan = DOM.summaryTime.querySelector('span');
  if (selectedTime) { tSpan.textContent = selectedTime; DOM.summaryTime.classList.add('is-filled'); }
  else { tSpan.textContent = 'Horário não selecionado'; DOM.summaryTime.classList.remove('is-filled'); }
}


/* ── API ──────────────────────────────────────────────────────── */

async function loadEnvironments() {
  const select = DOM.environment;
  const msg = DOM.environmentMsg;
  select.innerHTML = '<option value="" disabled selected>Carregando ambientes...</option>';
  select.disabled = true;
  msg.style.display = 'none';
  DOM.rcsValue.textContent = 'Carregando ambientes...';
  DOM.rcsValue.classList.add('is-placeholder');
  DOM.rcsTrigger.disabled = true;

  try {
    const r = await fetch(`${API_BASE_URL}/environments`);
    if (!r.ok) throw new Error('fail');
    const data = await r.json();

    if (!data || data.length === 0) {
      select.innerHTML = '<option value="" disabled selected>Nenhum ambiente</option>';
      msg.textContent = 'Não há ambientes disponíveis no momento.';
      msg.style.color = 'inherit';
      msg.style.display = 'block';
      rcsPopulate([]);
      return;
    }

    environmentsData = data;

    // Build ID-based image mapping from stored name map
    ENVIRONMENT_IMAGES = {};
    data.forEach(env => {
      ENVIRONMENT_IMAGES[env.id] = ENVIRONMENT_IMAGES_BY_NAME[env.name] || DEFAULT_PREVIEW_IMAGE;
    });

    select.innerHTML = '<option value="" disabled selected>Selecione</option>';
    data.forEach(env => {
      const o = document.createElement('option');
      o.value = env.id; o.textContent = env.name;
      select.appendChild(o);
    });
    select.disabled = false;
    rcsPopulate(data);

  } catch (e) {
    select.innerHTML = '<option value="" disabled selected>Indisponível</option>';
    msg.textContent = 'Não foi possível carregar os ambientes.';
    msg.style.color = '#ef4444';
    msg.style.display = 'block';
    rcsPopulate([]);
    console.error('Falha:', e);
  }
}

function getEnvironmentById(id) {
  return environmentsData.find(e => e.id === id) || null;
}

function renderGuestPills(max) {
  const c = DOM.guestsContainer;
  c.innerHTML = '';
  selectedGuests = null;
  for (let i = 1; i <= max; i++) {
    const p = document.createElement('button');
    p.className = 'res-pill'; p.textContent = i; p.dataset.guests = String(i);
    p.addEventListener('click', () => {
      c.querySelectorAll('.res-pill').forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      selectedGuests = p.dataset.guests;
      tryEnableDateInput(); tryLoadAvailability(); updateBookingSummary();
    });
    c.appendChild(p);
  }
  if (c.children.length) {
    gsap.fromTo(c.children, {opacity:0,y:6,scale:.95}, {opacity:1,y:0,scale:1,duration:.35,ease:'power3.out',stagger:.03});
  }
}

function handleEnvironmentChange() {
  const env = getEnvironmentById(DOM.environment.value);
  updateEnvironmentPreview(env);
  updateBookingSummary();

  if (!env || !env.max_capacity || env.max_capacity < 1) {
    DOM.guestsSublabel.textContent = 'Selecione um ambiente para ver a capacidade disponível.';
    DOM.guestsContainer.innerHTML = '';
    selectedGuests = null;
    tryEnableDateInput();
    return;
  }

  DOM.guestsSublabel.textContent = `Este ambiente comporta até ${env.max_capacity} pessoas por reserva.`;
  renderGuestPills(env.max_capacity);
  tryEnableDateInput(); tryLoadAvailability();
}

function updateEnvironmentPreview(env) {
  const name = env ? env.name : 'Selecione um ambiente';
  const src = env ? (ENVIRONMENT_IMAGES[env.id] || ENVIRONMENT_IMAGES_BY_NAME[env.name] || DEFAULT_PREVIEW_IMAGE) : DEFAULT_PREVIEW_IMAGE;

  // Mobile
  if (DOM.envPreviewImg && DOM.envPreviewName) {
    DOM.envPreviewName.textContent = name;
    if (!DOM.envPreviewImg.src.endsWith(src)) {
      DOM.envPreviewImg.classList.add('is-fading');
      setTimeout(() => { DOM.envPreviewImg.src = src; DOM.envPreviewImg.alt = name; DOM.envPreviewImg.onload = () => DOM.envPreviewImg.classList.remove('is-fading'); setTimeout(() => DOM.envPreviewImg.classList.remove('is-fading'), 50); }, 350);
    }
  }

  // Desktop
  if (DOM.envShowcaseImg && DOM.envShowcaseName) {
    DOM.envShowcaseName.textContent = name;
    if (!DOM.envShowcaseImg.src.endsWith(src)) {
      DOM.envShowcaseImg.classList.add('is-fading');
      setTimeout(() => { DOM.envShowcaseImg.src = src; DOM.envShowcaseImg.alt = name; DOM.envShowcaseImg.onload = () => DOM.envShowcaseImg.classList.remove('is-fading'); setTimeout(() => DOM.envShowcaseImg.classList.remove('is-fading'), 50); }, 350);
    }
  }
}

function createTimePill(time) {
  const p = document.createElement('button');
  p.className = 'res-time-pill'; p.textContent = time; p.dataset.time = time;
  p.addEventListener('click', () => {
    document.querySelectorAll('.res-time-pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    selectedTime = time;
    tryEnablePersonalFields(); updateBookingSummary();
  });
  return p;
}

async function loadAvailability() {
  const envId = DOM.environment.value, date = DOM.dateInput.value, size = selectedGuests;
  if (!envId || !date || !size) return;

  DOM.timesEmpty.style.display = 'none';
  DOM.timesContainer.style.display = 'none';
  DOM.timesSkeleton.style.display = 'flex';
  selectedTime = null;
  tryEnablePersonalFields(); updateBookingSummary();

  try {
    const r = await fetch(`${API_BASE_URL}/availability?${new URLSearchParams({environment_id:envId,reservation_date:date,party_size:size})}`);
    if (!r.ok) throw new Error('fail');
    const slots = await r.json();
    DOM.timesSkeleton.style.display = 'none';
    const times = slots.map(s => typeof s==='string'?s:s.time);

    if (!times || times.length === 0) {
      DOM.timesEmpty.textContent = 'Nenhum horário disponível para esta data. Tente outro dia.';
      DOM.timesEmpty.style.display = '';
      return;
    }

    const morning = times.filter(t => t < '12:00');
    const afternoon = times.filter(t => t >= '12:00');
    DOM.timesContainer.innerHTML = '';
    if (morning.length) DOM.timesContainer.appendChild(createPeriodGroup('Manhã', morning));
    if (afternoon.length) DOM.timesContainer.appendChild(createPeriodGroup('Tarde', afternoon));
    DOM.timesContainer.style.display = 'flex';

    const pills = DOM.timesContainer.querySelectorAll('.res-time-pill');
    if (pills.length) gsap.fromTo(pills, {opacity:0,y:8,scale:.95}, {opacity:1,y:0,scale:1,duration:.4,ease:'power3.out',stagger:.035});
  } catch (e) {
    DOM.timesSkeleton.style.display = 'none';
    DOM.timesEmpty.textContent = 'Não foi possível carregar os horários.';
    DOM.timesEmpty.style.display = '';
    console.error('Falha:', e);
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


/* ── Submit ───────────────────────────────────────────────────── */

async function handleSubmit() {
  const btn = DOM.submitBtn, textEl = btn.querySelector('.res-submit-text'), arrowEl = btn.querySelector('.res-submit-arrow');
  const valMsg = document.getElementById('res-validation-msg');
  valMsg.style.display = 'none';
  DOM.successPanel.classList.remove('visible');
  DOM.errorPanel.classList.remove('visible');

  const environment = DOM.environment.value, date = DOM.dateInput.value;
  const name = DOM.nameInput.value.trim(), email = DOM.emailInput.value.trim();
  const phone = DOM.phoneInput.value.trim(), notes = DOM.notesInput.value.trim();

  const err = getValidationError({environment, date, name, email, phone});
  if (err) {
    valMsg.textContent = err; valMsg.style.display = 'block';
    gsap.to(btn, {x:[-8,8,-6,6,-3,3,0],duration:.5,ease:'power2.out'});
    return;
  }

  btn.classList.add('loading'); btn.disabled = true;
  textEl.textContent = 'Confirmando...'; arrowEl.style.display = 'none';

  try {
    const r = await fetch(`${API_BASE_URL}/reservations`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name,email,phone,environment_id:environment,reservation_date:date,reservation_time:selectedTime,party_size:Number(selectedGuests),notes:notes||null}),
    });

    btn.classList.remove('loading');
    if (r.ok) {
      btn.classList.add('success'); textEl.textContent = 'Reserva Confirmada ✓';
      DOM.successPanel.style.display = 'block';
      requestAnimationFrame(() => DOM.successPanel.classList.add('visible'));
      setTimeout(() => lenis.scrollTo(DOM.successPanel, {offset:-100,duration:1.2}), 300);
    } else {
      let msg = 'Não foi possível processar sua reserva.';
      try { const b = await r.json(); if(b.detail) msg = typeof b.detail==='string'?b.detail:b.detail.map(e=>e.msg).join('. '); } catch(_){}
      btn.classList.add('error'); textEl.textContent = 'Erro — Tente novamente';
      DOM.errorPanel.style.display = 'block';
      requestAnimationFrame(() => DOM.errorPanel.classList.add('visible'));
      valMsg.textContent = msg; valMsg.style.display = 'block';
      setTimeout(() => { btn.classList.remove('error'); btn.disabled=false; textEl.textContent='Confirmar Reserva'; arrowEl.style.display=''; }, 3000);
    }
  } catch (e) {
    btn.classList.remove('loading'); btn.classList.add('error');
    textEl.textContent = 'Erro — Tente novamente';
    DOM.errorPanel.style.display = 'block';
    requestAnimationFrame(() => DOM.errorPanel.classList.add('visible'));
    valMsg.textContent = 'Falha na conexão.'; valMsg.style.display = 'block';
    console.error('Falha:', e);
    setTimeout(() => { btn.classList.remove('error'); btn.disabled=false; textEl.textContent='Confirmar Reserva'; arrowEl.style.display=''; }, 3000);
  }
}

function getValidationError({environment, date, name, email, phone}) {
  if (!environment) return 'Selecione um ambiente para sua reserva.';
  if (!selectedGuests) return 'Selecione a quantidade de pessoas.';
  if (!date) return 'Escolha a data da sua reserva.';
  if (!selectedTime) return 'Selecione um horário para sua reserva.';
  if (!name) return 'Por favor, informe seu nome.';
  if (!email) return 'Por favor, informe seu e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Por favor, informe um e-mail válido.';
  if (!phone) return 'Por favor, informe seu telefone.';
  if (phone.replace(/\D/g,'').length < 11) return 'Informe o telefone completo com DDD.';
  return null;
}

function formatPhoneBR(v) {
  const d = v.replace(/\D/g,'').slice(0,11);
  if (!d.length) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function resetForm() {
  selectedGuests = null; selectedTime = null;
  DOM.environment.selectedIndex = 0;
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
  const v = document.getElementById('res-validation-msg'); if(v) v.style.display='none';
  updateEnvironmentPreview(null);
  updateBookingSummary();
  // Reset custom select
  DOM.rcsValue.textContent = 'Selecione um ambiente';
  DOM.rcsValue.classList.add('is-placeholder');
  DOM.rcsOptions.querySelectorAll('.rcs-option').forEach(o => o.classList.remove('is-selected'));
}

function handleNewReservation() {
  DOM.successPanel.classList.remove('visible'); DOM.successPanel.style.display = 'none';
  DOM.errorPanel.classList.remove('visible'); DOM.errorPanel.style.display = 'none';
  resetForm();
  setTimeout(() => { const t = document.getElementById('step-environment'); if(t) lenis.scrollTo(t,{offset:-120,duration:1.4}); }, 150);
}


/* ── Event Bindings ────────────────────────────────────────────── */

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
    DOM.phoneInput.setSelectionRange(c+d, c+d);
  });
  DOM.submitBtn.addEventListener('click', handleSubmit);
  const nb = document.getElementById('res-new-reservation');
  if (nb) nb.addEventListener('click', handleNewReservation);
}


/* ── Animations ────────────────────────────────────────────────── */

function initAnimations() {
  ScrollTrigger.create({start:'top -80',end:99999,toggleClass:{className:'is-scrolled',targets:'#navbar'}});
  gsap.to('#navbar', {opacity:1,duration:.8,delay:.2});
  document.querySelectorAll('.res-hero-reveal').forEach(el => {
    const d = parseFloat(el.dataset.delay||0);
    gsap.to(el, {opacity:1,y:0,duration:1.2,ease:'power4.out',delay:.4+d});
    el.classList.add('is-visible');
  });
  document.querySelectorAll('.res-reveal').forEach(el => {
    ScrollTrigger.create({trigger:el,start:'top 85%',onEnter:()=>el.classList.add('is-visible')});
  });
  document.querySelectorAll('.ft-reveal').forEach(el => {
    ScrollTrigger.create({trigger:el,start:'top 92%',onEnter:()=>{ gsap.to(el,{opacity:1,y:0,filter:'blur(0px)',duration:.9,ease:'power3.out'}); }});
  });
}


/* ── Init ─────────────────────────────────────────────────────── */

function initPage() {
  loadEnvironments();
  initAnimations();
}

(function runPreloader() {
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random()*15+5;
    if (p >= 100) {
      p = 100; clearInterval(iv);
      DOM.loaderBar.style.width = '100%';
      setTimeout(() => {
        gsap.to(DOM.loader, {yPercent:-100,duration:1,ease:'power4.inOut',onComplete:() => {
          DOM.loader.style.display='none'; document.body.style.opacity='1'; initPage();
        }});
      }, 300);
    }
    DOM.loaderBar.style.width = p+'%';
  }, 80);
})();

bindEvents();
initCustomSelect();
initDatepicker();
