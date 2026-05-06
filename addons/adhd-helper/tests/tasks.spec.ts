import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  const tasks = await request.get('/api/tasks');
  const taskList = await tasks.json();
  for (const task of taskList) {
    await request.delete(`/api/tasks/${task.id}`);
  }
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Tasks Page', () => {
  test('displays the tasks page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tasks & reminders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add task/i })).toBeVisible();
  });

  test('creates a new task through the UI', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Title').fill('New Task');
    await page.getByLabel('Description').fill('Task description');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('New Task')).toBeVisible();
    await expect(page.getByText('Task description')).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'medium' })).toBeVisible();
  });

  test('toggles task completion', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByLabel('Title').fill('Toggle Task');
    await page.getByRole('button', { name: /create/i }).click();

    const taskRow = page.locator('.MuiPaper-root').filter({ hasText: 'Toggle Task' });
    const checkbox = taskRow.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await page.waitForTimeout(500);

    await expect(checkbox).toBeChecked();
  });

  test('deletes a task', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByLabel('Title').fill('Delete Task');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('Delete Task')).toBeVisible();

    const taskRow = page.locator('div').filter({ hasText: 'Delete Task' });
    await taskRow.locator('button').last().click();
    await expect(page.getByText('Delete Task')).not.toBeVisible();
  });

  test('filters tasks by status', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByLabel('Title').fill('Active Task');
    await page.getByRole('button', { name: /create/i }).click();

    await page.getByRole('button', { name: /completed/i }).click();
    await expect(page.getByText('Active Task')).not.toBeVisible();

    await page.getByRole('button', { name: /all/i }).click();
    await expect(page.getByText('Active Task')).toBeVisible();
  });

  test('creates a task with due date and reminder', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByLabel('Title').fill('Scheduled Task');
    await page.getByLabel('Due Date').fill('2025-12-31');
    await page.getByLabel('Reminder Time').fill('14:30');
    await page.getByRole('button', { name: /create/i }).click();

    const taskRow = page.locator('div').filter({ hasText: 'Scheduled Task' });
    await expect(taskRow.getByText('2025-12-31').first()).toBeVisible();
  });
});
