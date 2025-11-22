import { test, expect } from '@playwright/test';

test.describe('Admin Functionality', () => {
  const TEST_ADMIN_TOKEN = 'TEST_ADMIN_TOKEN';

  test.beforeEach(async ({ page }) => {
    // Perform login using the test token bypass
    // We navigate to the callback URL with the test token
    await page.goto(`/auth/callback/plex?testToken=${TEST_ADMIN_TOKEN}`);

    // Wait for redirect to home (successful login)
    await expect(page).toHaveURL(/\/$/);
    // Verify we see the admin UI or at least logged-in state (WrappedHomeButton usually)
    // We can check for something only an admin/user would see.
    // Since our seed creates an admin user, we should have access to admin pages.
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: /Dashboard|Users/i })).toBeVisible();
  });

  test('should access admin settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    // Check for specific settings form elements
    await expect(page.getByText('Application Settings')).toBeVisible();
    await expect(page.getByText('LLM Configuration')).toBeVisible();
  });

  test('should access admin users list', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    // Should see the admin user we seeded
    await expect(page.getByText('Admin User')).toBeVisible();
    await expect(page.getByText('admin@example.com')).toBeVisible();
  });

  test('should access admin cost analysis', async ({ page }) => {
    await page.goto('/admin/cost-analysis');
    await expect(page.getByRole('heading', { name: 'Cost Analysis' })).toBeVisible();
  });
});
