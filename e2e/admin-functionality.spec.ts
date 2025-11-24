import { expect, test } from './fixtures/auth';
import { navigateAndVerify, verifyPageAccessible, waitForAdminContent, waitForAdminPageReady } from './helpers/test-utils';

test.describe('Admin Functionality', () => {
  test('should access admin dashboard', async ({ adminPage }) => {
    // After authentication, adminPage starts on /admin/users (dashboard)
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: /Users/i }
    ], { timeout: 30000 });
  });

  test('should access admin settings', async ({ adminPage }) => {
    // Use in-app navigation instead of forcing a new navigation
    await adminPage.getByRole('link', { name: 'Settings' }).click();
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: 'Settings' },
      { type: 'text', value: 'Application Settings' },
      { type: 'text', value: 'LLM Configuration' }
    ], { timeout: 30000 });
  });

  test('should access admin users list', async ({ adminPage }) => {
    // Already on /admin/users; just verify content
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: 'Users' },
      { type: 'text', value: 'Admin User' },
      { type: 'text', value: 'admin@example.com' },
      { type: 'text', value: 'Regular User' },
      { type: 'text', value: 'regular@example.com' }
    ], { timeout: 30000 });
  });

  test('should access admin cost analysis', async ({ adminPage }) => {
    await adminPage.getByRole('link', { name: 'Cost Analysis' }).click();
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: 'Cost Analysis' }
    ], { timeout: 30000 });
  });

  test('should access admin LLM usage', async ({ adminPage }) => {
    await adminPage.getByRole('link', { name: 'LLM Usage' }).click();
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('should access admin playground', async ({ adminPage }) => {
    await adminPage.getByRole('link', { name: 'Playground' }).click();
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('should access admin invites', async ({ adminPage }) => {
    await adminPage.getByRole('link', { name: 'Invites' }).click();
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('should access admin shares', async ({ adminPage }) => {
    await adminPage.getByRole('link', { name: 'Share Analytics' }).click();
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });
});
