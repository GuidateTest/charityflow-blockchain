const puppeteer = require('puppeteer');
const path = require('path');

const URL = 'file:///c:/Users/Anigma%20PC/Desktop/project-blockchain/workshop4/submission.html';
const OUT_DIR = 'c:\\Users\\Anigma PC\\Desktop\\project-blockchain\\workshop4\\screenshots';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Check scroll position before
  let scrollY = await page.evaluate(() => window.scrollY);
  console.log('Before scroll: scrollY =', scrollY);

  // Scroll to 941
  await page.evaluate(() => { window.scrollTo(0, 941); });
  await new Promise(r => setTimeout(r, 1000));

  scrollY = await page.evaluate(() => window.scrollY);
  console.log('After scroll to 941: scrollY =', scrollY);

  // Check what's visible at the top of the viewport
  const visible = await page.evaluate(() => {
    const els = document.elementsFromPoint(700, 0);
    return els.slice(0, 3).map(e => ({ tag: e.tagName, cls: e.className.substring(0,30), text: e.textContent.trim().substring(0,40) }));
  });
  console.log('Elements at top of viewport after scroll:', JSON.stringify(visible, null, 2));

  // Take screenshot without clip to see what's showing
  await page.screenshot({ path: path.join(OUT_DIR, 'debug_scrolled.png') });
  console.log('Saved debug_scrolled.png');

  await browser.close();
})();
