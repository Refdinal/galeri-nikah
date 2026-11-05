# Sinkronisasi daftar foto Cloudinary

Galeri menggunakan manifest statis di `public/data/gallery-manifest.json`. Pengunjung membaca manifest melalui CDN; halaman album dan tombol **Muat foto lainnya** tidak memanggil Cloudinary Admin API.

## Kapan harus sinkronisasi

Jalankan sinkronisasi setiap kali ada foto baru, foto dihapus, atau perubahan album/folder yang ingin ditampilkan di galeri.

## Langkah-langkah

1. Pastikan `.env.local` berisi kredensial Cloudinary berikut:

   ```env
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

2. Dari root proyek, jalankan:

   ```sh
   npm run sync:cloudinary
   ```

3. Periksa ringkasan jumlah foto per album di terminal dan pastikan `public/data/gallery-manifest.json` diperbarui.
4. Commit dan deploy manifest bersama perubahan proyek.

Sinkronisasi menelusuri seluruh halaman hasil untuk setiap album. Album dengan sampai 500 foto biasanya membutuhkan satu permintaan Admin API; album yang lebih besar membutuhkan permintaan tambahan per halaman. Sinkronisasi bersifat manual dan jangan dijalankan setiap kali pengunjung membuka galeri.

## Catatan limit Cloudinary

- Cloudinary Admin API memiliki batas operasi per jam. Jika script menampilkan `Rate Limit Exceeded`, tunggu sampai waktu reset yang tercantum di pesan error lalu ulangi perintah sinkronisasi.
- Script mempertahankan data manifest sebelumnya untuk album yang gagal diperbarui. Untuk pembuatan manifest pertama, seluruh album harus berhasil disinkronkan.
- Saat implementasi pertama, sinkronisasi tertahan oleh limit 500 operasi. Jalankan `npm run sync:cloudinary` setelah limit tersebut pulih untuk membuat manifest awal.
- Jangan pernah commit atau membagikan `.env.local` maupun `CLOUDINARY_API_SECRET`.

## Pratinjau lokal

Setelah manifest tersedia, jalankan:

```sh
npm run dev
```

Perubahan manifest akan langsung dibaca ulang setelah halaman direfresh. Di production, manifest di-cache oleh CDN; deploy manifest baru agar daftar foto terbaru tersedia.
