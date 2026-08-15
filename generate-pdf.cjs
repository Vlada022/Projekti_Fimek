const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function generatePdf() {
  console.log('Pokretanje Chromium browsera za generisanje PDF-a...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, 'docs', 'PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.html');
  const fileUrl = `file://${htmlPath}`;

  console.log(`Učitavanje HTML fajla: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  const outputPdfPath = path.resolve(__dirname, 'PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.pdf');
  const docsPdfPath = path.resolve(__dirname, 'docs', 'PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.pdf');

  console.log('Generisanje PDF fajla...');
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm'
    }
  });

  // Takođe kopiramo u docs folder
  fs.copyFileSync(outputPdfPath, docsPdfPath);

  console.log(`PDF uspešno kreiran na lokacijama:`);
  console.log(` - ${outputPdfPath}`);
  console.log(` - ${docsPdfPath}`);

  await browser.close();
}

generatePdf().catch(err => {
  console.error('Greška pri generisanju PDF-a:', err);
  process.exit(1);
});
