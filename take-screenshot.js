const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function captureScreenshot() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // REPLACE WITH YOUR TARGET URL
  const targetUrl = 'https://www.delta.exchange/app/options_analytics'; 

  try {
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    const dir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(dir, `screenshot-${timestamp}.png`);

    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved successfully: ${filePath}`);

  } catch (error) {
    console.error('Error taking screenshot:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshot();
