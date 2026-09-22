import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.join(process.cwd(), 'public/assets/logos/M_vermelho.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  // 1. 192x192 any
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(164, 164).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(process.cwd(), 'public/pwa-192x192.png'));

  // 2. 512x512 any
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(440, 440).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(process.cwd(), 'public/pwa-512x512.png'));

  // 3. 512x512 maskable (with safe margin => 380x380 centered on #FFFFFF)
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(380, 380).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(process.cwd(), 'public/pwa-maskable-512x512.png'));

  // 4. apple-touch-icon.png (180x180)
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(150, 150).toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(process.cwd(), 'public/apple-touch-icon.png'));

  // 5. icon.svg
  fs.copyFileSync(svgPath, path.join(process.cwd(), 'public/icon.svg'));

  console.log('Icons generated successfully.');
}

generate().catch(console.error);
