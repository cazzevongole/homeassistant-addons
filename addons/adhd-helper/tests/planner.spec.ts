import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  const items = await request.get('/api/planner');
  const itemList = await items.json();
  for (const item of itemList) {
    await request.delete(`/api/planner/${item.id}`);
  }
  await page.goto('/planner');
  await page.waitForLoadState('networkidle');
});

test.describe('Daily Planner Page', () => {
  test('displays the planner with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /daily planner/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add block/i })).toBeVisible();
  });

  test('shows time slots from 07:00 to 22:00', async ({ page }) => {
    await expect(page.getByText('07:00')).toBeVisible();
    await expect(page.getByText('12:00')).toBeVisible();
    await expect(page.getByText('22:00')).toBeVisible();
  });

  test('shows empty slots as Free', async ({ page }) => {
    const freeSlots = page.getByText('Free');
    await expect(freeSlots.first()).toBeVisible();
  });

  test('adds a new time block', async ({ page }) => {
    await page.getByRole('button', { name: /add block/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Title').fill('Morning Meeting');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Morning Meeting')).toBeVisible();
  });

  test('toggles time block completion', async ({ page }) => {
    await page.getByRole('button', { name: /add block/i }).click();
    await page.getByLabel('Title').fill('Workout Block');
    await page.getByRole('button', { name: /create/i }).click();

    const blockRow = page.locator('.MuiPaper-root, .MuiBox-root').filter({ hasText: 'Workout Block' });
    const checkbox = blockRow.locator('input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(checkbox).toBeChecked();
  });

  test('deletes a time block', async ({ page }) => {
    await page.getByRole('button', { name: /add block/i }).click();
    await page.getByLabel('Title').fill('Delete Block');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('Delete Block')).toBeVisible();

    const blockRow = page.locator('.MuiBox-root').filter({ hasText: 'Delete Block' });
    await blockRow.locator('button').last().click();
    await expect(page.getByText('Delete Block')).not.toBeVisible();
  });

  test('changes date filter', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput.first()).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await expect(dateInput.first()).toHaveValue(today);
  });
});
