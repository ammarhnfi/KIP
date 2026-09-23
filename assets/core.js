/* core.js — util bersama dua tab dashboard (tanpa build step, tanpa data hardcode). */
window.KIP = (function () {
  'use strict';

  // ---------------------------------------------------------------- palet
  // Tiga slot kategorikal tervalidasi + satu netral untuk "tidak ada data".
  var PALETTE = {
    s1: '#2a78d6',
    s2: '#eb6834',
    s3: '#1baf7a',
    none: '#5b6472',
    grid: '#E9EDF2',
    axis: '#94A3B8',
    text: '#475569',
    surface: '#ffffff'
  };

  var BELUM = 'Belum diklasifikasi';

  // ---------------------------------------------------------------- teks
  function isBlank(v) {
    return v === undefined || v === null || String(v).trim() === '';
  }

  function clean(v) {
    return isBlank(v) ? '' : String(v).trim();
  }

  function orUnknown(v, fallback) {
    return isBlank(v) ? (fallback || 'Tidak diketahui') : String(v).trim();
  }

  function escapeHtml(v) {
    return String(isBlank(v) ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escapeRegExp(t) {
    return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Tandai potongan yang cocok kata kunci. Escaping dilakukan per potongan,
  // jadi entitas HTML tidak pernah terbelah oleh <mark>.
  function highlight(v, terms) {
    var raw = isBlank(v) ? '' : String(v);
    if (!terms || terms.length === 0) return escapeHtml(raw);
    var re = new RegExp('(' + terms.map(escapeRegExp).join('|') + ')', 'gi');
    return raw.split(re).map(function (part, i) {
      return (i % 2 === 1) ? '<mark>' + escapeHtml(part) + '</mark>' : escapeHtml(part);
    }).join('');
  }

  // Potong dengan elipsis di batas kata supaya label grafik tidak terpenggal
  // di tengah kata. Nama utuh tetap tersedia lewat tooltip.
  function truncate(v, max) {
    var s = clean(v);
    if (s.length <= max) return s;
    var cut = s.slice(0, max - 1);
    var sp = cut.lastIndexOf(' ');
    if (sp > max * 0.6) cut = cut.slice(0, sp);
    return cut.replace(/[\s,.;:/-]+$/, '') + '…';
  }

  function num(n) {
    return Number(n || 0).toLocaleString('id-ID');
  }

  function debounce(fn, ms) {
    var t = null;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  // ---------------------------------------------------------------- pencarian
  function termsOf(inputId) {
    var el = document.getElementById(inputId);
    if (!el) return [];
    return el.value.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 0; });
  }

  // Blob dihitung sekali saat load; pencocokan jadi sekadar indexOf.
  function buildBlob(row, fields) {
    var out = [];
    for (var i = 0; i < fields.length; i++) {
      var v = row[fields[i]];
      if (!isBlank(v)) out.push(String(v));
    }
    return out.join(' \u0001 ').toLowerCase();
  }

  function matchesTerms(blob, terms) {
    for (var i = 0; i < terms.length; i++) {
      if (blob.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- agregasi
  function countBy(rows, keyFn) {
    var m = new Map();
    rows.forEach(function (r) {
      var k = keyFn(r);
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }

  function uniqueCount(rows, keyFn) {
    var s = new Set();
    rows.forEach(function (r) {
      var v = keyFn(r);
      if (!isBlank(v)) s.add(v);
    });
    return s.size;
  }

  function topEntries(map, n) {
    return Array.from(map.entries())
      .sort(function (a, b) { return b[1] - a[1] || String(a[0]).localeCompare(String(b[0])); })
      .slice(0, n);
  }

  // ---------------------------------------------------------------- KPI
  function renderKpi(containerId, items) {
    document.getElementById(containerId).innerHTML = items.map(function (it) {
      var accent = it.color ? ' style="border-top-color:' + it.color + '"' : '';
      return '<div class="kpi"' + accent + '>' +
        '<div class="value">' + escapeHtml(it.value) + '</div>' +
        '<div class="title">' + escapeHtml(it.title) + '</div>' +
        '<div class="sub">' + escapeHtml(it.sub || '') + '</div>' +
        '</div>';
    }).join('');
  }

  // ---------------------------------------------------------------- grafik
  var PLOT_CONFIG = { displayModeBar: false, responsive: true, locale: 'id' };

  function baseLayout(extra) {
    var l = {
      paper_bgcolor: PALETTE.surface,
      plot_bgcolor: PALETTE.surface,
      font: { family: 'Arial, Helvetica, sans-serif', size: 12, color: PALETTE.text },
      margin: { l: 52, r: 18, t: 8, b: 46 },
      hoverlabel: { bgcolor: '#0f172a', font: { color: '#fff', size: 12 }, bordercolor: '#0f172a' },
      showlegend: false,
      bargap: 0.45
    };
    Object.keys(extra || {}).forEach(function (k) { l[k] = extra[k]; });
    return l;
  }

  function axisX(extra) {
    var a = {
      showgrid: false,
      zeroline: false,
      showline: true,
      linecolor: PALETTE.grid,
      linewidth: 1,
      ticks: 'outside',
      tickcolor: PALETTE.grid,
      ticklen: 4,
      tickfont: { size: 11, color: PALETTE.text },
      automargin: true
    };
    Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; });
    return a;
  }

  function axisY(extra) {
    var a = {
      showgrid: true,
      gridcolor: PALETTE.grid,
      gridwidth: 1,
      griddash: 'solid',
      zeroline: false,
      showline: false,
      ticks: '',
      tickfont: { size: 11, color: PALETTE.text },
      separatethousands: true,
      automargin: true
    };
    Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; });
    return a;
  }

  function draw(id, traces, layout, height) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.height = height + 'px';
    Plotly.react(el, traces, layout, PLOT_CONFIG);
  }

  function drawEmpty(id, height, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.height = height + 'px';
    Plotly.react(el, [], baseLayout({
      xaxis: { visible: false },
      yaxis: { visible: false },
      annotations: [{
        text: msg || 'Tidak ada data untuk filter ini',
        showarrow: false,
        xref: 'paper', yref: 'paper', x: 0.5, y: 0.5,
        font: { size: 13, color: PALETTE.text }
      }]
    }), PLOT_CONFIG);
  }

  function plotWidth(id) {
    var el = document.getElementById(id);
    return (el && el.clientWidth) || 640;
  }

  // Bar horizontal top-N: label dipendekkan sendiri (bukan dipotong Plotly),
  // nama utuh dibawa customdata ke tooltip, margin kiri dihitung dari label.
  // Panjang label menyesuaikan lebar kartu supaya di layar sempit batangnya
  // tidak habis dimakan margin.
  function topBarTrace(entries, opts) {
    opts = opts || {};
    var w = opts.width || 640;
    var maxChars = opts.maxChars || (w < 520 ? 20 : (w < 760 ? 28 : 38));
    var labels = entries.map(function (e) { return truncate(e[0], maxChars); });
    var full = entries.map(function (e) { return e[0]; });
    var vals = entries.map(function (e) { return e[1]; });
    return {
      trace: {
        type: 'bar',
        orientation: 'h',
        width: barWidthUnits((opts.plotHeight || 360) * 0.78, entries.length, 24),
        x: vals,
        y: labels,
        customdata: full,
        marker: { color: opts.color || PALETTE.s1 },
        text: vals.map(num),
        textposition: 'outside',
        textfont: { size: 11, color: PALETTE.text },
        cliponaxis: false,
        hovertemplate: '%{customdata}<br><b>%{x}</b> ' + (opts.unit || 'perkara') + '<extra></extra>'
      },
      leftMargin: Math.min(Math.round(w * 0.45), Math.max(110, maxChars * 6.2 + 10))
    };
  }

  // Tebal batang dibatasi <= maxPx: Plotly memakai satuan kategori, jadi lebar
  // piksel slot dihitung dulu dari ukuran plot.
  function barWidthUnits(px, nCats, maxPx) {
    if (!nCats) return 0.8;
    var slot = px / nCats;
    return Math.min(0.8, Math.max(0.04, (maxPx || 24) / slot));
  }

  // Label persen hanya untuk irisan yang cukup besar; irisan tipis dibiarkan
  // polos (angkanya tetap ada di legenda-hover dan tabel) supaya tidak terpotong.
  function pieLabels(values, minShare) {
    var total = values.reduce(function (a, b) { return a + b; }, 0) || 1;
    return values.map(function (v) {
      var share = v / total;
      return share >= (minShare || 0.05) ? (share * 100).toFixed(1).replace('.', ',') + '%' : '';
    });
  }

  // ---------------------------------------------------------------- tabel
  function DataTable(opts) {
    this.table = document.getElementById(opts.table);
    this.countEl = opts.count ? document.getElementById(opts.count) : null;
    this.moreEl = opts.more ? document.getElementById(opts.more) : null;
    this.columns = opts.columns;
    this.pageSize = opts.pageSize || 200;
    this.detail = opts.detail || null;
    this.totalLabel = opts.totalLabel || 'baris';
    this.rows = [];
    this.terms = [];
    this.total = 0;
    this.shown = this.pageSize;
    this.sortIdx = null;
    this.sortDir = 1;
    this.init();
  }

  DataTable.prototype.init = function () {
    var self = this;
    var head = this.table.querySelector('thead tr');
    head.innerHTML = this.columns.map(function (c, i) {
      return '<th scope="col" data-idx="' + i + '" aria-sort="none" title="Klik untuk mengurutkan">' +
        escapeHtml(c.label) + '<span class="sort-mark">↕</span></th>';
    }).join('');
    head.addEventListener('click', function (ev) {
      var th = ev.target.closest('th');
      if (!th) return;
      self.sortBy(parseInt(th.dataset.idx, 10));
    });

    if (this.moreEl) {
      this.moreEl.addEventListener('click', function () {
        self.shown += self.pageSize;
        self.render();
      });
    }

    if (this.detail) {
      this.table.querySelector('tbody').addEventListener('click', function (ev) {
        var tr = ev.target.closest('tr.row-main');
        if (!tr) return;
        self.toggleDetail(tr);
      });
    }
  };

  DataTable.prototype.sortBy = function (idx) {
    if (this.sortIdx === idx) {
      this.sortDir = -this.sortDir;
    } else {
      this.sortIdx = idx;
      this.sortDir = 1;
    }
    this.render();
  };

  DataTable.prototype.setRows = function (rows, terms) {
    this.rows = rows;
    this.terms = terms || [];
    this.shown = this.pageSize;
    this.render();
  };

  DataTable.prototype.setTotal = function (total) {
    this.total = total;
  };

  DataTable.prototype.sortedRows = function () {
    if (this.sortIdx === null) return this.rows;
    var col = this.columns[this.sortIdx];
    var dir = this.sortDir;
    var keyed = this.rows.map(function (r, i) {
      return { r: r, i: i, k: col.sort ? col.sort(r) : col.value(r) };
    });
    keyed.sort(function (a, b) {
      var x = a.k, y = b.k, c;
      if (typeof x === 'number' && typeof y === 'number') {
        c = x - y;
      } else {
        c = String(x).localeCompare(String(y), 'id', { numeric: true, sensitivity: 'base' });
      }
      return c !== 0 ? c * dir : a.i - b.i;
    });
    return keyed.map(function (o) { return o.r; });
  };

  DataTable.prototype.render = function () {
    var self = this;
    var rows = this.sortedRows();
    var slice = rows.slice(0, this.shown);
    var tbody = this.table.querySelector('tbody');

    this.table.querySelectorAll('thead th').forEach(function (th, i) {
      var sorted = (i === self.sortIdx);
      th.setAttribute('aria-sort', sorted ? (self.sortDir === 1 ? 'ascending' : 'descending') : 'none');
      th.querySelector('.sort-mark').textContent = sorted ? (self.sortDir === 1 ? '↑' : '↓') : '↕';
    });

    if (slice.length === 0) {
      tbody.innerHTML = '<tr><td class="empty-cell" colspan="' + this.columns.length + '">' +
        'Tidak ada data yang cocok dengan filter/kata kunci ini.</td></tr>';
    } else {
      tbody.innerHTML = slice.map(function (r, i) {
        var cells = self.columns.map(function (c) {
          var v = c.value(r);
          var html = c.html ? c.html(r, self.terms)
            : (c.highlight === false ? escapeHtml(v) : highlight(v, self.terms));
          return '<td class="' + (c.align === 'num' ? 'col-num' : '') + '">' + html + '</td>';
        }).join('');
        return '<tr class="row-main" data-row="' + i + '">' + cells + '</tr>';
      }).join('');
      this._slice = slice;
    }

    if (this.countEl) {
      this.countEl.textContent = 'Menampilkan ' + num(Math.min(this.shown, rows.length)) +
        ' dari ' + num(rows.length) + ' ' + this.totalLabel +
        (this.total && rows.length !== this.total ? ' (total ' + num(this.total) + ')' : '');
    }

    if (this.moreEl) {
      var sisa = rows.length - slice.length;
      this.moreEl.hidden = sisa <= 0;
      this.moreEl.textContent = 'Muat ' + num(Math.min(this.pageSize, sisa)) + ' baris lagi (' + num(sisa) + ' tersisa)';
    }
  };

  DataTable.prototype.toggleDetail = function (tr) {
    var next = tr.nextElementSibling;
    if (next && next.classList.contains('row-detail')) {
      next.remove();
      return;
    }
    var row = this._slice[parseInt(tr.dataset.row, 10)];
    var det = document.createElement('tr');
    det.className = 'row-detail';
    det.innerHTML = '<td colspan="' + this.columns.length + '">' + this.detail(row) + '</td>';
    tr.parentNode.insertBefore(det, tr.nextSibling);
  };

  // ---------------------------------------------------------------- dropdown
  function fillSelect(id, values, allLabel) {
    var sel = document.getElementById(id);
    var current = sel.value;
    sel.innerHTML = '';
    var first = document.createElement('option');
    first.value = 'ALL';
    first.textContent = allLabel || 'Semua';
    sel.appendChild(first);
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    sel.value = (current && Array.prototype.some.call(sel.options, function (o) { return o.value === current; }))
      ? current : 'ALL';
  }

  // ---------------------------------------------------------------- data
  function loadCsv(path) {
    return new Promise(function (resolve, reject) {
      Papa.parse(path, {
        download: true,
        header: true,
        skipEmptyLines: 'greedy',
        complete: function (res) { resolve(res.data); },
        error: function (err) { reject(new Error(path + ': ' + err)); }
      });
    });
  }

  // ---------------------------------------------------------------- tab
  var tabs = {};
  var activeTab = null;

  function registerTab(name, def) {
    tabs[name] = def;
  }

  function activate(name) {
    if (!tabs[name]) return;
    activeTab = name;
    document.querySelectorAll('.tab').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.tab === name));
    });
    document.querySelectorAll('.tab-panel').forEach(function (p) {
      p.hidden = (p.id !== 'tab-' + name);
    });
    // Grafik baru digambar saat panelnya terlihat, supaya lebarnya benar.
    tabs[name].render();
    try { localStorage.setItem('kip-tab', name); } catch (e) { /* mode privat */ }
  }

  function requestRender(name) {
    if (activeTab === name) tabs[name].render();
  }

  function boot() {
    var status = document.getElementById('app-status');
    Promise.all([
      loadCsv('./data/sengketa_informasi.csv'),
      loadCsv('./data/sidang_kasus.csv'),
      loadCsv('./data/sidang_agenda.csv')
    ]).then(function (res) {
      tabs.permohonan.init(res[0]);
      tabs.sidang.init(res[1], res[2]);

      document.querySelectorAll('.tab').forEach(function (b) {
        b.addEventListener('click', function () { activate(b.dataset.tab); });
      });

      // Ukuran label bar horizontal ikut lebar kartu, jadi gambar ulang saat resize.
      window.addEventListener('resize', debounce(function () {
        if (activeTab) tabs[activeTab].render();
      }, 250));

      status.hidden = true;
      var saved = null;
      try { saved = localStorage.getItem('kip-tab'); } catch (e) { /* mode privat */ }
      activate(tabs[saved] ? saved : 'permohonan');
    }).catch(function (err) {
      status.hidden = false;
      status.className = 'app-status is-error';
      status.textContent = 'Gagal memuat data: ' + err.message +
        '. Pastikan halaman dibuka lewat HTTP (bukan file://) dan folder data/ berisi ketiga CSV.';
      console.error(err);
    });
  }

  return {
    PALETTE: PALETTE,
    BELUM: BELUM,
    isBlank: isBlank,
    clean: clean,
    orUnknown: orUnknown,
    escapeHtml: escapeHtml,
    highlight: highlight,
    truncate: truncate,
    num: num,
    debounce: debounce,
    termsOf: termsOf,
    buildBlob: buildBlob,
    matchesTerms: matchesTerms,
    countBy: countBy,
    uniqueCount: uniqueCount,
    topEntries: topEntries,
    renderKpi: renderKpi,
    baseLayout: baseLayout,
    axisX: axisX,
    axisY: axisY,
    draw: draw,
    drawEmpty: drawEmpty,
    topBarTrace: topBarTrace,
    pieLabels: pieLabels,
    barWidthUnits: barWidthUnits,
    plotWidth: plotWidth,
    DataTable: DataTable,
    fillSelect: fillSelect,
    registerTab: registerTab,
    requestRender: requestRender,
    boot: boot
  };
})();
