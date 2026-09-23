/* tab-sidang.js — tab 2: buku besar sidang (kasus + agenda sidang). */
(function (K) {
  'use strict';

  // ---- kosakata baku ----------------------------------------------------
  var JALUR_BAKU = ['Mediasi', 'Ajudikasi', 'Pencabutan'];

  var AMAR_PER_JALUR = {
    'Mediasi': ['Putusan Mediasi'],
    'Ajudikasi': ['Dikabulkan Seluruhnya', 'Dikabulkan Sebagian', 'Ditolak Seluruhnya', 'Putusan Gugur', 'Putusan Sela'],
    'Pencabutan': ['Pencabutan', 'Pencabutan Saat Sidang']
  };

  var JALUR_WARNA = {
    'Mediasi': K.PALETTE.s1,
    'Ajudikasi': K.PALETTE.s2,
    'Pencabutan': K.PALETTE.s3
  };
  JALUR_WARNA[K.BELUM] = K.PALETTE.none;

  var JALUR_PILL = {
    'Mediasi': 'pill-mediasi',
    'Ajudikasi': 'pill-ajudikasi',
    'Pencabutan': 'pill-pencabutan'
  };

  var CARI_KOLOM = ['REGISTER', 'NO_PENDAFTARAN', 'NO_IDENTIFIKASI', 'PEMOHON', 'TERMOHON'];

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  // 3 huruf pertama nama bulan -> indeks; ditambah ejaan Inggris yang muncul di data.
  var BULAN_IDX = { may: 4, aug: 7, oct: 9, dec: 11 };
  BULAN.forEach(function (b, i) { BULAN_IDX[b.toLowerCase().slice(0, 3)] = i; });

  var ROWS = [];
  var AGENDA = new Map();
  var table = null;

  // ---- normalisasi ------------------------------------------------------
  function normalJalur(v) {
    var s = K.clean(v);
    if (!s) return K.BELUM;
    for (var i = 0; i < JALUR_BAKU.length; i++) {
      if (s.toLowerCase() === JALUR_BAKU[i].toLowerCase()) return JALUR_BAKU[i];
    }
    return K.BELUM;
  }

  function normalAmar(v, jalur) {
    var s = K.clean(v);
    if (!s) return K.BELUM;
    var kandidat = (AMAR_PER_JALUR[jalur] || [])
      .concat(AMAR_PER_JALUR.Mediasi, AMAR_PER_JALUR.Ajudikasi, AMAR_PER_JALUR.Pencabutan);
    for (var i = 0; i < kandidat.length; i++) {
      if (s.toLowerCase() === kandidat[i].toLowerCase()) return kandidat[i];
    }
    return K.BELUM;
  }

  // Tanggal agenda ditulis beragam di data mentah. Yang terbaca dijadikan
  // tanggal; sisa teksnya tetap ditampilkan apa adanya sebagai catatan.
  function parseTanggal(raw) {
    var s = K.clean(raw);
    if (!s) return { text: '', note: '' };
    var m, d, mo, y, rest;

    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T][\d:.]+)?/);
    if (m) { y = +m[1]; mo = +m[2] - 1; d = +m[3]; rest = s.slice(m[0].length); }

    if (!m) {
      m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
      if (m) { d = +m[1]; mo = +m[2] - 1; y = +m[3]; rest = s.slice(m[0].length); }
    }
    if (!m) {
      m = s.match(/^(\d{1,2})[\/\s.]+([A-Za-z]{3,})\.?\s+(\d{4})/);
      if (m && BULAN_IDX[m[2].toLowerCase().slice(0, 3)] !== undefined) {
        d = +m[1]; mo = BULAN_IDX[m[2].toLowerCase().slice(0, 3)]; y = +m[3]; rest = s.slice(m[0].length);
      } else { m = null; }
    }

    if (!m || mo < 0 || mo > 11) return { text: '', note: s };
    var note = (rest || '').replace(/^[\s\-–—,:]+/, '').replace(/^\((.*)\)$/, '$1').trim();
    return { text: d + ' ' + BULAN[mo] + ' ' + y, note: note, sort: y * 10000 + mo * 100 + d };
  }

  function tanggalTampil(raw) {
    var p = parseTanggal(raw);
    if (!p.text && !p.note) return '—';
    if (!p.text) return p.note;
    return p.text + (p.note ? ' (' + p.note + ')' : '');
  }

  // ---- filter -----------------------------------------------------------
  function filterState() {
    return {
      tahun: document.getElementById('s-tahun').value,
      jalur: document.getElementById('s-jalur').value,
      amar: document.getElementById('s-amar').value,
      terms: K.termsOf('s-cari')
    };
  }

  function apply(f, opts) {
    var abaikanTahun = opts && opts.abaikanTahun;
    return ROWS.filter(function (r) {
      if (!abaikanTahun && f.tahun !== 'ALL' && r._tahun !== f.tahun) return false;
      if (f.jalur !== 'ALL' && r._jalur !== f.jalur) return false;
      if (f.amar !== 'ALL' && r._amar !== f.amar) return false;
      return K.matchesTerms(r._blob, f.terms);
    });
  }

  // Dropdown Amar Putusan menyesuaikan jalur yang dipilih.
  function syncAmarOptions() {
    var jalur = document.getElementById('s-jalur').value;
    var kandidat = (jalur === 'ALL')
      ? AMAR_PER_JALUR.Mediasi.concat(AMAR_PER_JALUR.Ajudikasi, AMAR_PER_JALUR.Pencabutan)
      : (AMAR_PER_JALUR[jalur] || []);
    var ada = kandidat.filter(function (a) {
      return ROWS.some(function (r) { return r._amar === a && (jalur === 'ALL' || r._jalur === jalur); });
    });
    if (ROWS.some(function (r) { return r._amar === K.BELUM && (jalur === 'ALL' || r._jalur === jalur); })) {
      ada.push(K.BELUM);
    }
    K.fillSelect('s-amar', ada);
    document.getElementById('s-amar').disabled = (ada.length === 0);
  }

  // ---- grafik -----------------------------------------------------------
  function chartTren(rows) {
    if (!rows.length) return K.drawEmpty('s-chart-tren', 320);
    var counts = K.countBy(rows, function (r) { return r._tahun; });
    var years = Array.from(counts.keys()).filter(Boolean).sort();
    var vals = years.map(function (y) { return counts.get(y); });
    var max = Math.max.apply(null, vals);
    var labels = vals.map(function (v) { return v === max ? K.num(v) : ''; });
    K.draw('s-chart-tren', [{
      type: 'bar', x: years, y: vals,
      width: K.barWidthUnits(K.plotWidth('s-chart-tren') - 76, years.length, 24),
      marker: { color: K.PALETTE.s1 },
      text: labels, textposition: 'outside', cliponaxis: false,
      textfont: { size: 11, color: K.PALETTE.text },
      hovertemplate: 'Tahun %{x}<br><b>%{y}</b> kasus<extra></extra>'
    }], K.baseLayout({
      bargap: 0.5,
      xaxis: K.axisX({ type: 'category', title: { text: 'Tahun', font: { size: 11 }, standoff: 8 } }),
      yaxis: K.axisY({ title: { text: 'Jumlah kasus', font: { size: 11 }, standoff: 8 } }),
      margin: { l: 58, r: 18, t: 14, b: 46 }
    }), 320);
  }

  function chartJalur(rows) {
    if (!rows.length) return K.drawEmpty('s-chart-jalur', 320);
    var counts = K.countBy(rows, function (r) { return r._jalur; });
    var order = JALUR_BAKU.concat([K.BELUM]).filter(function (l) { return counts.has(l); });
    K.draw('s-chart-jalur', [{
      type: 'pie', hole: 0.5,
      labels: order,
      values: order.map(function (l) { return counts.get(l); }),
      sort: false,
      direction: 'clockwise',
      marker: {
        colors: order.map(function (l) { return JALUR_WARNA[l]; }),
        line: { color: K.PALETTE.surface, width: 2 }
      },
      text: K.pieLabels(order.map(function (l) { return counts.get(l); })),
      textinfo: 'text',
      textposition: 'inside',
      insidetextorientation: 'horizontal',
      textfont: { size: 12, color: '#ffffff' },
      hovertemplate: '%{label}<br><b>%{value}</b> kasus (%{percent})<extra></extra>'
    }], K.baseLayout({
      showlegend: true,
      legend: { orientation: 'h', y: -0.08, x: 0.5, xanchor: 'center', font: { size: 11 } },
      margin: { l: 10, r: 10, t: 10, b: 10 }
    }), 320);
  }

  function chartAmar(rows) {
    if (!rows.length) return K.drawEmpty('s-chart-amar', 360);
    var counts = K.countBy(rows, function (r) { return r._amar; });
    // Sumbu-x mengikuti urutan baku, dikelompokkan per jalur; warna = warna jalur.
    var kategori = [];
    var traces = [];
    var totalKategori = JALUR_BAKU.concat([K.BELUM]).reduce(function (n, j) {
      var daftar = (j === K.BELUM) ? [K.BELUM] : AMAR_PER_JALUR[j];
      return n + daftar.filter(function (a) { return counts.has(a); }).length;
    }, 0);
    var lebarBatang = K.barWidthUnits(K.plotWidth('s-chart-amar') - 76, totalKategori, 24);
    JALUR_BAKU.concat([K.BELUM]).forEach(function (jalur) {
      var daftar = (jalur === K.BELUM) ? [K.BELUM] : AMAR_PER_JALUR[jalur];
      var punya = daftar.filter(function (a) { return counts.has(a); });
      if (!punya.length) return;
      kategori = kategori.concat(punya);
      traces.push({
        type: 'bar',
        name: jalur,
        x: punya,
        y: punya.map(function (a) { return counts.get(a); }),
        width: lebarBatang,
        marker: { color: JALUR_WARNA[jalur] },
        // Kategori "Belum diklasifikasi" jauh lebih besar dari sisanya, jadi tiap
        // batang diberi angka supaya yang pendek tetap terbaca nilainya.
        text: punya.map(function (a) { return K.num(counts.get(a)); }),
        textposition: 'outside',
        cliponaxis: false,
        textfont: { size: 11, color: K.PALETTE.text },
        hovertemplate: '%{x}<br>Jalur ' + jalur + '<br><b>%{y}</b> kasus<extra></extra>'
      });
    });
    if (!traces.length) return K.drawEmpty('s-chart-amar', 360);
    K.draw('s-chart-amar', traces, K.baseLayout({
      barmode: 'stack', // tiap amar hanya milik satu jalur, jadi tidak pernah bertumpuk
      bargap: 0.5,
      showlegend: true,
      legend: { orientation: 'h', y: 1.12, x: 0, font: { size: 11 }, traceorder: 'normal' },
      xaxis: K.axisX({
        type: 'category',
        categoryorder: 'array',
        categoryarray: kategori,
        tickangle: -28,
        tickfont: { size: 10, color: K.PALETTE.text }
      }),
      yaxis: K.axisY({ title: { text: 'Jumlah kasus', font: { size: 11 }, standoff: 8 } }),
      margin: { l: 58, r: 18, t: 34, b: 120 }
    }), 360);
  }

  function chartTermohon(rows) {
    if (!rows.length) return K.drawEmpty('s-chart-termohon', 360);
    var counts = K.countBy(rows, function (r) { return r._termohon; });
    var entries = K.topEntries(counts, 10).reverse();
    var built = K.topBarTrace(entries, { unit: 'kasus', width: K.plotWidth('s-chart-termohon'), plotHeight: 360 });
    K.draw('s-chart-termohon', [built.trace], K.baseLayout({
      bargap: 0.4,
      xaxis: K.axisX({ showgrid: true, gridcolor: K.PALETTE.grid, title: { text: 'Jumlah kasus', font: { size: 11 }, standoff: 8 } }),
      yaxis: K.axisY({ showgrid: false, type: 'category', tickfont: { size: 11, color: K.PALETTE.text } }),
      margin: { l: built.leftMargin, r: 44, t: 10, b: 44 }
    }), 360);
  }

  // ---- detail kasus -----------------------------------------------------
  function detailHtml(r) {
    var E = K.escapeHtml;
    var items = [
      ['No. Pendaftaran', K.clean(r.NO_PENDAFTARAN) || '—'],
      ['No. Identifikasi', K.clean(r.NO_IDENTIFIKASI) || '—'],
      ['Majelis Komisioner / Mediator', K.clean(r.MAJELIS_KOMISIONER_MEDIATOR) || '—'],
      ['Panitera Pengganti', K.clean(r.PANITERA_PENGGANTI) || '—'],
      ['TA / AA', K.clean(r.TA_AA) || '—'],
      ['Sidang Pertama', tanggalTampil(r.TANGGAL_SIDANG_PERTAMA)],
      ['Sidang Terakhir', tanggalTampil(r.TANGGAL_SIDANG_TERAKHIR)],
      ['Batas Maksimal Penyelesaian', /^#/.test(K.clean(r.BATAS_MAKSIMAL_PENYELESAIAN)) ? '—' : tanggalTampil(r.BATAS_MAKSIMAL_PENYELESAIAN)],
      ['Hasil (data mentah)', K.clean(r.HASIL_RAW) || '—'],
      ['Keterangan', K.clean(r.KETERANGAN) || '—'],
      ['Status Arsip Berkas', K.clean(r.STATUS_ARSIP_BERKAS) || '—'],
      ['Status Arsip Putusan', K.clean(r.STATUS_ARSIP_PUTUSAN) || '—'],
      ['Box Arsip', K.clean(r.BOX_ARSIP) || '—'],
      ['Catatan Anomali', K.clean(r.CATATAN_ANOMALI) || '—']
    ];
    var dl = '<dl class="detail-grid">' + items.map(function (it) {
      return '<div><dt>' + E(it[0]) + '</dt><dd>' + E(it[1]) + '</dd></div>';
    }).join('') + '</dl>';

    var agenda = AGENDA.get(K.clean(r.NO)) || [];
    var tl;
    if (!agenda.length) {
      tl = '<p class="table-hint">Belum ada agenda sidang yang tercatat untuk kasus ini.</p>';
    } else {
      tl = '<ol class="timeline">' + agenda.map(function (a) {
        var p = parseTanggal(a.AGENDA_RAW);
        var judul = p.text || K.clean(a.AGENDA_RAW) || '—';
        var note = p.text ? p.note : '';
        return '<li><div class="tl-date">Agenda ke-' + E(a.AGENDA_KE) + ' · ' + E(judul) + '</div>' +
          (note ? '<div class="tl-note">' + E(note) + '</div>' : '') + '</li>';
      }).join('') + '</ol>';
    }

    return dl + '<p class="detail-subhead">Linimasa agenda sidang (' + agenda.length + ')</p>' + tl;
  }

  // ---- render -----------------------------------------------------------
  function render() {
    var f = filterState();
    var rows = apply(f);
    var rowsTanpaTahun = apply(f, { abaikanTahun: true });

    var denganAgenda = rows.filter(function (r) { return r._jumlahAgenda > 0; });
    var rerata = denganAgenda.length
      ? (denganAgenda.reduce(function (s, r) { return s + r._jumlahAgenda; }, 0) / denganAgenda.length)
      : 0;
    var perJalur = K.countBy(rows, function (r) { return r._jalur; });

    K.renderKpi('s-kpi', [
      { title: 'Total Kasus', value: K.num(rows.length), sub: 'sesuai filter aktif' },
      {
        title: 'Rata-rata Sidang', value: rerata ? rerata.toFixed(1).replace('.', ',') : '—',
        sub: 'agenda per kasus, dari ' + K.num(denganAgenda.length) + ' kasus yang punya agenda'
      },
      { title: 'Mediasi', value: K.num(perJalur.get('Mediasi') || 0), sub: 'kasus jalur mediasi', color: JALUR_WARNA.Mediasi },
      { title: 'Ajudikasi', value: K.num(perJalur.get('Ajudikasi') || 0), sub: 'kasus jalur ajudikasi', color: JALUR_WARNA.Ajudikasi },
      { title: 'Pencabutan', value: K.num(perJalur.get('Pencabutan') || 0), sub: 'kasus dicabut', color: JALUR_WARNA.Pencabutan },
      { title: 'Cakupan Tahun', value: K.num(K.uniqueCount(rows, function (r) { return r._tahun; })), sub: 'tahun tercakup' }
    ]);

    chartTren(rowsTanpaTahun);
    chartJalur(rows);
    chartAmar(rows);
    chartTermohon(rows);

    table.setRows(rows, f.terms);
  }

  // ---- init -------------------------------------------------------------
  function init(kasus, agenda) {
    ROWS = kasus.filter(function (r) { return !K.isBlank(r.NO); }).map(function (r) {
      r._tahun = K.clean(r.TAHUN);
      r._jalur = normalJalur(r.HASIL_JALUR);
      r._amar = normalAmar(r.AMAR_PUTUSAN, r._jalur);
      r._termohon = K.orUnknown(r.TERMOHON);
      r._jumlahAgenda = parseInt(r.JUMLAH_AGENDA_SIDANG, 10) || 0;
      r._blob = K.buildBlob(r, CARI_KOLOM);
      return r;
    });

    agenda.forEach(function (a) {
      var k = K.clean(a.NO_KASUS);
      if (!k) return;
      if (!AGENDA.has(k)) AGENDA.set(k, []);
      AGENDA.get(k).push(a);
    });
    AGENDA.forEach(function (list) {
      list.sort(function (x, y) { return (parseInt(x.AGENDA_KE, 10) || 0) - (parseInt(y.AGENDA_KE, 10) || 0); });
    });

    K.fillSelect('s-tahun', Array.from(new Set(ROWS.map(function (r) { return r._tahun; })))
      .filter(Boolean).sort(), 'Semua tahun');
    K.fillSelect('s-jalur', JALUR_BAKU.concat([K.BELUM]).filter(function (v) {
      return ROWS.some(function (r) { return r._jalur === v; });
    }));
    syncAmarOptions();

    table = new K.DataTable({
      table: 's-table', count: 's-count', more: 's-more', pageSize: 200,
      totalLabel: 'kasus',
      detail: detailHtml,
      columns: [
        { label: 'NO', align: 'num', value: function (r) { return K.clean(r.NO); }, sort: function (r) { return parseInt(r.NO, 10) || 0; }, highlight: false },
        { label: 'Tahun', align: 'num', value: function (r) { return r._tahun; }, sort: function (r) { return parseInt(r._tahun, 10) || 0; }, highlight: false },
        { label: 'Register', value: function (r) { return K.clean(r.REGISTER); } },
        { label: 'Pemohon', value: function (r) { return K.clean(r.PEMOHON); } },
        { label: 'Termohon', value: function (r) { return r._termohon; } },
        {
          label: 'Jml Sidang', align: 'num',
          value: function (r) { return String(r._jumlahAgenda); },
          sort: function (r) { return r._jumlahAgenda; },
          highlight: false
        },
        {
          label: 'Hasil / Jalur',
          value: function (r) { return r._jalur; },
          html: function (r) {
            return '<span class="pill ' + (JALUR_PILL[r._jalur] || 'pill-none') + '">' +
              K.escapeHtml(r._jalur) + '</span>';
          }
        },
        { label: 'Amar Putusan', value: function (r) { return r._amar; }, highlight: false }
      ]
    });
    table.setTotal(ROWS.length);

    var rerender = function () { K.requestRender('sidang'); };
    document.getElementById('s-jalur').addEventListener('change', function () {
      syncAmarOptions();
      rerender();
    });
    ['s-tahun', 's-amar'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', rerender);
    });
    document.getElementById('s-cari').addEventListener('input', K.debounce(rerender, 200));
    document.getElementById('s-reset').addEventListener('click', function () {
      document.getElementById('s-cari').value = '';
      document.getElementById('s-tahun').value = 'ALL';
      document.getElementById('s-jalur').value = 'ALL';
      syncAmarOptions();
      document.getElementById('s-amar').value = 'ALL';
      rerender();
    });
  }

  K.registerTab('sidang', { init: init, render: render, needsData: true });
})(window.KIP);
