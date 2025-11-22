import { test, expect } from '@playwright/test';

test.describe('Admin Protection', () => {
  // List of admin pages to check
  const adminPages = [
    '/admin',
    '/admin/cost-analysis',
    '/admin/invites',
    '/admin/llm-usage',
    '/admin/playground',
    '/admin/settings',
    '/admin/shares',
    '/admin/users',
  ];

  for (const pagePath of adminPages) {
    test(`should redirect unauthenticated user to sign in from ${pagePath}`, async ({ page }) => {
      // Navigate to the admin page
      await page.goto(pagePath);

      // Since we are not logged in, we should be redirected or see an error
      // Currently the app throws an error that is caught by the error boundary
      // The error boundary for unauthenticated users shows "Authentication required" or similar
      // OR the page logic might redirect to /auth/signin

      // Based on our integration tests, the `requireAdmin` helper throws `UnauthenticatedError`
      // which is caught by `app/admin/error.tsx` and renders `<UnauthenticatedError />`

      // Check for the unauthenticated error UI
      // We can look for specific text that appears in the UnauthenticatedError component
      // Or check if we are redirected (if that logic changes)

      // Assuming the UnauthenticatedError component renders some specific text
      // Let's look for a heading or message indicating access is denied/login required

      // If the page throws a 500-like error caught by error.tsx, we expect to see that
      // However, in a real browser flow, next-auth middleware might also intercept

      // For now, let's check if we land on a page that asks us to sign in OR shows an error
      // NOTE: Since we don't have the exact UI text of UnauthenticatedError,
      // let's check for "Authentication required" or "Sign in" or "401"

      // The UnauthenticatedError component renders a large "401" text
      await expect(page.getByText('401', { exact: true })).toBeVisible();
    });
  }
});

test.describe('Public Access', () => {
  test('should allow access to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Plex Manager|Plex Wrapped/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should allow access to invite page', async ({ page }) => {
    const inviteCode = 'test-invite-code';
    await page.goto(`/invite/${inviteCode}`);

    // The loading state "Validating invite" is transient and may finish before Playwright checks it.
    // We verify the page loaded and processed the invite by checking the final state.
    // Since 'test-invite-code' is invalid, we expect the error state.
    await expect(page.getByRole('heading', { name: 'Invalid Invite' })).toBeVisible({ timeout: 10000 });
  });
});

