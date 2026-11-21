import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist/build/h5',
)
const port = Number(process.env.PORT ?? 5188)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

http
  .createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url ?? '/').split('?')[0])
    const relative = urlPath === '/' ? '/index.html' : urlPath
    const filePath = path.join(root, relative)
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404)
      response.end('not found')
      return
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    fs.createReadStream(filePath).pipe(response)
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`http://127.0.0.1:${port}`)
  })
