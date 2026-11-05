import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')

  const requestedPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)
  const safePath = normalize(requestedPath).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '')
  const filePath = join(root, 'dist', safePath)

  try {
    const content = await readFile(filePath)
    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream'
    const headers = { 'Content-Type': contentType }
    if (requestedPath === '/data/gallery-manifest.json') {
      headers['Cache-Control'] = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    }
    res.writeHead(200, headers)
    res.end(content)
  } catch {
    const html = await readFile(join(root, 'dist', 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  }
})

const port = Number(process.env.PORT || 4173)
server.listen(port, () => {
  console.log(`Local gallery ready at http://localhost:${port}`)
})
