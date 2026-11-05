export const albums = [
  {
    id: 'akad',
    path: '/akad',
    title: 'Akad',
    category: 'Momen sakral',
    description: 'Hari ketika dua doa menjadi satu.',
    folder: 'AKAD',
    cover: '',
  },
  {
    id: 'wanita-arakan',
    path: '/wanita-arakan',
    title: 'Wanita — Arakan',
    category: 'Sisi mempelai wanita',
    description: 'Langkah-langkah penuh haru menuju hari bahagia.',
    folder: 'Wanita - Arakan',
    cover: '',
  },
  {
    id: 'wanita-couple',
    path: '/wanita-couple',
    title: 'Wanita — Couple',
    category: 'Sisi mempelai wanita',
    description: 'Potret berdua, dengan cerita yang tak habis dikenang.',
    folder: 'Wanita - Couple',
    cover: '',
  },
  {
    id: 'wanita-keluarga-tamu',
    path: '/wanita-keluarga-tamu',
    title: 'Wanita — Keluarga & Tamu',
    category: 'Sisi mempelai wanita',
    description: 'Hangatnya keluarga dan sahabat yang hadir.',
    folder: 'Wanita - Keluarga x Tamu',
    cover: '',
  },
  {
    id: 'pria-arakan',
    path: '/pria-arakan',
    title: 'Pria — Arakan',
    category: 'Sisi mempelai pria',
    description: 'Perjalanan menuju sebuah janji seumur hidup.',
    folder: 'Pria - Arakan',
    cover: '',
  },
  {
    id: 'pria-couple',
    path: '/pria-couple',
    title: 'Pria — Couple',
    category: 'Sisi mempelai pria',
    description: 'Tentang kami, dan semua yang menanti di depan.',
    folder: 'Pria - Couple',
    cover: '',
  },
  {
    id: 'pria-keluarga-tamu',
    path: '/pria-keluarga-tamu',
    title: 'Pria — Keluarga & Tamu',
    category: 'Sisi mempelai pria',
    description: 'Momen bersama orang-orang tersayang.',
    folder: 'Pria - Keluarga x Tamu',
    cover: '',
  },
]

let manifestPromise

async function getManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('/data/gallery-manifest.json')
      .then((response) => {
        if (!response.ok) throw new Error('Daftar foto belum tersedia. Jalankan sinkronisasi manifest Cloudinary.')
        return response.json()
      })
      .then((manifest) => {
        if (!manifest.albums || albums.some((album) => !Array.isArray(manifest.albums[album.id]))) {
          throw new Error('Manifest foto belum lengkap. Jalankan sinkronisasi manifest Cloudinary.')
        }
        return manifest
      })
      .catch((error) => {
        manifestPromise = null
        throw error
      })
  }
  return manifestPromise
}

export function cloudinaryReady() {
  return true
}

export async function getAlbumPhotos(albumId, { limit = 500, cursor = 0 } = {}) {
  const manifest = await getManifest()
  const albumPhotos = manifest.albums?.[albumId]
  if (!albumPhotos) throw new Error(`Daftar foto album "${albumId}" tidak ditemukan di manifest.`)

  const start = Number.parseInt(cursor, 10) || 0
  const photos = albumPhotos.slice(start, start + limit)
  const nextOffset = start + photos.length
  return {
    photos,
    nextCursor: nextOffset < albumPhotos.length ? String(nextOffset) : null,
  }
}

export async function getAlbumPreviewPhotos() {
  const manifest = await getManifest()
  return Object.fromEntries(albums.map((album) => [album.id, manifest.albums?.[album.id]?.[0] || null]))
}

export async function getFeaturedPhotos() {
  const manifest = await getManifest()
  const previews = albums.map((album) => (manifest.albums?.[album.id] || []).slice(0, 6))
  return previews.flat().sort(() => Math.random() - 0.5).slice(0, 6)
}
