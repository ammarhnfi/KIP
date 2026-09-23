/* tab-permohonan.js — tab 1: permohonan penyelesaian sengketa informasi. */
(function (K) {
  'use strict';

  // Kosakata baku Jenis Pemohon (3 opsi). Varian penulisan di data mentah
  // dipetakan ke sini; yang tidak jelas TIDAK ditebak — jadi "Belum diklasifikasi".
  var JENIS_BAKU = ['Badan Hukum', 'Perseorangan', 'Kelompok Orang'];

  var JENIS_WARNA = {
    'Badan Hukum': K.PALETTE.s1,
    'Perseorangan': K.PALETTE.s2,
    'Kelompok Orang': K.PALETTE.s3
  };
  JENIS_WARNA[K.BELUM] = K.PALETTE.none;

  var CARI_KOLOM = [
    'NO_REG_PENDAFTARAN', 'NO_REGISTER_SENGKETA', 'PEMOHON',
    'BADAN_PUBLIK', 'INFORMASI_YANG_DIMINTA'
  ];

  var ROWS = [];
  var table = null;

  function normalJenis(v) {
    var s = K.clean(v).toLowerCase();
    if (!s) return K.BELUM;
    if (s.indexOf('badan hukum') === 0) return 'Badan Hukum';
    if (s.indexOf('kelompok') === 0) return 'Kelompok Orang';
    if (s.indexOf('perseoranga') === 0 || s.indexOf('peroranga') === 0 || s.indexOf('orang pribadi') === 0) {
      return 'Perseorangan';
    }
    return K.BELUM; // mis. "Kuasa" — ambigu, tidak ditebak
  }

  // Buang penomoran "3. " di depan nama klasifikasi.
  function ringkasKlasifikasi(v) {
    var s = K.clean(v);
    if (!s) return K.BELUM;
    return s.replace(/^\s*\d+\.\s*/, '').trim() || K.BELUM;
  }

  function filterState() {
    return {
      tahun: document.getElementById('p-tahun').value,
      jenis: document.getElementById('p-jenis').value,
      klas: document.getElementById('p-klasifikasi').value,
      terms: K.termsOf('p-cari')
    };
  }

  function apply(f, opts) {
    var abaikanTahun = opts && opts.abaikanTahun;
    return ROWS.filter(function (r) {
      if (!abaikanTahun && f.tahun !== 'ALL' && r._tahun !== f.tahun) return false;
      if (f.jenis !== 'ALL' && r._jenis !== f.jenis) return false;
      if (f.klas !== 'ALL' && r._klas !== f.klas) return false;
      return K.matchesTerms(r._blob, f.terms);
    });
  }

  // ------------------------------------------------------------ grafik
  function chartTren(rows) {
    if (!rows.length) return K.drawEmpty('p-chart-tren', 320);
    var counts = K.countBy(rows, function (r) { return r._tahun; });
    var years = Array.from(counts.keys()).sort();
    var vals = years.map(function (y) { return counts.get(y); });
    var max = Math.max.apply(null, vals);
    // Label selektif: hanya tahun tertinggi yang diberi angka; sisanya lewat sumbu & tooltip.
    var labels = vals.map(function (v) { return v === max ? K.num(v) : ''; });
    K.draw('p-chart-tren', [{
      type: 'bar', x: years, y: vals,
      width: K.barWidthUnits(K.plotWidth('p-chart-tren') - 76, years.length, 24),
      marker: { color: K.PALETTE.s1 },
      text: labels, textposition: 'outside', cliponaxis: false,
      textfont: { size: 11, color: K.PALETTE.text },
      hovertemplate: 'Tahun %{x}<br><b>%{y}</b> permohonan<extra></extra>'
    }], K.baseLayout({
      bargap: 0.55,
      xaxis: K.axisX({ type: 'category', title: { text: 'Tahun', font: { size: 11 }, standoff: 8 } }),
      yaxis: K.axisY({ title: { text: 'Jumlah permohonan', font: { size: 11 }, standoff: 8 } }),
      margin: { l: 58, r: 18, t: 14, b: 46 }
    }), 320);
  }

  function chartJenis(rows) {
    if (!rows.length) return K.drawEmpty('p-chart-jenis', 320);
    var counts = K.countBy(rows, function (r) { return r._jenis; });
    var order = JENIS_BAKU.concat([K.BELUM]).filter(function (l) { return counts.has(l); });
    K.draw('p-chart-jenis', [{
      type: 'pie', hole: 0.5,
      labels: order,
      values: order.map(function (l) { return counts.get(l); }),
      sort: false,
      direction: 'clockwise',
      marker: {
        colors: order.map(function (l) { return JENIS_WARNA[l]; }),
        line: { color: K.PALETTE.surface, width: 2 } // jarak 2px warna surface antar irisan
      },
      text: K.pieLabels(order.map(function (l) { return counts.get(l); })),
      textinfo: 'text',
      textposition: 'inside',
      insidetextorientation: 'horizontal',
      textfont: { size: 12, color: '#ffffff' },
      hovertemplate: '%{label}<br><b>%{value}</b> permohonan (%{percent})<extra></extra>'
    }], K.baseLayout({
      showlegend: true,
      legend: { orientation: 'h', y: -0.08, x: 0.5, xanchor: 'center', font: { size: 11 } },
      margin: { l: 10, r: 10, t: 10, b: 10 }
    }), 320);
  }

  function chartBadan(rows) {
    if (!rows.length) return K.drawEmpty('p-chart-badan', 360);
    var counts = K.countBy(rows, function (r) { return r._badan; });
    var entries = K.topEntries(counts, 10).reverse(); // terbesar di atas
    var built = K.topBarTrace(entries, { unit: 'permohonan', width: K.plotWidth('p-chart-badan'), plotHeight: 360 });
    K.draw('p-chart-badan', [built.trace], K.baseLayout({
      bargap: 0.4,
      xaxis: K.axisX({ showgrid: true, gridcolor: K.PALETTE.grid, title: { text: 'Jumlah permohonan', font: { size: 11 }, standoff: 8 } }),
      yaxis: K.axisY({ showgrid: false, type: 'category', tickfont: { size: 11, color: K.PALETTE.text } }),
      margin: { l: built.leftMargin, r: 44, t: 10, b: 44 }
    }), 360);
  }

  function chartKlasifikasi(rows) {
    if (!rows.length) return K.drawEmpty('p-chart-klasifikasi', 360);
    var counts = K.countBy(rows, function (r) { return r._klas; });
    var entries = K.topEntries(counts, 12);
    K.draw('p-chart-klasifikasi', [{
      type: 'bar',
      x: entries.map(function (e) { return K.truncate(e[0], 26); }),
      y: entries.map(function (e) { return e[1]; }),
      width: K.barWidthUnits(K.plotWidth('p-chart-klasifikasi') - 76, entries.length, 24),
      customdata: entries.map(function (e) { return e[0]; }),
      marker: { color: K.PALETTE.s1 },
      hovertemplate: '%{customdata}<br><b>%{y}</b> permohonan<extra></extra>'
    }], K.baseLayout({
      bargap: 0.5,
      xaxis: K.axisX({ type: 'category', tickangle: -32, tickfont: { size: 10, color: K.PALETTE.text } }),
      yaxis: K.axisY({ title: { text: 'Jumlah permohonan', font: { size: 11 }, standoff: 8 } }),
      margin: { l: 58, r: 18, t: 10, b: 130 }
    }), 360);
  }

  // ------------------------------------------------------------ render
  function render() {
    var f = filterState();
    var rows = apply(f);
    var rowsTanpaTahun = apply(f, { abaikanTahun: true });

    K.renderKpi('p-kpi', [
      { title: 'Total Permohonan', value: K.num(rows.length), sub: 'sesuai filter aktif' },
      { title: 'Badan Publik Terlibat', value: K.num(K.uniqueCount(rows, function (r) { return r._badan; })), sub: 'badan publik unik' },
      { title: 'Pemohon Unik', value: K.num(K.uniqueCount(rows, function (r) { return K.clean(r.PEMOHON); })), sub: 'pemohon berbeda' },
      { title: 'Cakupan Tahun', value: K.num(K.uniqueCount(rows, function (r) { return r._tahun; })), sub: 'tahun tercakup' }
    ]);

    chartTren(rowsTanpaTahun);
    chartJenis(rows);
    chartBadan(rows);
    chartKlasifikasi(rows);

    table.setRows(rows, f.terms);
  }

  // ------------------------------------------------------------ init
  function init(data) {
    ROWS = data.filter(function (r) { return !K.isBlank(r.NO) || !K.isBlank(r.PEMOHON); }).map(function (r) {
      r._tahun = K.clean(r.TAHUN);
      r._jenis = normalJenis(r.JENIS_PEMOHON);
      r._klas = ringkasKlasifikasi(r.KLASIFIKASI);
      r._badan = K.orUnknown(r.BADAN_PUBLIK);
      r._blob = K.buildBlob(r, CARI_KOLOM);
      return r;
    });

    K.fillSelect('p-tahun', Array.from(new Set(ROWS.map(function (r) { return r._tahun; })))
      .filter(Boolean).sort(), 'Semua tahun');
    K.fillSelect('p-jenis', JENIS_BAKU.concat([K.BELUM]).filter(function (v) {
      return ROWS.some(function (r) { return r._jenis === v; });
    }));
    K.fillSelect('p-klasifikasi', Array.from(new Set(ROWS.map(function (r) { return r._klas; })))
      .sort(function (a, b) { return a.localeCompare(b, 'id'); }));

    table = new K.DataTable({
      table: 'p-table', count: 'p-count', more: 'p-more', pageSize: 200,
      totalLabel: 'permohonan',
      columns: [
        { label: 'NO', align: 'num', value: function (r) { return K.clean(r.NO); }, sort: function (r) { return parseInt(r.NO, 10) || 0; }, highlight: false },
        { label: 'Tahun', align: 'num', value: function (r) { return r._tahun; }, sort: function (r) { return parseInt(r._tahun, 10) || 0; }, highlight: false },
        { label: 'No. Registrasi', value: function (r) { return K.clean(r.NO_REG_PENDAFTARAN); } },
        { label: 'Pemohon', value: function (r) { return K.clean(r.PEMOHON); } },
        { label: 'Jenis Pemohon', value: function (r) { return r._jenis; }, highlight: false },
        { label: 'Badan Publik', value: function (r) { return r._badan; } },
        { label: 'Klasifikasi', value: function (r) { return r._klas; } },
        { label: 'Metode Pendaftaran', value: function (r) { return K.orUnknown(r.METODE_PENDAFTARAN, '—'); }, highlight: false },
        { label: 'Penerima', value: function (r) { return K.clean(r.PENERIMA); } }
      ]
    });
    table.setTotal(ROWS.length);

    var rerender = function () { K.requestRender('permohonan'); };
    ['p-tahun', 'p-jenis', 'p-klasifikasi'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', rerender);
    });
    document.getElementById('p-cari').addEventListener('input', K.debounce(rerender, 200));
    document.getElementById('p-reset').addEventListener('click', function () {
      document.getElementById('p-cari').value = '';
      ['p-tahun', 'p-jenis', 'p-klasifikasi'].forEach(function (id) {
        document.getElementById(id).value = 'ALL';
      });
      rerender();
    });
  }

  K.registerTab('permohonan', { init: init, render: render, needsData: true });
})(window.KIP);
