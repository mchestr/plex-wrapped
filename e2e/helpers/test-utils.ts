import { Page, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/auth';


/**
 * Navigate to a page and verify it loaded successfully
 */
export async function navigateAndVerify(
  page: Page,
  path: string,
  options?: { waitForSelector?: string; timeout?: number }
): Promise<void> {
  const timeout = options?.timeout || 15000;

  // Navigate using the default load behavior.
  // In Next.js dev mode, waiting for "networkidle" is flaky because of
  // ongoing HMR / websocket requests; rely on explicit UI checks instead.
  await page.goto(path, { timeout });

  // Wait for any application loading states to resolve
  await waitForLoadingGone(page, timeout);

  // Wait for optional specific selector if provided
  if (options?.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout, state: 'visible' });
  }
}

/**
 * Wait for application loading screens to disappear
 */
export async function waitForLoadingGone(page: Page, timeout = 15000): Promise<void> {
  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    'text=/Loading/i',
    '.animate-spin',
    '[role="status"]',
    '[aria-label*="Loading" i]',
  ];

  // Wait for any visible loading indicators to disappear
  for (const selector of loadingSelectors) {
    try {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        // Wait for first visible element to be hidden (others will follow)
        await expect(elements.first()).not.toBeVisible({ timeout: Math.min(timeout, 5000) }).catch(() => {
          // Element may not exist or already hidden - that's fine
        });
      }
    } catch {
      // Selector may not match anything - that's fine
    }
  }
}

/**
 * Verify that a page is accessible (not showing 401 error)
 */
export async function verifyPageAccessible(page: Page): Promise<void> {
  await waitForLoadingGone(page);

  const unauthorizedError = page.getByText('401', { exact: true });
  const accessDeniedError = page.getByText('Access Denied');

  await expect(unauthorizedError).not.toBeVisible();
  await expect(accessDeniedError).not.toBeVisible();
}

/**
 * Verify that a page shows unauthorized error
 * Can show either "401" (for unauthenticated) or "Access Denied" (for authenticated non-admin users)
 */
export async function verifyPageUnauthorized(page: Page): Promise<void> {
  await waitForLoadingGone(page);

  // Check for either 401 error (unauthenticated) or Access Denied (authenticated non-admin)
  const unauthorizedError = page.getByText('401', { exact: true });
  const accessDeniedError = page.getByText('Access Denied');

  // At least one should be visible
  const is401Visible = await unauthorizedError.isVisible().catch(() => false);
  const isAccessDeniedVisible = await accessDeniedError.isVisible().catch(() => false);

  if (!is401Visible && !isAccessDeniedVisible) {
    throw new Error('Expected to see either "401" or "Access Denied" error, but neither was found');
  }
}

/**
 * Wait for navigation to complete and page to be stable
 */
export async function waitForStablePage(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout || 15000;
  await page.waitForLoadState('networkidle', { timeout });
  await waitForLoadingGone(page, timeout);
}

/**
 * Wait for admin page to be fully loaded with navigation and content
 */
export async function waitForAdminPageReady(page: Page, timeout = 20000): Promise<void> {
  // Wait for network to be idle and loading states to disappear
  await page.waitForLoadState('networkidle', { timeout });
  await waitForLoadingGone(page, timeout);
}

/**
 * Verify admin access by checking admin menu items or admin-specific content
 */
export async function verifyAdminAccess(page: Page): Promise<void> {
  await navigateAndVerify(page, '/admin/users');
  await verifyPageAccessible(page);

  // Should see admin content (heading with Dashboard or Users)
  const adminHeading = page.getByRole('heading', { name: /Dashboard|Users/i });
  await expect(adminHeading).toBeVisible();
}

/**
 * Verify regular user (non-admin) cannot access admin pages
 */
export async function verifyNoAdminAccess(page: Page): Promise<void> {
  await navigateAndVerify(page, '/admin');

  // Should see 401 error or be redirected
  const url = page.url();
  if (url.includes('/admin')) {
    await verifyPageUnauthorized(page);
  } else {
    expect(url).not.toContain('/admin');
  }
}

/**
 * Fill and submit a form with provided data
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string>,
  submitButtonText: string
): Promise<void> {
  for (const [name, value] of Object.entries(formData)) {
    const input = page.locator(`[name="${name}"]`).or(page.getByLabel(name));
    await input.fill(value);
  }

  const submitButton = page.getByRole('button', { name: submitButtonText });
  await submitButton.click();
}

/**
 * Wait for a toast/notification message to appear
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  options?: { timeout?: number }
): Promise<void> {
  const toast = page.getByText(message);
  await expect(toast).toBeVisible({ timeout: options?.timeout ?? 5000 });
}

/**
 * Get user info for a test user type
 */
export function getTestUser(userType: 'admin' | 'regular') {
  return userType === 'admin' ? TEST_USERS.ADMIN : TEST_USERS.REGULAR;
}

/**
 * Verify that user is on the expected page by checking URL
 */
export async function verifyCurrentPage(page: Page, expectedPath: string | RegExp): Promise<void> {
  if (typeof expectedPath === 'string') {
    expect(page.url()).toContain(expectedPath);
  } else {
    expect(page.url()).toMatch(expectedPath);
  }
}

/**
 * Check if an element exists on the page without throwing an error
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 1000, state: 'attached' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for admin page content to be fully loaded and visible
 * This waits for the page structure, loading states, and specific content
 */
export async function waitForAdminContent(
  page: Page,
  contentSelectors: Array<{ type: 'heading' | 'text' | 'selector'; value: string | RegExp; level?: number }>,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout || 20000;
  await waitForAdminPageReady(page, timeout);

  // Wait for specific content to appear
  for (const selector of contentSelectors) {
    if (selector.type === 'heading') {
      const headingOptions: { name: string | RegExp; level?: number; exact?: boolean } = {
        name: selector.value,
        exact: typeof selector.value === 'string',
      };
      if (selector.level !== undefined) {
        headingOptions.level = selector.level;
      }
      await expect(page.getByRole('heading', headingOptions)).toBeVisible({ timeout });
    } else if (selector.type === 'text') {
      await expect(page.getByText(selector.value)).toBeVisible({ timeout });
    } else if (selector.type === 'selector') {
      await page.waitForSelector(selector.value as string, { state: 'visible', timeout });
    }
  }
}
