/* ÓRBITA — protótipo estático: ícones, tema, abas, Kanban e microinterações. */
(function () {
  'use strict';

  var ICONS = {
    orbit: '<circle cx="12" cy="12" r="3.1"/><path d="M20.4 9.3c1.1 3.7-2.4 7.6-7.8 8.7-4 .8-7.5-.5-8.5-2.9-.9-2.2 1.4-4.9 5.2-6.4"/><path d="m17.6 6.6 2.9 2.7-2.8 2.5"/>',
    home: '<path d="M3.5 10.6 12 3.5l8.5 7.1"/><path d="M5.5 9.4V20a.9.9 0 0 0 .9.9h11.2a.9.9 0 0 0 .9-.9V9.4"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6"/>',
    folder: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l2 2.2h8.8A1.5 1.5 0 0 1 21 9.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    'check-square': '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8.2 12.3 2.6 2.6 5-5.4"/>',
    inbox: '<path d="M3.5 12.5h4l1.6 2.4h5.8l1.6-2.4h4"/><path d="M5.6 5.5h12.8l2.1 7v5.6a1.4 1.4 0 0 1-1.4 1.4H4.9a1.4 1.4 0 0 1-1.4-1.4V12.5z"/>',
    book: '<path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20"/><path d="M6.2 2H20v20H6.2A2.2 2.2 0 0 1 4 19.8V4.2A2.2 2.2 0 0 1 6.2 2z"/>',
    paperclip: '<path d="M20.5 12.3 12.4 20.4a5.2 5.2 0 0 1-7.4-7.4l8.2-8.2a3.5 3.5 0 0 1 4.9 4.9l-8.2 8.2a1.8 1.8 0 0 1-2.6-2.6l7.4-7.4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.2A1.7 1.7 0 0 1 10.2 3.5h3.6a1.7 1.7 0 0 1 1.7 1.7V7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-3.6-3.6"/>',
    bell: '<path d="M18 8.6a6 6 0 1 0-12 0c0 6.4-2.6 6.4-2.6 8.1h17.2c0-1.7-2.6-1.7-2.6-8.1z"/><path d="M10.4 20.3a1.9 1.9 0 0 0 3.2 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    'chevron-right': '<path d="m9.5 6 6 6-6 6"/>',
    'chevron-left': '<path d="m14.5 6-6 6 6 6"/>',
    'chevron-down': '<path d="m6 9.5 6 6 6-6"/>',
    more: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    calendar: '<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    flag: '<path d="M5.5 21V4"/><path d="M5.5 4.5h10.6l-1.5 4 1.5 4H5.5"/>',
    alert: '<path d="M12 3.5 2.8 20h18.4z"/><path d="M12 9.2v4.9M12 17.2h.01"/>',
    check: '<path d="m5 13.2 4.3 4.3L19 7"/>',
    x: '<path d="m6.2 6.2 11.6 11.6M17.8 6.2 6.2 17.8"/>',
    upload: '<path d="M12 16.5V3.8"/><path d="m7.2 8.6 4.8-4.8 4.8 4.8"/><path d="M4 16.5v2.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.2"/>',
    camera: '<path d="M4 8.5h3.2L8.8 6h6.4l1.6 2.5H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.8" r="3.4"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.6" cy="9.6" r="1.5"/><path d="m4.5 18 4.8-4.8 3.8 3.8 2.8-2.8 4.6 4.6"/>',
    file: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5"/>',
    link: '<path d="M10.2 13.4a4.2 4.2 0 0 0 6 .4l2-2a4.2 4.2 0 0 0-5.9-5.9l-1.2 1.2"/><path d="M13.8 10.6a4.2 4.2 0 0 0-6-.4l-2 2a4.2 4.2 0 0 0 5.9 5.9l1.2-1.2"/>',
    users: '<circle cx="9.2" cy="8.2" r="3.4"/><path d="M2.8 20a6.4 6.4 0 0 1 12.8 0"/><path d="M16.2 5.2a3.4 3.4 0 0 1 0 6.4"/><path d="M18 14.6a5.8 5.8 0 0 1 3.2 5.4"/>',
    shield: '<path d="M12 3 4.3 5.9v5.6c0 4.3 3.2 7.7 7.7 8.9 4.5-1.2 7.7-4.6 7.7-8.9V5.9z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5H6.5a2 2 0 0 0-2 2V16"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M4 4l16 16"/><path d="M9.9 5.9A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6"/><path d="M6.4 7.8A17.6 17.6 0 0 0 2.5 12S6 18.5 12 18.5a9.8 9.8 0 0 0 3.4-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    external: '<path d="M14.5 4h5.5v5.5"/><path d="M20 4 11.5 12.5"/><path d="M18.5 14.5v4a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5h4"/>',
    'arrow-right': '<path d="M4 12h15.5"/><path d="m14 6.5 5.5 5.5-5.5 5.5"/>',
    sparkles: '<path d="m12 3 1.7 4.9L18.5 9.5l-4.8 1.6L12 16l-1.7-4.9L5.5 9.5l4.8-1.6z"/><path d="m18.5 15.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',
    moon: '<path d="M20.5 14.8A8.6 8.6 0 0 1 9.2 3.5a8.6 8.6 0 1 0 11.3 11.3z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="m6.5 7 .9 12.2a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3L17.5 7"/><path d="M9 7V4.3h6V7"/>',
    undo: '<path d="M3.5 10.5h10.8a5.2 5.2 0 0 1 0 10.4H9.5"/><path d="m7.5 6.5-4 4 4 4"/>',
    filter: '<path d="M3.5 5.5h17l-6.6 7.6v5.4l-3.8 1.9v-7.3z"/>',
    columns: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.2 4.5v15M14.8 4.5v15"/>',
    list: '<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12"/><path d="M3.8 6.5h.01M3.8 12h.01M3.8 17.5h.01"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    message: '<path d="M20.5 14.8a2.7 2.7 0 0 1-2.7 2.7H8.4L3.5 21V6.7A2.7 2.7 0 0 1 6.2 4h11.6a2.7 2.7 0 0 1 2.7 2.7z"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5v4.2h4.2"/><path d="M12 7.8V12l3 1.8"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17z"/>',
    play: '<path d="M7.5 5.5 18 12 7.5 18.5z"/>',
    hand: '<path d="M9 11.5V6.8a1.5 1.5 0 0 1 3 0v4.4"/><path d="M12 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 11V7.5a1.5 1.5 0 0 1 3 0v6.9a6 6 0 0 1-6 6h-1a5.5 5.5 0 0 1-4.4-2.2l-3-4a1.6 1.6 0 0 1 2.5-2l2.4 2.4"/>',
    sun2: '<circle cx="12" cy="12" r="4"/>',
    folder2: '<path d="M3 7.5h6l2 2.2h10v9.8H3z"/>'
  };

  function injectSprite() {
    if (document.getElementById('orbita-sprite')) return;
    var parts = ['<svg id="orbita-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'];
    Object.keys(ICONS).forEach(function (name) {
      parts.push('<symbol id="i-' + name + '" viewBox="0 0 24 24">' + ICONS[name] + '</symbol>');
    });
    parts.push('</svg>');
    document.body.insertAdjacentHTML('afterbegin', parts.join(''));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
      el.textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
    });
    document.querySelectorAll('[data-theme-action]').forEach(function (el) {
      el.setAttribute('aria-label', theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
      var use = el.querySelector('use');
      if (use) use.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
    });
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('orbita-theme'); } catch (e) {}
    var preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || preferred);
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-theme-action]');
      if (!btn) return;
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('orbita-theme', next); } catch (e) {}
      applyTheme(next);
    });
  }

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      group.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[role="tab"]');
        if (!btn || !group.contains(btn)) return;
        var key = btn.getAttribute('data-tab');
        group.querySelectorAll('[role="tab"]').forEach(function (t) {
          t.setAttribute('aria-selected', String(t === btn));
          t.setAttribute('tabindex', t === btn ? '0' : '-1');
        });
        var scope = group.closest('[data-tabs-scope]') || document;
        scope.querySelectorAll('[data-panel]').forEach(function (p) {
          p.hidden = p.getAttribute('data-panel') !== key;
        });
      });
      var hash = (location.hash || '').replace('#', '');
      if (hash) {
        var initial = group.querySelector('[data-tab="' + hash + '"]');
        if (initial) initial.click();
      }
    });
  }

  function initViewSwitch() {
    document.querySelectorAll('[data-view-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view-btn');
        document.querySelectorAll('[data-view-btn]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        document.querySelectorAll('[data-view]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-view') !== view;
        });
        var label = document.querySelector('[data-view-label]');
        if (label) label.textContent = btn.getAttribute('data-view-label') || '';
      });
    });
  }

  function initModals() {
    var lastFocus = null;
    function focusables(modal) {
      return Array.prototype.slice.call(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
    }
    function close(modal) {
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.addEventListener('click', function (ev) {
      var open = ev.target.closest('[data-open]');
      if (open) {
        var modal = document.getElementById(open.getAttribute('data-open'));
        if (modal) {
          lastFocus = open;
          modal.hidden = false;
          var first = modal.querySelector('[data-autofocus], input, button, select, textarea, a[href]');
          if (first) first.focus();
        }
        return;
      }
      var closer = ev.target.closest('[data-close]');
      if (closer) {
        var m = closer.closest('[data-modal]');
        if (m) close(m);
        return;
      }
      if (ev.target.matches('[data-modal]')) close(ev.target);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      document.querySelectorAll('[data-modal]:not([hidden])').forEach(close);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Tab') return;
      var modal = document.querySelector('[data-modal]:not([hidden])');
      if (!modal) return;
      var list = focusables(modal);
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
  }

  function initChoiceGroups() {
    document.querySelectorAll('[data-chip-group]').forEach(function (group) {
      var chips = group.querySelectorAll('button.chip');
      chips.forEach(function (chip) {
        var base = chip.className.replace(/\bchip-brand\b/, '').replace(/\s+/g, ' ').trim();
        chip.dataset.baseClass = base;
        var initial = chip.getAttribute('aria-pressed') === 'true' || /\bchip-brand\b/.test(chip.className);
        chip.setAttribute('aria-pressed', String(initial));
        if (initial && !/chip-(danger|success|warning)/.test(base)) chip.classList.add('chip-brand');
      });
      group.addEventListener('click', function (ev) {
        var btn = ev.target.closest('button.chip');
        if (!btn || !group.contains(btn)) return;
        chips.forEach(function (chip) {
          var on = chip === btn;
          chip.className = chip.dataset.baseClass;
          chip.setAttribute('aria-pressed', String(on));
          if (on && !/chip-(brand|danger|success|warning)/.test(chip.dataset.baseClass)) {
            chip.classList.add('chip-brand');
          }
        });
      });
    });
  }

  function initTables() {
    document.querySelectorAll('table.table').forEach(function (table) {
      table.setAttribute('role', 'table');
      table.querySelectorAll('thead, tbody').forEach(function (el) { el.setAttribute('role', 'rowgroup'); });
      table.querySelectorAll('tr').forEach(function (el) { el.setAttribute('role', 'row'); });
      table.querySelectorAll('th').forEach(function (el) { el.setAttribute('role', 'columnheader'); });
      table.querySelectorAll('td').forEach(function (el) { el.setAttribute('role', 'cell'); });
    });
  }

  function initKanban() {
    var dragging = null;
    document.querySelectorAll('.kcard[draggable="true"]').forEach(function (card) {
      card.addEventListener('dragstart', function (e) {
        dragging = card;
        card.style.opacity = '.45';
        try { e.dataTransfer.setData('text/plain', card.id || 'card'); } catch (err) {}
      });
      card.addEventListener('dragend', function () {
        card.style.opacity = '';
        dragging = null;
      });
    });
    document.querySelectorAll('[data-drop]').forEach(function (col) {
      col.addEventListener('dragover', function (e) {
        e.preventDefault();
        col.style.background = 'var(--brand-050)';
        col.style.borderColor = 'var(--brand)';
      });
      col.addEventListener('dragleave', function () {
        col.style.background = '';
        col.style.borderColor = '';
      });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        col.style.background = '';
        col.style.borderColor = '';
        if (!dragging) return;
        var list = col.querySelector('[data-cards]');
        if (!list) return;
        var moved = dragging;
        var fromList = moved.parentElement;
        var fromNext = moved.nextElementSibling;
        list.appendChild(moved);
        updateCounts();
        var name = col.getAttribute('data-col-name') || 'coluna';
        toast('Movido para “' + name + '”.', 'Desfazer', function () {
          if (fromNext && fromNext.parentElement === fromList) fromList.insertBefore(moved, fromNext);
          else fromList.appendChild(moved);
          updateCounts();
          toast('Movimentação desfeita.');
        });
      });
    });
    function updateCounts() {
      document.querySelectorAll('[data-drop]').forEach(function (col) {
        var list = col.querySelector('[data-cards]');
        var badge = col.querySelector('[data-count]');
        if (list && badge) badge.textContent = String(list.querySelectorAll('.kcard').length);
      });
    }
    updateCounts();
  }

  var toastTimer = null;
  function toast(message, actionLabel, action) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = '<svg class="i ok" aria-hidden="true"><use href="#i-check"/></svg><span></span>';
    el.querySelector('span').textContent = message;
    if (actionLabel) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = actionLabel;
      b.addEventListener('click', function () {
        el.hidden = true;
        if (typeof action === 'function') action();
      });
      el.appendChild(b);
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 5000);
  }
  window.orbitaToast = toast;

  function initDemoActions() {
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-toast-msg]');
      if (t) {
        ev.preventDefault();
        toast(t.getAttribute('data-toast-msg'), t.getAttribute('data-toast-action') || 'Desfazer', null);
      }
      var copy = ev.target.closest('[data-copy]');
      if (copy) {
        ev.preventDefault();
        var text = copy.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(function () {});
        }
        toast('Link copiado. Validade de 7 dias.', null, null);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectSprite();
    initTheme();
    initTabs();
    initViewSwitch();
    initModals();
    initChoiceGroups();
    initTables();
    initKanban();
    initDemoActions();
  });
})();
