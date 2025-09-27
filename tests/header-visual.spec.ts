import { test, expect } from '@playwright/test';

test.describe('Header Visual Comparison', () => {
  const OUR_URL = 'http://localhost:5174/cruise-planning-tips/the-fall-cruise-strategy-most-people-get-wrong/';
  const REFERENCE_URL = 'https://cruisemadeeasy.com/the-fall-cruise-strategy-most-people-get-wrong/';
  
  test('header desktop comparison', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Navigate to our implementation
    await page.goto(OUR_URL);
    
    // Wait for header to load
    await page.waitForSelector('.header-wrap', { timeout: 15000 });
    
    // Take screenshot of our header
    await page.locator('.header-wrap').screenshot({
      path: 'test-results/our-header-desktop.png'
    });
    
    // Navigate to reference site
    await page.goto(REFERENCE_URL);
    
    // Wait for reference header to load
    await page.waitForSelector('.header-wrap', { timeout: 15000 });
    
    // Take screenshot of reference header
    await page.locator('.header-wrap').screenshot({
      path: 'test-results/reference-header-desktop.png'
    });
    
    console.log('✅ Desktop header screenshots captured');
  });
  
  test('header mobile comparison', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to our implementation
    await page.goto(OUR_URL);
    
    // Wait for header to load
    await page.waitForSelector('.header-wrap', { timeout: 15000 });
    
    // Take screenshot of our mobile header
    await page.locator('.header-wrap').screenshot({
      path: 'test-results/our-header-mobile.png'
    });
    
    // Navigate to reference site
    await page.goto(REFERENCE_URL);
    
    // Wait for reference header to load
    await page.waitForSelector('.header-wrap', { timeout: 15000 });
    
    // Take screenshot of reference mobile header
    await page.locator('.header-wrap').screenshot({
      path: 'test-results/reference-header-mobile.png'
    });
    
    console.log('✅ Mobile header screenshots captured');
  });
  
  test('header tablet comparison', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigate to our implementation
    await page.goto(OUR_URL);
    
    // Wait for header to load
    await page.waitForSelector('.header-wrap', { timeout: 15000 });
    
    // Take screenshot of our tablet header
    await page.locator('.header-wrap').screenshot({
      path: 'test-results/our-header-tablet.png'
    });
    
    // Navigate to reference site
    await page.goto(REFERENCE_URL);
    
    // Wait for reference header to load
    await page.waitForSelector('.header-wrap', { timeout: 15000 });
    
    // Take screenshot of reference tablet header
    await page.locator('.header-wrap').screenshot({
      path: 'test-results/reference-header-tablet.png'
    });
    
    console.log('✅ Tablet header screenshots captured');
  });
});