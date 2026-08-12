// Generates the PWA PNG icons with zero dependencies (hand-rolled PNG encoder).
// Run with: `npm run icons`.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/icons");

// --- Minimal PNG (RGBA, 8-bit) encoder -------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Add a leading filter byte (0) per scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Icon drawing ----------------------------------------------------------

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function drawIcon(size, diamondRatio) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * diamondRatio;

  // gradient endpoints
  const top = [79, 70, 229]; // arcane-600
  const bottom = [15, 12, 41]; // deep indigo
  const white = [248, 250, 252];
  const gem = [67, 56, 202]; // arcane-700

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      let r = lerp(top[0], bottom[0], t);
      let g = lerp(top[1], bottom[1], t);
      let b = lerp(top[2], bottom[2], t);

      const d = Math.abs(x - cx) + Math.abs(y - cy); // manhattan → diamond
      if (d <= R) {
        if (d <= R * 0.58) {
          [r, g, b] = gem;
        } else {
          [r, g, b] = white;
        }
      }

      const i = (y * size + x) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }
  return encodePng(size, size, rgba);
}

// --- Emit ------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

const files = [
  ["icon-192.png", 192, 0.34],
  ["icon-512.png", 512, 0.34],
  // Maskable: keep the motif inside the safe zone (~60% center).
  ["maskable-512.png", 512, 0.28],
];

for (const [name, size, ratio] of files) {
  const png = drawIcon(size, ratio);
  writeFileSync(resolve(OUT_DIR, name), png);
  console.log(`wrote public/icons/${name} (${png.length} bytes)`);
}
