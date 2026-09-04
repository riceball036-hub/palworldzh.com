/* 幻兽帕鲁营地 —— 外部脚本：移动端导航 + 图鉴/物品筛选 */
(function () {
  'use strict';

  // ---------- 移动端导航折叠 ----------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---------- 帕鲁图鉴筛选 ----------
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
        var elems = (card.getAttribute('data-elems') || '');
        var okKw = !kw || name.indexOf(kw) !== -1 || no.indexOf(kw) !== -1;
        var okElem = !activeElem || elems.indexOf(activeElem) !== -1;
        var show = okKw && okElem;
        card.style.display = show ? '' : 'none';
        if (show) { visible++; }
      });
      if (emptyMsg) { emptyMsg.style.display = visible === 0 ? '' : 'none'; }
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilter);
    }
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
        if (!btn) { return; }
        var v = btn.getAttribute('data-elem') || '';
        activeElem = (activeElem === v) ? '' : v;
        var btns = btnBar.querySelectorAll('.filter-btn');
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.toggle('active', btns[i].getAttribute('data-elem') === activeElem);
        }
        if (elemSelect) { elemSelect.value = activeElem; }
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
          var ok = !kw || rows[j].getAttribute('data-name').indexOf(kw) !== -1;
          rows[j].style.display = ok ? '' : 'none';
          if (ok) { showRows++; }
        }
        var show = showCat && (showRows > 0);
        cats[i].style.display = show ? '' : 'none';
        total += showRows;
      }
      if (itemEmpty) { itemEmpty.style.display = (total === 0) ? '' : 'none'; }
    }

    if (itemSearch) {
      itemSearch.addEventListener('input', applyItemFilter);
    }
    if (itemBtns) {
      itemBtns.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.filter-btn') : null;
        if (!btn) { return; }
        var v = btn.getAttribute('data-cat') || '';
        activeCat = (activeCat === v) ? '' : v;
        var btns = itemBtns.querySelectorAll('.filter-btn');
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.toggle('active', btns[i].getAttribute('data-cat') === activeCat);
        }
        applyItemFilter();
      });
    }
  }
})();
