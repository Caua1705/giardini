
    gsap.registerPlugin(ScrollTrigger);

    /* ── Native smooth scroll behavior ── */
    document.documentElement.style.scrollBehavior = 'smooth';

    /* ── CANVAS FRAME VARS ── */
    const CONFIG = {
      TOTAL_FRAMES: 150,
      FRAMES_DIR: 'references/image-frames/menu',
      scrollVH: 120, // Reduced from 250 to 120 for faster scrub
      scrub: 1.0,
    };
    const canvas = document.getElementById('seq-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let frames = [];
    let currentFrameIndex = -1;

    function resizeCanvas() {
      if (!canvas) return;
      const frame = document.getElementById('video-frame');
      canvas.width = frame.offsetWidth;
      canvas.height = frame.offsetHeight;
      if (frames.length > 0 && currentFrameIndex >= 0) {
        drawFrame(currentFrameIndex);
      }
    }

    function drawFrame(index) {
      if (index === currentFrameIndex || !ctx) return;
      const img = frames[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      currentFrameIndex = index;
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    /* ── Preloader ── */
    const loaderBar = document.getElementById('loader-bar');
    const loader = document.getElementById('loader');

    function preloadFrames() {
      return new Promise((resolve) => {
        let loaded = 0;
        const total = CONFIG.TOTAL_FRAMES;
        frames = new Array(total);
        for (let i = 0; i < total; i++) {
          const img = new Image();
          img.src = `${CONFIG.FRAMES_DIR}/frame_${String(i).padStart(4, '0')}.webp`;
          frames[i] = img;
          img.onload = img.onerror = () => {
            loaded++;
            const pct = Math.round((loaded / total) * 100);
            if (loaderBar) loaderBar.style.width = `${pct}%`;
            if (loaded === total) resolve();
          };
        }
      });
    }

    preloadFrames().then(() => {
      // ── Loader Lift ──
      const loadTl = gsap.timeline({
        onComplete: () => {
          loader.style.display = 'none';
          initPage();
        }
      });
      
      loadTl.to(loader, { yPercent: -105, duration: 1.2, ease: 'power4.inOut' });

      // ── Detect mid-scroll reload ──────────────────────────────────────
      const isAlreadyScrolled = (window.scrollY || window.pageYOffset) > 10;

      let heroTl = null;

      if (isAlreadyScrolled) {
        // Page loaded mid-scroll: commit all hero elements to their
        // fully-visible final state immediately, then let scroll-out handle it.
        document.body.style.opacity = '1';
        gsap.set(['#navbar', '#el-kicker', '#el-h1a', '#el-h1b', '#el-body', '#el-cta', '#el-scroll'], { 
          opacity: 1, y: 0, filter: 'blur(0px)' 
        });
        
        // frame: set opacity 1 — never leave the frame in opacity:0 state
        gsap.set('#video-frame', { opacity: 1, scale: 1 });
        
        if (canvas) {
          canvas.style.transition = 'none';
          canvas.style.opacity    = '1';
          canvas.style.filter     = 'blur(0) contrast(1.1) brightness(1.05)';
          canvas.style.transform  = 'scale(1)';
        }
      } else {
        // Normal page load at top: run cinematic entrance animation
        gsap.set('#el-kicker', { opacity: 0, y: 35, filter: 'blur(14px)' });
        gsap.set('#el-h1a', { opacity: 0, y: 45, filter: 'blur(16px)' });
        gsap.set('#el-h1b', { opacity: 0, y: -45, filter: 'blur(16px)' });
        gsap.set('#el-body', { opacity: 0, y: 30, filter: 'blur(12px)' });
        gsap.set('#el-cta', { opacity: 0, y: 25, filter: 'blur(10px)' });
        gsap.set('#el-scroll', { opacity: 0, y: 15, filter: 'blur(8px)' });
        gsap.set('#navbar', { opacity: 0 });
        gsap.set('#video-frame', { opacity: 0, scale: 0.94 });

        heroTl = gsap.timeline({ 
          delay: 0.1,
          onStart: () => {
            document.body.style.opacity = '1';
          }
        });
        
        heroTl
          .to('#navbar', { opacity: 1, duration: 0.8, ease: 'power2.out' })
          .to('#el-kicker', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'expo.out' }, '-=0.5')
          .add('titleShow', '-=0.8')
          .to('#el-h1a', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow')
          .to('#video-frame', { opacity: 1, scale: 1, duration: 1.8, ease: 'power4.out' }, 'titleShow')
          .to('#el-h1b', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow+=0.18')
          .to('#el-body', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, 'titleShow+=0.55')
          .to('#el-cta', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' }, 'titleShow+=0.75')
          .to('#el-scroll', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 'titleShow+=1.05');
      }

      // Initialize canvas
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      if (frames[0]?.complete) drawFrame(0);
      // Add .ready class for the CSS styling — transition is suppressed above if mid-scroll
      if (canvas) canvas.classList.add('ready');


      // ── ScrollTrigger Scrub Animation ──
      const wrapper = document.getElementById('hero-pin-wrapper');
      const viewport = document.getElementById('hero-viewport');
      const scrollPx = window.innerHeight * (CONFIG.scrollVH / 100);

      if (wrapper && viewport && canvas) {
        wrapper.style.height = `${window.innerHeight + scrollPx}px`;

        ScrollTrigger.create({
          trigger: wrapper,
          start: 'top top',
          end: () => `+=${scrollPx}`,
          pin: viewport,
          pinSpacing: false,
          scrub: CONFIG.scrub,
          /* anticipatePin: prevents the layout jump/flash when the pin activates */
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              Math.floor(self.progress * CONFIG.TOTAL_FRAMES),
              CONFIG.TOTAL_FRAMES - 1
            );
            drawFrame(idx);
          }
        });

        // ── HERO EXIT: cinematic staggered parallax transitions ─────────────
        // Individual gsap.to() blocks with immediateRender: false match the
        // robust architecture of hero_premium.html.
        
        const scrollSettings = {
          trigger: wrapper, 
          start: 'top top', 
          scrub: 1.2,
          onEnter: () => {
            if (heroTl && heroTl.isActive()) heroTl.progress(1, false);
          }
        };

        gsap.to('#el-kicker', {
          opacity: 0, y: -40, filter: 'blur(8px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.22}` }
        });

        gsap.to('#el-h1a', {
          opacity: 0, y: -60, filter: 'blur(12px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.3}` }
        });

        gsap.to('#el-h1b', {
          opacity: 0, y: -48, filter: 'blur(10px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.36}` }
        });

        gsap.to('#el-h1-sep', {
          opacity: 0, y: -30, filter: 'blur(5px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.38}` }
        });

        gsap.to('#el-scroll', {
          opacity: 0, y: -20, filter: 'blur(5px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.25}` }
        });

        gsap.to('#el-body', {
          opacity: 0, y: -32, filter: 'blur(8px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.43}` }
        });

        gsap.to('#el-cta', {
          opacity: 0, y: -26, filter: 'blur(6px)', ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.5}` }
        });

        gsap.to('.product-glow', {
          opacity: 0, ease: 'none', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.35}` }
        });

        gsap.to('#video-frame', {
          opacity: 0.12, duration: 0.55, ease: 'none', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.55}` }
        });


      }
    });

    // Fallback: If loader doesn't clear in 6s, reveal anyway
    setTimeout(() => {
        if (loader && loader.style.display !== 'none') {
            gsap.to(loader, { yPercent: -105, duration: 1.2, ease: 'power4.inOut', onComplete: () => {
                loader.style.display = 'none';
                initPage();
            }});
        }
    }, 6000);

    function initPage() {
      const nav = document.getElementById('navbar');
      const catNav = document.getElementById('cat-nav');
      const catNavInner = document.getElementById('cat-nav-inner');
      const catBtns = document.querySelectorAll('.cat-btn');
      const sections = document.querySelectorAll('.menu-section');
      
      /* ── Sticky state observer for #cat-nav ──────────────────
         A sentinel element sits just above the cat-nav.
         When it leaves the viewport (scrolled past), we add
         .is-pinned to the nav — triggering the premium sticky style.
      */
      const sentinel = document.createElement('div');
      sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:100%;pointer-events:none;';
      catNav.parentElement.insertBefore(sentinel, catNav);

      const pinObserver = new IntersectionObserver(
        ([entry]) => {
          // Only pin if it's NOT intersecting (past the margin)
          // AND it's at the top of the viewport (not below it).
          // 77px matches the total negative margin including one extra pixel for safety.
          const isAboveThreshold = entry.boundingClientRect.top <= 77;
          catNav.classList.toggle('is-pinned', !entry.isIntersecting && isAboveThreshold);
        },
        { rootMargin: `-77px 0px 0px 0px`, threshold: 0 }
      );
      pinObserver.observe(sentinel);

      window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
          nav.classList.add('is-scrolled');
          nav.classList.remove('nav-light');
        } else {
          nav.classList.remove('is-scrolled');
          nav.classList.add('nav-light');
        }
      }, { passive: true });

      /* Native Intersection Observer for reveals */
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px" });

      // Observe all reveal elements by default
      document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

      /* ══════════════════════════════════════════════════════════
         CATEGORY TAB LOGIC — Anchor Navigation with Scroll
         ══════════════════════════════════════════════════════════ */

      /** Returns the scroll offset so content positions just below the main navbar,
       *  scrolling high enough that the cat-nav bar clears the visible area. */
      function getStickyOffset() {
        const navH = nav ? nav.getBoundingClientRect().height : 60;
        return navH + 120; // Increased offset to scroll 'up' (stopping higher in the document)
      }

      /** Centers the active cat-btn inside the horizontally scrollable rail. */
      function syncCatNavRail() {
        const activeBtn = catNavInner.querySelector('.cat-btn.active');
        if (!activeBtn) return;
        const btnLeft  = activeBtn.offsetLeft;
        const btnWidth = activeBtn.offsetWidth;
        const railW    = catNavInner.parentElement.offsetWidth;
        catNavInner.scrollTo({
          left: btnLeft - railW / 2 + btnWidth / 2,
          behavior: 'smooth'
        });
      }

      /**
       * setActiveTab(targetId, shouldScroll)
       * @param {string}  targetId    - the data-target / data-parent value
       * @param {boolean} shouldScroll - true = navigate page to top of category
       */
      function setActiveTab(targetId, shouldScroll = false) {
        /* 1. Update button active states */
        catBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.target === targetId);
        });

        /* 2. Show/hide sections & re-arm reveal observers */
        let firstSection = null;
        sections.forEach(sec => {
          if (sec.dataset.parent === targetId) {
            sec.classList.add('is-active');
            if (!firstSection) firstSection = sec;
            sec.querySelectorAll('.reveal').forEach(el => {
              el.classList.remove('is-visible');
              revealObserver.observe(el);
            });
          } else {
            sec.classList.remove('is-active');
          }
        });

        /* 3. Keep active button visible inside the cat-nav rail */
        syncCatNavRail();

        /* 4. Scroll page to the VERY TOP of the selected category.
              We always do this on user click (shouldScroll=true).
              Precise offset = navbar height + cat-nav height + breathing room. */
        if (shouldScroll && firstSection) {
          const offset     = getStickyOffset();
          const sectionTop = firstSection.getBoundingClientRect().top;
          const target     = window.scrollY + sectionTop - offset;
          window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
        }
      }

      /* Attach click handlers — always scroll when user picks a category */
      catBtns.forEach(btn => {
        btn.addEventListener('click', () => setActiveTab(btn.dataset.target, true));
      });

      // Initialize first tab (no scroll on page load)
      setActiveTab('manha', false);



      /* ── Intercept Hero CTA & Scroll Indicator for smooth GSAP-friendly scroll ── */
      const scrollToMenu = (e) => {
        e.preventDefault(); // Prevent native jump
        const targetY = catNav.getBoundingClientRect().top + window.scrollY - 76; // Accommodate sticky nav height & GSAP scrub
        window.scrollTo({ top: targetY, behavior: 'smooth' });
        setActiveTab('manha');

        if (mobileMenu && mobileMenu.classList.contains('open')) {
          mobileMenu.classList.remove('open');
        }
      };

      const heroCta = document.querySelector('.loc-beam-container[href="#manha"]');
      if (heroCta) heroCta.addEventListener('click', scrollToMenu);

      const navSabores = document.querySelector('.nav-link[href="#manha"]');
      if (navSabores) navSabores.addEventListener('click', scrollToMenu);

      const mobileCardapio = document.querySelector('.mobile-link[href="#manha"]');
      if (mobileCardapio) mobileCardapio.addEventListener('click', scrollToMenu);

      const scrollIndicator = document.getElementById('el-scroll');
      if (scrollIndicator) {
        scrollIndicator.style.pointerEvents = 'auto';
        scrollIndicator.style.cursor = 'pointer';
        scrollIndicator.addEventListener('click', () => {
          const targetY = catNav.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        });
      }
    }

    /* ── Mobile menu ── */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-close');
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    
    // Closer menu when a link is clicked
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });

    /* ══════════════════════════════════════════════════════════════════
       AMBIENT PARTICLE SYSTEM — floating golden motes
    ══════════════════════════════════════════════════════════════════ */
    (function initParticles() {
      const canvas = document.getElementById('particle-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      let W, H;
      const PARTICLES = [];
      const COUNT = 28;

      function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();

      function rand(min, max) { return Math.random() * (max - min) + min; }

      function createParticle() {
        return {
          x:     rand(0, W),
          y:     rand(0, H),
          r:     rand(0.6, 2.2),
          alpha: rand(0.04, 0.22),
          vx:    rand(-0.12, 0.12),
          vy:    rand(-0.22, -0.06),   // always drift upward, slowly
          life:  rand(0.4, 1),         // phase offset for pulse
          speed: rand(0.003, 0.009),   // pulse speed
        };
      }

      for (let i = 0; i < COUNT; i++) PARTICLES.push(createParticle());

      let raf;
      function tick(t) {
        ctx.clearRect(0, 0, W, H);

        PARTICLES.forEach(p => {
          p.life += p.speed;
          const pulse = 0.55 + 0.45 * Math.sin(p.life * Math.PI * 2);
          const a = p.alpha * pulse;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(183, 147, 88, ${a.toFixed(3)})`;
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;

          // Wrap around edges
          if (p.y < -10) { p.y = H + 5; p.x = rand(0, W); }
          if (p.x < -10) { p.x = W + 5; }
          if (p.x > W + 10) { p.x = -5; }
        });

        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);

      // Pause when tab is hidden to save CPU
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(raf);
        else raf = requestAnimationFrame(tick);
      });
    })();


    /* ══════════════════════════════════════════════════════════════════
       CUSTOM CURSOR — Magnetic golden dot with lagging ring
    ══════════════════════════════════════════════════════════════════ */
    (function initCursor() {
      // Only on pointer:fine devices (desktop)
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const dot  = document.getElementById('custom-cursor');
      const ring = document.getElementById('custom-cursor-ring');
      if (!dot || !ring) return;

      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let rx = mx, ry = my;   // ring position (lagged)

      document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
      });

      document.addEventListener('mouseleave', () => {
        dot.style.opacity  = '0';
        ring.style.opacity = '0';
      });
      document.addEventListener('mouseenter', () => {
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
      });

      function animCursor() {
        // Dot: instant
        dot.style.left = mx + 'px';
        dot.style.top  = my + 'px';

        // Ring: lerp for magnetic lag
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';

        requestAnimationFrame(animCursor);
      }
      requestAnimationFrame(animCursor);
    })();


    /* ══════════════════════════════════════════════════════════════════
       WATERMARK LETTERS — inject phantom letter behind each section header
    ══════════════════════════════════════════════════════════════════ */
    (function injectWatermarks() {
      const headers = document.querySelectorAll('.section-header');
      headers.forEach(header => {
        const kicker = header.querySelector('.section-kicker');
        if (!kicker) return;
        const letter = kicker.textContent.trim().charAt(0).toUpperCase();
        const wm = document.createElement('span');
        wm.className = 'section-watermark';
        wm.textContent = letter;
        wm.setAttribute('aria-hidden', 'true');
        header.appendChild(wm);
      });
    })();


    /* ══════════════════════════════════════════════════════════════════
       SCROLL DEPTH — add body class for orb intensity boost
    ══════════════════════════════════════════════════════════════════ */
    (function trackScrollDepth() {
      const threshold = window.innerHeight * 1.5;
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            document.body.classList.toggle('is-scrolled-deep', window.scrollY > threshold);
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    })();




  