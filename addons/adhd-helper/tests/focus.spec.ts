import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.request.delete('/api/focus-sessions');
  await page.goto('/focus');
  await page.waitForLoadState('networkidle');
});

test.describe('Focus Timer Page', () => {
  test('displays the focus timer with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /focus timer/i })).toBeVisible();
  });

  test('shows all timer modes', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Focus' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Short Break' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Long Break' })).toBeVisible();
  });

  test('starts and pauses the timer', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /start/i });
    await expect(startBtn).toBeVisible();

    await startBtn.click();
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();

    await page.getByRole('button', { name: /pause/i }).click();
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('resets the timer', async ({ page }) => {
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /reset/i }).click();
    await expect(page.getByText('25:00')).toBeVisible();
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('switches between modes and resets duration', async ({ page }) => {
    await expect(page.getByText('25:00')).toBeVisible();

    await page.getByRole('button', { name: 'Short Break' }).click();
    await expect(page.getByText('05:00')).toBeVisible();

    await page.getByRole('button', { name: 'Long Break' }).click();
    await expect(page.getByText('15:00')).toBeVisible();
  });

  test('adjusts duration with slider', async ({ page }) => {
    const sliderThumb = page.locator('.MuiSlider-thumb');
    await expect(sliderThumb).toBeVisible();

    await sliderThumb.focus();
    await sliderThumb.press('ArrowRight');
    await sliderThumb.press('ArrowRight');

    const durationText = page.locator('p.MuiTypography-body2').filter({ hasText: /min/ });
    await expect(durationText).toBeVisible();
  });

  test('shows session history section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /session history/i })).toBeVisible();
    await expect(page.getByText(/no sessions yet/i)).toBeVisible();
  });

  test('sets a label for the session', async ({ page }) => {
    const labelInput = page.getByLabel('Session label');
    await expect(labelInput).toBeVisible();
    await labelInput.fill('Deep work session');
    await expect(labelInput).toHaveValue('Deep work session');
  });
});
