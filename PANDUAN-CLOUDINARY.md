# Menghubungkan galeri dengan Cloudinary

Aplikasi mengambil foto langsung dari folder Media Library Cloudinary. **Tidak perlu mengedit metadata atau menambahkan tag pada foto yang sudah diunggah.** Daftar foto diambil oleh Vercel Function menggunakan Cloudinary Admin API.

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

Foto yang sudah ada di dalam masing-masing folder akan ditemukan otomatis.

## Menjalankan lokal

Isi `.env.local` di root proyek dengan:

```env
CLOUDINARY_CLOUD_NAME=cloud_name_dari_dashboard
CLOUDINARY_API_KEY=api_key_dari_dashboard
CLOUDINARY_API_SECRET=api_secret_dari_dashboard
```

Jalankan `npm run preview:local-api`, lalu buka `http://localhost:4173`. Perintah ini membangun frontend dan menjalankan endpoint API lokal, tanpa perlu instal Vercel CLI. Setiap perubahan kode frontend perlu dijalankan ulang dengan perintah tersebut. Jangan pernah membagikan atau melakukan commit terhadap API Secret.
