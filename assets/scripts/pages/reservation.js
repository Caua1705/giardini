/* ═══════════════════════════════════════════════════════════════════
   RESERVATION PAGE — JavaScript
   Giardini Café · reservation.js
   ═══════════════════════════════════════════════════════════════════ */

/* ── Configuration ─────────────────────────────────────────────── */

const API_BASE_URL = "http://127.0.0.1:8000";


/* ── GSAP & Lenis Setup ───────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  smooth: true,
  smoothTouch: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);


/* ── DOM References ────────────────────────────────────────────── */

const DOM = {
  // Preloader
  loader:          document.getElementById('loader'),
  loaderBar:       document.getElementById('loader-bar'),

  // Mobile menu
  hamburger:       document.getElementById('hamburger'),
  mobileMenu:      document.getElementById('mobile-menu'),
  mobileClose:     document.getElementById('mobile-close'),

  // Form — Environment
  environment:     document.getElementById('res-environment'),
  environmentMsg:  document.getElementById('res-environment-msg'),

  // Form — Guests
  guestsContainer: document.getElementById('res-guests'),
  guestsSublabel:  document.getElementById('res-guests-sublabel'),

  // Form — Date
  dateInput:       document.getElementById('res-date'),
  dateMsg:         document.getElementById('res-date-msg'),
  dateSublabel:    document.getElementById('res-date-sublabel'),

  // Form — Time slots
  timesEmpty:      document.getElementById('res-times-empty'),
  timesSkeleton:   document.getElementById('res-times-skeleton'),
  timesContainer:  document.getElementById('res-times'),

  // Form — Personal info
  nameInput:       document.getElementById('res-name'),
  emailInput:      document.getElementById('res-email'),
  phoneInput:      document.getElementById('res-phone'),
  notesInput:      document.getElementById('res-notes'),
  infoSublabel:    document.getElementById('res-info-sublabel'),

  // Submit
  submitBtn:       document.getElementById('res-submit'),
  successPanel:    document.getElementById('res-success'),
  errorPanel:      document.getElementById('res-error'),
};


/* ── State ─────────────────────────────────────────────────────── */

let environmentsData = [];   // Cached list from GET /environments
let selectedGuests   = null;
let selectedTime     = null;


/* ── Helpers ───────────────────────────────────────────────────── */

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
function getTodayISO() {
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks if a YYYY-MM-DD date string falls on a Monday.
 */
function isMonday(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay() === 1;
}

/**
 * Resets time slots to their initial empty state and cascades
 * the reset to personal fields.
 */
function resetTimeSlots() {
  DOM.timesEmpty.style.display     = '';
  DOM.timesContainer.style.display = 'none';
  DOM.timesSkeleton.style.display  = 'none';
  DOM.timesContainer.innerHTML     = '';
  selectedTime = null;
  tryEnablePersonalFields();
}

/**
 * Attempts to load availability if all three dependencies
 * (environment, guests, date) are currently selected.
 * Otherwise resets the time slots to their empty state.
 */
function tryLoadAvailability() {
  const hasEnv   = DOM.environment.value !== '';
  const hasGuests = selectedGuests !== null;
  const hasDate  = DOM.dateInput.value !== '';

  if (hasEnv && hasGuests && hasDate) {
    loadAvailability();
  } else {
    resetTimeSlots();
  }
}

/**
 * Enables the date input only when both environment and guests
 * have been selected. Updates the sublabel accordingly.
 */
function tryEnableDateInput() {
  const hasEnvironment = DOM.environment.value !== '';
  const hasGuests      = selectedGuests !== null;

  if (hasEnvironment && hasGuests) {
    DOM.dateInput.disabled = false;
    DOM.dateInput.setAttribute('min', getTodayISO());
    DOM.dateSublabel.textContent = 'Escolha o dia da sua visita.';
  } else {
    DOM.dateInput.disabled = true;
    DOM.dateInput.value    = '';
    DOM.dateSublabel.textContent = 'Selecione primeiro o ambiente e a quantidade de pessoas.';
    DOM.dateMsg.style.display = 'none';
    resetTimeSlots();
  }
}

/**
 * Enables the personal data fields only when environment, guests,
 * date, and time have all been selected. Updates the sublabel.
 */
function tryEnablePersonalFields() {
  const allSelected = DOM.environment.value !== ''
    && selectedGuests !== null
    && DOM.dateInput.value !== ''
    && selectedTime !== null;

  const fields = [DOM.nameInput, DOM.emailInput, DOM.phoneInput, DOM.notesInput];

  if (allSelected) {
    fields.forEach(f => { f.disabled = false; });
    DOM.infoSublabel.textContent = 'Precisamos de algumas informações para confirmar sua reserva.';
  } else {
    fields.forEach(f => { f.disabled = true; });
    DOM.infoSublabel.textContent = 'Preencha seus dados após selecionar o horário da reserva.';
  }
}

/**
 * Validates the selected date before loading time slots.
 * Blocks Mondays (café closed) with user feedback.
 */
function handleDateChange() {
  const value = DOM.dateInput.value;
  DOM.dateMsg.style.display = 'none';

  if (!value) return;

  if (isMonday(value)) {
    // Reject the selection
    DOM.dateInput.value = '';
    DOM.dateMsg.textContent = 'O Giardini não abre às segundas-feiras. Escolha outro dia.';
    DOM.dateMsg.style.display = 'block';

    // Reset time slots to initial state
    resetTimeSlots();

    // Shake the input for feedback
    gsap.to(DOM.dateInput, {
      x: [-6, 6, -4, 4, -2, 2, 0],
      duration: 0.4,
      ease: 'power2.out'
    });
    return;
  }

  // Valid date — proceed
  loadAvailability();
}


/* ── API Functions ─────────────────────────────────────────────── */

/**
 * Fetches active environments from the backend and populates the
 * environment <select>. Handles loading, empty, and error states.
 */
async function loadEnvironments() {
  const select       = DOM.environment;
  const msgContainer = DOM.environmentMsg;

  // Loading state
  select.innerHTML  = '<option value="" disabled selected>Carregando ambientes...</option>';
  select.disabled   = true;
  msgContainer.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE_URL}/environments`);
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();

    // Empty state
    if (!data || data.length === 0) {
      select.innerHTML = '<option value="" disabled selected>Nenhum ambiente disponível</option>';
      msgContainer.textContent = 'Não há ambientes disponíveis para reserva no momento.';
      msgContainer.style.color = 'inherit';
      msgContainer.style.display = 'block';
      return;
    }

    // Store for later use (guest capacity, etc.)
    environmentsData = data;

    // Populate state
    select.innerHTML = '<option value="" disabled selected>Selecione um ambiente</option>';
    data.forEach(env => {
      const option = document.createElement('option');
      option.value       = env.id;
      option.textContent = env.name;
      select.appendChild(option);
    });
    select.disabled = false;

  } catch (error) {
    // Error state
    select.innerHTML = '<option value="" disabled selected>Indisponível</option>';
    msgContainer.textContent = 'Não foi possível carregar os ambientes. Tente novamente ou verifique sua conexão.';
    msgContainer.style.color = '#ef4444';
    msgContainer.style.display = 'block';
    console.error('Falha ao carregar ambientes:', error);
  }
}


/* ── UI State Functions ────────────────────────────────────────── */

/**
 * Finds an environment object by its id from the cached data.
 */
function getEnvironmentById(id) {
  return environmentsData.find(env => env.id === id) || null;
}

/**
 * Renders guest-count pill buttons from 1 to maxCapacity inside
 * the guests container. Resets selectedGuests on every call.
 */
function renderGuestPills(maxCapacity) {
  const container = DOM.guestsContainer;
  container.innerHTML = '';
  selectedGuests = null;

  for (let i = 1; i <= maxCapacity; i++) {
    const pill = document.createElement('button');
    pill.className    = 'res-pill';
    pill.textContent  = i;
    pill.dataset.guests = String(i);

    pill.addEventListener('click', () => {
      container.querySelectorAll('.res-pill').forEach(b => b.classList.remove('active'));
      pill.classList.add('active');
      selectedGuests = pill.dataset.guests;
      tryEnableDateInput();
      tryLoadAvailability();
    });

    container.appendChild(pill);
  }

  // Animate pills in
  if (container.children.length) {
    gsap.fromTo(
      container.children,
      { opacity: 0, y: 6, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out', stagger: 0.03 }
    );
  }
}

/**
 * Called when the environment <select> changes. Updates the guest
 * sublabel text, re-renders guest pills, and resets downstream fields.
 */
function handleEnvironmentChange() {
  const envId = DOM.environment.value;
  const env   = getEnvironmentById(envId);

  if (!env || !env.max_capacity || env.max_capacity < 1) {
    // Graceful fallback
    DOM.guestsSublabel.textContent = 'Selecione um ambiente para ver a capacidade disponível.';
    DOM.guestsContainer.innerHTML = '';
    selectedGuests = null;
    tryEnableDateInput();
    return;
  }

  DOM.guestsSublabel.textContent = `Este ambiente comporta até ${env.max_capacity} pessoas por reserva.`;
  renderGuestPills(env.max_capacity);

  // Reset downstream: date + time (guests just got cleared)
  tryEnableDateInput();
  tryLoadAvailability();
}

/**
 * Creates a time-slot pill button and wires its click handler.
 */
function createTimePill(time) {
  const pill = document.createElement('button');
  pill.className   = 'res-time-pill';
  pill.textContent = time;
  pill.dataset.time = time;

  pill.addEventListener('click', () => {
    document.querySelectorAll('.res-time-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedTime = time;
    tryEnablePersonalFields();
  });

  return pill;
}

/**
 * Fetches available time slots from the backend for the currently
 * selected environment, party size, and date. Handles loading,
 * empty, and error states.
 */
async function loadAvailability() {
  const environmentId   = DOM.environment.value;
  const reservationDate = DOM.dateInput.value;
  const partySize       = selectedGuests;

  // Guard: all three must be set
  if (!environmentId || !reservationDate || !partySize) return;

  // Show skeleton loader
  DOM.timesEmpty.style.display     = 'none';
  DOM.timesContainer.style.display = 'none';
  DOM.timesSkeleton.style.display  = 'flex';
  selectedTime = null;
  tryEnablePersonalFields();

  try {
    const params = new URLSearchParams({
      environment_id:   environmentId,
      reservation_date: reservationDate,
      party_size:       partySize,
    });

    const response = await fetch(`${API_BASE_URL}/availability?${params}`);
    if (!response.ok) throw new Error('Network response was not ok');

    const slots = await response.json();

    DOM.timesSkeleton.style.display = 'none';

    // Normalize: support both string[] and {time: string}[]
    const times = slots.map(s => typeof s === 'string' ? s : s.time);

    // Empty state
    if (!times || times.length === 0) {
      DOM.timesEmpty.textContent = 'Nenhum horário disponível para esta data. Tente outro dia.';
      DOM.timesEmpty.style.display = '';
      return;
    }

    // Group into morning / afternoon
    const morning   = times.filter(t => t < '12:00');
    const afternoon = times.filter(t => t >= '12:00');

    DOM.timesContainer.innerHTML = '';

    if (morning.length > 0) {
      DOM.timesContainer.appendChild(createPeriodGroup('Manhã', morning));
    }
    if (afternoon.length > 0) {
      DOM.timesContainer.appendChild(createPeriodGroup('Tarde', afternoon));
    }

    // Animate in
    DOM.timesContainer.style.display = 'flex';
    const allPills = DOM.timesContainer.querySelectorAll('.res-time-pill');
    if (allPills.length) {
      gsap.fromTo(
        allPills,
        { opacity: 0, y: 8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out', stagger: 0.035 }
      );
    }

  } catch (error) {
    DOM.timesSkeleton.style.display = 'none';
    DOM.timesEmpty.textContent = 'Não foi possível carregar os horários. Tente novamente.';
    DOM.timesEmpty.style.display = '';
    console.error('Falha ao carregar disponibilidade:', error);
  }
}

/**
 * Creates a labeled period group (e.g. "Manhã") containing its time pills.
 */
function createPeriodGroup(label, times) {
  const group = document.createElement('div');
  group.className = 'res-time-group';

  const heading = document.createElement('span');
  heading.className = 'res-time-group-label';
  heading.textContent = label;
  group.appendChild(heading);

  const pillsWrap = document.createElement('div');
  pillsWrap.className = 'res-time-group-pills';

  times.forEach(time => {
    pillsWrap.appendChild(createTimePill(time));
  });

  group.appendChild(pillsWrap);
  return group;
}

/**
 * Handles main form submission with validation, loading state,
 * and success/error feedback.
 */
function handleSubmit() {
  const btn      = DOM.submitBtn;
  const textEl   = btn.querySelector('.res-submit-text');
  const arrowEl  = btn.querySelector('.res-submit-arrow');

  // Gather values
  const environment = DOM.environment.value;
  const date        = DOM.dateInput.value;
  const name        = DOM.nameInput.value.trim();
  const email       = DOM.emailInput.value.trim();
  const phone       = DOM.phoneInput.value.trim();

  // Simple validation
  if (!environment || !selectedGuests || !date || !selectedTime || !name || !email || !phone) {
    gsap.to(btn, {
      x: [-8, 8, -6, 6, -3, 3, 0],
      duration: 0.5,
      ease: 'power2.out'
    });
    return;
  }

  // Start loading state
  btn.classList.add('loading');
  textEl.textContent = 'Processando...';
  arrowEl.style.display = 'none';

  // Hide previous feedback
  DOM.successPanel.classList.remove('visible');
  DOM.errorPanel.classList.remove('visible');

  // TODO: API integration — POST reservation data
  // Simulate API call
  setTimeout(() => {
    btn.classList.remove('loading');

    // Simulate success (random 85% success for demo)
    const isSuccess = Math.random() > 0.15;

    if (isSuccess) {
      btn.classList.add('success');
      textEl.textContent = 'Reserva Confirmada ✓';
      DOM.successPanel.style.display = 'block';
      requestAnimationFrame(() => DOM.successPanel.classList.add('visible'));

      // Scroll to success message
      setTimeout(() => {
        lenis.scrollTo(DOM.successPanel, { offset: -100, duration: 1.2 });
      }, 300);
    } else {
      btn.classList.add('error');
      textEl.textContent = 'Erro — Tente novamente';
      DOM.errorPanel.style.display = 'block';
      requestAnimationFrame(() => DOM.errorPanel.classList.add('visible'));

      // Reset button after 3s on error so user can retry
      setTimeout(() => {
        btn.classList.remove('error');
        textEl.textContent = 'Confirmar Reserva';
        arrowEl.style.display = '';
      }, 3000);
    }
  }, 2000);
}


/* ── Event Bindings ────────────────────────────────────────────── */

function bindEvents() {
  // Mobile menu
  if (DOM.hamburger && DOM.mobileMenu) {
    DOM.hamburger.addEventListener('click', () => DOM.mobileMenu.classList.add('open'));
    DOM.mobileClose.addEventListener('click', () => DOM.mobileMenu.classList.remove('open'));
    DOM.mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => DOM.mobileMenu.classList.remove('open'));
    });
  }

  // Environment change → update guest pills
  DOM.environment.addEventListener('change', handleEnvironmentChange);

  // Date change → validate & load time slots
  DOM.dateInput.addEventListener('change', handleDateChange);

  // Submit button
  DOM.submitBtn.addEventListener('click', handleSubmit);
}


/* ── Animation & Scroll Reveals ────────────────────────────────── */

function initAnimations() {
  /* Navbar scroll state */
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    toggleClass: { className: 'is-scrolled', targets: '#navbar' }
  });

  /* Navbar opacity reveal */
  gsap.to('#navbar', { opacity: 1, duration: 0.8, delay: 0.2 });

  /* Hero content reveal */
  document.querySelectorAll('.res-hero-reveal').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0);
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power4.out',
      delay: 0.4 + delay
    });
    el.classList.add('is-visible');
  });

  /* Scroll reveal for reservation steps */
  document.querySelectorAll('.res-reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('is-visible')
    });
  });

  /* Footer reveals */
  document.querySelectorAll('.ft-reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out'
        });
      }
    });
  });
}


/* ── Page Initialization ───────────────────────────────────────── */

function initPage() {
  loadEnvironments();
  initAnimations();
}


/* ── Preloader ─────────────────────────────────────────────────── */

(function runPreloader() {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      DOM.loaderBar.style.width = '100%';
      setTimeout(() => {
        gsap.to(DOM.loader, {
          yPercent: -100,
          duration: 1,
          ease: 'power4.inOut',
          onComplete: () => {
            DOM.loader.style.display = 'none';
            document.body.style.opacity = '1';
            initPage();
          }
        });
      }, 300);
    }
    DOM.loaderBar.style.width = progress + '%';
  }, 80);
})();


/* ── Bootstrap ───────────────────────────────────────────────────── */

// Wire up all event listeners
bindEvents();
