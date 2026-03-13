const puppeteer = require('puppeteer');
const path = require('path');

const URL = 'file:///c:/Users/Anigma%20PC/Desktop/project-blockchain/workshop4/submission.html';
const OUT_DIR = 'c:\\Users\\Anigma PC\\Desktop\\project-blockchain\\workshop4\\screenshots';

async function getScrollHeight(page) {
  return await page.evaluate(() => document.body.scrollHeight);
}

async function scrollTo(page, y) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise(r => setTimeout(r, 600));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  const totalHeight = await getScrollHeight(page);
  console.log('Total page height:', totalHeight);

  // ---- 1. cover.png — top of page (cover section) ----
  await scrollTo(page, 0);
  await page.screenshot({ path: path.join(OUT_DIR, 'cover.png'), clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log('Saved cover.png');

  // ---- 2. overview.png — look for overview/intro section ----
  // Scroll past the cover (one viewport height = 900px)
  const overviewY = await page.evaluate(() => {
    const el = document.querySelector('.overview, #overview, section, .section, .content-section, .intro');
    return el ? el.getBoundingClientRect().top + window.scrollY : 900;
  });
  await scrollTo(page, overviewY);
  await page.screenshot({ path: path.join(OUT_DIR, 'overview.png'), clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log('Saved overview.png at y=', overviewY);

  // ---- 3. transactions.png — transaction terminal views ----
  const txY = await page.evaluate(() => {
    const keywords = ['transaction', 'terminal', 'command', 'bitcoin-cli'];
    const allEls = Array.from(document.querySelectorAll('h1,h2,h3,h4,.section-title,.terminal,.code-block,pre'));
    for (const el of allEls) {
      const text = el.textContent.toLowerCase();
      if (keywords.some(k => text.includes(k))) {
        return el.getBoundingClientRect().top + window.scrollY - 50;
      }
    }
    return Math.floor(totalHeight * 0.3);
  });
  await scrollTo(page, txY);
  await page.screenshot({ path: path.join(OUT_DIR, 'transactions.png'), clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log('Saved transactions.png at y=', txY);

  // ---- 4. detail.png — transaction detail / decode ----
  const detailY = await page.evaluate(() => {
    const keywords = ['detail', 'decode', 'raw', 'txid', 'vin', 'vout'];
    const allEls = Array.from(document.querySelectorAll('h1,h2,h3,h4,.section-title,pre,.terminal'));
    for (const el of allEls) {
      const text = el.textContent.toLowerCase();
      if (keywords.some(k => text.includes(k))) {
        return el.getBoundingClientRect().top + window.scrollY - 50;
      }
    }
    return Math.floor(totalHeight * 0.5);
  });
  await scrollTo(page, detailY);
  await page.screenshot({ path: path.join(OUT_DIR, 'detail.png'), clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log('Saved detail.png at y=', detailY);

  // ---- 5. balance.png — balance / wallet section ----
  const balY = await page.evaluate(() => {
    const keywords = ['balance', 'wallet', 'getbalance', 'btc', 'amount'];
    const allEls = Array.from(document.querySelectorAll('h1,h2,h3,h4,.section-title,pre,.terminal'));
    for (const el of allEls) {
      const text = el.textContent.toLowerCase();
      if (keywords.some(k => text.includes(k))) {
        return el.getBoundingClientRect().top + window.scrollY - 50;
      }
    }
    return Math.floor(totalHeight * 0.65);
  });
  await scrollTo(page, balY);
  await page.screenshot({ path: path.join(OUT_DIR, 'balance.png'), clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log('Saved balance.png at y=', balY);

  // ---- 6. explanation.png — written explanations (near bottom) ----
  const explY = await page.evaluate(() => {
    const keywords = ['explain', 'analysis', 'answer', 'discussion', 'summary', 'conclusion', 'observation'];
    const allEls = Array.from(document.querySelectorAll('h1,h2,h3,h4,.section-title,p,.explanation'));
    for (const el of allEls) {
      const text = el.textContent.toLowerCase();
      if (keywords.some(k => text.includes(k))) {
        return el.getBoundingClientRect().top + window.scrollY - 50;
      }
    }
    return Math.floor(totalHeight * 0.8);
  });
  await scrollTo(page, explY);
  await page.screenshot({ path: path.join(OUT_DIR, 'explanation.png'), clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log('Saved explanation.png at y=', explY);

  // ---- Full page screenshot for reference ----
  await scrollTo(page, 0);
  await page.screenshot({ path: path.join(OUT_DIR, 'full_page.png'), fullPage: true });
  console.log('Saved full_page.png (full page)');

  await browser.close();
  console.log('Done!');
})();
