// Generates Hayasaka PWA icons (192 & 512) as simple PNGs with no deps.
// Run: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  // RGBA rows, filter type 0 per row
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const cx = size / 2;
      const cy = size / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // background
      let r = 0x0a, g = 0x0a, b = 0x0c;

      // gold disc
      const ringR = size * 0.46;
      if (dist < ringR) {
        r = 0xf6; g = 0xc0; b = 0x38;
        // subtle darker ring edge
        if (dist > ringR - size * 0.02) {
          r = 0xe0; g = 0xa8; b = 0x28;
        }
        // play triangle (dark cutout)
        const triTop = cy - size * 0.18;
        const triLeft = cx - size * 0.14;
        const triRight = cx + size * 0.2;
        if (y > triTop && x > triLeft && x < triRight) {
          const t = (y - triTop) / (size * 0.36);
          const x1 = triLeft + (size * 0.06) * t;
          const x2 = triRight - (size * 0.06) * t;
          if (x > x1 && x < x2) {
            r = 0x0a; g = 0x0a; b = 0x0c;
          }
        }
      }

      const i = 1 + x * 4;
      row[i] = r;
      row[i + 1] = g;
      row[i + 2] = b;
      row[i + 3] = 255;
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const idat = deflateSync(Buffer.concat(rows));

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const s of [192, 512]) {
  writeFileSync(join(outDir, `icon-${s}.png`), png(s));
  console.log(`wrote icon-${s}.png`);
}
