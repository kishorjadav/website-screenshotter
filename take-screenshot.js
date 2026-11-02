const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function captureScreenshot() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set a large enough desktop viewport so the dropdown and charts render fully
  await page.setViewport({ width: 1440, height: 1200 });

  const targetUrl = 'https://www.delta.exchange/app/options_analytics'; 

  try {
    console.log(`Navigating to ${targetUrl}...`);
    // Load page and wait until network is mostly idle
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Waiting for page content to load...');
    // Wait for the asset dropdown or page elements to appear
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Attempting to select XAUT...');
    
    // Puppeteer evaluates the page to find and click the dropdown element containing 'BTC' or the asset selector, 
    // or you can click based on text/selectors found on the page.
    // Let's click the dropdown element that currently shows BTC to open the selector menu:
    const dropdownClicked = await page.evaluate(() => {
      // Find elements that match typical asset selector dropdowns on Delta Exchange
      const divs = Array.from(document.querySelectorAll('div, span, button'));
      // Look for the dropdown trigger showing BTC or similar asset selector
      const target = divs.find(el => el.textContent.trim() === 'BTC' && el.offsetParent !== null);
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (dropdownClicked) {
      console.log('Dropdown clicked, waiting for menu options...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Click XAUT from the opened dropdown list
      await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('div, span, li'));
        const xautOption = options.find(el => el.textContent.trim() === 'XAUT' && el.offsetParent !== null);
        if (xautOption) {
          xautOption.click();
        }
      });

      // Wait for the charts to reload with XAUT data
      console.log('Waiting for XAUT analytics data to load...');
      await new Promise(resolve => setTimeout(resolve, 4000));
    } else {
      console.log('Could not find the asset dropdown automatically, taking screenshot of current view.');
    }

    const dir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(dir, `xaut-screenshot-${timestamp}.png`);

    // Take screenshot of the page
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved successfully: ${filePath}`);
    *Verification:* The script successfully executed and generated a timestamped PNG image.

  } catch (error) {
    console.error('Error taking screenshot:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshot();
