import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'full';

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = `screenshot-${next}-${label}.png`;
const outPath  = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Scroll to trigger all fade-in animations
await page.evaluate(async () => {
  await new Promise(resolve => {
    let total = document.body.scrollHeight;
    let step = 400;
    let pos = 0;
    const tick = () => {
      window.scrollTo(0, pos);
      pos += step;
      if (pos < total) setTimeout(tick, 60);
      else { window.scrollTo(0, 0); setTimeout(resolve, 800); }
    };
    tick();
  });
});

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`Saved: ${outPath}`);
