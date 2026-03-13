const puppeteer = require('puppeteer');
const path = require('path');

const URL = 'file:///c:/Users/Anigma%20PC/Desktop/project-blockchain/workshop4/submission.html';
const OUT_DIR = 'c:\\Users\\Anigma PC\\Desktop\\project-blockchain\\workshop4\\screenshots';

async function snap(page, filename, scrollY) {
  await page.evaluate((y) => { window.scrollTo(0, y); }, scrollY);
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT_DIR, filename) });
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

  // 1. Cover page (top of page)
  await snap(page, 'cover.png', 0);

  // 2. Overview section (y=941)
  await snap(page, 'overview.png', 941);

  // 3. Transactions section — All Transactions (y=1309)
  await snap(page, 'transactions.png', 1309);

  // 4. Transaction detail section (y=3015)
  await snap(page, 'detail.png', 3015);

  // 5. Balance section (y=4975)
  await snap(page, 'balance.png', 4975);

  // 6. Written explanation section (y=5766)
  await snap(page, 'explanation.png', 5766);

  // 7. Full page for reference
  await page.evaluate(() => { window.scrollTo(0, 0); });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT_DIR, 'full_page.png'), fullPage: true });
  console.log('Saved full_page.png');

  await browser.close();
  console.log('All done!');
})();
