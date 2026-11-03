const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,2000"
    ]
  });

  const page = await browser.newPage();
  
  await page.setViewport({ 
    width: 1920, 
    height: 2000,
    deviceScaleFactor: 2 
  });

  console.log("Navigating to Delta Exchange options analytics...");
  await page.goto("https://www.delta.exchange/app/options_analytics", { 
    waitUntil: "networkidle2", 
    timeout: 60000 
  });

  console.log("Waiting for page elements to load...");
  await new Promise(resolve => setTimeout(resolve, 8000));

  console.log("Selecting XAUT across all dropdowns...");
  try {
    const dropdownHandles = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("div, button, span")).filter(el => {
        const text = el.textContent.trim();
        return (text === "BTC" || text === "ETH" || text === "XAUT") && 
               el.offsetParent !== null && 
               el.clientHeight < 50 &&
               el.children.length <= 2;
      });
    });

    const count = await page.evaluate(els => els.length, dropdownHandles);
    
    for (let i = 0; i < count; i++) {
      await page.evaluate((idx) => {
        const dropdowns = Array.from(document.querySelectorAll("div, button, span")).filter(el => {
          const text = el.textContent.trim();
          return (text === "BTC" || text === "ETH" || text === "XAUT") && 
                 el.offsetParent !== null && 
                 el.clientHeight < 50 &&
                 el.children.length <= 2;
        });
        if (dropdowns[idx]) {
          dropdowns[idx].click();
        }
      }, i);

      await new Promise(r => setTimeout(r, 1500));

      await page.evaluate(() => {
        const allEls = Array.from(document.querySelectorAll("div, span, li, a"));
        const target = allEls.find(el => el.offsetParent !== null && el.textContent.trim() === "XAUT" && el.children.length === 0);
        if (target) {
          target.click();
        }
      });

      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) {
    console.log("Dropdown interaction note:", e.message);
  }

  console.log("Waiting 12 seconds for all XAUT charts to render...");
  await new Promise(resolve => setTimeout(resolve, 12000));

  await page.evaluate(() => {
    const now = new Date();
    const timeString = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" });
    
    const badge = document.createElement("div");
    badge.innerText = "Captured at: " + timeString + " IST";
    badge.style.position = "fixed";
    badge.style.top = "15px";
    badge.style.right = "80px";
    badge.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    badge.style.color = "#00ffcc";
    badge.style.padding = "10px 18px";
    badge.style.fontSize = "16px";
    badge.style.fontFamily = "monospace";
    badge.style.fontWeight = "bold";
    badge.style.borderRadius = "6px";
    badge.style.zIndex = "999999";
    badge.style.border = "1px solid #00ffcc";
    document.body.appendChild(badge);
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  const dir = path.join(process.cwd(), "screenshots");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(dir, `xaut-${timestamp}.png`);

  console.log("Taking watermarked screenshot...");
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Successfully saved screenshot to ${filePath}`);

  await browser.close();
})().catch(err => {
  console.error("Error during screenshot execution:", err);
  process.exit(1);
});
