const puppeteer = require('puppeteer');
const path = require('path');

const URL = 'file:///c:/Users/Anigma%20PC/Desktop/project-blockchain/workshop4/submission.html';
const OUT_DIR = 'c:\\Users\\Anigma PC\\Desktop\\project-blockchain\\workshop4\\screenshots';

// Pixel offsets discovered from explore.js:
// Cover:        y=0       (section ends ~940)
// Overview:     y=941
// Transactions: y=1309
// Detail:       y=3015
// Balance:      y=4975
// Explanation:  y=5766

async function snap(page, filename, scrollY) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(OUT_DIR, filename), clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log(`Saved ${filename} (scrollY=${scrollY})`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Cover page
  await snap(page, 'cover.png', 0);

  // 2. Overview section
  await snap(page, 'overview.png', 941);

  // 3. Transactions section (All Transactions screenshot)
  await snap(page, 'transactions.png', 1309);

  // 4. Transaction detail section
  await snap(page, 'detail.png', 3015);

  // 5. Balance section
  await snap(page, 'balance.png', 4975);

  // 6. Written explanation section
  await snap(page, 'explanation.png', 5766);

  // Full page reference
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT_DIR, 'full_page.png'), fullPage: true });
  console.log('Saved full_page.png (full page)');

  await browser.close();
  console.log('All done!');
})();
