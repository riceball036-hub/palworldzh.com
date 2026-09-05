/* PalworldZH 全站基础交互：导航、版本提示、筛选与通用体验增强。 */
(function () {
  'use strict';

  var scriptEl = document.currentScript;
  var siteRoot = '';
  if (scriptEl && scriptEl.src) siteRoot = scriptEl.src.replace(/js\/main\.js(?:\?.*)?$/, '');
  if (!siteRoot) siteRoot = /\/(?:pals|news)\//.test(location.pathname) ? '../' : '';

  if (!document.querySelector('link[data-palworldzh-experience]')) {
    var extraCss = document.createElement('link');
    extraCss.rel = 'stylesheet';
    extraCss.href = siteRoot + 'css/experience.css?v=20260905a';
    extraCss.setAttribute('data-palworldzh-experience', '1');
    document.head.appendChild(extraCss);
  }

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

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  function closeNav() {
    if (!toggle || !nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
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

  // 修正旧生成页把“299 个站内条目”误写成“299 种官方帕鲁”的口径。
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

  var incomingQuery = '';
  try { incomingQuery = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
  var incomingPalSearch = document.getElementById('palSearch');
  if (incomingPalSearch && incomingQuery) {
    incomingPalSearch.value = incomingQuery;
    setTimeout(function () {
      try { incomingPalSearch.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    }, 0);
  }

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

  if (location.hash) {
    try {
      var id = decodeURIComponent(location.hash.slice(1));
      var target = document.getElementById(id);
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);
    } catch (e) {}
  }
})();
