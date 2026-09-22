---
title: Dashboard Sengketa Informasi KIP
emoji: 📊
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
---

# Dashboard Sengketa Informasi Publik

Dashboard statis (HTML + JavaScript + Plotly.js) untuk melihat tren dan distribusi
permohonan penyelesaian sengketa informasi (PSI) yang tercatat di Sekretariat
Komisi Informasi Pusat. Tidak butuh server Python — semua render & filter jalan
langsung di browser, jadi cocok untuk SDK **static** di Hugging Face Spaces.

## Filter & pencarian

- **Cari** — kotak teks bebas di kiri filter bar. Mencari ke kolom nomor registrasi,
  pemohon, jenis pemohon, alamat pemohon, badan publik (termasuk nama mentah &
  unit kerja), kategori badan publik, metode pendaftaran, penerima, informasi yang
  diminta, klasifikasi, dan tahun. Beberapa kata dipisah spasi dicari sekaligus —
  semua kata harus cocok (AND), tidak peduli besar-kecil huruf. Teks yang cocok
  ditandai di tabel.
- **Tahun / Jenis Pemohon / Klasifikasi Informasi** — dropdown seperti sebelumnya.
- **Reset filter** — mengosongkan kotak pencarian dan mengembalikan semua dropdown
  ke "Semua".

Semua filter berlaku ke KPI, grafik, dan tabel sekaligus. Grafik tren per tahun
sengaja tetap menampilkan seluruh tahun (hanya mengikuti pencarian, jenis pemohon,
dan klasifikasi) supaya bentuk trennya tetap terbaca.

## Isi

- `index.html` — dashboard-nya (baca data lewat `fetch`, jadi tidak perlu di-build ulang tiap ganti data)
- `data/sengketa_informasi.csv` — data sumber. Kolom **NO, TAHUN** diikuti field lain.

## Memperbarui data

1. Buka `data/sengketa_informasi.csv`.
2. Gabungkan (merge) data tahun berjalan ke file ini secara manual — pertahankan
   urutan kolom **NO, TAHUN, ...** dan nama header apa adanya (dashboard membaca
   berdasarkan nama kolom, bukan posisi).
3. Upload ulang / commit ke Space ini di Hugging Face. Tidak perlu mengubah
   `index.html`.

## Menjalankan lokal

Buka `index.html` lewat server statis lokal (bukan langsung double-click file,
karena `fetch()` butuh HTTP, bukan `file://`), misalnya:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.
