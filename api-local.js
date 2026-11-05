import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import cloudinaryImages from './api/cloudinary-images.js'

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

  if (url.pathname === '/api/cloudinary-images') {
    const reqAdapter = { query: Object.fromEntries(url.searchParams.entries()) }
    const resAdapter = {
      status(code) {
        res.statusCode = code
        return this
      },
      setHeader(name, value) {
        res.setHeader(name, value)
        return this
      },
      end(value) {
        res.end(value)
        return this
      },
    }
    await cloudinaryImages(reqAdapter, resAdapter)
    return
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)
  const safePath = normalize(requestedPath).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '')
  const filePath = join(root, 'dist', safePath)

  try {
    const content = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' })
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
