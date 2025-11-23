import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { navigateAndVerify, waitForLoadingGone } from './helpers/test-utils';

test.describe('Public Flows', () => {
  test('home page has sign in button and initiates flow', async ({ page }) => {
    await navigateAndVerify(page, '/');

    // Check for Sign In button
    const signInButton = page.getByRole('button', { name: /Sign in with Plex/i });
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    await expect(signInButton).toBeEnabled();
  });

  test('invite page shows invalid state for unknown code', async ({ page }) => {
    const inviteCode = 'test-invite-code';
    await navigateAndVerify(page, `/invite/${inviteCode}`, {
      waitForSelector: 'h1, h2, [role="heading"]'
    });

    await expect(page.getByRole('heading', { name: 'Invalid Invite' })).toBeVisible({ timeout: 10000 });
  });

  test('setup page redirects if already set up', async ({ page }) => {
    await page.goto('/setup');

    // Wait for any client-side redirects or hydration to finish
    await page.waitForLoadState('networkidle');

    // Wait for loading screen to disappear
    await waitForLoadingGone(page);

    await expect(page.getByRole('heading', { name: /Manager/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Plex/i })).toBeVisible();
  });

  test('denied page is accessible', async ({ page }) => {
    await page.goto('/auth/denied');

    // Should show access denied message
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
    // The page actually has a "Try Again" link and a "Return Home" button, not a "Return to Home" link
    await expect(page.getByRole('button', { name: 'Return Home' })).toBeVisible();
  });

  test('onboarding page accessibility check', async ({ page }) => {

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

  test('shared wrapped page loads for unauthenticated user', async ({ page }) => {
    const prisma = new PrismaClient();
    const shareToken = `test-share-${Date.now()}`;

    // Mock wrapped data
    const mockWrappedData = {
      year: 2024,
      userId: 'regular-user-id',
      userName: 'Regular User',
      generatedAt: new Date().toISOString(),
      statistics: {
        totalWatchTime: { total: 1000, movies: 600, shows: 400 },
        moviesWatched: 10,
        showsWatched: 5,
        episodesWatched: 20,
        topMovies: [{ title: 'Test Movie', watchTime: 120, playCount: 1 }],
        topShows: [{ title: 'Test Show', watchTime: 200, playCount: 2, episodesWatched: 4 }]
      },
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Your 2024 Wrapped',
          content: 'Welcome to your wrapped!',
          data: { prominentStat: { value: '1000', label: 'Minutes', description: 'Total Watch Time' } }
        }
      ],
      insights: {
        personality: 'Movie Buff',
        topGenre: 'Action',
        bingeWatcher: false,
        discoveryScore: 80,
        funFacts: ['You watched a lot!']
      },
      metadata: {
        totalSections: 1,
        generationTime: 5
      }
    };

    try {
      // Ensure regular user exists (should be created by global setup, but safe to check/connect)
      // We just insert the wrapped connected to 'regular-user-id'

      await prisma.plexWrapped.create({
        data: {
          userId: 'regular-user-id',
          year: 2024,
          status: 'completed',
          data: JSON.stringify(mockWrappedData),
          shareToken: shareToken,
        }
      });

      // Navigate to share page
      await page.goto(`/wrapped/share/${shareToken}`);

      // Wait for loading to finish
      await waitForLoadingGone(page);

      // Assert content is visible
      // Adjust these selectors based on actual UI
      await expect(page.getByText("Regular User's 2024 Plex Wrapped")).toBeVisible();
      // 1000 minutes = 16 hours
      await expect(page.getByText('16 hours')).toBeVisible();

    } finally {
      // Cleanup
      await prisma.plexWrapped.deleteMany({
        where: { shareToken: shareToken }
      });
      await prisma.$disconnect();
    }
  });
});
