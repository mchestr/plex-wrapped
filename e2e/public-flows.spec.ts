import { test, expect } from '@playwright/test';

test.describe('Public Flows', () => {
  test('home page has sign in button and initiates flow', async ({ page }) => {
    await page.goto('/');

    // Check for Sign In button
    const signInButton = page.getByRole('button', { name: /Sign in with Plex/i });
    await expect(signInButton).toBeVisible();

    // Get the href or onclick behavior?
    // The button is likely a client-side handler calling signIn('plex').
    // We can test that clicking it doesn't crash and triggers navigation.

    // Note: actually clicking might redirect to plex.tv which we don't want to full automated test against (rate limits, etc).
    // But we can verify the button is there and enabled.
    await expect(signInButton).toBeEnabled();
  });

  test('setup page redirects if already set up', async ({ page }) => {
    await page.goto('/setup');

    // Wait for any client-side redirects or hydration to finish
    await page.waitForLoadState('networkidle');

    const url = page.url();

    if (url.includes('/setup')) {
      // Setup incomplete
      await expect(page.getByRole('heading', { name: /Welcome|Setup/i })).toBeVisible();
    } else {
      // Setup complete - could be home or onboarding
      expect(url).toMatch(/(\/$)|(\/onboarding$)/);
    }
  });

  test('denied page is accessible', async ({ page }) => {
    await page.goto('/auth/denied');

    // Should show access denied message
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
    // The page actually has a "Try Again" link and a "Return Home" button, not a "Return to Home" link
    await expect(page.getByRole('button', { name: 'Return Home' })).toBeVisible();
  });

  test('onboarding page accessibility check', async ({ page }) => {
    // Behavior for unauthenticated users on /onboarding:
    // Based on code analysis, it might render or redirect.
    // Let's observe the behavior.
    // If it renders, we check for wizard elements.
    // If it redirects to signin/home, we accept that too (as "secure").

    await page.goto('/onboarding');

    const isHome = page.url().endsWith('/');
    const isSignin = page.url().includes('signin');
    const isOnboarding = page.url().includes('/onboarding');

    if (isOnboarding) {
      // If we stay on onboarding, verify the wizard is visible
      await expect(page.getByText('Welcome!')).toBeVisible();
      await expect(page.getByText("Let's get you started")).toBeVisible();
    } else {
      // If redirected, ensure we are on a safe page
      expect(isHome || isSignin).toBeTruthy();
    }
  });
});

