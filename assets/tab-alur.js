/* tab-alur.js — tab 3: alur & aturan penyelesaian sengketa informasi publik.
   Isinya statis (rujukan peraturan, bukan data CSV), disimpan sebagai struktur
   data di file ini lalu dirender jadi kartu/percabangan dengan komponen yang
   sama dengan tab lain. */
(function (K) {
  'use strict';

  // Ringkasan di kepala tab.
  var RINGKASAN = [
    { title: 'Biaya Perkara', value: 'Gratis', sub: 'tidak dipungut biaya (Pasal 12)' },
    { title: 'Batas Proses di KI', value: '≤ 100 hk', sub: 'hari kerja sejak sengketa diterima sampai putusan, termasuk mediasi/ajudikasi' },
    { title: 'Jenis Putusan', value: '3', sub: 'Putusan Sela · Putusan Mediasi · Putusan Ajudikasi' }
  ];

  var LEGENDA = [
    ['continue', 'Biru — tahapan proses yang berlanjut ke fase berikutnya'],
    ['success', 'Hijau — titik akhir berhasil: putusan atau kesepakatan terbit'],
    ['stop', 'Merah — titik berhenti: gugur, ditolak, atau dicabut'],
    ['deadline', 'Kuning kecokelatan — badge tenggat waktu wajib']
  ];

  var GLOSARIUM = [
    ['Panitera', 'Sekretaris Komisi Informasi. Mengurus administrasi permohonan, membantu Mediator dan Majelis, serta mencatat jalannya persidangan.'],
    ['Majelis Komisioner', 'Minimal 3 komisioner (jumlah ganjil) yang ditetapkan Ketua KI untuk memeriksa dan memutus satu sengketa.'],
    ['Mediator', 'Komisioner yang membantu perundingan para pihak, tanpa wewenang memutus atau memaksakan kesepakatan.'],
    ['Termohon', 'Badan publik yang disengketakan, diwakili pimpinan, Atasan PPID, atau pejabat yang diberi wewenang mengambil keputusan.']
  ];

  // Tiap fase: kumpulan blok. t = 'card' | 'fork' | 'callout'.
  var FASE = [
    {
      num: '00',
      judul: 'Pra-Sengketa di Badan Publik',
      sub: 'Terjadi sepenuhnya di badan publik, sebelum berkas bisa masuk ke Komisi Informasi.',
      blok: [
        {
          t: 'card',
          judul: 'Permohonan informasi ke PPID',
          teks: ['Pemohon meminta informasi kepada Pejabat Pengelola Informasi dan Dokumentasi (PPID) badan publik terkait.'],
          badges: [
            { k: 'pasal', v: 'UU KIP' },
            { k: 'tenggat', v: '10 hari kerja untuk ditanggapi' },
            { k: 'aktor', v: 'Pemohon → PPID Badan Publik' }
          ]
        },
        {
          t: 'fork',
          q: 'Bagaimana tanggapan PPID?',
          paths: [
            {
              tone: 'success',
              cond: 'Dipenuhi & memuaskan',
              judul: 'Selesai di tingkat badan publik',
              teks: ['Informasi diberikan sesuai permintaan. Tidak ada alasan melanjutkan ke sengketa.']
            },
            {
              tone: 'continue',
              cond: 'Ditolak / tidak lengkap / tidak ditanggapi / biaya tak wajar / terlambat',
              judul: 'Ajukan keberatan tertulis',
              teks: ['Pemohon mengajukan keberatan ke **Atasan PPID** badan publik yang sama.']
            }
          ]
        },
        {
          t: 'card',
          judul: 'Keberatan ke Atasan PPID',
          teks: ['Diajukan dalam **30 hari kerja** sejak tanggapan atau penolakan PPID diterima. Atasan PPID kemudian punya **30 hari kerja** untuk menanggapi keberatan tersebut.'],
          badges: [
            { k: 'tenggat', v: 'Diajukan: 30 hari kerja sejak tanggapan diterima' },
            { k: 'tenggat', v: 'Atasan PPID: 30 hari kerja untuk menanggapi' },
            { k: 'aktor', v: 'Pemohon → Atasan PPID' }
          ]
        }
      ]
    },

    {
      num: '01',
      judul: 'Permohonan Sengketa ke Komisi Informasi',
      sub: 'Di sinilah berkas pertama kali masuk ke Komisi Informasi.',
      blok: [
        {
          t: 'card',
          judul: 'Syarat & batas waktu mengajukan',
          teks: ['Sengketa boleh diajukan jika Pemohon **tidak puas** atas tanggapan Atasan PPID, atau **tidak mendapat tanggapan** dalam 30 hari kerja.'],
          badges: [
            { k: 'pasal', v: 'Pasal 5 & 13' },
            { k: 'tenggat', v: 'Maks. 14 hari kerja sejak tanggapan diterima / masa tunggu berakhir' }
          ],
          more: {
            judul: 'Komisi Informasi mana yang berwenang? (Pasal 6)',
            daftar: [
              'KI Pusat — sengketa dengan badan publik tingkat pusat.',
              'KI Provinsi — tingkat provinsi; mengambil alih kewenangan KI Kabupaten/Kota yang belum ada.',
              'KI Kabupaten/Kota — tingkat kabupaten/kota.',
              'KI Pusat mengambil alih jika KI Provinsi setempat belum terbentuk.'
            ]
          }
        },
        {
          t: 'card',
          judul: 'Cara mengajukan',
          teks: ['Tertulis lewat formulir resmi atau surat, atau **lisan** khusus bagi pemohon difabel netra/tuna aksara yang dibantu petugas mengisi formulir. Prosesnya **gratis**.'],
          badges: [{ k: 'pasal', v: 'Pasal 12' }]
        },
        {
          t: 'card',
          judul: '6 alasan resmi permohonan sengketa',
          teks: ['Pemohon mencentang satu atau lebih alasan berikut pada formulir permohonan:'],
          daftar: [
            'Atasan PPID menolak permohonan dengan alasan pengecualian informasi (Pasal 17 UU KIP).',
            'Badan publik tidak menyediakan informasi berkala (Pasal 9 UU KIP).',
            'Atasan PPID tidak menanggapi keberatan.',
            'Pemohon tidak puas atas tanggapan Atasan PPID.',
            'Pengenaan biaya yang tidak wajar.',
            'Penyampaian informasi melebihi batas waktu yang diatur UU KIP.'
          ],
          badges: [{ k: 'pasal', v: 'Checklist formulir' }]
        },
        {
          t: 'card',
          judul: 'Dokumen yang wajib dilampirkan',
          teks: ['Identitas, alamat, kontak, uraian alasan, dan hal yang dimohonkan (Pasal 10); ditambah identitas sah, bukti permohonan informasi, dan bukti keberatan (Pasal 11).'],
          badges: [{ k: 'pasal', v: 'Pasal 10 & 11' }]
        }
      ]
    },

    {
      num: '02',
      judul: 'Registrasi oleh Panitera',
      sub: 'Panitera memeriksa kelengkapan berkas sebelum sengketa resmi terdaftar.',
      blok: [
        {
          t: 'card',
          judul: 'Pemeriksaan kelengkapan dokumen',
          teks: [
            'Jika lengkap, Panitera menerbitkan **Akta Registrasi Sengketa** dengan format nomor `REG-PSI/bulan/tahun`.',
            'Jika tidak lengkap, Panitera mengirim **Surat Pemberitahuan Ketidaklengkapan Dokumen** dan Pemohon diberi waktu melengkapinya.'
          ],
          badges: [
            { k: 'pasal', v: 'Pasal 17' },
            { k: 'tenggat', v: 'Surat ketidaklengkapan: maks. 3 hari kerja sejak permohonan diterima' },
            { k: 'tenggat', v: 'Pemohon melengkapi: 7 hari kerja' }
          ]
        },
        {
          t: 'fork',
          q: 'Setelah 7 hari kerja, apa yang masih kurang?',
          paths: [
            {
              tone: 'stop',
              cond: 'Dokumen identitas tetap tidak lengkap',
              judul: 'Tidak diregistrasi',
              teks: ['Permohonan tidak didaftarkan. Proses berhenti di sini.']
            },
            {
              tone: 'continue',
              cond: 'Hanya bukti permohonan/keberatan yang kurang, DAN alasannya badan publik tidak melayani sebagaimana mestinya',
              judul: 'Tetap diregistrasi',
              pasal: 'Pasal 18',
              teks: ['Berkas tetap didaftarkan; sah atau tidaknya alasan ini baru diputus nanti di sidang ajudikasi.']
            }
          ]
        },
        {
          t: 'card',
          tone: 'stop',
          judul: 'Hak mencabut permohonan',
          teks: ['Kapan pun **sebelum sidang pembacaan putusan**, Pemohon boleh mencabut permohonannya. Panitera menerbitkan **Akta Pembatalan Registrasi**, dan sengketa yang sama **tidak bisa diajukan lagi**.'],
          badges: [{ k: 'pasal', v: 'Pasal 14 & 15(4)' }]
        }
      ]
    },

    {
      num: '03',
      judul: 'Sidang Pertama: Pemeriksaan Awal',
      sub: 'Majelis Komisioner memeriksa keabsahan perkara sebelum masuk ke pokok sengketa.',
      blok: [
        {
          t: 'card',
          judul: '4 hal yang diperiksa Majelis',
          daftar: [
            'Kewenangan Komisi Informasi yang bersangkutan.',
            'Kedudukan hukum (legal standing) Pemohon.',
            'Kedudukan hukum (legal standing) Termohon.',
            'Kepatuhan terhadap batas waktu pengajuan.'
          ],
          badges: [{ k: 'pasal', v: 'Pasal 35–36' }]
        },
        {
          t: 'fork',
          q: 'Apakah keempatnya terpenuhi?',
          paths: [
            {
              tone: 'stop',
              cond: 'Salah satu tidak terpenuhi',
              judul: 'Putusan Sela',
              teks: ['Majelis langsung menjatuhkan Putusan Sela, menerima atau menolak permohonan. Proses berhenti di sini.']
            },
            {
              tone: 'continue',
              cond: 'Semua terpenuhi',
              judul: 'Lanjut ke pokok sengketa',
              teks: ['Perkara sah untuk diperiksa lebih lanjut — berlanjut ke penentuan jalur di Fase 04.']
            }
          ]
        }
      ]
    },

    {
      num: '04',
      judul: 'Menentukan Jalur',
      sub: 'Jenis alasan sengketa menentukan apakah perkara wajib lewat mediasi atau tidak.',
      blok: [
        {
          t: 'fork',
          q: 'Apa alasan sengketanya?',
          paths: [
            {
              tone: 'continue',
              cond: 'Bukan soal pengecualian informasi',
              judul: 'Wajib mediasi dulu',
              pasal: 'Pasal 29 & 37',
              teks: ['Berlanjut ke Fase 05 — Mediasi.']
            },
            {
              tone: 'continue',
              cond: 'Soal pengecualian informasi (Pasal 35(1)(a) UU KIP)',
              judul: 'Langsung ke pokok sengketa',
              pasal: 'Pasal 34',
              teks: ['Tanpa mediasi — langsung uji konsekuensi, lalu (jika terbukti dikecualikan) uji kepentingan publik. Lompat ke Fase 06 — Ajudikasi.']
            }
          ]
        }
      ]
    },

    {
      num: '05',
      judul: 'Mediasi',
      sub: 'Perundingan tertutup dipimpin Mediator, tanpa kewenangan memaksakan kesepakatan.',
      blok: [
        {
          t: 'card',
          judul: 'Pelaksanaan',
          teks: ['Dimulai pada hari yang sama dengan sidang pertama — dapat ditunda maksimal 3 hari kerja atas kesepakatan para pihak. Bersifat tertutup, kecuali para pihak sepakat lain.'],
          badges: [
            { k: 'pasal', v: 'Pasal 41' },
            { k: 'tenggat', v: '14 hari kerja sejak pertemuan pertama' },
            { k: 'tenggat', v: 'Dapat diperpanjang 1× untuk 7 hari kerja' }
          ]
        },
        {
          t: 'callout',
          judul: 'Catatan penting — Pasal 50',
          teks: 'Apa pun yang terungkap selama mediasi **tidak bisa dijadikan alat bukti**, baik di sidang ajudikasi maupun di pengadilan.'
        },
        {
          t: 'fork',
          q: 'Bagaimana hasilnya?',
          paths: [
            {
              tone: 'success',
              cond: 'Para pihak sepakat',
              judul: 'Putusan Mediasi',
              pasal: 'Pasal 47',
              teks: ['Majelis Komisioner menuangkan kesepakatan menjadi Putusan Mediasi. Lanjut ke Fase 07 — Putusan.']
            },
            {
              tone: 'continue',
              cond: 'Gagal — salah satu pihak menyatakan gagal, menarik diri, waktu habis, atau Termohon tak hadir 2×',
              judul: 'Pernyataan Mediasi Gagal',
              pasal: 'Pasal 48–49',
              teks: ['Mediator menerbitkan Pernyataan Mediasi Gagal. Proses lanjut ke Fase 06 — Ajudikasi.']
            }
          ]
        }
      ]
    },

    {
      num: '06',
      judul: 'Ajudikasi — Pemeriksaan Pokok Sengketa',
      sub: 'Sidang substansi: ditempuh setelah mediasi gagal, atau langsung jika sengketanya soal pengecualian informasi.',
      blok: [
        {
          t: 'card',
          judul: 'Sifat persidangan',
          teks: ['Terbuka untuk umum, **kecuali** saat pemeriksaan dokumen yang dikecualikan — bagian itu tertutup, dan Pemohon tidak boleh melihat dokumen tersebut.'],
          badges: [{ k: 'pasal', v: 'Pasal 26' }]
        },
        {
          t: 'card',
          judul: 'Alat bukti yang diakui',
          daftar: [
            'Surat.',
            'Keterangan saksi.',
            'Keterangan ahli.',
            'Keterangan Pemohon atau Termohon.',
            'Petunjuk.',
            'Informasi elektronik.'
          ],
          badges: [{ k: 'pasal', v: 'Pasal 51' }]
        },
        {
          t: 'fork',
          q: 'Bagaimana kehadiran para pihak?',
          paths: [
            {
              tone: 'stop',
              cond: 'Pemohon tidak hadir 2× tanpa alasan jelas',
              judul: 'Permohonan gugur',
              pasal: 'Pasal 30',
              teks: ['Proses berhenti — permohonan dinyatakan gugur.']
            },
            {
              tone: 'continue',
              cond: 'Termohon tidak hadir',
              judul: 'Sidang tetap berjalan',
              pasal: 'Pasal 31',
              teks: ['Majelis tetap memeriksa dan memutus perkara tanpa kehadiran Termohon.']
            }
          ]
        },
        {
          t: 'card',
          judul: 'Musyawarah Majelis',
          teks: ['Bersifat tertutup dan rahasia. Jika ada anggota Majelis yang berpendapat berbeda, pendapatnya dilampirkan pada putusan sebagai *dissenting opinion*.'],
          badges: [{ k: 'pasal', v: 'Pasal 58' }]
        }
      ]
    },

    {
      num: '07',
      judul: 'Putusan',
      sub: 'Hasil musyawarah Majelis dibacakan secara resmi.',
      blok: [
        {
          t: 'card',
          tone: 'success',
          judul: 'Putusan Ajudikasi',
          teks: ['Diucapkan dalam sidang yang terbuka untuk umum, dan tidak boleh memuat informasi yang dikecualikan.'],
          badges: [
            { k: 'pasal', v: 'Pasal 59' },
            { k: 'tenggat', v: 'Salinan ke para pihak: maks. 3 hari kerja sejak dibacakan' },
            { k: 'aktor', v: 'Dimuat di situs resmi KI (JDIH) setelahnya' }
          ]
        },
        {
          t: 'callout',
          judul: 'Batas waktu keseluruhan',
          teks: 'Sejak permohonan sengketa diterima Komisi Informasi sampai putusan, seluruh proses — termasuk mediasi dan/atau ajudikasi — dibatasi maksimal **100 hari kerja**.'
        }
      ]
    },

    {
      num: '08',
      judul: 'Upaya Hukum & Eksekusi',
      sub: 'Putusan KI belum tentu final — ada jendela waktu untuk mengajukan keberatan ke pengadilan.',
      blok: [
        {
          t: 'callout',
          judul: 'Catatan penting — Pasal 60',
          teks: 'Siapa pun pihak — Pemohon **atau** Termohon — yang tidak menerima **putusan apa pun** dari Komisi Informasi, termasuk Putusan Mediasi dan bukan hanya putusan ajudikasi soal informasi yang dikecualikan, berhak mengajukan keberatan ke pengadilan.'
        },
        {
          t: 'fork',
          q: 'Apakah ada pihak yang mengajukan keberatan?',
          paths: [
            {
              tone: 'continue',
              cond: 'Ya, dalam 14 hari sejak salinan putusan diterima',
              judul: 'Keberatan ke pengadilan',
              pasal: 'Pasal 60',
              teks: ['Sengketa berlanjut di ranah peradilan, di luar proses Komisi Informasi.']
            },
            {
              tone: 'success',
              cond: 'Tidak, dalam 14 hari itu tidak ada keberatan',
              judul: 'Berkekuatan hukum tetap',
              teks: ['Putusan menjadi final dan dapat dimintakan **penetapan eksekusi** ke Ketua Pengadilan yang berwenang.']
            }
          ]
        },
        {
          t: 'card',
          judul: 'Jika badan publik tetap tidak melaksanakan putusan tetap',
          teks: ['Pemohon dapat melapor ke PTUN untuk meminta eksekusi. Badan publik yang membangkang berpotensi dikenai sanksi administratif atau pidana sesuai UU KIP.']
        }
      ]
    }
  ];

  var SUMBER = [
    '**Sumber:** Peraturan Komisi Informasi Nomor 1 Tahun 2013 tentang Prosedur Penyelesaian Sengketa Informasi Publik, dan Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik. Nomor pasal mengikuti penomoran dalam PERKI 1/2013 kecuali disebut lain.',
    'Disusun sebagai catatan kerja internal, bukan pendapat hukum resmi — untuk kasus konkret rujuk teks lengkap peraturan.'
  ];

  // ---------------------------------------------------------------- render
  // Teks di-escape dulu, lalu penanda ringan diubah jadi markup: **tebal**,
  // *miring*, dan `kode`. Tidak ada HTML mentah yang masuk dari data di atas.
  function rich(teks) {
    return K.escapeHtml(teks)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function paragraf(daftarTeks) {
    return (daftarTeks || []).map(function (t) { return '<p>' + rich(t) + '</p>'; }).join('');
  }

  function daftarPoin(items) {
    if (!items || !items.length) return '';
    return '<ul class="flow-list">' + items.map(function (t) {
      return '<li>' + rich(t) + '</li>';
    }).join('') + '</ul>';
  }

  function badges(list) {
    if (!list || !list.length) return '';
    return '<div class="flow-badges">' + list.map(function (b) {
      return '<span class="badge-flow badge-' + b.k + '">' + rich(b.v) + '</span>';
    }).join('') + '</div>';
  }

  function kartu(b) {
    var kelas = 'flow-card' + (b.tone ? ' flow-card-' + b.tone : '');
    var more = '';
    if (b.more) {
      more = '<details class="flow-more"><summary>' + K.escapeHtml(b.more.judul) + '</summary>' +
        '<div class="more-body">' + paragraf(b.more.teks) + daftarPoin(b.more.daftar) + '</div></details>';
    }
    return '<article class="' + kelas + '">' +
      '<h4>' + K.escapeHtml(b.judul) + '</h4>' +
      paragraf(b.teks) + daftarPoin(b.daftar) + badges(b.badges) + more +
      '</article>';
  }

  function jalur(p) {
    return '<div class="path path-' + p.tone + '">' +
      '<span class="path-cond">' + K.escapeHtml(p.cond) + '</span>' +
      '<h4>' + K.escapeHtml(p.judul) + '</h4>' +
      (p.pasal ? '<div class="flow-badges"><span class="badge-flow badge-pasal">' + K.escapeHtml(p.pasal) + '</span></div>' : '') +
      paragraf(p.teks) +
      '</div>';
  }

  function percabangan(b) {
    return '<div class="fork">' +
      '<p class="fork-q">' + K.escapeHtml(b.q) + '</p>' +
      '<div class="fork-paths">' +
        jalur(b.paths[0]) +
        '<div class="fork-divider" aria-hidden="true"><span>ATAU</span></div>' +
        jalur(b.paths[1]) +
      '</div></div>';
  }

  function sorotan(b) {
    return '<div class="flow-callout"><h4>' + K.escapeHtml(b.judul) + '</h4><p>' + rich(b.teks) + '</p></div>';
  }

  function blokHtml(b) {
    if (b.t === 'fork') return percabangan(b);
    if (b.t === 'callout') return sorotan(b);
    return kartu(b);
  }

  function faseHtml(f) {
    return '<section class="phase" id="fase-' + f.num + '">' +
      '<div class="phase-head">' +
        '<span class="phase-num">' + K.escapeHtml(f.num) + '</span>' +
        '<div class="phase-titles"><h3>' + K.escapeHtml(f.judul) + '</h3>' +
        '<p class="phase-sub">' + K.escapeHtml(f.sub) + '</p></div>' +
      '</div>' +
      '<div class="phase-body">' + f.blok.map(blokHtml).join('') + '</div>' +
      '</section>';
  }

  function init() {
    K.renderKpi('a-kpi', RINGKASAN);

    document.getElementById('a-legend').innerHTML =
      '<h3 class="panel-title">Cara membaca alur ini</h3>' +
      '<div class="legend-list">' + LEGENDA.map(function (l) {
        return '<div class="legend-item"><span class="swatch swatch-' + l[0] + '"></span><span>' +
          K.escapeHtml(l[1]) + '</span></div>';
      }).join('') + '</div>';

    document.getElementById('a-glosarium').innerHTML =
      '<h3 class="panel-title">Istilah kunci</h3><dl class="glosarium">' +
      GLOSARIUM.map(function (g) {
        return '<div><dt>' + K.escapeHtml(g[0]) + '</dt><dd>' + K.escapeHtml(g[1]) + '</dd></div>';
      }).join('') + '</dl>';

    document.getElementById('a-nav').innerHTML = FASE.map(function (f) {
      return '<a href="#fase-' + f.num + '">' + K.escapeHtml(f.num + ' · ' + f.judul) + '</a>';
    }).join('');

    document.getElementById('a-flow').innerHTML = FASE.map(faseHtml).join('');

    document.getElementById('a-sumber').innerHTML = paragraf(SUMBER);
  }

  // Isinya statis, jadi cukup digambar sekali di init().
  function render() {}

  K.registerTab('alur', { init: init, render: render });
})(window.KIP);
