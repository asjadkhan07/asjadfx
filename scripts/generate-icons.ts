import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function drawAsjadFxIcon(size: number, isMaskable = false): Buffer {
  const png = new PNG({ width: size, height: size });

  const goldA = [255, 242, 163, 255]; // #FFF2A3
  const goldB = [242, 169, 0, 255];   // #F2A900
  const goldC = [212, 136, 0, 255];   // #D48800
  const goldD = [140, 88, 0, 255];    // #8C5800
  const bgDark = [5, 7, 10, 255];     // #05070A
  const bgMid = [11, 15, 23, 255];    // #0B0F17
  const borderGold = [242, 169, 0, 200];

  const scale = size / 512;
  const padding = isMaskable ? 0.8 : 0.95;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Dark Luxury Gradient Background
      const diag = (x + y) / (size * 2);
      const rBg = Math.round(bgDark[0] + (bgMid[0] - bgDark[0]) * diag);
      const gBg = Math.round(bgDark[1] + (bgMid[1] - bgDark[1]) * diag);
      const bBg = Math.round(bgDark[2] + (bgMid[2] - bgDark[2]) * diag);

      let r = rBg;
      let g = gBg;
      let b = bBg;
      let a = 255;

      // Normalization to 512 canvas coordinates
      const nx = (x - cx) / scale / padding + 256;
      const ny = (y - cy) / scale / padding + 256;

      // Outer Rounded Border for non-maskable
      if (!isMaskable) {
        const cornerDist = Math.max(Math.abs(x - cx), Math.abs(y - cy));
        const borderInset = 8 * scale;
        if (x < borderInset || x >= size - borderInset || y < borderInset || y >= size - borderInset) {
          r = Math.round(r * 0.4 + borderGold[0] * 0.6);
          g = Math.round(g * 0.4 + borderGold[1] * 0.6);
          b = Math.round(b * 0.4 + borderGold[2] * 0.6);
        }
      }

      // Golden ambient glow
      const distFromCenter = Math.hypot(nx - 256, ny - 240);
      if (distFromCenter < 160) {
        const glowFactor = Math.pow(1 - distFromCenter / 160, 2) * 0.25;
        r = Math.min(255, Math.round(r + 242 * glowFactor));
        g = Math.min(255, Math.round(g + 169 * glowFactor));
        b = Math.min(255, Math.round(b + 0 * glowFactor));
      }

      // Hexagonal Crest Outline
      // Crown at apex
      if (ny >= 120 && ny <= 165 && Math.abs(nx - 256) <= 45) {
        const apexY = 120 + Math.abs(nx - 256) * 0.8;
        if (ny >= apexY && ny <= apexY + 16) {
          r = goldB[0];
          g = goldB[1];
          b = goldB[2];
        }
      }

      // Monogram "A" shape
      // Left leg: line from (256, 150) to (172, 325)
      // Right leg: line from (256, 150) to (340, 325)
      // Crossbar: ny between 260 and 278, nx between 214 and 298
      if (ny >= 150 && ny <= 325) {
        const progress = (ny - 150) / 175;
        const halfWidth = 10 + progress * 74; // outer bound
        const innerHalfWidth = progress > 0.45 ? (progress - 0.45) * 45 : 0;
        const dx = Math.abs(nx - 256);

        if (dx <= halfWidth && dx >= innerHalfWidth) {
          // Inside "A" legs
          // Carve out center triangle above crossbar
          let isFilled = true;
          if (ny < 260 && dx < progress * 40) {
            isFilled = false;
          }

          if (isFilled) {
            // Gold gradient
            const vertGrad = (ny - 150) / 175;
            r = Math.round(goldA[0] * (1 - vertGrad) + goldD[0] * vertGrad);
            g = Math.round(goldA[1] * (1 - vertGrad) + goldD[1] * vertGrad);
            b = Math.round(goldA[2] * (1 - vertGrad) + goldD[2] * vertGrad);

            // Shading highlight
            if (dx < 12 || Math.abs(dx - halfWidth) < 4) {
              r = Math.min(255, r + 40);
              g = Math.min(255, g + 30);
              b = Math.min(255, b + 20);
            }
          }
        }
      }

      // Central Power Light / Ascent diamond
      if (Math.abs(nx - 256) <= 8 && ny >= 195 && ny <= 245) {
        r = 255;
        g = 255;
        b = 255;
      }

      // Bottom Brand Line "ASJADFX" Bar Indicator
      if (ny >= 370 && ny <= 382 && Math.abs(nx - 256) <= 120) {
        r = goldB[0];
        g = goldB[1];
        b = goldB[2];
      }

      // Sub-accent dots
      if (ny >= 405 && ny <= 412 && (Math.abs(nx - 256) <= 4 || Math.abs(nx - 200) <= 3 || Math.abs(nx - 312) <= 3)) {
        r = 142;
        g = 156;
        b = 178;
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

// Generate all target PNG icon resolutions
const pwa192 = drawAsjadFxIcon(192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = drawAsjadFxIcon(512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable512 = drawAsjadFxIcon(512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

const appleTouchIcon = drawAsjadFxIcon(180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

const favicon32 = drawAsjadFxIcon(32, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon32);

console.log('Generated PWA icons in public/ directory successfully!');
