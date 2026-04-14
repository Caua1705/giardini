/* ═══════════════════════════════════════════════════════════════════
   RESERVATION PAGE — JavaScript
   Giardini Café · reservation.js
   ═══════════════════════════════════════════════════════════════════ */

/* ── Config ────────────────────────────────────────────────────── */
const API_BASE_URL = 'http://127.0.0.1:8000';

const ENVIRONMENT_IMAGES_BY_NAME = {
  'Jardim Externo':         'assets/images/jardim-externo.webp',
  'Salão Principal':        'assets/images/salao-principal.webp',
  'Lounge Reservado':       'assets/images/lounge-reservado.webp',
  'Sala Privativa Pequena': 'assets/images/sala-privativa-pequena.webp',
  'Sala Privativa Média':   'assets/images/sala-privativa-media.webp',
  'Sala Privativa Grande':  'assets/images/sala-privativa-grande.webp',
};

const ENVIRONMENT_CAPACITY_HINTS = {
  'Jardim Externo':         'Ao ar livre',
  'Salão Principal':        'Ambiente amplo',
  'Lounge Reservado':       'Ambiente intimista',
  'Sala Privativa Pequena': 'Até 6 pessoas',
  'Sala Privativa Média':   'Até 10 pessoas',
  'Sala Privativa Grande':  'Até 20 pessoas',
};

let ENVIRONMENT_IMAGES = {};
const DEFAULT_PREVIEW_IMAGE = 'assets/images/jardim-externo.webp';

const MONTHS_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];


/* ── GSAP + Lenis ──────────────────────────────────────────────── */
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
    const imgSrc = ENVIRONMENT_IMAGES[env.id] || ENVIRONMENT_IMAGES_BY_NAME[env.name] || DEFAULT_PREVIEW_IMAGE;
    const hint   = ENVIRONMENT_CAPACITY_HINTS[env.name] || (env.max_capacity ? `Até ${env.max_capacity} pessoas` : '');

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

    c.appendChild(card);

    gsap.fromTo(card,
      { opacity: 0, y: 18, scale: .97 },
      { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'power3.out', delay: idx * 0.07 }
    );
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
}

function resetEnvCardSelection() {
  DOM.envCards.querySelectorAll('.res-env-card').forEach(c => c.classList.remove('is-selected'));
  hideFormSummary();
  DOM.envSelectedBar.classList.remove('is-visible');
  lenis.scrollTo('#reservation-flow', { offset: -60, duration: 1.2 });
}


/* ── Inline form summary (compact, no big duplicate image) ───────── */

function showFormSummary(env, imgSrc) {
  if (!DOM.formEnvSummary) return;
  DOM.formEnvThumb.src = imgSrc;
  DOM.formEnvThumb.alt = env.name;
  DOM.formEnvName.textContent = env.name;
  DOM.formEnvSummary.classList.add('is-visible');
  gsap.fromTo(DOM.formEnvSummary, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' });
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
  DOM.timesEmpty.style.display = '';
  DOM.timesContainer.style.display = 'none';
  DOM.timesSkeleton.style.display = 'none';
  DOM.timesContainer.innerHTML = '';
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
    const r = await fetch(`${API_BASE_URL}/environments`);
    if (!r.ok) throw new Error('api fail');
    const data = await r.json();

    if (!data || data.length === 0) {
      DOM.environment.innerHTML = '<option value="" disabled selected>Nenhum ambiente</option>';
      DOM.environmentMsg.textContent = 'Não há ambientes disponíveis.';
      DOM.environmentMsg.style.display = 'block';
      renderEnvCards([]);
      return;
    }

    environmentsData = data;
    ENVIRONMENT_IMAGES = {};
    data.forEach(env => { ENVIRONMENT_IMAGES[env.id] = ENVIRONMENT_IMAGES_BY_NAME[env.name] || DEFAULT_PREVIEW_IMAGE; });

    DOM.environment.innerHTML = '<option value="" disabled selected>Selecione</option>';
    data.forEach(env => {
      const o = document.createElement('option'); o.value = env.id; o.textContent = env.name;
      DOM.environment.appendChild(o);
    });
    DOM.environment.disabled = false;
    renderEnvCards(data);

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

  // Show inline form summary (compact, no duplicate large image)
  const imgSrc = ENVIRONMENT_IMAGES[env.id] || ENVIRONMENT_IMAGES_BY_NAME[env.name] || DEFAULT_PREVIEW_IMAGE;
  showFormSummary(env, imgSrc);

  DOM.guestsSublabel.textContent = `Este ambiente comporta até ${env.max_capacity} pessoas por reserva.`;
  renderGuestPills(env.max_capacity);
  tryEnableDateInput();
  tryLoadAvailability();

  // Scroll to booking section smoothly
  setTimeout(() => {
    lenis.scrollTo('#res-booking-section', { offset: -80, duration: 1.4 });
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
  tryEnablePersonalFields(); updateSummaryPills();

  try {
    const r = await fetch(`${API_BASE_URL}/availability?${new URLSearchParams({environment_id:envId,reservation_date:date,party_size:size})}`);
    if (!r.ok) throw new Error('fail');
    const slots = await r.json();
    DOM.timesSkeleton.style.display = 'none';
    const times = slots.map(s => typeof s === 'string' ? s : s.time);

    if (!times || times.length === 0) {
      DOM.timesEmpty.textContent = 'Nenhum horário disponível para esta data. Tente outro dia.';
      DOM.timesEmpty.style.display = '';
      return;
    }

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
  } catch (e) {
    DOM.timesSkeleton.style.display = 'none';
    DOM.timesEmpty.textContent = 'Não foi possível carregar os horários.';
    DOM.timesEmpty.style.display = '';
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
    gsap.to(btn, { x: [-8,8,-6,6,-3,3,0], duration: .5, ease: 'power2.out' });
    return;
  }

  btn.classList.add('loading'); btn.disabled = true;
  textEl.textContent = 'Confirmando...'; arrowEl.style.display = 'none';

  try {
    const r = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name, email, phone,
        environment_id: environment,
        reservation_date: date,
        reservation_time: selectedTime,
        party_size: Number(selectedGuests),
        notes: notes || null,
      }),
    });

    btn.classList.remove('loading');
    if (r.ok) {
      btn.classList.add('success'); textEl.textContent = 'Reserva Confirmada ✓';
      DOM.successPanel.style.display = 'block';
      requestAnimationFrame(() => DOM.successPanel.classList.add('visible'));
      setTimeout(() => lenis.scrollTo(DOM.successPanel, {offset:-100,duration:1.2}), 300);
    } else {
      let msg = 'Não foi possível processar sua reserva.';
      try {
        const b = await r.json();
        if (b.detail) msg = typeof b.detail === 'string' ? b.detail : b.detail.map(e => e.msg).join('. ');
      } catch(_) {}
      btn.classList.add('error'); textEl.textContent = 'Erro — Tente novamente';
      DOM.errorPanel.style.display = 'block';
      requestAnimationFrame(() => DOM.errorPanel.classList.add('visible'));
      valMsg.textContent = msg; valMsg.style.display = 'block';
      setTimeout(() => { btn.classList.remove('error'); btn.disabled = false; textEl.textContent = 'Confirmar Reserva'; arrowEl.style.display = ''; }, 3000);
    }
  } catch (e) {
    btn.classList.remove('loading'); btn.classList.add('error');
    textEl.textContent = 'Erro — Tente novamente';
    DOM.errorPanel.style.display = 'block';
    requestAnimationFrame(() => DOM.errorPanel.classList.add('visible'));
    const valMsg2 = document.getElementById('res-validation-msg');
    valMsg2.textContent = 'Falha na conexão.'; valMsg2.style.display = 'block';
    console.error(e);
    setTimeout(() => { btn.classList.remove('error'); btn.disabled = false; textEl.textContent = 'Confirmar Reserva'; arrowEl.style.display = ''; }, 3000);
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
  setTimeout(() => { lenis.scrollTo('#reservation-flow', {offset:-60,duration:1.4}); }, 150);
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
}


/* ── Animations ────────────────────────────────────────────────── */

function initAnimations() {
  ScrollTrigger.create({start:'top -80',end:99999,toggleClass:{className:'is-scrolled',targets:'#navbar'}});
  gsap.to('#navbar',{opacity:1,duration:.8,delay:.2});

  // Hero reveals — staggered with blur
  document.querySelectorAll('.res-hero-reveal').forEach(el => {
    const d = parseFloat(el.dataset.delay || 0);
    gsap.fromTo(el,
      {opacity:0, y:32, filter:'blur(6px)'},
      {opacity:1, y:0, filter:'blur(0px)', duration:1.4, ease:'power4.out', delay:.5+d,
        onStart:()=>el.classList.add('is-visible')}
    );
  });

  // Section reveals — with subtle scale and rotation
  document.querySelectorAll('.res-reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 87%',
      onEnter: () => {
        el.classList.add('is-visible');
        if (el.classList.contains('res-step')) {
          gsap.fromTo(el, {scale:.985, rotateX:1},{scale:1, rotateX:0, duration:1, ease:'power3.out'});
        }
      }
    });
  });

  // Footer reveals
  document.querySelectorAll('.ft-reveal').forEach(el => {
    ScrollTrigger.create({trigger:el,start:'top 92%',onEnter:()=>{
      gsap.to(el,{opacity:1,y:0,filter:'blur(0px)',duration:.9,ease:'power3.out'});
    }});
  });

  // Parallax
  initHeroParallax();
  initHeroParticles();
  initGoldenDust();
  initEnvSectionParallax();
  initSectionDividerReveal();

  // Hero CTA
  const heroCta = document.getElementById('res-hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', e => {
      e.preventDefault();
      lenis.scrollTo('#reservation-flow', {offset:-60,duration:1.8});
    });
  }
}

function initHeroParallax() {
  const heroBg      = document.querySelector('.res-hero-bg video');
  const heroContent = document.querySelector('.res-hero-content');
  if (!heroBg || !heroContent) return;
  ScrollTrigger.create({
    trigger: '.res-hero', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(heroBg,      { y: p * 90 });
      gsap.set(heroContent, { y: p * -28, opacity: 1 - p * 0.7 });
    }
  });
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

/* ── Environment section parallax — subtle depth on bg elements ── */
function initEnvSectionParallax() {
  const envBg = document.querySelector('.res-env-section-bg');
  const envWatermark = document.querySelector('.res-env-watermark');
  if (!envBg) return;
  ScrollTrigger.create({
    trigger: '.res-env-section', start: 'top bottom', end: 'bottom top', scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(envBg, { y: p * 40 - 20 });
      if (envWatermark) gsap.set(envWatermark, { y: p * -30 });
    }
  });
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

function initPage() {
  loadEnvironments();
  initAnimations();
}

(function runPreloader() {
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 15 + 5;
    if (p >= 100) {
      p = 100; clearInterval(iv);
      DOM.loaderBar.style.width = '100%';
      setTimeout(() => {
        gsap.to(DOM.loader, {yPercent:-100, duration:1, ease:'power4.inOut', onComplete:() => {
          DOM.loader.style.display = 'none';
          document.body.style.opacity = '1';
          initPage();
        }});
      }, 300);
    }
    DOM.loaderBar.style.width = p + '%';
  }, 80);
})();

bindEvents();
initDatepicker();

