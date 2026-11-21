import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const SIZE = 81
const GRAY = [156, 163, 175]
const PRIMARY = [79, 110, 247]

function createCanvas() {
  return new Uint8Array(SIZE * SIZE * 4)
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return
  const index = (y * SIZE + x) * 4
  canvas[index] = color[0]
  canvas[index + 1] = color[1]
  canvas[index + 2] = color[2]
  canvas[index + 3] = 255
}

function fillRect(canvas, x, y, width, height, color) {
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) {
      setPixel(canvas, column, row, color)
    }
  }
}

function strokeRect(canvas, x, y, width, height, thickness, color) {
  fillRect(canvas, x, y, width, thickness, color)
  fillRect(canvas, x, y + height - thickness, width, thickness, color)
  fillRect(canvas, x, y, thickness, height, color)
  fillRect(canvas, x + width - thickness, y, thickness, height, color)
}

function fillCircle(canvas, cx, cy, radius, color, yMin = -Infinity, yMax = Infinity) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    if (y < yMin || y > yMax) continue
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= radius * radius) setPixel(canvas, x, y, color)
    }
  }
}

function strokeCircle(canvas, cx, cy, radius, thickness, color) {
  const inner = radius - thickness
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const distance = Math.hypot(x - cx, y - cy)
      if (distance <= radius && distance >= inner) setPixel(canvas, x, y, color)
    }
  }
}

function line(canvas, x0, y0, x1, y1, thickness, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let step = 0; step <= steps; step++) {
    const ratio = step / steps
    const x = Math.round(x0 + (x1 - x0) * ratio)
    const y = Math.round(y0 + (y1 - y0) * ratio)
    fillCircle(canvas, x, y, thickness / 2, color)
  }
}

function drawHome(color) {
  const canvas = createCanvas()
  line(canvas, 40, 12, 10, 37, 7, color)
  line(canvas, 40, 12, 70, 37, 7, color)
  line(canvas, 40, 12, 40, 22, 7, color)
  strokeRect(canvas, 17, 34, 46, 34, 6, color)
  fillRect(canvas, 34, 51, 12, 17, color)
  return canvas
}

function drawBook(color) {
  const canvas = createCanvas()
  strokeRect(canvas, 11, 17, 59, 47, 6, color)
  line(canvas, 40, 20, 40, 61, 5, color)
  line(canvas, 18, 31, 33, 31, 4, color)
  line(canvas, 18, 43, 33, 43, 4, color)
  line(canvas, 47, 31, 62, 31, 4, color)
  line(canvas, 47, 43, 62, 43, 4, color)
  return canvas
}

function drawWrong(color) {
  const canvas = createCanvas()
  strokeCircle(canvas, 40, 40, 27, 7, color)
  line(canvas, 30, 30, 50, 50, 7, color)
  line(canvas, 50, 30, 30, 50, 7, color)
  return canvas
}

function drawUser(color) {
  const canvas = createCanvas()
  fillCircle(canvas, 40, 25, 12, color)
  fillCircle(canvas, 40, 70, 23, color, 47, 68)
  return canvas
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (let index = 0; index < buffer.length; index++) {
    crc ^= buffer[index]
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

function encodePng(canvas) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0
    for (let x = 0; x < SIZE * 4; x++) {
      raw[y * (SIZE * 4 + 1) + 1 + x] = canvas[y * SIZE * 4 + x]
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outputDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/static/tabbar',
)
fs.mkdirSync(outputDir, { recursive: true })

const icons = [
  ['home', drawHome],
  ['book', drawBook],
  ['wrong', drawWrong],
  ['user', drawUser],
]

for (const [name, draw] of icons) {
  fs.writeFileSync(path.join(outputDir, `${name}.png`), encodePng(draw(GRAY)))
  fs.writeFileSync(
    path.join(outputDir, `${name}-active.png`),
    encodePng(draw(PRIMARY)),
  )
}

console.log(`generated ${icons.length * 2} icons in ${outputDir}`)
