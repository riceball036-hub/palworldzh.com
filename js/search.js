/* 全站搜索：Ctrl/Cmd+K、导航按钮、首页搜索框。
   旧版依赖的 data/search-index.json 在仓库中不存在；本版改为内置核心入口 +
   同源懒加载图鉴/物品/技能名称，并使用 sessionStorage 缓存。 */
(function () {
  'use strict';

  var CACHE_KEY = 'palworldzh-search-index-v20260905a';
  var idx = [
    { t: '页面', n: '首页', d: '幻兽帕鲁中文资料库首页', u: '/index.html' },
    { t: '帕鲁', n: '帕鲁图鉴', d: '299 只帕鲁，按属性、稀有度、工作适性筛选', u: '/paldex.html' },
    { t: '工具', n: '繁殖计算器', d: '选父母查子代，或按目标反查配种组合', u: '/breed-calc.html' },
    { t: '攻略', n: '配种繁殖', d: '繁殖机制、词条遗传与配种思路', u: '/breeding.html' },
    { t: '工具', n: '游戏地图', d: 'BOSS、传送点、地下城与资源位置', u: '/map.html' },
    { t: '资料', n: '物品图鉴', d: '武器、防具、材料、消耗品等物品速查', u: '/items.html' },
    { t: '资料', n: '技能大全', d: '主动技能威力、冷却与习得帕鲁', u: '/skills.html' },
    { t: '资料', n: '被动技能', d: '被动词条效果与持有帕鲁', u: '/passive-skills.html' },
    { t: '资料', n: '科技树', d: '科技项目与解锁等级', u: '/tech.html' },
    { t: '工具', n: '科技树图', d: '按等级浏览科技解锁关系', u: '/treemap.html' },
    { t: '攻略', n: '工作帕鲁', d: '按工种查适合基地工作的帕鲁', u: '/workers.html' },
    { t: '攻略', n: '坐骑推荐', d: '陆地、水上与飞行坐骑对比', u: '/mounts.html' },
    { t: '攻略', n: '战斗配队', d: '属性克制、队伍搭配与战斗思路', u: '/combat.html' },
    { t: '资料', n: 'Boss 与传说', d: 'Boss 与高价值目标速查', u: '/bosses.html' },
    { t: '资料', n: '狂化帕鲁', d: '狂化帕鲁与相关掉落', u: '/rampaging-pals.html' },
    { t: '工具', n: '掉落物反查', d: '按掉落物查对应帕鲁', u: '/drops.html' },
    { t: '工具', n: '捕获率估算', d: '按目标、球、血量与状态估算捕获成功率', u: '/capture-calc.html' },
    { t: '资料', n: '世界探索', d: '区域与探索资料', u: '/world.html' },
    { t: '资讯', n: '最新资讯', d: '版本与官方动态整理', u: '/news.html' }
  ];

  var loading = false;
  var loaded = false;
  var activeItems = [];
  var lastTrigger = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function unique(items) {
    var seen = {};
    return items.filter(function (x) {
      var key = x.t + '|' + x.n + '|' + x.u;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function loadCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      var cached = JSON.parse(raw);
      if (!Array.isArray(cached) || !cached.length) return false;
      idx = unique(idx.concat(cached));
      loaded = true;
      return true;
    } catch (e) {
      return false;
    }
  }
  loadCache();

  function pageEntriesFromDoc(doc, kind) {
    var out = [];
    if (kind === 'pals') {
      doc.querySelectorAll('.pal-card[data-name]').forEach(function (a) {
        var name = a.getAttribute('data-name') || '';
        var no = a.getAttribute('data-no') || '';
        var elems = a.getAttribute('data-elems') || '';
        var href = a.getAttribute('href') || '';
        if (!name || !href) return;
        var u;
        try { u = new URL(href, window.location.origin + '/paldex.html').pathname; }
        catch (e) { u = '/paldex.html?q=' + encodeURIComponent(name); }
        out.push({ t: '帕鲁', n: name, d: (no ? 'No.' + no + ' · ' : '') + elems, u: u });
      });
      return out;
    }

    var selector = kind === 'skills' ? '#skillTable tr[data-name]' : 'tr[data-name]';
    var seen = {};
    doc.querySelectorAll(selector).forEach(function (row) {
      var name = row.getAttribute('data-name') || '';
      if (!name || seen[name]) return;
      seen[name] = true;
      var cells = row.querySelectorAll('td');
      var desc = '';
      if (kind === 'items' && cells[2]) desc = cells[2].textContent.trim().slice(0, 72);
      if (kind === 'skills') {
        var p = cells[1] ? cells[1].textContent.trim() : '';
        var cd = cells[2] ? cells[2].textContent.trim() : '';
        desc = (p ? '威力 ' + p : '') + (cd ? ' · 冷却 ' + cd : '');
      }
      if (kind === 'passives' && cells[1]) desc = cells[1].textContent.trim().slice(0, 72);
      var page = kind === 'items' ? '/items.html' : (kind === 'skills' ? '/skills.html' : '/passive-skills.html');
      var type = kind === 'items' ? '物品' : (kind === 'skills' ? '技能' : '被动');
      out.push({ t: type, n: name, d: desc, u: page + '?q=' + encodeURIComponent(name) });
    });
    return out;
  }

  function loadDynamicIndex(done) {
    if (loaded) { if (done) done(); return; }
    if (loading) return;
    loading = true;

    var sources = [
      ['/paldex.html', 'pals'],
      ['/items.html', 'items'],
      ['/skills.html', 'skills'],
      ['/passive-skills.html', 'passives']
    ];
    Promise.all(sources.map(function (s) {
      return fetch(s[0], { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          return pageEntriesFromDoc(doc, s[1]);
        })
        .catch(function () { return []; });
    })).then(function (parts) {
      var dynamic = [];
      parts.forEach(function (p) { dynamic = dynamic.concat(p); });
      idx = unique(idx.concat(dynamic));
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(dynamic)); } catch (e) {}
      loaded = true;
      loading = false;
      if (done) done();
    }).catch(function () {
      loaded = true;
      loading = false;
      if (done) done();
    });
  }

  function overlay() {
    var el = document.getElementById('globalSearch');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'globalSearch';
    el.className = 'global-search';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '全站搜索');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="gs-backdrop" data-close></div>' +
      '<div class="gs-panel">' +
      '<div class="gs-input-row"><svg class="gs-ico" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="13.5" y1="13.5" x2="17" y2="17" stroke="currentColor" stroke-width="2"/></svg>' +
      '<input type="search" id="gsInput" placeholder="搜索帕鲁、物品、技能、地图、攻略…" autocomplete="off" aria-label="搜索">' +
      '<button type="button" class="gs-esc" data-close aria-label="关闭">Esc</button></div>' +
      '<div class="gs-results" id="gsResults"></div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
    var inp = el.querySelector('#gsInput');
    inp.addEventListener('input', render);
    inp.addEventListener('keydown', onKey);
    return el;
  }

  function emptyHtml() {
    return '<div class="gs-empty">输入关键词开始搜索' +
      '<div class="gs-quick-row">' +
      '<a class="gs-quick" href="/paldex.html">帕鲁图鉴</a>' +
      '<a class="gs-quick" href="/breed-calc.html">配种计算器</a>' +
      '<a class="gs-quick" href="/map.html">游戏地图</a>' +
      '<a class="gs-quick" href="/items.html">物品图鉴</a>' +
      '</div></div>';
  }

  function open(initialQuery, trigger) {
    var el = overlay();
    var alreadyOpen = el.classList.contains('open');
    if (trigger) lastTrigger = trigger;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-open');
    var inp = el.querySelector('#gsInput');
    if (!alreadyOpen || typeof initialQuery === 'string') inp.value = initialQuery || '';
    render();
    setTimeout(function () { inp.focus(); }, 20);
    if (!loaded && !loading) {
      loadDynamicIndex(function () {
        if (el.classList.contains('open')) render();
      });
    }
  }

  function close() {
    var el = document.getElementById('globalSearch');
    if (!el || !el.classList.contains('open')) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-open');
    var home = document.getElementById('homeSearch');
    if (home) home.value = '';
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      try { lastTrigger.focus(); } catch (e) {}
    }
  }

  function score(x, kw) {
    var n = (x.n || '').toLowerCase();
    var d = (x.d || '').toLowerCase();
    if (n === kw) return 100;
    if (n.indexOf(kw) === 0) return 80;
    if (n.indexOf(kw) !== -1) return 60;
    if (d.indexOf(kw) !== -1) return 20;
    return 0;
  }

  function render() {
    var inp = document.getElementById('gsInput');
    var box = document.getElementById('gsResults');
    if (!inp || !box) return;
    var kw = inp.value.trim().toLowerCase();
    if (!kw) {
      activeItems = [];
      box.innerHTML = emptyHtml() + (!loaded ? '<div class="gs-loading">正在准备完整搜索索引…</div>' : '');
      return;
    }

    var hit = idx.map(function (x) { return { x: x, s: score(x, kw) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.x.n.length - b.x.n.length; })
      .map(function (r) { return r.x; });

    var order = ['页面', '工具', '帕鲁', '物品', '技能', '被动', '资料', '攻略', '资讯'];
    var groups = {};
    hit.forEach(function (x) { (groups[x.t] = groups[x.t] || []).push(x); });
    activeItems = [];
    var html = '';
    order.concat(Object.keys(groups)).filter(function (v, i, a) { return a.indexOf(v) === i; }).forEach(function (t) {
      if (!groups[t] || !groups[t].length) return;
      html += '<div class="gs-group">' + esc(t) + '</div>';
      groups[t].slice(0, 12).forEach(function (x) {
        var i = activeItems.length;
        activeItems.push(x);
        html += '<a class="gs-item" href="' + esc(x.u) + '" data-i="' + i + '">' +
          '<span class="gs-item-name">' + esc(x.n) + '</span>' +
          '<span class="gs-item-desc">' + esc(x.d || '') + '</span></a>';
      });
    });

    if (!activeItems.length) {
      html = '<div class="gs-empty">没有找到“<b>' + esc(inp.value.trim()) + '</b>”<br>试试中文名、图鉴编号或更短的关键词。</div>';
    }
    if (!loaded) html += '<div class="gs-loading">正在补充帕鲁、物品与技能索引…</div>';
    box.innerHTML = html;
    box.querySelectorAll('.gs-item, .gs-quick').forEach(function (a) { a.addEventListener('click', close); });
  }

  function move(d) {
    var all = document.querySelectorAll('.gs-item');
    if (!all.length) return;
    var cur = document.querySelector('.gs-item.active');
    var i = cur ? parseInt(cur.getAttribute('data-i'), 10) + d : (d > 0 ? 0 : all.length - 1);
    i = Math.max(0, Math.min(all.length - 1, i));
    all.forEach(function (a) { a.classList.remove('active'); });
    var target = document.querySelector('.gs-item[data-i="' + i + '"]');
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  function onKey(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (e.key === 'Enter') {
      var sel = document.querySelector('.gs-item.active');
      if (sel) {
        e.preventDefault();
        sel.click();
      }
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      var el = document.getElementById('globalSearch');
      if (el && el.classList.contains('open')) close(); else open('', document.activeElement);
      return;
    }
    if (e.key === 'Escape') close();
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest ? e.target.closest('.js-open-search') : null;
    if (!trigger) return;
    e.preventDefault();
    var home = document.getElementById('homeSearch');
    var q = home ? home.value.trim() : '';
    open(q, trigger);
  });

  // 首页直接输入：保留已经输入的第一个字，不再像旧版那样弹窗后清空。
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'homeSearch') open(e.target.value, e.target);
  });
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.id === 'homeSearch' && e.target.value) open(e.target.value, e.target);
  });
})();
