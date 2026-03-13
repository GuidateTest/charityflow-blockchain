/**
 * Generate MDT915_Project_Report.pdf from the HTML file.
 * Run: node generate-report-pdf.js
 * Requires: npm install puppeteer (one-time)
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'MDT915_Project_Report.html');
const pdfPath = path.join(__dirname, 'MDT915_Project_Report.pdf');

async function generate() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.log('Installing puppeteer... (one-time)');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer --no-save', { stdio: 'inherit', cwd: __dirname });
    puppeteer = require('puppeteer');
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true,
  });
  await browser.close();
  console.log('PDF saved to:', pdfPath);
}

generate().catch((err) => {
  console.error('Error:', err.message);
  console.log('\nAlternative: Open MDT915_Project_Report.html in Chrome, press Ctrl+P, choose "Save as PDF".');
  process.exit(1);
});
