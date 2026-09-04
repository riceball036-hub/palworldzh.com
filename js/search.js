/* 全站搜索覆盖层 search.js —— Ctrl+K / 导航栏搜索按钮 / 首页搜索框 触发。
   数据加载自 /data/search-index.json,前端过滤,分类显示,键盘上下选择,Enter 进入,Esc 关闭。 */
(function () {
  'use strict';
  var idx = [];
  var IDX_URL = 'data/search-index.json';

  function getIdx(cb) {
    if (idx.length) { cb(); return; }
    fetch(IDX_URL).then(function (r) { return r.json(); }).then(function (d) {
      idx = d; cb();
    }).catch(function () { cb(); });
  }

  function overlay() {
    var el = document.getElementById('globalSearch');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'globalSearch';
    el.className = 'global-search';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '全站搜索');
    el.innerHTML = '<div class="gs-backdrop" data-close></div>' +
      '<div class="gs-panel">' +
      '<div class="gs-input-row"><svg class="gs-ico" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="13.5" y1="13.5" x2="17" y2="17" stroke="currentColor" stroke-width="2"/></svg>' +
      '<input type="search" id="gsInput" placeholder="搜索帕鲁、物品、技能、地图、攻略…" autocomplete="off" aria-label="搜索">' +
      '<button type="button" class="gs-esc" data-close aria-label="关闭">Esc</button></div>' +
      '<div class="gs-results" id="gsResults"></div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', close);
    });
    var inp = el.querySelector('#gsInput');
    inp.addEventListener('input', onInput);
    inp.addEventListener('keydown', onKey);
    return el;
  }

  function open() {
    var el = overlay();
    el.classList.add('open');
    var inp = el.querySelector('#gsInput');
    inp.value = '';
    el.querySelector('#gsResults').innerHTML = '<div class="gs-empty">输入关键词开始搜索</div>';
    setTimeout(function () { inp.focus(); }, 30);
    document.addEventListener('keydown', docKey);
  }
  function close() {
    var el = document.getElementById('globalSearch');
    if (el) el.classList.remove('open');
    document.removeEventListener('keydown', docKey);
  }
  function docKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); close(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'gsInput') {
      e.preventDefault();
      var sel = document.querySelector('.gs-item.active');
      if (sel) sel.click();
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(e.key === 'ArrowDown' ? 1 : -1);
    }
  }

  var items = [];
  function onInput() {
    var inp = document.getElementById('gsInput');
    var kw = inp.value.trim().toLowerCase();
    var box = document.getElementById('gsResults');
    if (!kw) { box.innerHTML = '<div class="gs-empty">输入关键词开始搜索</div>'; items = []; return; }
    getIdx(function () {
      var hit = idx.filter(function (x) {
        return x.n.toLowerCase().indexOf(kw) !== -1 || (x.d || '').toLowerCase().indexOf(kw) !== -1;
      });
      var groups = {};
      hit.slice(0, 60).forEach(function (x) {
        (groups[x.t] = groups[x.t] || []).push(x);
      });
      items = [];
      var html = '';
      Object.keys(groups).forEach(function (t) {
        html += '<div class="gs-group">' + t + '</div>';
        groups[t].forEach(function (x) {
          var i = items.length;
          items.push(x);
          html += '<a class="gs-item" href="' + x.u + '" data-i="' + i + '"><span class="gs-item-name">' + x.n + '</span><span class="gs-item-desc">' + (x.d || '') + '</span></a>';
        });
      });
      if (!items.length) html = '<div class="gs-empty">没有找到"<b>' + kw + '</b>"<br>试试中文名 / 英文名 / 其他关键词，或浏览<a href="paldex.html">全部帕鲁</a></div>';
      box.innerHTML = html;
      box.querySelectorAll('.gs-item').forEach(function (a) { a.addEventListener('click', function () { close(); }); });
    });
  }
  function move(d) {
    var cur = document.querySelector('.gs-item.active');
    var all = document.querySelectorAll('.gs-item');
    if (!all.length) return;
    var i = cur ? parseInt(cur.dataset.i, 10) + d : (d > 0 ? 0 : all.length - 1);
    i = Math.max(0, Math.min(all.length - 1, i));
    all.forEach(function (a) { a.classList.remove('active'); });
    var target = document.querySelector('.gs-item[data-i="' + i + '"]');
    if (target) { target.classList.add('active'); target.scrollIntoView({ block: 'nearest' }); }
  }
  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); var sel = document.querySelector('.gs-item.active'); if (sel) sel.click(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1); }
  }

  // 触发入口: Ctrl/Cmd+K, 全站搜索按钮
  document.addEventListener('keydown', function (e) {
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(); }
  });
  // 导航栏搜索按钮(由 gen_core 注入)和首页大搜索框
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-open-search')) open();
    var homeSearch = document.getElementById('homeSearch');
    if (homeSearch && e.target === homeSearch) { e.preventDefault(); open(); }
  });
  // 首页大搜索框直接输入即打开覆盖层
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'homeSearch') { open(); }
  });
})();