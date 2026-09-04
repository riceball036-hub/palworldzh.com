/* PalworldZH 全站搜索：Ctrl/Cmd+K、导航按钮与首页搜索框共用。 */
(function () {
  'use strict';

  var idx = [];
  var loading = null;
  var currentItems = [];
  var scriptEl = document.currentScript;
  var siteRoot = '';
  if (scriptEl && scriptEl.src) siteRoot = scriptEl.src.replace(/js\/search\.js(?:\?.*)?$/, '');
  var IDX_URL = siteRoot + 'data/search-index.json';

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getIdx(cb) {
    if (idx.length) { cb(true); return; }
    if (!loading) {
      loading = fetch(IDX_URL, { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error('search index ' + r.status);
          return r.json();
        })
        .then(function (d) { idx = Array.isArray(d) ? d : []; return true; })
        .catch(function () { return false; });
    }
    loading.then(cb);
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
    el.innerHTML = '<div class="gs-backdrop" data-close></div>' +
      '<div class="gs-panel">' +
      '<div class="gs-input-row"><svg class="gs-ico" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="13.5" y1="13.5" x2="17" y2="17" stroke="currentColor" stroke-width="2"/></svg>' +
      '<input type="search" id="gsInput" placeholder="搜索帕鲁、物品、技能、地图、攻略…" autocomplete="off" aria-label="搜索">' +
      '<button type="button" class="gs-esc" data-close aria-label="关闭搜索">Esc</button></div>' +
      '<div class="gs-results" id="gsResults" aria-live="polite"></div>' +
      '</div>';
    document.body.appendChild(el);
    var closers = el.querySelectorAll('[data-close]');
    for (var i = 0; i < closers.length; i++) closers[i].addEventListener('click', close);
    var input = el.querySelector('#gsInput');
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);
    return el;
  }

  function open(query) {
    var el = overlay();
    var inp = el.querySelector('#gsInput');
    var q = typeof query === 'string' ? query.trim() : '';
    el.classList.add('open');
    inp.value = q;
    if (q) render(q);
    else {
      currentItems = [];
      el.querySelector('#gsResults').innerHTML = '<div class="gs-empty">输入关键词开始搜索</div>';
    }
    setTimeout(function () { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }, 30);
  }

  function close() {
    var el = document.getElementById('globalSearch');
    if (el) el.classList.remove('open');
  }

  function score(x, q) {
    var n = String(x.n || '').toLowerCase();
    var d = String(x.d || '').toLowerCase();
    var k = String(x.k || x.keywords || '').toLowerCase();
    if (n === q) return 100;
    if (n.indexOf(q) === 0) return 80;
    if (n.indexOf(q) !== -1) return 60;
    if (k.indexOf(q) !== -1) return 35;
    if (d.indexOf(q) !== -1) return 15;
    return 0;
  }

  function render(raw) {
    var q = String(raw || '').trim().toLowerCase();
    var box = document.getElementById('gsResults');
    if (!box) return;
    if (!q) {
      currentItems = [];
      box.innerHTML = '<div class="gs-empty">输入关键词开始搜索</div>';
      return;
    }

    box.innerHTML = '<div class="gs-empty">正在搜索…</div>';
    getIdx(function (ok) {
      if (!ok) {
        currentItems = [];
        box.innerHTML = '<div class="gs-empty">搜索索引暂时不可用，可先从<a href="' + esc(siteRoot + 'paldex.html') + '">帕鲁图鉴</a>浏览。</div>';
        return;
      }
      var hit = idx.map(function (x) { return { x: x, s: score(x, q) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 40)
        .map(function (r) { return r.x; });

      var groups = {};
      hit.forEach(function (x) {
        var t = x.t || '其他';
        (groups[t] = groups[t] || []).push(x);
      });
      currentItems = [];
      var html = '';
      Object.keys(groups).forEach(function (t) {
        html += '<div class="gs-group">' + esc(t) + '</div>';
        groups[t].forEach(function (x) {
          var i = currentItems.length;
          currentItems.push(x);
          var url = x.u || '#';
          if (!/^https?:\/\//i.test(url) && url.charAt(0) !== '/') url = siteRoot + url;
          html += '<a class="gs-item" href="' + esc(url) + '" data-i="' + i + '">' +
            '<span class="gs-item-name">' + esc(x.n) + '</span>' +
            '<span class="gs-item-desc">' + esc(x.d || '') + '</span></a>';
        });
      });
      if (!currentItems.length) {
        html = '<div class="gs-empty">没有找到“<b>' + esc(raw) + '</b>”<br>试试中文名、编号或更短的关键词，或浏览<a href="' + esc(siteRoot + 'paldex.html') + '">全部帕鲁条目</a>。</div>';
      }
      box.innerHTML = html;
    });
  }

  function onInput() { render(this.value); }

  function move(delta) {
    var all = document.querySelectorAll('#gsResults .gs-item');
    if (!all.length) return;
    var cur = document.querySelector('#gsResults .gs-item.active');
    var i = cur ? parseInt(cur.getAttribute('data-i'), 10) + delta : (delta > 0 ? 0 : all.length - 1);
    if (i < 0) i = all.length - 1;
    if (i >= all.length) i = 0;
    for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
    var target = document.querySelector('#gsResults .gs-item[data-i="' + i + '"]');
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1);
    }
    if (e.key === 'Enter') {
      var selected = document.querySelector('#gsResults .gs-item.active') || document.querySelector('#gsResults .gs-item');
      if (selected) { e.preventDefault(); selected.click(); }
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      var el = document.getElementById('globalSearch');
      if (el && el.classList.contains('open')) close(); else open('');
    }
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest ? e.target.closest('.js-open-search') : null;
    if (!trigger) return;
    e.preventDefault();
    var home = document.getElementById('homeSearch');
    open(home ? home.value : '');
  });

  // 首页输入时把已输入内容带进覆盖层，而不是像旧实现那样反复清空。
  var home = document.getElementById('homeSearch');
  if (home) {
    home.addEventListener('focus', function () { if (home.value.trim()) open(home.value); });
    home.addEventListener('input', function () { if (home.value.trim()) open(home.value); });
    home.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); open(home.value); }
    });
  }
})();
