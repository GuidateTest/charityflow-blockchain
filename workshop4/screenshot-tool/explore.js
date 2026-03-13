const puppeteer = require('puppeteer');

const URL = 'file:///c:/Users/Anigma%20PC/Desktop/project-blockchain/workshop4/submission.html';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    const totalH = document.body.scrollHeight;
    // Find all headings and sections
    const elements = Array.from(document.querySelectorAll('h1,h2,h3,h4,.cover,.section-title,.task-title,.step-title'));
    const positions = elements.map(el => ({
      tag: el.tagName,
      cls: el.className.substring(0, 40),
      text: el.textContent.trim().substring(0, 80),
      offsetTop: el.getBoundingClientRect().top + window.scrollY
    }));
    return { totalH, positions };
  });

  console.log('Total height:', info.totalH);
  console.log('\nElement positions:');
  info.positions.forEach(p => {
    console.log(`  [${p.tag}] y=${Math.round(p.offsetTop)} | "${p.text}"`);
  });

  await browser.close();
})();
