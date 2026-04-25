
    gsap.registerPlugin(ScrollTrigger);

    /* ── Native smooth scroll behavior (desktop only) ── */
    if (window.innerWidth > 767) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    /* ── CANVAS FRAME VARS ── */
    const isMobileDevice = window.innerWidth <= 767;

    /* ── MOBILE SAFETY NET: Force all .reveal elements visible ──
       This runs independently of the preloader/initPage chain.
       Even if frame preloading fails, menu items will appear. */
    if (isMobileDevice) {
      setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => {
          el.classList.add('is-visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.clipPath = 'none';
          el.style.webkitClipPath = 'none';
        });
      }, 2000);
    }

    const CONFIG = {
      TOTAL_FRAMES: isMobileDevice ? 80 : 150,
      FRAMES_DIR: isMobileDevice
        ? 'references/image-frames/menu/mobile'
        : 'references/image-frames/menu/desktop',
      scrollVH: isMobileDevice ? 80 : 85,
      scrub: isMobileDevice ? 0.3 : 1.0,
    };
    const canvas = document.getElementById('seq-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let frames = [];
    let currentFrameIndex = -1;

    function resizeCanvas() {
      if (!canvas) return;
      const frame = document.getElementById('video-frame');
      const newW = frame.offsetWidth;
      const newH = frame.offsetHeight;
      if (newW <= 0 || newH <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(newW * dpr);
      const targetH = Math.round(newH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width  = targetW;
        canvas.height = targetH;
        canvas.style.width  = newW + 'px';
        canvas.style.height = newH + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Canvas was cleared by dimension change — force redraw
        const savedIdx = currentFrameIndex;
        currentFrameIndex = -1;
        if (frames.length > 0 && savedIdx >= 0) {
          drawFrame(savedIdx);
        }
      }
    }

    function drawFrame(index) {
      if (index === currentFrameIndex || !ctx) return;
      const img = frames[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      if (canvas.width === 0 || canvas.height === 0) return;
      currentFrameIndex = index;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      // Cover — zoom slightly more on mobile to hide edge artifacts
      const zoom = isMobileDevice ? 1.15 : 1.02;
      const scale = Math.max(cw / iw, ch / ih) * zoom;
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // Force redraw current frame (bypasses index guard)
    function forceRedraw() {
      if (currentFrameIndex >= 0 && frames[currentFrameIndex]?.complete) {
        const idx = currentFrameIndex;
        currentFrameIndex = -1;
        drawFrame(idx);
      }
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

      // ── Force scroll to top on mobile ──
      if (isMobileDevice) {
        window.scrollTo(0, 0);
      }

      // ── Detect mid-scroll reload ──
      const isAlreadyScrolled = (window.scrollY || window.pageYOffset) > 10;

      let heroEntranceDone = false;
      let exitAnimsCreated = false;

      // ── Initial hidden state for hero elements ──
      gsap.set('#el-kicker', { opacity: 0, y: 35, filter: 'blur(14px)' });
      gsap.set('#el-h1a',    { opacity: 0, y: 45, filter: 'blur(16px)' });
      gsap.set('#el-h1b',    { opacity: 0, y: -45, filter: 'blur(16px)' });
      gsap.set('#el-h1-sep', { opacity: 0, scaleX: 0, transformOrigin: 'left' });
      gsap.set('#el-body',   { opacity: 0, y: 30, filter: 'blur(12px)' });
      gsap.set('#el-cta',    { opacity: 0, y: 25, filter: 'blur(10px)' });
      gsap.set('#el-scroll', { opacity: 0, y: 15, filter: 'blur(8px)' });
      gsap.set('#navbar',    { opacity: 0 });
      gsap.set('#video-frame', { opacity: 0, scale: 0.94 });

      // ── Entrance timeline builder ──
      function buildEntranceTl(opts) {
        const originalOnComplete = opts.onComplete;
        opts.onComplete = () => {
          // After entrance: lock video-frame visible permanently
          const vf = document.getElementById('video-frame');
          if (vf) {
            vf.style.opacity = '1';
            vf.style.transform = 'scale(1)';
          }
          if (originalOnComplete) originalOnComplete();
        };
        const tl = gsap.timeline(opts);
        tl
          .to('#navbar', { opacity: 1, duration: 0.8, ease: 'power2.out' })
          .to('#el-kicker', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'expo.out' }, '-=0.5')
          .add('titleShow', '-=0.8')
          .to('#el-h1a', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow')
          .to('#video-frame', { opacity: 1, scale: 1, duration: 1.8, ease: 'power4.out' }, 'titleShow')
          .to('#el-h1b', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow+=0.18')
          .to('#el-h1-sep', { opacity: 1, scaleX: 1, duration: 1.2, ease: 'expo.out' }, 'titleShow+=0.30')
          .to('#el-body', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, 'titleShow+=0.55')
          .to('#el-cta', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' }, 'titleShow+=0.75')
          .to('#el-scroll', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 'titleShow+=1.05');
        return tl;
      }

      // Initialize canvas
      // Initialize canvas — debounce resize on mobile
      if (isMobileDevice) {
        let _rTimer;
        window.addEventListener('resize', () => {
          clearTimeout(_rTimer);
          _rTimer = setTimeout(resizeCanvas, 150);
        });
      } else {
        window.addEventListener('resize', resizeCanvas);
      }
      resizeCanvas();
      // Force draw first frame — retry until loaded
      function tryDrawFirst() {
        if (frames[0]?.complete && frames[0].naturalWidth > 0) {
          currentFrameIndex = -1; // reset to force draw
          drawFrame(0);
        } else {
          requestAnimationFrame(tryDrawFirst);
        }
      }
      tryDrawFirst();
      if (canvas) {
        canvas.classList.add('ready');
        canvas.style.willChange = 'transform';
      }

      // ── ScrollTrigger Scrub Animation ──
      const wrapper = document.getElementById('hero-pin-wrapper');
      const viewport = document.getElementById('hero-viewport');
      const scrollPx = window.innerHeight * (CONFIG.scrollVH / 100);

      // ── Exit scrub animations ──
      function createExitAnimations() {
        if (exitAnimsCreated) return;
        exitAnimsCreated = true;

        function snapHeroVisible() {
          gsap.set(['#el-kicker', '#el-h1a', '#el-h1b', '#el-h1-sep', '#el-body', '#el-cta', '#el-scroll'], {
            opacity: 1, y: 0, filter: 'blur(0px)'
          });
          gsap.set('#el-h1-sep', { scaleX: 1 });
          // Force video-frame visible and redraw first frame
          const vf = document.getElementById('video-frame');
          if (vf) {
            vf.style.opacity = '1';
            vf.style.transform = 'scale(1)';
          }
          gsap.set('#video-frame', { opacity: 1, scale: 1 });
          if (frames[0]?.complete) {
            currentFrameIndex = -1;
            drawFrame(0);
          }
        }

        const scrollSettings = {
          trigger: wrapper,
          start: 'top top',
          scrub: 0.6,
          onLeaveBack: () => { snapHeroVisible(); }
        };

        // On mobile, skip filter:blur in scroll-out — paint op, not compositor-only
        const _f = (b) => isMobileDevice ? {} : { filter: `blur(${b})` };

        gsap.to('#el-kicker', {
          opacity: 0, y: -40, ..._f('8px'), ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.22}` }
        });
        gsap.to('#el-h1a', {
          opacity: 0, y: -60, ..._f('12px'), ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.3}` }
        });
        gsap.to('#el-h1b', {
          opacity: 0, y: -48, ..._f('10px'), ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.36}` }
        });
        gsap.to('#el-h1-sep', {
          scaleX: 0, opacity: 0, ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.38}` }
        });
        gsap.to('#el-scroll', {
          opacity: 0, y: -20, ..._f('5px'), ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.25}` }
        });
        gsap.to('#el-body', {
          opacity: 0, y: -32, ..._f('8px'), ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.43}` }
        });
        gsap.to('#el-cta', {
          opacity: 0, y: -26, ..._f('6px'), ease: 'power2.in', immediateRender: false,
          scrollTrigger: { ...scrollSettings, end: () => `+=${scrollPx * 0.5}` }
        });
      }

      if (wrapper && viewport && canvas) {
        wrapper.style.height = `${window.innerHeight + scrollPx}px`;

        ScrollTrigger.create({
          trigger: wrapper,
          start: 'top top',
          end: () => `+=${scrollPx}`,
          pin: viewport,
          pinSpacing: false,
          scrub: CONFIG.scrub,
          anticipatePin: isMobileDevice ? 1.5 : 1,
          onUpdate: (self) => {
            resizeCanvas(); // keep canvas synced with any GSAP size changes
            const idx = Math.min(
              Math.floor(self.progress * CONFIG.TOTAL_FRAMES),
              CONFIG.TOTAL_FRAMES - 1
            );
            drawFrame(idx);
          },
          onLeaveBack: () => {
            // Safety: always show frame 0 + video-frame when returning to top
            const vf = document.getElementById('video-frame');
            if (vf) vf.style.opacity = '1';
            if (frames[0]?.complete) {
              currentFrameIndex = -1;
              drawFrame(0);
            }
          },
          onLeave: () => {
            // When leaving hero area: ensure last frame stays drawn
            const lastIdx = CONFIG.TOTAL_FRAMES - 1;
            if (frames[lastIdx]?.complete) {
              currentFrameIndex = -1;
              drawFrame(lastIdx);
            }
          }
        });

        if (isAlreadyScrolled) {
          document.body.style.opacity = '1';
          gsap.set('#navbar', { opacity: 1 });
          gsap.set('#video-frame', { opacity: 1, scale: 1 });
          if (canvas) {
            canvas.style.transition = 'none';
            canvas.style.opacity    = '1';
            canvas.style.filter     = 'blur(0) contrast(1.1) brightness(1.05)';
            canvas.style.transform  = 'scale(1)';
          }

          ScrollTrigger.create({
            trigger: wrapper,
            start: 'top 90%',
            onEnterBack: () => {
              if (!heroEntranceDone) {
                heroEntranceDone = true;
                buildEntranceTl({ onComplete: () => { createExitAnimations(); } });
              }
            }
          });

        } else {
          document.body.style.opacity = '1';
          buildEntranceTl({
            delay: 0.1,
            onComplete: () => { createExitAnimations(); }
          });
        }

        // ── MOBILE SAFETY NET: ensure canvas never stays blank ──
        // Use lightweight check: only redraw on visibilitychange (tab regain).
        // The previous getImageData approach was extremely expensive on mobile
        // (GPU→CPU readback on every scroll frame). Removed.
        if (isMobileDevice && canvas && ctx) {
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              forceRedraw();
            }
          });
        }

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
      const categoryGroups = document.querySelectorAll('.category-group');
      
      /* ── Fixed-pin observer for #cat-nav ─────────────────────────────
         overflow-x:hidden on html/body breaks position:sticky, so we
         use position:fixed instead.
         On mobile the navbar is position:absolute (scrolls away),
         so cat-nav pins at top:0. On desktop it pins below navbar.
      ──────────────────────────────────────────────────────────────── */
      const menuBody = document.getElementById('menu-body');
      const NAVBAR_H = isMobileDevice ? 0 : 72;
      let catNavH = catNav.offsetHeight;
      let isPinned = false;

      function getCatNavTop() {
        if (isPinned) {
          catNav.classList.remove('is-pinned');
          if (menuBody) menuBody.style.paddingTop = '0';
        }
        const rect = catNav.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        if (isPinned) {
          catNav.classList.add('is-pinned');
          if (menuBody) menuBody.style.paddingTop = catNavH + 'px';
        }
        return top;
      }

      let catNavNaturalTop = 0;

      function updatePin() {
        catNavH = catNav.offsetHeight;
        const triggerAt = catNavNaturalTop - NAVBAR_H;

        if (window.scrollY >= triggerAt && !isPinned) {
          isPinned = true;
          catNav.classList.add('is-pinned');
          if (menuBody) menuBody.style.paddingTop = catNavH + 'px';
        } else if (window.scrollY < triggerAt && isPinned) {
          isPinned = false;
          catNav.classList.remove('is-pinned');
          if (menuBody) menuBody.style.paddingTop = '0';
        }
      }

      requestAnimationFrame(() => {
        catNavNaturalTop = catNav.getBoundingClientRect().top + window.scrollY;
        updatePin();
      });

      window.addEventListener('scroll', updatePin, { passive: true });
      window.addEventListener('resize', () => {
        catNavNaturalTop = getCatNavTop();
        catNavH = catNav.offsetHeight;
        updatePin();
      }, { passive: true });

      /* ── Navbar scroll state ── */
      window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
          nav.classList.add('is-scrolled');
          nav.classList.remove('nav-light');
        } else {
          nav.classList.remove('is-scrolled');
          nav.classList.add('nav-light');
        }
      }, { passive: true });

      /* ── Reveal animations (IntersectionObserver) ── */
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px" });

      function observeRevealElements() {
        document.querySelectorAll('.reveal:not(.is-observed)').forEach(el => {
          el.classList.add('is-observed');
          revealObserver.observe(el);
        });
      }

      observeRevealElements();

      /* ── Mobile fallback: force all reveals visible immediately ── */
      if (window.innerWidth <= 767) {
        document.querySelectorAll('.reveal').forEach(el => {
          el.classList.add('is-visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.clipPath = 'none';
          el.style.webkitClipPath = 'none';
        });
      }


      /* ══════════════════════════════════════════════════════════
         SCROLL-BASED CATEGORY NAVIGATION
      ══════════════════════════════════════════════════════════ */

      /** Centers the active cat-btn inside the scrollable rail. */
      function syncCatNavRail() {
        const activeBtn = catNavInner.querySelector('.cat-btn.active');
        if (!activeBtn) return;
        const rail = catNavInner;
        const btnLeft  = activeBtn.offsetLeft;
        const btnWidth = activeBtn.offsetWidth;
        const railW    = rail.offsetWidth;
        const scrollTarget = btnLeft - (railW / 2) + (btnWidth / 2);
        rail.scrollTo({
          left: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
      }

      /** Set active category button by ID */
      function setActiveCategory(targetId) {
        let changed = false;
        catBtns.forEach(btn => {
          const shouldBeActive = btn.dataset.target === targetId;
          if (shouldBeActive && !btn.classList.contains('active')) changed = true;
          btn.classList.toggle('active', shouldBeActive);
        });
        if (changed) syncCatNavRail();
      }

      /** Scroll to a category group smoothly */
      function scrollToCategory(targetId) {
        const group = document.getElementById(targetId);
        if (!group) return;

        const navH = nav ? nav.getBoundingClientRect().height : 72;
        const catH = catNav ? catNav.offsetHeight : 50;
        const offset = (isMobileDevice ? 0 : navH) + catH + 24;
        const groupTop = group.getBoundingClientRect().top + window.scrollY;
        const target = groupTop - offset;

        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }

      /* ── Click handlers for category buttons ── */
      catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.target;
          setActiveCategory(targetId);
          scrollToCategory(targetId);
        });
      });

      /* ── IntersectionObserver: track which category is in view ─────
         Updates active nav button as user scrolls through categories.
         On mobile, use a tighter rootMargin for better detection since
         cat-nav pins at top:0 without the navbar taking space.
      ──────────────────────────────────────────────────────────────── */
      let isUserScrolling = true; // Flag to prevent observer fighting with click-scroll

      const catObserverMargin = isMobileDevice
        ? '-8% 0px -70% 0px'   // Mobile: detect near top of viewport
        : '-20% 0px -60% 0px'; // Desktop: bias toward upper portion

      const categoryObserver = new IntersectionObserver((entries) => {
        if (!isUserScrolling) return;

        // Find the topmost visible category group
        let topEntry = null;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
              topEntry = entry;
            }
          }
        });

        if (topEntry) {
          setActiveCategory(topEntry.target.id);
        }
      }, {
        rootMargin: catObserverMargin,
        threshold: [0, 0.1]
      });

      categoryGroups.forEach(group => categoryObserver.observe(group));

      // Temporarily disable observer during click-to-scroll
      catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          isUserScrolling = false;
          // Re-enable after scrolling settles
          setTimeout(() => { isUserScrolling = true; }, 1200);
        });
      });


      /* ── Hero CTA & Scroll Indicator scroll-to-menu ── */
      const scrollToMenu = (e) => {
        e.preventDefault();
        const menuStart = document.getElementById('menu-start');
        if (menuStart) {
          const targetY = menuStart.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }

        if (mobileMenu && mobileMenu.classList.contains('open')) {
          mobileMenu.classList.remove('open');
        }
      };

      const heroCta = document.querySelector('.loc-beam-container[href="#menu-start"]');
      if (heroCta) heroCta.addEventListener('click', scrollToMenu);

      const navSabores = document.querySelector('.nav-link[href="#menu-start"]');
      if (navSabores) navSabores.addEventListener('click', scrollToMenu);

      const mobileCardapio = document.querySelector('.mobile-link[href="#menu-start"]');
      if (mobileCardapio) mobileCardapio.addEventListener('click', scrollToMenu);

      const scrollIndicator = document.getElementById('el-scroll');
      if (scrollIndicator) {
        scrollIndicator.style.pointerEvents = 'auto';
        scrollIndicator.style.cursor = 'pointer';
        scrollIndicator.addEventListener('click', () => {
          const menuStart = document.getElementById('menu-start');
          if (menuStart) {
            const targetY = menuStart.getBoundingClientRect().top + window.scrollY - 76;
            window.scrollTo({ top: targetY, behavior: 'smooth' });
          }
        });
      }
    }

    /* ── Mobile menu ── */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-close');
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });


    /* ══════════════════════════════════════════════════════════════════
       CUSTOM CURSOR — Green dot with lagging ring
    ══════════════════════════════════════════════════════════════════ */
    (function initCursor() {
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const dot  = document.getElementById('custom-cursor');
      const ring = document.getElementById('custom-cursor-ring');
      if (!dot || !ring) return;

      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let rx = mx, ry = my;

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
        dot.style.left = mx + 'px';
        dot.style.top  = my + 'px';

        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';

        requestAnimationFrame(animCursor);
      }
      requestAnimationFrame(animCursor);
    })();

    /* ══════════════════════════════════════════════════════════════════
       PRODUCT DETAIL MODAL / BOTTOM SHEET
    ══════════════════════════════════════════════════════════════════ */
    (function initDetailModal() {
      const modal = document.getElementById('menu-modal');
      const closeBtn = document.getElementById('modal-close');
      const backdrop = document.getElementById('modal-backdrop');
      
      if (!modal) return;

      const titleEl = document.getElementById('modal-title');
      const priceEl = document.getElementById('modal-price');
      const descEl = document.getElementById('modal-desc');
      const imageEl = document.getElementById('modal-image');
      const imgWrapper = document.getElementById('modal-image-wrapper');
      const attrsContainer = document.getElementById('modal-attrs');
      const badgesContainer = document.getElementById('modal-badges');

      // Dictionary of mappings for profile and allergens
      const iconMap = {
        veg: { label: 'Vegetariano', icon: 'lucide:leaf' },
        vegan: { label: 'Vegano', icon: 'lucide:leaf' },
        hot: { label: 'Picante', icon: 'lucide:flame' },
        new: { label: 'Novidade', icon: 'lucide:star' },
        premium: { label: 'Premium', icon: 'lucide:gem' },
        regional: { label: 'Regional', icon: 'lucide:map-pin' },
        fav: { label: 'Favorito', icon: 'lucide:heart' },
        casa: { label: 'Da Casa', icon: 'lucide:home' },
        gluten: { label: 'Contém Glúten', icon: 'lucide:wheat' },
        leite: { label: 'Contém Leite', icon: 'lucide:milk' },
        lac: { label: 'Contém Lactose', icon: 'lucide:milk-off' },
        castanhas: { label: 'Castanhas', icon: 'lucide:nut' }
      };

      function buildAttrGroup(title, itemsArr) {
        if (!itemsArr || itemsArr.length === 0) return '';
        let html = `<div class="modal-attr-group">
                      <h4 class="modal-attr-heading">${title}</h4>
                      <div class="modal-attr-list">`;
        itemsArr.forEach(key => {
          const dict = iconMap[key.trim()];
          if (dict) {
            html += `<span class="modal-attr-item">
                       <iconify-icon icon="${dict.icon}" class="modal-attr-icon"></iconify-icon>
                       ${dict.label}
                     </span>`;
          }
        });
        html += `</div></div>`;
        return html;
      }

      function openModal(item) {
        const name = item.getAttribute('data-item-name');
        const desc = item.getAttribute('data-item-desc');
        const price = item.getAttribute('data-item-price');
        const img = item.getAttribute('data-item-image');
        const allergens = item.getAttribute('data-item-allergens');
        const profile = item.getAttribute('data-item-profile');

        const priceCuscuz = item.getAttribute('data-price-cuscuz');
        const priceTapioca = item.getAttribute('data-price-tapioca');

        if (name) titleEl.innerHTML = name;
        
        if (price) {
          if (priceCuscuz && priceTapioca) {
            priceEl.innerHTML = `<span style="display:block; font-size: 0.55em; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px;">Cuscuz &nbsp;<strong style="font-size: 1.6em; font-weight: 500; letter-spacing: normal; text-transform: none; padding-right: 1.5rem;">${priceCuscuz}</strong> Tapioca &nbsp;<strong style="font-size: 1.6em; font-weight: 500; letter-spacing: normal; text-transform: none;">${priceTapioca}</strong></span>`;
          } else {
            priceEl.innerHTML = price;
          }
        }
        
        if (desc) {
          descEl.innerHTML = desc;
          descEl.style.display = 'block';
        } else {
          descEl.style.display = 'none';
        }

        if (img) {
          imageEl.src = img;
          imgWrapper.style.display = 'block';
        } else {
          imageEl.src = '';
          imgWrapper.style.display = 'none';
        }

        // Build semantic attribute sections
        let attrsHtml = '';
        if (profile) attrsHtml += buildAttrGroup('Perfil', profile.split(',').filter(Boolean));
        if (allergens) attrsHtml += buildAttrGroup('Contém', allergens.split(',').filter(Boolean));

        if (attrsHtml) {
          attrsContainer.innerHTML = attrsHtml;
          attrsContainer.style.display = 'flex';
        } else {
          attrsContainer.innerHTML = '';
          attrsContainer.style.display = 'none';
        }

        // Show badges in modal
        const badge = item.getAttribute('data-item-badge');
        if (badgesContainer) {
          if (badge && badge.trim()) {
            badgesContainer.innerHTML = `<span class="badge">${badge}</span>`;
            badgesContainer.style.display = 'flex';
          } else {
            badgesContainer.innerHTML = '';
            badgesContainer.style.display = 'none';
          }
        }

        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }

      function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      }

      function registerMenuItemClicks() {
        document.querySelectorAll('.menu-item').forEach(item => {
          if (item.hasAttribute('data-item-name') && !item._modalBound) {
            item._modalBound = true;
            item.addEventListener('click', () => openModal(item));
          }
        });
      }

      registerMenuItemClicks();

      // Re-registrar após fetch dinâmico da API (menu-data.js)
      document.addEventListener('menuRendered', () => {
        registerMenuItemClicks();
        // Não tentar usar o revealObserver aqui porque o initPage pode não ter rodado.
        // Apenas deixe os elementos prontos. 
        document.querySelectorAll('.reveal:not(.is-observed)').forEach(el => {
          // Fallback seguro: já torna os itens diretamente visíveis
          // Para evitar o bug do observer nunca inicializando neles
          el.classList.add('is-visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.clipPath = 'none';
          el.style.webkitClipPath = 'none';
        });
      });

      closeBtn.addEventListener('click', closeModal);
      backdrop.addEventListener('click', closeModal);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
          closeModal();
        }
      });
    })();

    /* ═══════════════════════════════════════════════════════════════════════════
       BASE SELECTOR LOGIC (TAPIOCA / CUSCUZ)
       Aguarda menuRendered para garantir que o grid está populado pela API.
    ═══════════════════════════════════════════════════════════════════════════ */
    function initBaseSelector() {
      const toggleBtns = document.querySelectorAll('.base-toggle-btn');
      if (toggleBtns.length === 0) return;

      function updateTapiocaGrid(base) {
        const tapiocaGrid = document.querySelector('#tapioca .menu-grid');
        if (!tapiocaGrid) return;

        const items = tapiocaGrid.querySelectorAll('.menu-item');
        items.forEach(item => {
          // Toggle image paths
          const thumbImg = item.querySelector('.item-thumb img');
          const currentDataImg = item.getAttribute('data-item-image');

          if (thumbImg && currentDataImg) {
            const newPath = base === 'cuscuz'
              ? currentDataImg.replace('/tapioca-e-cuscuz/tapioca/', '/tapioca-e-cuscuz/cuzcuz/')
              : currentDataImg.replace('/tapioca-e-cuscuz/cuzcuz/', '/tapioca-e-cuscuz/tapioca/');

            thumbImg.src = newPath;
            item.setAttribute('data-item-image', newPath);
          }

          item.classList.remove('thumb-hidden');

          // Toggle prices
          const priceEl = item.querySelector('.dynamic-price');
          if (!priceEl) return;
          
          const targetAttr = base === 'cuscuz' ? 'data-price-cuscuz' : 'data-price-tapioca';
          const newPrice = item.getAttribute(targetAttr);
          
          if (newPrice && priceEl.innerHTML !== newPrice) {
            // Atualiza também o atributo consumido pelo modal
            item.setAttribute('data-item-price', newPrice);

            gsap.to(priceEl, { opacity: 0, y: -2, duration: 0.15, onComplete: () => {
              priceEl.innerHTML = newPrice;
              gsap.to(priceEl, { opacity: 1, y: 0, duration: 0.15 });
            }});
          }
        });
      }

      toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          toggleBtns.forEach(b => b.classList.remove('active'));
          const currentBtn = e.currentTarget;
          currentBtn.classList.add('active');

          const base = currentBtn.getAttribute('data-base'); // 'cuscuz' or 'tapioca'
          updateTapiocaGrid(base);
        });
      });

      // Estado inicial
      const initialActive = document.querySelector('.base-toggle-btn.active');
      if (initialActive) {
        updateTapiocaGrid(initialActive.getAttribute('data-base'));
      }
    }

    // Tentar inicializar imediatamente (dados hardcoded ou fetch já concluído)
    initBaseSelector();

    // Re-inicializar após o fetch dinâmico popular o grid de Tapioca & Cuscuz
    document.addEventListener('menuRendered', initBaseSelector);
