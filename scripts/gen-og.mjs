// Generates the Open Graph / social preview card from public/logo.png.
// Run: node scripts/gen-og.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public", "logo.png");

const WIDTH = 1200;
const HEIGHT = 630;

const background = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="18%" r="78%">
      <stop offset="0%" stop-color="#241f1a"/>
      <stop offset="55%" stop-color="#14120f"/>
      <stop offset="100%" stop-color="#0d0c0b"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${
  HEIGHT - 1
}" fill="none" stroke="rgba(255,255,255,0.06)"/>
  <text x="${WIDTH / 2}" y="392" text-anchor="middle"
        font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif"
        font-size="86" font-weight="600" letter-spacing="14" fill="#faf9f6">AEVON</text>
  <text x="${WIDTH / 2}" y="452" text-anchor="middle"
        font-family="Consolas, Menlo, monospace"
        font-size="26" letter-spacing="16" fill="#a8a29a">M U S I C</text>
  <rect x="${WIDTH / 2 - 42}" y="497" width="84" height="2" fill="#e50914"/>
  <text x="${WIDTH / 2}" y="556" text-anchor="middle"
        font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif"
        font-size="27" fill="#8e8880">Stream free. No ads. No sign-up.</text>
</svg>`);

const logo = await sharp(source)
  .resize(168, 168, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const card = await sharp(background)
  .composite([{ input: logo, top: 132, left: Math.round((WIDTH - 168) / 2) }])
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(join(root, "src", "app", "opengraph-image.png"), card);

console.log("wrote src/app/opengraph-image.png");
