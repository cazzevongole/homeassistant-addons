import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  const logs = await request.get('/api/habit-logs');
  const logList = await logs.json();
  for (const log of logList) {
    await request.delete(`/api/habit-logs/${log.id}`);
  }
  const habits = await request.get('/api/habits');
  const habitList = await habits.json();
  for (const habit of habitList) {
    await request.delete(`/api/habits/${habit.id}`);
  }
  await page.goto('/habits');
  await page.waitForLoadState('networkidle');
});

test.describe('Habit Tracker Page', () => {
  test('displays the habits page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /habit tracker/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add habit/i })).toBeVisible();
  });

  test('creates a new habit', async ({ page }) => {
    await page.getByRole('button', { name: /add habit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Name').fill('Drink Water');
    await page.getByLabel('Description').fill('8 glasses per day');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Drink Water')).toBeVisible();
  });

  test('shows 7-day view with day labels', async ({ page }) => {
    await page.getByRole('button', { name: /add habit/i }).click();
    await page.getByLabel('Name').fill('Test Habit');
    await page.getByRole('button', { name: /create/i }).click();

    const dayLabels = page.locator('text=/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/');
    await expect(dayLabels.first()).toBeVisible();
  });

  test('toggles habit completion for a day', async ({ page }) => {
    await page.getByRole('button', { name: /add habit/i }).click();
    await page.getByLabel('Name').fill('Exercise');
    await page.getByRole('button', { name: /create/i }).click();

    const habitCard = page.locator('.MuiPaper-root').filter({ hasText: 'Exercise' });
    const dayChips = habitCard.locator('.MuiChip-root');
    const initialCount = await dayChips.count();

    await dayChips.first().click();
    await page.waitForTimeout(500);

    await expect(habitCard.locator('svg').first()).toBeVisible();
  });

  test('deletes a habit', async ({ page }) => {
    await page.getByRole('button', { name: /add habit/i }).click();
    await page.getByLabel('Name').fill('Delete This');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('Delete This')).toBeVisible();

    const habitCard = page.locator('.MuiPaper-root').filter({ hasText: 'Delete This' });
    await habitCard.locator('button').last().click();
    await expect(page.getByText('Delete This')).not.toBeVisible();
  });

  test('shows streak counter', async ({ page }) => {
    await page.getByRole('button', { name: /add habit/i }).click();
    await page.getByLabel('Name').fill('Meditate');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/streak/i)).toBeVisible();
  });
});
