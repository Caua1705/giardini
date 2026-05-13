(function () {
  'use strict';

  function initMobileBottomNav() {
    var nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;

    var path = window.location.pathname;
    var hash = window.location.hash;

    // Determine which item to activate
    var activeId = 'mbn-inicio';

    if (path.indexOf('menu.html') !== -1) {
      activeId = 'mbn-cardapio';
    } else if (path.indexOf('reservation.html') !== -1) {
      activeId = 'mbn-reservar';
    } else if (hash === '#location' || hash === '#visit') {
      activeId = 'mbn-visite';
    }

    // Remove all active states first
    nav.querySelectorAll('.mbn-item').forEach(function (el) {
      el.classList.remove('is-active');
    });

    // Set the correct one active
    var activeItem = document.getElementById(activeId);
    if (activeItem) {
      activeItem.classList.add('is-active');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileBottomNav);
  } else {
    initMobileBottomNav();
  }
})();
