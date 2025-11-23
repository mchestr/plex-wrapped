import { expect, test } from './fixtures/auth';
import { navigateAndVerify, verifyPageAccessible, waitForAdminContent, waitForAdminPageReady } from './helpers/test-utils';

test.describe('Admin Functionality', () => {
  test('should access admin dashboard', async ({ adminPage }) => {
    // Navigate directly to /admin/users (the actual admin dashboard)
    await adminPage.goto('/admin/users', { waitUntil: 'networkidle', timeout: 30000 });
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: /Users/i }
    ], { timeout: 30000 });
  });

  test('should access admin settings', async ({ adminPage }) => {
    await navigateAndVerify(adminPage, '/admin/settings', { timeout: 30000 });
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: 'Settings' },
      { type: 'text', value: 'Application Settings' },
      { type: 'text', value: 'LLM Configuration' }
    ], { timeout: 30000 });
  });

  test('should access admin users list', async ({ adminPage }) => {
    await navigateAndVerify(adminPage, '/admin/users', { timeout: 30000 });
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: 'Users' },
      { type: 'text', value: 'Admin User' },
      { type: 'text', value: 'admin@example.com' },
      { type: 'text', value: 'Regular User' },
      { type: 'text', value: 'regular@example.com' }
    ], { timeout: 30000 });
  });

  test('should access admin cost analysis', async ({ adminPage }) => {
    await navigateAndVerify(adminPage, '/admin/cost-analysis', { timeout: 30000 });
    await waitForAdminContent(adminPage, [
      { type: 'heading', value: 'Cost Analysis' }
    ], { timeout: 30000 });
  });

  test('should access admin LLM usage', async ({ adminPage }) => {
    await navigateAndVerify(adminPage, '/admin/llm-usage', { timeout: 30000 });
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('should access admin playground', async ({ adminPage }) => {
    await navigateAndVerify(adminPage, '/admin/playground', { timeout: 30000 });
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('should access admin invites', async ({ adminPage }) => {
    await navigateAndVerify(adminPage, '/admin/invites', { timeout: 30000 });
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('should access admin shares', async ({ adminPage }) => {
    await navigateAndVerify(adminPage, '/admin/shares', { timeout: 30000 });
    await waitForAdminPageReady(adminPage, 30000);
    await verifyPageAccessible(adminPage);
    // Wait for page content to be visible (not just accessible)
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15000 });
  });
});
