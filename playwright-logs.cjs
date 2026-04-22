const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log("Navigating to localhost:3000...");
  await page.goto('http://localhost:3000');
  
  // Wait a bit to let React mount
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
