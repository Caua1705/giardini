
    (function() {
      // Browser restores scroll BEFORE DOMContentLoaded.
      // If we are already scrolled, reveal body immediately.
      if ((window.scrollY || window.pageYOffset) > 10) {
        document.documentElement.style.cssText += ';opacity:1!important';
        // Will be applied to body once it exists (next paint)
        requestAnimationFrame(function() {
          if (document.body) document.body.style.opacity = '1';
        });
      }
    }());
  


    (function () {
      var s5 = document.getElementById('experience-video');
      var triggered = false;

      var io5 = new IntersectionObserver(function (entries) {
        if (triggered) return;
        if (!entries[0].isIntersecting) return;
        triggered = true;
        io5.disconnect();

        /* Reveal content items */
        var items = s5.querySelectorAll('[class*="s5-reveal-"]');
        items.forEach(function (el, i) {
          setTimeout(function () { el.classList.add('s5-visible'); }, 300 + i * 180);
        });

        /* Animated separator */
        setTimeout(function () {
          var sep = document.getElementById('s5-separator');
          if (sep) sep.classList.add('s5-sep-visible');
        }, 900);

        /* Top line grow */
        var tl = document.getElementById('s5-top-line');
        if (tl) { tl.style.width = '100%'; tl.style.opacity = '1'; }

        /* Watermark fade in */
        var wm = document.getElementById('s5-wm');
        if (wm) wm.style.opacity = '1';

        /* Corner frames */
        s5.querySelectorAll('.s5-corner').forEach(function (c) { c.classList.add('s5-visible'); });

      }, { threshold: 0.18 });

      io5.observe(s5);

      /* Spotlight removed — intentional */
    })();
    


  /* ── CLUBE DO LIVRO: rich scroll reveals ─────────────────────────────── */
  (function () {
    var ease = '1.15s cubic-bezier(0.16,1,0.3,1)';
    /* show watermark when section is visible */
    var wm = document.getElementById('clube-wm');
    function countUp(el) {
      var target = parseInt(el.dataset.target || '0', 10);
      var current = 0;
      var step = Math.max(1, Math.ceil(target / 55));
      var timer = setInterval(function () {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 22);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var type = el.dataset.clubeReveal;
        /* Reveal watermark on first trigger */
        if (wm) wm.style.opacity = '1';
        el.style.transition = 'opacity ' + ease + ', transform ' + ease + ', filter ' + ease;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) translateX(0)';
        el.style.filter = 'blur(0)';
        if (type === 'title') {
          setTimeout(function () {
            el.querySelectorAll('.clube-line span').forEach(function (s) {
              s.style.transform = 'translateY(0)';
            });
          }, 120);
        }
        if (type === 'left' || type === 'right') {
          setTimeout(function () {
            el.querySelectorAll('.clube-count').forEach(function (c) { countUp(c); });
          }, 500);
        }
        io.unobserve(el);
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-clube-reveal]').forEach(function (el) {
      io.observe(el);
    });
    /* Tag all targets */
    var tags = {
      '.clube-reveal__header': 'header',
      '.clube-reveal__title': 'title',
      '.clube-reveal__left': 'left',
      '.clube-reveal__center': 'center',
      '.clube-reveal__right': 'right'
    };
    Object.keys(tags).forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) { el.dataset.clubeReveal = tags[sel]; io.observe(el); }
    });
    /* Image hover effects */
    document.querySelectorAll('.clube-img-main, .clube-img-accent').forEach(function (wrap) {
      var caption = wrap.querySelector('.clube-img-caption');
      var img = wrap.querySelector('img');
      var shimmer = wrap.querySelector('.clube-img-shimmer');
      wrap.addEventListener('mouseenter', function () {
        if (caption) { caption.style.opacity = '1'; caption.style.transform = 'translateY(0)'; }
        if (img) img.style.transform = 'scale(1.09)';
        if (shimmer) shimmer.style.opacity = '1';
        wrap.style.boxShadow = '0 36px 80px rgba(0,0,0,0.15),0 10px 28px rgba(0,0,0,0.08)';
      });
      wrap.addEventListener('mouseleave', function () {
        if (caption) { caption.style.opacity = '0'; caption.style.transform = 'translateY(6px)'; }
        if (img) img.style.transform = img.dataset.initScale || 'scale(1.05)';
        if (shimmer) shimmer.style.opacity = '0';
        wrap.style.boxShadow = '';
      });
    });
    /* Stat cards shimmer on hover */
    document.querySelectorAll('.clube-stat-card').forEach(function (card) {
      var s = card.querySelector('.clube-stat-shimmer');
      card.addEventListener('mouseenter', function(){
        card.style.transform = 'translateY(-3px)';
        card.style.boxShadow = '0 16px 48px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.9)';
        if(s) s.style.left = '140%';
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = '';
        card.style.boxShadow = '';
        if(s) { s.style.transition='none'; s.style.left='-100%'; setTimeout(function(){s.style.transition='';},50); }
      });
    });
    /* CTA button hover */
    var cta = document.querySelector('.clube-cta-btn');
    if (cta) {
      var shimEl = cta.querySelector('.clube-shimmer');
      cta.addEventListener('mouseenter', function () {
        cta.style.background = 'var(--c-primary)';
        cta.style.color = '#fdfbf7';
        cta.style.borderColor = 'var(--c-primary)';
        cta.style.transform = 'translateY(-2px)';
        cta.style.boxShadow = '0 12px 32px rgba(43,74,59,0.35)';
        if (shimEl) { shimEl.style.transition='left 0.6s ease'; shimEl.style.left='140%'; }
      });
      cta.addEventListener('mouseleave', function () {
        cta.style.background = '';
        cta.style.color = '';
        cta.style.borderColor = '';
        cta.style.transform = '';
        cta.style.boxShadow = '';
        if (shimEl) { shimEl.style.transition='none'; shimEl.style.left='-100%'; setTimeout(function(){shimEl.style.transition='';},50); }
      });
    }
  })();
  


    (function(){
      var loc = document.getElementById('location');
      if (!loc) return;
      var done = false;
      var io = new IntersectionObserver(function(entries){
        if (done || !entries[0].isIntersecting) return;
        done = true; loc.classList.add('loc-active'); io.disconnect();
      }, { threshold: 0.10 });
      io.observe(loc);
    })();
    


  (function(){
    var ft = document.getElementById('site-footer');
    if (!ft) return;
    var obs = new IntersectionObserver(function(entries){
      if (!entries[0].isIntersecting) return;
      ft.classList.add('ft-in-view');
      obs.disconnect();
    }, { threshold: 0.08 });
    obs.observe(ft);
  })();
  


  (function(){
    var loc = document.getElementById('location');
    if (!loc) return;
    var io = new IntersectionObserver(function(entries){
      if (!entries[0].isIntersecting) return;
      loc.classList.add('loc-in-view');
      // Reveal watermark
      var wm = document.getElementById('loc-wm-text');
      if (wm) { setTimeout(function(){ wm.style.opacity = '1'; }, 600); }
      io.disconnect();
    }, { threshold: 0.12 });
    io.observe(loc);
  })();
  


    (function () {
      'use strict';
      /* ── PRELOAD HIDING ─────────────────────────────────────────── */
      gsap.set(['#el-kicker', '#el-body', '#el-cta', '#el-meta', '#hero-explore-scroll', '#el-badge'], { opacity: 0, y: 15, filter: 'blur(8px)' });
      gsap.set(['#el-h1a', '#el-h1b'], { y: '108%', filter: 'blur(10px)' });
      gsap.set('#video-frame', { opacity: 0, scale: 0.94 });
      gsap.set('#navbar', { opacity: 0 });
      /* ══════════════════════════════════════════════════════════════
         CONFIG
         ══════════════════════════════════════════════════════════════
         TOTAL_FRAMES → deve ser igual ao número de arquivos gerados
                        pelo extract_frames.py (padrão: 150)
         FRAMES_DIR   → caminho RELATIVO a este HTML até a pasta frames
         scrollVH     → distância de scroll virtual em % do viewport
                        (maior = transformação mais lenta)
         scrub        → suavidade do ScrollTrigger (true = 1:1, número = lag)
      ══════════════════════════════════════════════════════════════ */
      const CONFIG = {
        TOTAL_FRAMES: 150,
        FRAMES_DIR: 'references/image-frames/home',   // frame sequence for home hero
        scrollVH: 380,        // % do viewport — aumentado para o vídeo fluir até o fim do scroll
        scrub: 1.0,        // 1.0 = seguindo o scroll com pequeno amortecimento suave
      };
      /* ══ GSAP ══════════════════════════════════════════════════════ */
      gsap.registerPlugin(ScrollTrigger);
      /* ══ UTILIDADES ════════════════════════════════════════════════ */
      window.updateMouse = function (element, e) {
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        element.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      };
      /* ══ LENIS (smooth scroll, corretamente sincronizado) ══════════ */
      const lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);

      // ── SMOOTH SCROLL FOR MENU LINKS (Optimized) ──────────────────
      document.querySelectorAll('.nav-link, .ft-nav-link, .nav-logo').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          const href = this.getAttribute('href');
          if (!href || (!href.startsWith('#') && href !== '#')) return;
          
          e.preventDefault();
          // Fix: if href is just #, target is top of page
          const target = (href === '#') ? 0 : document.querySelector(href);
          
          if (target !== null) {
            lenis.scrollTo(target, {
              offset: 0,
              duration: 1.2,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
          }
        });
      });
      /* ══ CANVAS + CONTEXT ══════════════════════════════════════════ */
      const canvas = document.getElementById('seq-canvas');
      const ctx = canvas.getContext('2d');
      let frames = [];      // array de Image objects pré-carregados
      let currentFrameIndex = -1; // evita repintar o mesmo frame
      /* Redimensiona o canvas para o tamanho do #video-frame */
      function resizeCanvas() {
        const frame = document.getElementById('video-frame');
        const w = frame.offsetWidth;
        const h = frame.offsetHeight;
        // Usa devicePixelRatio para nitidez em telas retina/mobile
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Repinta frame atual após resize
        if (frames.length > 0 && currentFrameIndex >= 0) {
          const savedIdx = currentFrameIndex;
          currentFrameIndex = -1; // força repaint
          drawFrame(savedIdx);
        }
      }
      /* Sincroniza canvas com o tamanho atual do #video-frame durante scroll */
      function syncCanvasSize() {
        const frame = document.getElementById('video-frame');
        const w = frame.offsetWidth;
        const h = frame.offsetHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        // Math.ceil + 1px reserva garante que o canvas mate qualquer frestinha na lateral direita
        const targetW = Math.ceil(w * dpr) + 1; 
        const targetH = Math.ceil(h * dpr);
        
        // Threshold reduzido para 0.1 para precisão absoluta durante a expansão (mata tremedeira)
        if (Math.abs(canvas.width - targetW) > 0.1 || Math.abs(canvas.height - targetH) > 0.1) {
          canvas.width = targetW;
          canvas.height = targetH;
          canvas.style.width = (w + 1) + 'px'; // Estica 1px a mais pra garantir cobertura total
          canvas.style.height = h + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          return true; // canvas foi redimensionado
        }
        return false;
      }
      /* Desenha um frame no canvas preservando aspect ratio (object-fit: cover) */
      function drawFrame(index) {
        // Sincroniza canvas com tamanho atual do frame (crucial durante expansão via scroll)
        const resized = syncCanvasSize();
        if (index === currentFrameIndex && !resized) return; // sem redraw desnecessário
        const img = frames[index];
        if (!img || !img.complete || img.naturalWidth === 0) return;
        currentFrameIndex = index;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = canvas.width / dpr;
        const ch = canvas.height / dpr;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        // Cover: escala para preencher mantendo proporção, centraliza
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      /* ══ PRELOAD DE FRAMES ═════════════════════════════════════════
         Carrega todos os frames em paralelo (Image objects) antes de
         iniciar a hero. Mostra barra de progresso no preloader.
      ══════════════════════════════════════════════════════════════ */
      const preloaderBar = document.getElementById('preloader-bar');
      const preloaderLabel = document.getElementById('preloader-label');
      const preloaderEl = document.getElementById('preloader');
      function preloadFrames() {
        return new Promise((resolve) => {
          let loaded = 0;
          const total = CONFIG.TOTAL_FRAMES;
          frames = new Array(total);
          for (let i = 0; i < total; i++) {
            const img = new Image();
            // Nomes: frame_0000.webp, frame_0001.webp, ...
            img.src = `${CONFIG.FRAMES_DIR}/frame_${String(i).padStart(4, '0')}.webp`;
            frames[i] = img;
            img.onload = img.onerror = () => {
              loaded++;
              const pct = Math.round((loaded / total) * 100);
              preloaderBar.style.width = `${pct}%`;
              preloaderLabel.textContent = `${pct}%`;
              if (loaded === total) resolve();
            };
          }
        });
      }
      /* ══ LAYOUT: calcula o rect inicial do video-frame ════════════ */
      function getInitialFrameRect() {
        const right = document.getElementById('hero-right');
        const vp = document.getElementById('hero-viewport');
        const rRect = right.getBoundingClientRect();
        const vpRect = vp.getBoundingClientRect();
        const cs = getComputedStyle(right);
        const pt = parseFloat(cs.paddingTop);
        const pr = parseFloat(cs.paddingRight);
        const pb = parseFloat(cs.paddingBottom);
        const pl = parseFloat(cs.paddingLeft);
        return {
          left: (rRect.left - vpRect.left) + pl,
          top: (rRect.top - vpRect.top) + pt,
          width: rRect.width - pl - pr,
          height: rRect.height - pt - pb,
        };
      }
      /* ══ INIT (chamado após preload concluído) ═════════════════════ */
      function init() {
        const frame = document.getElementById('video-frame');
        const viewport = document.getElementById('hero-viewport');
        const wrapper = document.getElementById('hero-pin-wrapper');
        /* Altura virtual do scroll */
        const scrollPx = window.innerHeight * (CONFIG.scrollVH / 100);
        wrapper.style.height = `${window.innerHeight + scrollPx}px`;
        /* Registra matchMedia para layouts responsivos */
        let mm = gsap.matchMedia();

        const wideTabletMQ = "(max-width: 1024px) and (min-width: 850px) and (max-height: 800px)";
        
        mm.add({
          isDesktop: `(min-width: 1025px), ${wideTabletMQ}`,
          isMobile: "(max-width: 1024px)"
        }, (context) => {
          let { isDesktop, isMobile } = context.conditions;

          // Override local para forçar que o 900x700 aja exatamente como o Desktop (1280x800 style)
          if (isDesktop && window.innerWidth <= 1024) {
            isMobile = false;
          }

          const initRect = getInitialFrameRect();

          if (isMobile) {
            // ──────────────────────────────────────────────────────────
            // FIX: Use CSS-declared values (82%, max-width 340px) directly
            // instead of reading initRect.width from the DOM.
            //
            // Why: On mobile reload, #hero-right is a placeholder with
            // opacity:0 and aspect-ratio:16/10. The flexbox column layout
            // hasn't finished computing its width before this code runs,
            // so initRect.width returns a compressed (incorrect) value.
            // GSAP then locks that compressed width as an inline style,
            // which only corrects itself when the scroll expansion begins.
            //
            // By using percentage-based width matching the CSS, the frame
            // is always correctly sized on load — no compressed state.
            // ──────────────────────────────────────────────────────────
            const cta = document.getElementById('el-cta');
            const vpRect = document.getElementById('hero-viewport').getBoundingClientRect();
            const ctaBottom = cta ? (cta.getBoundingClientRect().bottom - vpRect.top) : 280;

            const isTallMobile = window.innerWidth <= 395 && window.innerHeight >= 840;
            const isProMaxMobile = window.innerWidth >= 428 && window.innerWidth <= 430 && window.innerHeight >= 900;
            
            // Stable top: position below CTA with a comfortable gap
            const stableTop = ctaBottom + (isProMaxMobile ? 36 : (isTallMobile ? 48 : 32));

            gsap.set(frame, {
              position: 'absolute',
              left: "50%",
              xPercent: -50,
              top: stableTop,
              yPercent: 0,
              // No Pro Max diminui a largura (76% em vez de 82%) a pedido
              width: isProMaxMobile ? '76%' : '82%',
              maxWidth: 360,
              height: 'auto',
              // Aumenta a altura ainda mais (1/1, quadrado) no breakpoint 430x932
              aspectRatio: isProMaxMobile ? '1 / 1' : (isTallMobile ? '5 / 4' : '16 / 10'),
              borderRadius: 16,
              zIndex: 15,
              transformOrigin: 'top center',
            });
          } else {
            gsap.set(frame, {
              position: 'absolute',
              left: initRect.left,
              top: initRect.top + 14,
              width: initRect.width,
              height: initRect.height,
              borderRadius: 20,
              zIndex: 15,
            });
          }
        });
        /* Dimensiona canvas para o frame */
        resizeCanvas();
        /* Desenha o frame 0 */
        if (frames[0]?.complete) drawFrame(0);
        canvas.classList.add('ready');
        /* ── NAVBAR ─────────────────────────────────────────────── */
        ScrollTrigger.create({
          start: 'top -80px', end: 99999,
          onEnter: () => document.getElementById('navbar').classList.add('is-scrolled'),
          onLeaveBack: () => document.getElementById('navbar').classList.remove('is-scrolled'),
        });
        /* ── HERO ENTRANCE: cinematic per-element blur+fade+parallax ── */
        // Detect if page was reloaded while already scrolled down.
        // If so, skip entrance animation and set all hero elements to final
        // visible state to avoid the scroll-out fromTo conflicting with
        // a never-played entrance (which causes elements to vanish on scroll-back).
        const isAlreadyScrolled = (window.scrollY || window.pageYOffset) > 10;
        if (isAlreadyScrolled) {
          // Page loaded mid-scroll: commit all hero elements to their
          // fully-visible final state immediately, then let scroll-out handle it.
          document.body.style.opacity = '1';
          document.getElementById('hero-left').style.pointerEvents = 'auto';
          gsap.set('#navbar', { opacity: 1 });
          gsap.set('#el-kicker', { opacity: 1, y: 0, filter: 'blur(0px)' });
          gsap.set('#el-h1a', { opacity: 1, y: 0, filter: 'blur(0px)' });
          gsap.set('#el-h1b', { opacity: 1, y: 0, filter: 'blur(0px)' });
          gsap.set('#el-body', { opacity: 1, y: 0, filter: 'blur(0px)' });
          gsap.set('#el-cta', { opacity: 1, y: 0, filter: 'blur(0px)' });
          gsap.set('#el-meta', { opacity: 1, y: 0, filter: 'blur(0px)' });
          gsap.set('#el-badge', { opacity: 1, y: 0 });
          gsap.set('#hero-explore-scroll', { opacity: 1, y: 0, filter: 'blur(0px)' });
          gsap.set('#hero-sep', { opacity: 1, scaleX: 1, transformOrigin: 'left center' });
          gsap.set('#hero-wm', { opacity: 1 });
          // frame: set opacity 1 — never leave the frame in opacity:0 state
          gsap.set(frame, { opacity: 1, scale: 1 });
          // Activate bg columns immediately (skip stagger entrance)
          document.querySelectorAll('#hero-bg-cols .hero-col').forEach(col => col.classList.add('active'));
          // Initialize Flashlight tracking
          const viewportElemScroll = document.getElementById('hero-viewport');
          viewportElemScroll.addEventListener('mousemove', (e) => {
            const rect = viewportElemScroll.getBoundingClientRect();
            viewportElemScroll.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            viewportElemScroll.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          });
        } else {
          // Normal page load at top: run entrance animation
          gsap.set('#el-kicker', { opacity: 0, y: 35, filter: 'blur(14px)' });
          gsap.set('#el-h1a', { opacity: 0, y: 45, filter: 'blur(16px)' });
          gsap.set('#el-h1b', { opacity: 0, y: -45, filter: 'blur(16px)' });
          gsap.set('#el-body', { opacity: 0, y: 30, filter: 'blur(12px)' });
          gsap.set('#el-cta', { opacity: 0, y: 25, filter: 'blur(10px)' });
          gsap.set('#el-meta', { opacity: 0, y: 15, filter: 'blur(8px)' });
          gsap.set('#hero-explore-scroll', { opacity: 0, y: 15, filter: 'blur(8px)' });
          gsap.set(['#el-badge'], { opacity: 0, y: 15 });
          gsap.set('#navbar', { opacity: 0 });
          gsap.set('#hero-sep', { opacity: 0, scaleX: 0, transformOrigin: 'left center' });
          gsap.set('#hero-wm', { opacity: 0 });
          const tl = gsap.timeline({
            delay: 0.1,
            onStart: () => {
              document.body.style.opacity = '1';
              document.getElementById('hero-left').style.pointerEvents = 'auto';
              // Initialize Flashlight tracking
              const viewportElem = document.getElementById('hero-viewport');
              viewportElem.addEventListener('mousemove', (e) => {
                const rect = viewportElem.getBoundingClientRect();
                viewportElem.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                viewportElem.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
              });
            }
          });
          tl
            .to('#navbar', { opacity: 1, duration: 0.8, ease: 'power2.out' })
            .to('#el-kicker', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'expo.out' }, '-=0.5')
            .add('titleShow', '-=0.8')
            .to('#el-h1a', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow')
            .to(frame, { opacity: 1, scale: 1, duration: 1.8, ease: 'power4.out' }, 'titleShow')
            .to('#el-h1b', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow+=0.18')
            .to('#hero-sep', { opacity: 1, scaleX: 1, duration: 1.2, ease: 'power3.out' }, 'titleShow+=0.45')
            .to('#el-body', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, 'titleShow+=0.55')
            .to('#el-cta', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' }, 'titleShow+=0.75')
            .to('#el-meta', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 'titleShow+=0.95')
            .to('#hero-explore-scroll', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 'titleShow+=1.05')
            .to(['#el-badge'], { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.15 }, 'titleShow+=1.1')
            .to('#hero-wm',  { opacity: 1, duration: 2.5, ease: 'power1.out' }, 'titleShow+=0.8');

          // Graceful interruption: fast-forward intro if user interacts to avoid broken scroll states
          const skipIntro = () => {
            if (tl && tl.isActive() && tl.progress() < 1) {
              tl.progress(1); // Force timeline to its final clean state immediately
            }
            cleanupListeners();
          };

          const cleanupListeners = () => {
            window.removeEventListener('wheel', skipIntro);
            window.removeEventListener('touchmove', skipIntro);
            window.removeEventListener('mousedown', skipIntro);
            window.removeEventListener('keydown', skipIntro);
            window.removeEventListener('scroll', skipIntro);
          };

          // Listen for actual scroll/interaction attempts (passive for performance)
          window.addEventListener('wheel', skipIntro, { passive: true });
          window.addEventListener('touchmove', skipIntro, { passive: true });
          window.addEventListener('mousedown', skipIntro, { passive: true });
          window.addEventListener('keydown', skipIntro, { passive: true });
          window.addEventListener('scroll', skipIntro, { passive: true });

          // Cleanup listeners naturally when the timeline finishes without interruption
          tl.eventCallback("onComplete", cleanupListeners);
        }
        /* ── SCROLL-OUT: staggered parallax per element ─────────────── */
        // Using gsap.to (not fromTo) so that the "from" state is never force-set
        // by GSAP when the ScrollTrigger initializes, which is what caused elements
        // to disappear when the page was reloaded mid-scroll and then scrolled back.
        gsap.to('#el-kicker', {
          opacity: 0, y: -40, filter: 'blur(8px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.22}`, scrub: CONFIG.scrub }
        });
        gsap.to('#el-h1a', {
          opacity: 0, y: -60, filter: 'blur(12px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.3}`, scrub: CONFIG.scrub }
        });
        gsap.to('#el-h1b', {
          opacity: 0, y: -48, filter: 'blur(10px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.36}`, scrub: CONFIG.scrub }
        });
        gsap.to('#el-body', {
          opacity: 0, y: -32, filter: 'blur(8px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.43}`, scrub: CONFIG.scrub }
        });
        gsap.to('#el-cta', {
          opacity: 0, y: -26, filter: 'blur(6px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.5}`, scrub: CONFIG.scrub }
        });
        gsap.to('#el-meta', {
          opacity: 0, y: -18, filter: 'blur(6px)', ease: 'power1.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.35}`, scrub: CONFIG.scrub }
        });
        gsap.to('#hero-sep', {
          opacity: 0, scaleX: 0, transformOrigin: 'left center', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.28}`, scrub: CONFIG.scrub }
        });
        gsap.to('#hero-wm', {
          opacity: 0, ease: 'power1.in', immediateRender: false,
          scrollTrigger: { trigger: wrapper, start: 'top top', end: () => `+=${scrollPx * 0.4}`, scrub: CONFIG.scrub }
        });
        /* ── SCROLL PIN ──────────────────────────────────────────── */
        ScrollTrigger.create({
          trigger: wrapper,
          start: 'top top',
          end: () => `+=${scrollPx}`,
          pin: viewport,
          pinSpacing: false,
          anticipatePin: 1,
        });
        /* ── IMAGE SEQUENCE SCRUB ────────────────────────────────────
           OnUpdate dispara a cada tick de scroll.
           O índice é calculado pelo progresso (0→1) × total de frames.
           DrawImage é instantâneo — sem latência de codec H.264.
        ────────────────────────────────────────────────────────────── */
        ScrollTrigger.create({
          trigger: wrapper,
          start: 'top top',
          end: () => `+=${scrollPx}`,
          scrub: CONFIG.scrub,
          onUpdate: (self) => {
            const idx = Math.min(
              Math.floor(self.progress * CONFIG.TOTAL_FRAMES),
              CONFIG.TOTAL_FRAMES - 1
            );
            drawFrame(idx);
          }
        });
        /* ── TEXT SCROLL-OUT: per-element parallax exits (see below) ── */
        // Handled by individual gsap.to() blocks in the CREATIVE ANIMATIONS section
        /* ── EXPLORE SCROLL-OUT ────────────────────────── */
        gsap.to('#hero-explore-scroll', {
          opacity: 0, y: -20, filter: 'blur(5px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: {
            trigger: wrapper, start: 'top top',
            end: () => `+=${scrollPx * 0.25}`, scrub: CONFIG.scrub,
          }
        });
        /* ── VIDEO-FRAME EXPANSION (split → fullscreen) ──────────── */
        const wideTabletMQFull = "(max-width: 1024px) and (min-width: 850px) and (max-height: 800px)";
        mm.add({
          isDesktop: `(min-width: 1025px), ${wideTabletMQFull}`,
          isMobile: "(max-width: 1024px)"
        }, (context) => {
          let { isDesktop, isMobile } = context.conditions;

          // Mesma trava explícita: force o formato tablet baixo a usar Desktop script
          if (isDesktop && window.innerWidth <= 1024) {
            isMobile = false; 
          }

          // Fullscreen end-state properties
          const fullscreenProps = {
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            boxShadow: '0 0 0 0 transparent',
            zIndex: 40,
          };

          if (isMobile) {
            const mobileFullscreen = {
              ...fullscreenProps,
              left: '50%',
              xPercent: -50,
              top: '50%',
              yPercent: -50,
              maxHeight: 'none',
              maxWidth: 'none',
            };

            gsap.to(frame, {
              ...mobileFullscreen,
              ease: 'power2.inOut',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top top',
                end: () => `+=${scrollPx}`,
                scrub: CONFIG.scrub,
                onLeave: () => {
                  gsap.set(frame, mobileFullscreen);
                },
                onEnterBack: () => {}
              }
            });
          } else {
            const desktopFullscreen = {
              ...fullscreenProps,
              left: 0,
              top: 0,
              xPercent: 0,
              yPercent: 0,
            };
            gsap.to(frame, {
              ...desktopFullscreen,
              ease: 'power2.inOut',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top top',
                end: () => `+=${scrollPx}`,
                scrub: CONFIG.scrub,
                onLeave: () => {
                  gsap.set(frame, desktopFullscreen);
                },
                onEnterBack: () => {
                  // ScrollTrigger scrub handles it
                }
              }
            });
          }
        });
        /* ── CINEMATIC OVERLAY — enabled on all devices ─────────── */
        gsap.to('#video-overlay', {
          opacity: 1, ease: 'power1.inOut',
          scrollTrigger: {
            trigger: wrapper,
            start: () => `+=${scrollPx * 0.35}`,
            end: () => `+=${scrollPx}`,
            scrub: CONFIG.scrub,
          }
        });
        /* ── MOBILE: darken hero-viewport background during scroll ── */
        if (window.innerWidth <= 1024) {
          gsap.to('#hero-viewport', {
            backgroundColor: '#0a0a0a',
            ease: 'power1.inOut',
            scrollTrigger: {
              trigger: wrapper,
              start: () => `+=${scrollPx * 0.15}`,
              end: () => `+=${scrollPx * 0.55}`,
              scrub: CONFIG.scrub,
            }
          });
        }
        /* Canvas resize on window resize */
        window.addEventListener('resize', () => {
          resizeCanvas();
          ScrollTrigger.refresh();
        });
        /* ── SECTION 2 ANIMATION (2-Col Layout Polished) ─────────── */
        // Set initial states for word mask
        gsap.set('.word-inner', { y: '110%' });
        // Parallax background text and glows
        gsap.to('#parallax-text span', {
          x: '-30%',
          ease: 'none',
          scrollTrigger: {
            trigger: '#experience',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
        gsap.to('.parallax-glow-1', {
          yPercent: -40,
          ease: 'none',
          scrollTrigger: { trigger: '#experience', start: 'top bottom', end: 'bottom top', scrub: true }
        });
        gsap.to('.parallax-glow-2', {
          yPercent: 40,
          ease: 'none',
          scrollTrigger: { trigger: '#experience', start: 'top bottom', end: 'bottom top', scrub: true }
        });
        ScrollTrigger.create({
          trigger: '#experience',
          start: 'top 80%',
          once: true,
          onEnter: () => {
            const tExp = gsap.timeline();
            tExp.add('start')
              .to('.exp-left', {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 1.6,
                ease: 'power3.out'
              }, 'start')
              .to('.exp-left-img', {
                scale: 1,
                duration: 2.0,
                ease: 'power3.out',
                clearProps: 'transform'
              }, 'start')
              .to('.sec2-title', {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 1.0,
                ease: 'power3.out'
              }, 'start+=0.3')
              .to('.exp-pillar', {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 1.0,
                ease: 'power3.out',
                stagger: 0.4
              }, 'start+=0.7');
          }
        });
        // ── SECTION 3 ANIMATION (Gemini-style) ─────────────────────
        gsap.set('.feat-card', { opacity: 0, y: 70, scale: 0.94, filter: 'blur(6px)' });
        gsap.set('.feat-reveal', { opacity: 0, y: 28, filter: 'blur(6px)' });
        // Title lines start clipped
        gsap.set('.sect3-line-inner', { y: '110%', opacity: 0 });
        ScrollTrigger.create({
          trigger: '#featured',
          start: 'top 72%',
          once: true,
          onEnter: () => {
            const tFeat = gsap.timeline();
            tFeat.add('start')
              // 1. Label animationIn blur
              .to('.feat-reveal', {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.9,
                ease: 'power3.out',
                stagger: 0.08
              }, 'start')
              // 2. Heading: each line slides up from clip (Gemini textSlide)
              .to('.sect3-line-inner', {
                y: '0%',
                opacity: 1,
                duration: 1.0,
                ease: 'expo.out',
                stagger: 0.14
              }, 'start+=0.1')
              // 3. Cards: stagger with blur + scale (Gemini animationIn energy)
              .to('.feat-card', {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 1.1,
                ease: 'power4.out',
                stagger: 0.18,
                clearProps: 'filter'
              }, 'start+=0.35');
          }
        });
        // ── CREATIVE ANIMATIONS (NEW) ──────────────────────────────
        // 1. Text Split & Char Reveal Logic
        function splitAndAnimate(selector, delayStart = 0) {
          const el = document.querySelector(selector);
          if (!el) return;
          const text = el.innerText;
          el.innerHTML = '';
          text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.innerText = char === ' ' ? '\u00A0' : char;
            span.className = 'split-child opacity-0';
            el.appendChild(span);
            gsap.to(span, {
              opacity: 1,
              y: 0,
              startAt: { y: 20 },
              duration: 0.8,
              delay: delayStart + (i * 0.03),
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            });
          });
        }
        // Hero headline uses dedicated GSAP line animations (see tl above)
        // splitAndAnimate removed here to preserve HTML color/style markup
        // 2. Flashlight / Spotlight Mouse Follow
        document.querySelectorAll('.flashlight-card').forEach(card => {
          card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
          });
        });
        // 3. Section 3 Dark Mode (Improved Transitions)
        ScrollTrigger.create({
          trigger: '#featured',
          start: 'top 35%', // Começa a escurecer a seção um pouco mais tarde
          end: 'bottom 45%',
          onEnter: () => {
             gsap.to('#featured', { backgroundColor: 'var(--c-dark)', duration: 1.2, ease: 'power2.out' });
             // Body só escurece quando o topo encostar quase no topo, pra não vazar pelas bordas arredondadas
             gsap.to('body', { backgroundColor: 'var(--c-dark)', duration: 1.0, delay: 0.1 });
             gsap.to('.feat-text-dark', { color: '#ffffff', duration: 1.2 });
             gsap.to('.feat-text-muted', { color: 'rgba(255,255,255,0.6)', duration: 1.2 });
             gsap.to('.glow-orb', { opacity: 0.25, duration: 2, ease: 'power2.inOut', stagger: 0.2 });
             gsap.to('.feat-grid', { opacity: 1, duration: 2 });
          },
          onLeave: () => {
             gsap.to('body', { backgroundColor: 'var(--c-bg)', duration: 1.0 });
          },
          onEnterBack: () => {
             gsap.to('body', { backgroundColor: 'var(--c-dark)', duration: 1.0 });
          },
          onLeaveBack: () => {
             gsap.to('#featured', { backgroundColor: 'var(--c-bg)', duration: 1.2, ease: 'power2.out' });
             gsap.to('body', { backgroundColor: 'var(--c-bg)', duration: 1.2, ease: 'power2.out' });
             gsap.to('.feat-text-dark', { color: 'var(--c-dark)', duration: 1.2 });
             gsap.to('.feat-text-muted', { color: 'rgba(26,26,26,0.5)', duration: 1.2 });
             gsap.to('.glow-orb', { opacity: 0, duration: 1.2 });
             gsap.to('.feat-grid', { opacity: 0, duration: 1.2 });
          }
        });
        // 3b. Clube do Livro Animation
        const clubeElements = gsap.utils.toArray('.blur-reveal, .split-animate');
        ScrollTrigger.create({
          trigger: '#clube-livro',
          start: 'top 75%',
          once: true,
          onEnter: () => {
            clubeElements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('is-visible');
              }, index * 120);
            });
          }
        });
        // Clube Quote Bar + Watermark — reveal on scroll
        ScrollTrigger.create({
          trigger: '#clube-quote-block',
          start: 'top 80%',
          once: true,
          onEnter: () => {
            const bar = document.getElementById('clube-quote-bar');
            if (bar) bar.style.height = '100%';
            const wm = document.getElementById('clube-wm');
            if (wm) wm.style.opacity = '1';
          }
        });
        gsap.to('.clube-parallax-img', {
          yPercent: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: '#clube-livro',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
        // 4. Section 4 Location Animation (Gemini Fade-In Style)
        const locElements = gsap.utils.toArray('.anim-fade-blur');
        ScrollTrigger.create({
          trigger: '#location',
          start: 'top 80%',
          once: true,
          onEnter: () => {
            locElements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('is-visible');
              }, index * 120);
            });
          }
        });
        // Giant Background Text Parallax
        gsap.to('#giant-text', {
          y: -150,
          ease: 'none',
          scrollTrigger: {
            trigger: '#featured',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
        // 4. Parallax scroll for cards images
        document.querySelectorAll('.feat-img').forEach((img, i) => {
          const card = img.closest('.feat-card');
          const direction = i % 2 === 0 ? -8 : 8;
          gsap.to(img, {
            yPercent: direction,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          });
        });
      }
      /* ══ LOCATION MODAL LOGIC ═════════════════════════════════════ */
      window.openLocationModal = function () {
        const modal = document.getElementById('location-modal');
        const content = document.getElementById('location-modal-content');
        modal.classList.remove('pointer-events-none');
        modal.classList.replace('opacity-0', 'opacity-100');
        setTimeout(() => {
          content.classList.replace('scale-95', 'scale-100');
          content.classList.replace('opacity-0', 'opacity-100');
        }, 50);
      };
      window.closeLocationModal = function () {
        const modal = document.getElementById('location-modal');
        const content = document.getElementById('location-modal-content');
        content.classList.replace('scale-100', 'scale-95');
        content.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => {
          modal.classList.replace('opacity-100', 'opacity-0');
          modal.classList.add('pointer-events-none');
        }, 200);
      };
      /* ══ UTILIDADES DE MOUSE (PARALLAX/FLASHLIGHT) ═══════════════ */
      window.updateMouse = function (element, e) {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        element.style.setProperty('--mouse-x', `${x}px`);
        element.style.setProperty('--mouse-y', `${y}px`);
      };
      /* ══ HERO BG COLUMNS REVEAL ════════════════════════════════════ */
      (function () {
        const bgCols = document.getElementById('hero-bg-cols');
        if (!bgCols) return;
        const NUM_COLS = 9;
        for (let i = 0; i < NUM_COLS; i++) {
          const col = document.createElement('div');
          col.className = 'hero-col';
          bgCols.appendChild(col);
        }
        // Reveal in stagger after fonts load
        setTimeout(() => {
          bgCols.querySelectorAll('.hero-col').forEach((col, i) => {
            setTimeout(() => col.classList.add('active'), i * 80);
          });
        }, 600);
      })();
      /* ══ HERO MOUSE SPOTLIGHT ══════════════════════════════════════ */
      (function () {
        const viewport = document.getElementById('hero-viewport');
        const spotlight = document.getElementById('hero-spotlight');
        if (!viewport || !spotlight) return;
        let rafId;
        let tx = 50, ty = 50;
        let cx = 50, cy = 50;
        function lerp(a, b, t) { return a + (b - a) * t; }
        function loop() {
          cx = lerp(cx, tx, 0.07);
          cy = lerp(cy, ty, 0.07);
          spotlight.style.background = `radial-gradient(600px circle at ${cx}% ${cy}%, rgba(43,74,59,0.06), transparent 60%)`;
          rafId = requestAnimationFrame(loop);
        }
        viewport.addEventListener('mousemove', e => {
          const rect = viewport.getBoundingClientRect();
          tx = ((e.clientX - rect.left) / rect.width) * 100;
          ty = ((e.clientY - rect.top) / rect.height) * 100;
        });
        viewport.addEventListener('mouseenter', () => {
          spotlight.style.opacity = '1';
          loop();
        });
        viewport.addEventListener('mouseleave', () => {
          spotlight.style.opacity = '0';
          cancelAnimationFrame(rafId);
        });
      })();
      /* ══ CUSTOM SCROLL INDICATOR LOGIC ════════════════════════════ */
      (function () {
        const line = document.getElementById('scroll-progress-line');
        if (!line) return;
        const fill = document.createElement('div');
        fill.style.cssText = 'position:absolute;top:0;left:0;right:0;background:var(--c-primary);border-radius:2px;height:0%;transition:height 0.15s linear;';
        line.appendChild(fill);
        function updateScrollProgress() {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = (scrollTop / (docHeight || 1)) * 100;
          fill.style.height = Math.min(100, Math.max(0, progress)) + '%';
        }
        window.addEventListener('scroll', updateScrollProgress, { passive: true });
        updateScrollProgress();
      })();
      (function () {
        const clockEl = document.getElementById('hero-clock');
        if (!clockEl) return;
        function tick() {
          const now = new Date();
          const h = String(now.getHours()).padStart(2, '0');
          const m = String(now.getMinutes()).padStart(2, '0');
          const s = String(now.getSeconds()).padStart(2, '0');
          clockEl.textContent = `São Paulo — ${h}:${m}:${s}`;
        }
        tick();
        setInterval(tick, 1000);
      })();
      /* ══ BOOTSTRAP ════════════════════════════════════════════════
         1. Preload todos os frames (mostra barra de progresso)
         2. Remove preloader com animação
         3. Calcula layout e inicia GSAP
      ══════════════════════════════════════════════════════════════ */
      document.fonts.ready.then(() => {
        preloadFrames().then(() => {
          /* Preload concluído — remove o preloader */
          gsap.to(preloaderEl, {
            yPercent: -100,
            duration: 1.0,
            ease: 'power4.inOut',
            onComplete: () => {
              preloaderEl.style.display = 'none';
              requestAnimationFrame(() => requestAnimationFrame(init));
            }
          });
        });
      });
    }());
  


(function(){
  function fixHeroResponsive() {
    const vp = document.getElementById('hero-viewport');
    if(!vp) return;
    const w = window.innerWidth;
    vp.classList.remove('is-notebook-pad', 'is-mobile-stack');
    if (w <= 1024) {
      vp.classList.add('is-mobile-stack');
    } else if (w <= 1279) {
      vp.classList.add('is-notebook-pad');
    }
    // Update GSAP ScrollTrigger computations when layout switches
    if(window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }
  window.addEventListener('resize', fixHeroResponsive);
  fixHeroResponsive();
  // Call once more upon full load to ensure perfect initial GSAP calculations
  window.addEventListener('load', fixHeroResponsive);
})();
