/* PalworldZH 全站基础交互：导航、版本提示、筛选与通用体验增强。 */
(function () {
  'use strict';

  var scriptEl = document.currentScript;
  var siteRoot = '';
  if (scriptEl && scriptEl.src) siteRoot = scriptEl.src.replace(/js\/main\.js(?:\?.*)?$/, '');
  if (!siteRoot) siteRoot = /\/(?:pals|news)\//.test(location.pathname) ? '../' : '';

  function loadStylesheet(attr, href) {
    if (document.querySelector('link[' + attr + ']')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(attr, '1');
    document.head.appendChild(link);
  }

  loadStylesheet('data-palworldzh-experience', siteRoot + 'css/experience.css?v=20260905a');
  loadStylesheet('data-ux-styles', siteRoot + 'css/ux.css?v=20260905b');

  var main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'main-content';
    if (!document.querySelector('.skip-link')) {
      var skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#main-content';
      skip.textContent = '跳到正文';
      document.body.insertBefore(skip, document.body.firstChild);
    }
  }

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
  var mainLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a'));
  var matchedTool = false;
  var matchedMain = false;

  toolLinks.forEach(function (a) {
    var matched = fileName(a.href) === currentFile;
    a.classList.toggle('active', matched);
    if (matched) matchedTool = true;
  });

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

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  function closeNav() {
    if (!toggle || !nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }
  function openNav() {
    if (!toggle || !nav) return;
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  }
  if (toggle && nav) {
    if (!nav.id) nav.id = 'mainNav';
    toggle.setAttribute('aria-controls', nav.id);
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
        try { toggle.focus(); } catch (err) {}
      }
    });
  }

  var toolBar = document.querySelector('.tool-bar');
  if (toolBar && !document.querySelector('.site-version-bar')) {
    var versionBar = document.createElement('div');
    versionBar.className = 'site-version-bar';
    versionBar.innerHTML = '<div class="container site-version-inner">' +
      '<span class="version-pill">数据基准 v1.0.3</span>' +
      '<span class="version-copy">1.0 后配种、伙伴技能、科技与平衡曾大幅调整；未单独标注复核日期的条目请以游戏内当前数据为准。</span>' +
      '<a class="version-link" href="' + siteRoot + 'about.html#version-policy">版本说明</a>' +
      '</div>';
    toolBar.insertAdjacentElement('afterend', versionBar);
  }

  var footerVer = document.querySelector('.footer-ver');
  if (footerVer) {
    footerVer.innerHTML = '数据基准：Palworld v1.0.3 · 页面校订：2026-09-05 · ' +
      '<a href="' + siteRoot + 'about.html">关于本站</a> · ' +
      '<a href="' + siteRoot + 'sitemap.xml">站点地图</a>';
  }

  if (/\/paldex\.html$/.test(location.pathname)) {
    document.title = '帕鲁图鉴 - 正式版287种帕鲁与形态/特殊条目 | PalworldZH';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', '幻兽帕鲁 1.0 中文图鉴：官方正式版共287种帕鲁；本站另将部分形态、联动与特殊实体单独建档，提供名称搜索、属性/工作筛选与详情查询。');
    var heading = document.querySelector('h1.page-title');
    var intro = heading ? heading.nextElementSibling : null;
    if (intro && intro.tagName === 'P') {
      intro.innerHTML = '本站当前共整理 <strong>299 个资料条目</strong>：其中 Palworld 1.0 官方公布的帕鲁总数为 <strong>287 种</strong>，另含部分形态、联动与特殊实体。可按属性、名称、稀有度和工作适性筛选，点击卡片查看详情。';
    }
    var jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        var ld = JSON.parse(jsonLd.textContent);
        if (ld && ld['@type'] === 'ItemList') {
          ld.name = '幻兽帕鲁资料条目列表（287种正式版帕鲁 + 形态/特殊条目）';
          jsonLd.textContent = JSON.stringify(ld);
        }
      } catch (e) {}
    }
  }

  function applyQueryParam() {
    var q = '';
    try { q = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
    q = q.trim();
    if (!q) return;
    ['palSearch', 'itemSearch', 'dropSearch', 'skillSearch', 'psSearch'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.value = q;
      setTimeout(function () {
        try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
      }, 0);
    });
  }
  applyQueryParam();

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
      updateFilterFeedback();
    }
    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (elemSelect) {
      elemSelect.addEventListener('change', function () {
        activeElem = elemSelect.value;
        if (btnBar) {
          var btns = btnBar.querySelectorAll('.filter-btn');
          for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-elem') === activeElem);
        }
        applyFilter();
      });
    }
    if (btnBar) {
      btnBar.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.filter-btn') : null;
        if (!b) return;
        var v = b.getAttribute('data-elem') || '';
        activeElem = activeElem === v ? '' : v;
        var btns = btnBar.querySelectorAll('.filter-btn');
        for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-elem') === activeElem);
        if (elemSelect) elemSelect.value = activeElem;
        applyFilter();
      });
    }
  }

  var itemGrid = document.getElementById('itemGrid');
  var itemBtns = document.getElementById('itemBtns');
  var activeCat = '';
  if (itemGrid) {
    var itemSearch = document.getElementById('itemSearch');
    var itemEmpty = document.getElementById('itemEmpty');
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
          var rowName = (rows[j].getAttribute('data-name') || '').toLowerCase();
          var ok = !kw || rowName.indexOf(kw) !== -1;
          rows[j].style.display = ok ? '' : 'none';
          if (ok) showRows++;
        }
        var show = showCat && showRows > 0;
        cats[i].style.display = show ? '' : 'none';
        if (show) total += showRows;
      }
      if (itemEmpty) itemEmpty.style.display = total === 0 ? '' : 'none';
      updateFilterFeedback();
    }
    if (itemSearch) itemSearch.addEventListener('input', applyItemFilter);
    if (itemBtns) {
      itemBtns.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.filter-btn') : null;
        if (!b) return;
        var v = b.getAttribute('data-cat') || '';
        activeCat = activeCat === v ? '' : v;
        var btns = itemBtns.querySelectorAll('.filter-btn');
        for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-cat') === activeCat);
        applyItemFilter();
      });
    }
  }

  var dropGrid = document.getElementById('dropGrid');
  var skillTable = document.getElementById('skillTable');
  var psGrid = document.getElementById('psGrid');
  var filterFeedback = null;

  function visibleCount() {
    var palSections = document.getElementById('palSections');
    if (palSections) {
      return Array.prototype.filter.call(palSections.querySelectorAll('.pal-card'), function (c) {
        return c.style.display !== 'none';
      }).length;
    }
    if (palGrid) {
      return Array.prototype.filter.call(palGrid.querySelectorAll('.pal-card'), function (c) {
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
    if (dropGrid) {
      return Array.prototype.filter.call(dropGrid.querySelectorAll('.item-cat'), function (cat) {
        return cat.style.display !== 'none';
      }).length;
    }
    if (skillTable) {
      return Array.prototype.filter.call(skillTable.querySelectorAll('tbody tr[data-name]'), function (row) {
        return row.style.display !== 'none';
      }).length;
    }
    if (psGrid) {
      return Array.prototype.filter.call(psGrid.querySelectorAll('.catalog-card[data-name]'), function (card) {
        return card.style.display !== 'none';
      }).length;
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
    var hasResults = palSections || palGrid || itemGrid || dropGrid || skillTable || psGrid;
    var filters = hasResults ? document.querySelector('.filters') : null;
    if (!filters || filters.parentNode.querySelector('.filter-feedback')) return;

    filterFeedback = document.createElement('div');
    filterFeedback.className = 'filter-feedback';
    filterFeedback.innerHTML = '<span class="filter-result-count" aria-live="polite"></span><button type="button" class="filter-reset">清除筛选</button>';
    filters.insertAdjacentElement('afterend', filterFeedback);

    filterFeedback.querySelector('.filter-reset').addEventListener('click', function () {
      ['palSearch', 'itemSearch', 'dropSearch', 'skillSearch', 'psSearch'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.value = '';
          try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
        }
      });
      ['elemFilter', 'rarityFilter', 'workFilter', 'psRank'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.value = '';
          try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        }
      });
      Array.prototype.forEach.call(document.querySelectorAll('.work-chip.on'), function (chip) {
        chip.classList.remove('on');
      });
      if (itemBtns) {
        activeCat = '';
        Array.prototype.forEach.call(itemBtns.querySelectorAll('.filter-btn'), function (b) {
          b.classList.toggle('active', (b.getAttribute('data-cat') || '') === '');
        });
        if (typeof applyItemFilter === 'function') applyItemFilter();
      }
      try {
        var u = new URL(window.location.href);
        u.searchParams.delete('q');
        window.history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash);
      } catch (e) {}
      setTimeout(updateFilterFeedback, 0);
    });

    ['palSearch', 'itemSearch', 'dropSearch', 'skillSearch', 'psSearch', 'elemFilter', 'rarityFilter', 'workFilter', 'sortBy', 'psRank'].forEach(function (id) {
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

  Array.prototype.forEach.call(document.querySelectorAll('.table-scroll'), function (box) {
    if (!box.hasAttribute('tabindex')) box.tabIndex = 0;
    if (!box.hasAttribute('role')) box.setAttribute('role', 'region');
    if (!box.hasAttribute('aria-label')) box.setAttribute('aria-label', '可横向滚动的数据表格');
  });

  var elemNames = { '普通': '无', '叶子': '草', '地球': '地', '黑暗': '暗', '电': '雷' };
  Array.prototype.forEach.call(document.querySelectorAll('.elem-badge'), function (badge) {
    var text = badge.textContent.trim();
    if (elemNames[text]) badge.textContent = elemNames[text];
  });

  if (!document.querySelector('.back-top')) {
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
  }

  if (location.hash) {
    try {
      var id = decodeURIComponent(location.hash.slice(1));
      var target = document.getElementById(id);
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);
    } catch (e) {}
  }
})();
