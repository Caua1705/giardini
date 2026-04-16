
    gsap.registerPlugin(ScrollTrigger);

    /* ── Native smooth scroll behavior (desktop only) ── */
    if (window.innerWidth > 767) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    /* ── CANVAS FRAME VARS ── */
    const isMobileDevice = window.innerWidth <= 767;
    const CONFIG = {
      TOTAL_FRAMES: isMobileDevice ? 80 : 150,
      FRAMES_DIR: 'references/image-frames/menu',
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
      gsap.set('#el-body',   { opacity: 0, y: 30, filter: 'blur(12px)' });
      gsap.set('#el-cta',    { opacity: 0, y: 25, filter: 'blur(10px)' });
      gsap.set('#el-scroll', { opacity: 0, y: 15, filter: 'blur(8px)' });
      gsap.set('#navbar',    { opacity: 0 });
      gsap.set('#video-frame', { opacity: 0, scale: 0.94 });

      // ── Entrance timeline builder ──
      function buildEntranceTl(opts) {
        const tl = gsap.timeline(opts);
        tl
          .to('#navbar', { opacity: 1, duration: 0.8, ease: 'power2.out' })
          .to('#el-kicker', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'expo.out' }, '-=0.5')
          .add('titleShow', '-=0.8')
          .to('#el-h1a', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow')
          .to('#video-frame', { opacity: 1, scale: 1, duration: 1.8, ease: 'power4.out' }, 'titleShow')
          .to('#el-h1b', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out' }, 'titleShow+=0.18')
          .to('#el-body', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, 'titleShow+=0.55')
          .to('#el-cta', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' }, 'titleShow+=0.75')
          .to('#el-scroll', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 'titleShow+=1.05');
        return tl;
      }

      // Initialize canvas
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      if (frames[0]?.complete) drawFrame(0);
      if (canvas) canvas.classList.add('ready');

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
          gsap.set('#video-frame', { opacity: 1 });
        }

        const scrollSettings = {
          trigger: wrapper,
          start: 'top top',
          scrub: 1.2,
          onLeaveBack: () => { snapHeroVisible(); }
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
            const idx = Math.min(
              Math.floor(self.progress * CONFIG.TOTAL_FRAMES),
              CONFIG.TOTAL_FRAMES - 1
            );
            drawFrame(idx);
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
      ──────────────────────────────────────────────────────────────── */
      const menuBody = document.getElementById('menu-body');
      const NAVBAR_H = 72;
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

      document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


      /* ══════════════════════════════════════════════════════════
         SCROLL-BASED CATEGORY NAVIGATION
         ══════════════════════════════════════════════════════════ */

      /** Centers the active cat-btn inside the scrollable rail. */
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

      /** Set active category button by ID */
      function setActiveCategory(targetId) {
        catBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.target === targetId);
        });
        syncCatNavRail();
      }

      /** Scroll to a category group smoothly */
      function scrollToCategory(targetId) {
        const group = document.getElementById(targetId);
        if (!group) return;

        const navH = nav ? nav.getBoundingClientRect().height : 72;
        const catH = catNav ? catNav.offsetHeight : 50;
        const offset = navH + catH + 24;
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
      ──────────────────────────────────────────────────────────────── */
      let isUserScrolling = true; // Flag to prevent observer fighting with click-scroll

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
        rootMargin: '-20% 0px -60% 0px', // Bias toward the top portion of the viewport
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
      const badgesEl = document.getElementById('modal-badges');

      function openModal(item) {
        const name = item.getAttribute('data-item-name');
        const desc = item.getAttribute('data-item-desc');
        const price = item.getAttribute('data-item-price');
        const img = item.getAttribute('data-item-image');
        const badges = item.getAttribute('data-item-badges');

        if (name) titleEl.innerHTML = name;
        if (price) priceEl.innerHTML = price;
        
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

        if (badges) {
          badgesEl.innerHTML = badges;
          badgesEl.style.display = 'flex';
        } else {
          badgesEl.style.display = 'none';
        }

        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }

      function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      }

      document.querySelectorAll('.menu-item').forEach(item => {
        if (item.hasAttribute('data-item-name')) {
          item.addEventListener('click', () => openModal(item));
        }
      });

      closeBtn.addEventListener('click', closeModal);
      backdrop.addEventListener('click', closeModal);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
          closeModal();
        }
      });
    })();

