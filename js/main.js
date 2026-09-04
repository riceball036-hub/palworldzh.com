/* 幻兽帕鲁资料库 —— 全站交互与可用性增强 */
(function () {
  'use strict';

  // ---------- 载入可用性增强样式（避免每个静态页逐一改 head） ----------
  (function loadUxStyles() {
    if (document.querySelector('link[data-ux-styles]')) return;
    var script = document.currentScript;
    if (!script) {
      var scripts = document.querySelectorAll('script[src*="js/main.js"]');
      script = scripts.length ? scripts[scripts.length - 1] : null;
    }
    var href = script && script.getAttribute('src')
      ? script.getAttribute('src').replace(/js\/main\.js(?:\?.*)?$/, 'css/ux.css?v=20260905a')
      : 'css/ux.css?v=20260905a';
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-ux-styles', '1');
    document.head.appendChild(link);
  })();

  // ---------- 当前导航状态 ----------
  function fileName(url) {
    try {
      var p = new URL(url, window.location.href).pathname;
      return decodeURIComponent(p.split('/').pop() || 'index.html');
    } catch (e) {
      return '';
    }
  }
  var currentFile = fileName(window.location.href);
  var toolLinks = Array.prototype.slice.call(document.querySelectorAll('.tool-nav a'));
  var matchedTool = false;
  toolLinks.forEach(function (a) {
    var matched = fileName(a.href) === currentFile;
    a.classList.toggle('active', matched);
    if (matched) matchedTool = true;
  });
  var mainLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a'));
  var matchedMain = false;
  mainLinks.forEach(function (a) {
    var matched = fileName(a.href) === currentFile;
    if (matched) {
      mainLinks.forEach(function (x) { x.classList.remove('active'); });
      a.classList.add('active');
      matchedMain = true;
    }
  });
  if (matchedTool && !matchedMain) {
    mainLinks.forEach(function (a) { a.classList.remove('active'); });
  }

  // ---------- 移动端导航：可关闭、可键盘操作 ----------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    if (!nav.id) nav.id = 'mainNav';
    toggle.setAttribute('aria-controls', nav.id);

    function closeNav() {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }
    function openNav() {
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    }

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) closeNav(); else openNav();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) closeNav();
    });
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      var header = document.querySelector('.site-header');
      if (header && !header.contains(e.target)) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        toggle.focus();
      }
    });
  }

  // ---------- URL ?q= 直达页内筛选 ----------
  function applyQueryParam() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    var q = (params.get('q') || '').trim();
    if (!q) return;
    var ids = ['palSearch', 'itemSearch', 'skillSearch', 'passiveSearch'];
    ids.forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.value = q;
      setTimeout(function () {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus({ preventScroll: true });
      }, 0);
    });
  }
  applyQueryParam();

  // ---------- 帕鲁图鉴筛选（旧版 palGrid 页面兼容） ----------
  var palGrid = document.getElementById('palGrid');
  if (palGrid) {
    var searchInput = document.getElementById('palSearch');
    var elemSelect = document.getElementById('elemFilter');
    var btnBar = document.getElementById('elemBtns');
    var emptyMsg = document.getElementById('palEmpty');
    var cards = Array.prototype.slice.call(palGrid.querySelectorAll('.pal-card'));
    var activeElem = '';

    function applyFilter() {
      var kw = (searchInput ? searchInput.value.trim() : '').toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var name = (card.getAttribute('data-name') || '').toLowerCase();
        var no = card.getAttribute('data-no') || '';
        var elems = card.getAttribute('data-elems') || '';
        var okKw = !kw || name.indexOf(kw) !== -1 || no.indexOf(kw) !== -1;
        var okElem = !activeElem || elems.indexOf(activeElem) !== -1;
        var show = okKw && okElem;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (emptyMsg) emptyMsg.style.display = visible === 0 ? '' : 'none';
    }

    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (elemSelect) {
      elemSelect.addEventListener('change', function () {
        activeElem = elemSelect.value;
        if (btnBar) {
          var btns = btnBar.querySelectorAll('.filter-btn');
          for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('active', btns[i].getAttribute('data-elem') === activeElem);
          }
        }
        applyFilter();
      });
    }
    if (btnBar) {
      btnBar.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.filter-btn') : null;
        if (!btn) return;
        var v = btn.getAttribute('data-elem') || '';
        activeElem = activeElem === v ? '' : v;
        var btns = btnBar.querySelectorAll('.filter-btn');
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.toggle('active', btns[i].getAttribute('data-elem') === activeElem);
        }
        if (elemSelect) elemSelect.value = activeElem;
        applyFilter();
      });
    }
  }

  // ---------- 物品图鉴筛选 ----------
  var itemGrid = document.getElementById('itemGrid');
  if (itemGrid) {
    var itemSearch = document.getElementById('itemSearch');
    var itemBtns = document.getElementById('itemBtns');
    var itemEmpty = document.getElementById('itemEmpty');
    var activeCat = '';

    function applyItemFilter() {
      var kw = (itemSearch ? itemSearch.value.trim() : '').toLowerCase();
      var total = 0;
      var cats = itemGrid.querySelectorAll('.item-cat');
      for (var i = 0; i < cats.length; i++) {
        var cat = cats[i].getAttribute('data-cat');
        var showCat = !activeCat || cat === activeCat;
        var rows = cats[i].querySelectorAll('tr[data-name]');
        var showRows = 0;
        for (var j = 0; j < rows.length; j++) {
          var name = (rows[j].getAttribute('data-name') || '').toLowerCase();
          var ok = !kw || name.indexOf(kw) !== -1;
          rows[j].style.display = ok ? '' : 'none';
          if (ok) showRows++;
        }
        var show = showCat && showRows > 0;
        cats[i].style.display = show ? '' : 'none';
        if (show) total += showRows; // 只统计真正可见的分类，修复空状态误判
      }
      if (itemEmpty) itemEmpty.style.display = total === 0 ? '' : 'none';
      updateFilterFeedback();
    }

    if (itemSearch) itemSearch.addEventListener('input', applyItemFilter);
    if (itemBtns) {
      itemBtns.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.filter-btn') : null;
        if (!btn) return;
        var v = btn.getAttribute('data-cat') || '';
        activeCat = activeCat === v ? '' : v;
        var btns = itemBtns.querySelectorAll('.filter-btn');
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.toggle('active', btns[i].getAttribute('data-cat') === activeCat);
        }
        applyItemFilter();
      });
    }
  }

  // ---------- 图鉴/物品页：结果数量 + 一键清除筛选 ----------
  var filterFeedback = null;
  function visibleCount() {
    var palSections = document.getElementById('palSections');
    if (palSections) {
      return Array.prototype.filter.call(palSections.querySelectorAll('.pal-card'), function (c) {
        return c.style.display !== 'none';
      }).length;
    }
    if (itemGrid) {
      var n = 0;
      Array.prototype.forEach.call(itemGrid.querySelectorAll('.item-cat'), function (cat) {
        if (cat.style.display === 'none') return;
        Array.prototype.forEach.call(cat.querySelectorAll('tr[data-name]'), function (row) {
          if (row.style.display !== 'none') n++;
        });
      });
      return n;
    }
    return null;
  }
  function updateFilterFeedback() {
    if (!filterFeedback) return;
    var count = visibleCount();
    var label = filterFeedback.querySelector('.filter-result-count');
    if (label && count !== null) label.textContent = '当前显示 ' + count + ' 条结果';
  }
  function setupFilterFeedback() {
    var palSections = document.getElementById('palSections');
    var filters = (palSections || itemGrid) ? document.querySelector('.filters') : null;
    if (!filters || filters.parentNode.querySelector('.filter-feedback')) return;
    filterFeedback = document.createElement('div');
    filterFeedback.className = 'filter-feedback';
    filterFeedback.innerHTML = '<span class="filter-result-count" aria-live="polite"></span><button type="button" class="filter-reset">清除筛选</button>';
    filters.insertAdjacentElement('afterend', filterFeedback);

    filterFeedback.querySelector('.filter-reset').addEventListener('click', function () {
      var ids = ['palSearch', 'itemSearch'];
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      ['elemFilter', 'rarityFilter', 'workFilter'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.value = '';
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      var workChips = document.querySelectorAll('.work-chip.on');
      for (var i = 0; i < workChips.length; i++) workChips[i].classList.remove('on');
      if (itemBtns) {
        activeCat = '';
        Array.prototype.forEach.call(itemBtns.querySelectorAll('.filter-btn'), function (b) {
          b.classList.toggle('active', (b.getAttribute('data-cat') || '') === '');
        });
        applyItemFilter();
      }
      try {
        var u = new URL(window.location.href);
        u.searchParams.delete('q');
        window.history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash);
      } catch (e) {}
      setTimeout(updateFilterFeedback, 0);
    });

    ['palSearch', 'itemSearch', 'elemFilter', 'rarityFilter', 'workFilter', 'sortBy'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', function () {
        setTimeout(updateFilterFeedback, 0);
      });
    });
    var wp = document.getElementById('workPanel');
    if (wp) wp.addEventListener('click', function () { setTimeout(updateFilterFeedback, 0); });
    updateFilterFeedback();
  }
  setupFilterFeedback();

  // ---------- 长表格键盘可滚动 ----------
  Array.prototype.forEach.call(document.querySelectorAll('.table-scroll'), function (box) {
    if (!box.hasAttribute('tabindex')) box.tabIndex = 0;
    if (!box.hasAttribute('role')) box.setAttribute('role', 'region');
    if (!box.hasAttribute('aria-label')) box.setAttribute('aria-label', '可横向滚动的数据表格');
  });

  // ---------- 统一可见属性名称（只改标签，不改原始数据） ----------
  var elemNames = { '普通': '无', '叶子': '草', '地球': '地', '黑暗': '暗' };
  Array.prototype.forEach.call(document.querySelectorAll('.elem-badge'), function (badge) {
    var text = badge.textContent.trim();
    if (elemNames[text]) badge.textContent = elemNames[text];
  });

  // ---------- 长页面回到顶部 ----------
  var backTop = document.createElement('button');
  backTop.type = 'button';
  backTop.className = 'back-top';
  backTop.setAttribute('aria-label', '回到顶部');
  backTop.setAttribute('title', '回到顶部');
  backTop.textContent = '↑';
  document.body.appendChild(backTop);
  function syncBackTop() {
    backTop.classList.toggle('show', window.scrollY > 700);
  }
  window.addEventListener('scroll', syncBackTop, { passive: true });
  backTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  syncBackTop();
})();
