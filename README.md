---
title: Dashboard Sengketa Informasi KIP
emoji: 📊
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
---

# Dashboard Sengketa Informasi Publik

Dashboard statis (HTML + JavaScript + Plotly.js) untuk data sengketa informasi di
Sekretariat Komisi Informasi Pusat. Tidak ada backend dan tidak ada build step —
semua parsing CSV, filter, agregasi, dan render jalan di browser, jadi cocok untuk
Hugging Face Spaces dengan SDK **static**.

Aplikasinya punya dua tab:

| Tab | Isi |
| --- | --- |
| **Permohonan** | Permohonan penyelesaian sengketa informasi (PSI) yang masuk |
| **Buku Besar Sidang** | Proses persidangan tiap kasus + linimasa agenda sidangnya |
| **Alur & Aturan** | Alur proses penyelesaian sengketa (9 fase), tenggat waktu, dan rujukan pasal |

## Struktur file

```
index.html              kerangka halaman (dua tab)
assets/app.css          gaya
assets/core.js          util bersama: baca CSV, pencarian, tabel, util grafik, tab
assets/tab-permohonan.js  tab 1
assets/tab-sidang.js      tab 2
assets/tab-alur.js        tab 3 (isi alur + rujukan pasal, statis)
data/sengketa_informasi.csv   data permohonan
data/sidang_kasus.csv         data kasus (satu baris per kasus)
data/sidang_agenda.csv        data agenda sidang (satu baris per tanggal sidang)
```

Tidak ada data yang di-hardcode di JavaScript. Yang ada di kode hanya **kosakata
baku** (daftar opsi Jenis Pemohon, Hasil/Jalur, dan Amar Putusan) plus pemetaan
warnanya.

## Fitur tiap tab

### Permohonan & Buku Besar Sidang

Keduanya punya pola yang sama: kartu filter (pencarian bebas + dropdown + tombol
**Reset filter**) → baris kartu KPI → grafik → tabel data yang bisa disortir.
Semua filter berlaku ke KPI, grafik, dan tabel sekaligus.

**Pencarian bebas.** Beberapa kata dipisah spasi dicocokkan sekaligus (semua kata
harus cocok, tidak peduli besar-kecil huruf). Potongan yang cocok ditandai di
tabel. Tab Permohonan mencari di nomor registrasi, pemohon, badan publik, dan
informasi yang diminta; tab Sidang mencari di nomor register/pendaftaran/
identifikasi, pemohon, dan termohon.

**Tabel.** Klik judul kolom untuk mengurutkan (klik lagi untuk membalik arah).
Baris dimuat 200 sekaligus lewat tombol "Muat 200 baris lagi" supaya tabel ribuan
baris tetap ringan. Di tab Sidang, klik baris kasus untuk membuka detail kasus dan
**linimasa agenda sidang** dari `sidang_agenda.csv`, urut berdasarkan `AGENDA_KE`.

**Grafik tren per tahun** sengaja tetap menampilkan seluruh tahun (hanya mengikuti
filter lain dan pencarian) supaya bentuk trennya tetap terbaca saat satu tahun
dipilih.

### Alur & Aturan

Tab rujukan, bukan tab data — tidak membaca CSV sama sekali, jadi tetap bisa
dibuka walau pemuatan data gagal. Isinya:

- Ringkasan (gratis, maksimal 100 hari kerja, 3 jenis putusan), legenda warna,
  dan glosarium istilah (Panitera, Majelis Komisioner, Mediator, Termohon).
- Alur vertikal **9 fase (00–08)**, dari permohonan informasi ke PPID sampai
  upaya hukum dan eksekusi. Tiap tahapan berupa kartu dengan badge tenggat waktu
  dan badge rujukan pasal; sebagian punya bagian "detail lebih lanjut" yang bisa
  dibuka-tutup.
- Titik percabangan tampil sebagai dua kolom berdampingan dengan label **ATAU**
  di tengah, dan menumpuk jadi satu kolom di layar sempit.
- Kode warna: **biru** = tahapan proses berlanjut, **hijau** = titik akhir
  berhasil (putusan/kesepakatan terbit), **merah** = titik berhenti (gugur,
  ditolak, dicabut), **kuning kecokelatan** = badge tenggat waktu.

Sumbernya PERKI No. 1 Tahun 2013 dan UU No. 14 Tahun 2008. Seluruh teksnya ada
di satu struktur data di `assets/tab-alur.js`, jadi mengoreksi isi alur atau
nomor pasal cukup mengubah array `FASE` di file itu. Tab ini catatan kerja
internal, bukan pendapat hukum resmi.

## Bagaimana data mentah diperlakukan

- **Nilai kosong tidak disembunyikan.** `HASIL_JALUR` dan `AMAR_PUTUSAN` yang
  kosong ditampilkan sebagai **"Belum diklasifikasi"** — ikut dihitung di KPI,
  muncul di grafik dengan warna abu-abu netral, dan bisa dipilih di dropdown.
  Sebagian besar baris memang belum terklasifikasi, jadi kategori ini biasanya
  yang terbesar; itu memang keadaan datanya.
- **Kosakata baku dipakai apa adanya.** Jenis Pemohon: `Badan Hukum`,
  `Perseorangan`, `Kelompok Orang`. Hasil/Jalur: `Mediasi`, `Ajudikasi`,
  `Pencabutan`. Amar Putusan: `Putusan Mediasi` (Mediasi); `Dikabulkan
  Seluruhnya`, `Dikabulkan Sebagian`, `Ditolak Seluruhnya`, `Putusan Gugur`,
  `Putusan Sela` (Ajudikasi); `Pencabutan`, `Pencabutan Saat Sidang`
  (Pencabutan). Dropdown **Amar Putusan menyesuaikan jalur** yang sedang dipilih.
- **Varian ejaan dirapikan, yang ambigu tidak ditebak.** Di kolom
  `JENIS_PEMOHON`, penulisan seperti "Perorangan" dan "Orang Pribadi" dipetakan ke
  `Perseorangan`. Nilai yang tidak jelas masuk jenis mana (mis. "Kuasa") dibiarkan
  sebagai "Belum diklasifikasi", bukan ditebak.
- **Tanggal agenda ditulis beragam** di data mentah (`2018-05-28 00:00:00`,
  `22/2/2021 (Mediasi kedua)`, `19 Maret 2021 (P. Putusan)`). Yang bisa dibaca
  ditampilkan sebagai tanggal Indonesia, sisa teksnya tetap ditampilkan apa adanya
  sebagai catatan. Yang tidak terbaca ditampilkan mentah, tidak dibuang.

## Memperbarui data

Cukup ganti isi CSV di `data/` — kode tidak perlu disentuh. Pertahankan nama
header kolomnya (dashboard membaca berdasarkan nama kolom, bukan posisi), dan
jaga `NO_KASUS` di `sidang_agenda.csv` tetap merujuk ke `NO` di
`sidang_kasus.csv`.

## Menjalankan lokal

`fetch()` butuh HTTP, jadi jangan buka `index.html` dengan klik ganda:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.
