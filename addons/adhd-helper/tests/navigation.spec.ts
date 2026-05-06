import { test, expect } from '@playwright/test';

test.describe('Navigation & Layout', () => {
  test('shows the app title in the sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'ADHD Helper' }).first()).toBeVisible();
  });

  test('navigates to all pages from sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navItems = [
      { name: 'Tasks', url: '/' },
      { name: 'Focus Timer', url: '/focus' },
      { name: 'Daily Planner', url: '/planner' },
      { name: 'Habits', url: '/habits' },
      { name: 'Brain Dump', url: '/notes' },
    ];

    for (const item of navItems) {
      await page.getByRole('link', { name: item.name }).click();
      await expect(page).toHaveURL(item.url);
      await page.waitForLoadState('networkidle');
    }
  });

  test('highlights the active nav item', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const tasksLink = page.getByRole('link', { name: 'Tasks' });
    await expect(tasksLink).toHaveClass(/Mui-selected/);

    await page.getByRole('link', { name: 'Focus Timer' }).click();
    await page.waitForLoadState('networkidle');
    const focusLink = page.getByRole('link', { name: 'Focus Timer' });
    await expect(focusLink).toHaveClass(/Mui-selected/);
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'ADHD Helper' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible();
  });

  test('API endpoints are accessible', async ({ request }) => {
    const routes = [
      '/api/tasks',
      '/api/focus-sessions',
      '/api/planner',
      '/api/habits',
      '/api/habit-logs',
      '/api/notes',
    ];

    for (const route of routes) {
      const response = await request.get(route);
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('application/json');
    }
  });
});
