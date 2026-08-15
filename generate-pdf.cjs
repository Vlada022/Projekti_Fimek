const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function renderDocToPdf(browser, htmlFileName, pdfFileName) {
  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, 'docs', htmlFileName);
  const fileUrl = `file://${htmlPath}`;

  console.log(`Učitavanje HTML fajla: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  const rootPdfPath = path.resolve(__dirname, pdfFileName);
  const docsPdfPath = path.resolve(__dirname, 'docs', pdfFileName);

  console.log(`Generisanje PDF-a za: ${pdfFileName}...`);
  await page.pdf({
    path: rootPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm'
    }
  });

  fs.copyFileSync(rootPdfPath, docsPdfPath);
  console.log(`PDF kreiran: ${rootPdfPath} i ${docsPdfPath}`);
  await page.close();
}

async function generateAllPdfs() {
  console.log('Pokretanje Chromium browsera za generisanje PDF dokumenata...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Glavna tehnička dokumentacija (bez sekcije sa dijagramima)
  await renderDocToPdf(browser, 'PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.html', 'PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.pdf');

  // 2. Zasebni UML Dijagrami PDF
  await renderDocToPdf(browser, 'UML_DIJAGRAMI.html', 'UML_DIJAGRAMI.pdf');

  await browser.close();
  console.log('Svi PDF dokumenti su uspešno izgenerisani!');
}

generateAllPdfs().catch(err => {
  console.error('Greška pri generisanju PDF-a:', err);
  process.exit(1);
});
