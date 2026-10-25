// Generates favicons and PWA icons from public/logo.png.
// Run: node scripts/gen-icons.mjs
//
// The icons are fully transparent (no background plate) so they match the
// favicon used on aevon-movies.vercel.app, which serves logo.png directly.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public", "logo.png");
const outDir = join(root, "public", "icons");

/** Renders one square icon: the logo on a transparent canvas. */
async function renderIcon(size) {
  return sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Packs PNG buffers into an .ico container (Vista+ / all modern browsers). */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, buf }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.buf)]);
}

const sizes = [16, 32, 48];
const icoImages = await Promise.all(
  sizes.map(async (size) => ({ size, buf: await renderIcon(size) }))
);

mkdirSync(outDir, { recursive: true });

writeFileSync(join(root, "src", "app", "favicon.ico"), packIco(icoImages));
writeFileSync(join(root, "src", "app", "icon.png"), await renderIcon(512));
writeFileSync(join(root, "src", "app", "apple-icon.png"), await renderIcon(180));
writeFileSync(join(outDir, "icon-192.png"), await renderIcon(192));
writeFileSync(join(outDir, "icon-512.png"), await renderIcon(512));

console.log("wrote favicon.ico, icon.png, apple-icon.png, icon-192.png, icon-512.png");
