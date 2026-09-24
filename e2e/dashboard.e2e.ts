import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E - Basic Smoke', () => {
  test('app loads and shows PulseGuard branding', async ({ page }) => {
    await page.goto('/');
    
    // Verify page title
    await expect(page).toHaveTitle(/PulseGuard/);
    
    // Verify the app div is present
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('can navigate and mock API responses', async ({ page }) => {
    // Mock server list API
    await page.route('**/api/servers/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { id: 1, name: 'Mock Server', protocol: 'https', host: 'example.com', port: 443 },
          ],
        }),
      });
    });

    // Mock SSE
    await page.route('**/api/events/status/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'retry: 5000\n\n: heartbeat\n\n',
      });
    });

    await page.goto('/');
    
    // If auth is required, we'll be redirected or see login form
    // For now, just verify the page loaded
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded successfully, title:', await page.title());
    console.log('URL:', page.url());
  });
});
