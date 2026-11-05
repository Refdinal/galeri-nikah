import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(root, 'public/data/gallery-manifest.json')
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

const albums = [
  { id: 'akad', folder: 'AKAD' },
  { id: 'wanita-arakan', folder: 'Wanita - Arakan' },
  { id: 'wanita-couple', folder: 'Wanita - Couple' },
  { id: 'wanita-keluarga-tamu', folder: 'Wanita - Keluarga x Tamu' },
  { id: 'pria-arakan', folder: 'Pria - Arakan' },
  { id: 'pria-couple', folder: 'Pria - Couple' },
  { id: 'pria-keluarga-tamu', folder: 'Pria - Keluarga x Tamu' },
]

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET sebelum sinkronisasi.')
}

const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`

async function getAlbumPhotos(album) {
  const photos = []
  let nextCursor = null

  do {
    const body = new URLSearchParams({
      expression: `folder="${album.folder}" AND resource_type:image`,
      max_results: '500',
    })
    if (nextCursor) body.set('next_cursor', nextCursor)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/search`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    const result = await response.json()
    if (!response.ok) {
      throw new Error(`Gagal mengambil album "${album.folder}": ${result.error?.message || response.statusText}`)
    }

    photos.push(...(result.resources || []).map((resource) => ({
      id: resource.public_id,
      src: resource.secure_url,
      thumb: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_640,c_limit/'),
      alt: resource.context?.custom?.alt || resource.public_id.split('/').at(-1).replace(/[-_]/g, ' '),
    })))
    nextCursor = result.next_cursor || null
  } while (nextCursor)

  photos.sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: 'base', numeric: true }))
  return photos
}

let previousManifest = { albums: {} }
try {
  previousManifest = JSON.parse(await readFile(outputPath, 'utf8'))
} catch {
  // A first-time sync has no previous manifest to preserve.
}

const manifest = {
  generatedAt: new Date().toISOString(),
  albums: { ...(previousManifest.albums || {}) },
}

for (const album of albums) {
  try {
    const photos = await getAlbumPhotos(album)
    manifest.albums[album.id] = photos
    console.log(`${album.id}: ${photos.length} foto`)
  } catch (error) {
    const hasCachedAlbum = Array.isArray(manifest.albums[album.id])
    if (!hasCachedAlbum) throw error
    console.warn(`${album.id}: sinkronisasi gagal, manifest sebelumnya dipertahankan (${error.message})`)
  }
}

const missingAlbums = albums.filter((album) => !Array.isArray(manifest.albums[album.id]))
if (missingAlbums.length) {
  throw new Error(`Manifest belum lengkap; album belum memiliki data: ${missingAlbums.map((album) => album.id).join(', ')}`)
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Manifest tersimpan: ${outputPath}`)
