import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// First scroll through to trigger all animations
await page.evaluate(async () => {
  const total = document.body.scrollHeight;
  for (let pos = 0; pos <= total; pos += 600) {
    window.scrollTo(0, pos);
    await new Promise(r => setTimeout(r, 80));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 600));
});

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
let next = nums.length ? Math.max(...nums) + 1 : 1;

const pageHeight = await page.evaluate(() => document.body.scrollHeight);
const viewH = 900;
const sections = Math.ceil(pageHeight / viewH);

const labels = ['hero','essence','experience-1','experience-2','experience-3','experience-4','experience-5','guides','included','pricing','testimonials','cta','footer'];

for (let i = 0; i < sections; i++) {
  const scrollY = i * viewH;
  await page.evaluate(y => window.scrollTo(0, y), scrollY);
  await new Promise(r => setTimeout(r, 400));
  const label = labels[i] || `section-${i+1}`;
  const filename = `screenshot-${next}-${label}.png`;
  await page.screenshot({ path: path.join(dir, filename), fullPage: false });
  console.log(`Saved: ${filename}`);
  next++;
}

await browser.close();
