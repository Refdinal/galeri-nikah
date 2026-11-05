# Menghubungkan galeri dengan Cloudinary

Aplikasi menampilkan foto dari manifest statis yang disimpan di `public/data/gallery-manifest.json`. Pengunjung hanya meminta manifest melalui CDN; daftar foto tidak diambil dari Cloudinary Admin API setiap kali halaman dibuka.

## Variabel Cloudinary di Vercel

Di Cloudinary Dashboard, salin **Cloud name**, **API Key**, dan **API Secret**. Di Vercel buka **Project Settings → Environment Variables** dan tambahkan:

- `CLOUDINARY_CLOUD_NAME` — Cloud name.
- `CLOUDINARY_API_KEY` — API Key.
- `CLOUDINARY_API_SECRET` — API Secret.

Pilih environment yang dipakai (Production, dan Preview jika perlu), simpan, lalu deploy ulang. API Secret dipakai server saja; jangan gunakan prefix `VITE_` dan jangan masukkan ke kode frontend.

Folder album harus berada di root dan bernama:

- `AKAD`
- `Wanita - Arakan`
- `Wanita - Couple`
- `Wanita - Keluarga x Tamu`
- `Pria - Arakan`
- `Pria - Couple`
- `Pria - Keluarga x Tamu`

Foto yang sudah ada di dalam masing-masing folder akan ditemukan saat menjalankan sinkronisasi.

## Memperbarui daftar foto (manual)

Setiap kali ada foto baru atau perubahan folder di Cloudinary:

1. Pastikan variabel `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET` tersedia di `.env.local` (lihat format di bawah).
2. Jalankan `npm run sync:cloudinary` dari root proyek. Script mengambil daftar semua foto per album dan memperbarui `public/data/gallery-manifest.json`.
3. Commit dan deploy manifest yang diperbarui bersama perubahan proyek.

Sinkronisasi membuat satu permintaan Cloudinary Search per halaman hasil tiap album. Untuk album berisi sampai 500 foto, satu sinkronisasi memakai satu permintaan per album. Membuka galeri dan menekan tombol “Muat foto lainnya” tidak menggunakan Admin API.

## Menjalankan lokal

Isi `.env.local` di root proyek dengan:

```env
CLOUDINARY_CLOUD_NAME=cloud_name_dari_dashboard
CLOUDINARY_API_KEY=api_key_dari_dashboard
CLOUDINARY_API_SECRET=api_secret_dari_dashboard
```

Jalankan `npm run sync:cloudinary` untuk membuat manifest, lalu `npm run dev` untuk pratinjau lokal. Jangan pernah membagikan atau melakukan commit terhadap API Secret.
