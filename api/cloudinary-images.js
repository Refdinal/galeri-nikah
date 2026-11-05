const ALBUMS = [
  { id: 'akad', folder: 'AKAD' },
  { id: 'wanita-arakan', folder: 'Wanita - Arakan' },
  { id: 'wanita-couple', folder: 'Wanita - Couple' },
  { id: 'wanita-keluarga-tamu', folder: 'Wanita - Keluarga x Tamu' },
  { id: 'pria-arakan', folder: 'Pria - Arakan' },
  { id: 'pria-couple', folder: 'Pria - Couple' },
  { id: 'pria-keluarga-tamu', folder: 'Pria - Keluarga x Tamu' },
]

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return json(res, 500, { error: 'Cloudinary belum dikonfigurasi di environment Vercel.' })
  }

  const albumId = typeof req.query?.album === 'string' ? req.query.album : ''
  const album = ALBUMS.find((item) => item.id === albumId)
  if (!album) return json(res, 400, { error: 'Album tidak dikenal.' })

  const requestedLimit = Number.parseInt(req.query?.limit, 10)
  const maxResults = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 500)) : 500
  const nextCursor = typeof req.query?.cursor === 'string' ? req.query.cursor : ''

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const searchParams = {
    expression: `folder="${album.folder}" AND resource_type:image`,
    max_results: String(maxResults),
  }
  if (nextCursor) searchParams.next_cursor = nextCursor
  const body = new URLSearchParams(searchParams)

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/search`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const result = await response.json()
    if (!response.ok) {
      return json(res, response.status, { error: result.error?.message || 'Cloudinary gagal mengambil daftar foto.' })
    }

    const photos = (result.resources || []).map((resource) => ({
      id: resource.public_id,
      src: resource.secure_url,
      thumb: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_640,c_limit/'),
      alt: resource.context?.custom?.alt || resource.public_id.split('/').at(-1).replace(/[-_]/g, ' '),
    }))

    return json(res, 200, { photos, nextCursor: result.next_cursor || null })
  } catch {
    return json(res, 502, { error: 'Tidak dapat terhubung ke Cloudinary.' })
  }
}
