import { test } from '@playwright/test';

test('debug header loading', async ({ page }) => {
  await page.goto('http://localhost:5174/cruise-planning-tips/the-fall-cruise-strategy-most-people-get-wrong/');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take a full page screenshot to see what's happening
  await page.screenshot({ path: 'test-results/debug-full-page.png', fullPage: true });
  
  // Check console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Check if header elements exist
  const headerWrap = await page.locator('.header-wrap').count();
  const gbElement = await page.locator('.gb-element-6d98b3bd').count();
  
  console.log('Header wrap count:', headerWrap);
  console.log('GB element count:', gbElement);
  console.log('Console logs:', logs);
  
  // Get HTML content of the header area
  const headerHtml = await page.locator('body').innerHTML();
  console.log('Body HTML (first 500 chars):', headerHtml.substring(0, 500));
});