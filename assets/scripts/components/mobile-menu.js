/*!
 * mobile-menu.js — Shared mobile navigation overlay controller
 * Works on index.html, menu.html, and reservation.html
 *
 * Trigger open:  add  data-open-mobile-menu  to any button
 * Trigger close: add  data-close-mobile-menu to any button (close btn auto-detected)
 *
 * Custom events dispatched on document:
 *   mmenu:open     — overlay just opened
 *   mmenu:close    — overlay just closed
 *   mmenu:scrollTo — anchor link clicked; detail.target = element|0
 */
(function () {
  'use strict';

  const menu = document.getElementById('mobile-menu');
  if (!menu) return;

  // ── Gather all open / close triggers ──────────────────────────
  const openTriggers  = document.querySelectorAll('[data-open-mobile-menu]');
  const closeTriggers = document.querySelectorAll('[data-close-mobile-menu], #mobile-close, .mmenu-close');

  // ── Active page link detection ─────────────────────────────────
  const filename = location.pathname.split('/').pop() || 'index.html';
  menu.querySelectorAll('.mmenu-item').forEach(function (link) {
    var href     = link.getAttribute('href') || '';
    var linkFile = href.replace(/^\.\//, '').split('#')[0] || 'index.html';
    var isHome   = filename === 'index.html' || filename === '';
    if (
      linkFile === filename ||
      (isHome && (href === '#' || linkFile === 'index.html'))
    ) {
      link.classList.add('is-active');
    }
  });

  // ── Scroll lock helpers ────────────────────────────────────────
  var _scrollY = 0;

  function lockScroll() {
    _scrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _scrollY);
  }

  // ── Open ───────────────────────────────────────────────────────
  function openMenu() {
    lockScroll();
    menu.classList.add('open');
    document.dispatchEvent(new CustomEvent('mmenu:open'));
  }

  // ── Close ──────────────────────────────────────────────────────
  function closeMenu() {
    menu.classList.remove('open');
    unlockScroll();
    document.dispatchEvent(new CustomEvent('mmenu:close'));
  }

  // ── Bind open triggers ─────────────────────────────────────────
  openTriggers.forEach(function (t) { t.addEventListener('click', openMenu); });

  // ── Bind close triggers ────────────────────────────────────────
  closeTriggers.forEach(function (t) { t.addEventListener('click', closeMenu); });

  // ── Nav item clicks ────────────────────────────────────────────
  menu.querySelectorAll('.mmenu-item').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href') || '';
      closeMenu();

      // Anchor links: prevent browser jump, hand off to scrollTo event
      if (href.charAt(0) === '#') {
        e.preventDefault();
        var scrollTarget = (href === '#' || href === '')
          ? 0
          : document.querySelector(href);
        document.dispatchEvent(new CustomEvent('mmenu:scrollTo', {
          detail: { target: scrollTarget }
        }));
      }
    });
  });

  // ── CTA pill (also a link, close on click) ─────────────────────
  var ctaPill = menu.querySelector('.mmenu-cta-pill');
  if (ctaPill) ctaPill.addEventListener('click', closeMenu);

  // ── Escape key ────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
}());
