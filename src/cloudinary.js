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

export function cloudinaryReady() {
  return true
}

export async function getAlbumPhotos(albumId, { limit, cursor } = {}) {
  const params = new URLSearchParams({ album: albumId })
  if (limit) params.set('limit', String(limit))
  if (cursor) params.set('cursor', cursor)
  const endpoint = `/api/cloudinary-images?${params}`
  const response = await fetch(endpoint)
  if (!response.ok) {
    let detail = ''
    try {
      detail = (await response.json()).error || ''
    } catch {
      // Fallback for non-JSON responses.
    }
    throw new Error(detail || (response.status === 404 ? 'Album belum memiliki foto atau folder belum tersedia.' : 'Foto album belum dapat dimuat.'))
  }

  const data = await response.json()
  if (!cursor) data.photos = [...(data.photos || [])].sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: 'base', numeric: true }))
  return data
}

export async function getAlbumPreviewPhotos() {
  const previews = await Promise.all(albums.map(async (album) => {
    try {
      const { photos } = await getAlbumPhotos(album.id, { limit: 1 })
      return { albumId: album.id, photo: photos[0] || null }
    } catch {
      return { albumId: album.id, photo: null }
    }
  }))
  return Object.fromEntries(previews.map(({ albumId, photo }) => [albumId, photo]))
}

export async function getFeaturedPhotos() {
  const previews = await Promise.all(albums.map((album) => getAlbumPhotos(album.id, { limit: 6 }).then((result) => result.photos).catch(() => [])))
  return previews.flat().sort(() => Math.random() - 0.5).slice(0, 6)
}
