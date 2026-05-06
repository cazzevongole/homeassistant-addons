import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  const notes = await request.get('/api/notes');
  const noteList = await notes.json();
  for (const note of noteList) {
    await request.delete(`/api/notes/${note.id}`);
  }
  await page.goto('/notes');
  await page.waitForLoadState('networkidle');
});

test.describe('Brain Dump / Notes Page', () => {
  test('displays the notes page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /brain dump/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new note/i })).toBeVisible();
  });

  test('creates a new note', async ({ page }) => {
    await page.getByRole('button', { name: /new note/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Title').fill('Test Note');
    await page.getByLabel('Content').fill('Note content here');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Test Note')).toBeVisible();
    await expect(page.getByText('Note content here')).toBeVisible();
  });

  test('deletes a note', async ({ page }) => {
    await page.getByRole('button', { name: /new note/i }).click();
    await page.getByLabel('Title').fill('Delete Note');
    await page.getByLabel('Content').fill('To be deleted');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('Delete Note')).toBeVisible();

    const noteCard = page.locator('.MuiPaper-root').filter({ hasText: 'Delete Note' });
    await noteCard.locator('button').last().click();
    await expect(page.getByText('Delete Note')).not.toBeVisible();
  });

  test('pins and unpins a note', async ({ page }) => {
    await page.getByRole('button', { name: /new note/i }).click();
    await page.getByLabel('Title').fill('Pin Note');
    await page.getByLabel('Content').fill('Important note');
    await page.getByRole('button', { name: /create/i }).click();

    const noteCard = page.locator('.MuiPaper-root').filter({ hasText: 'Pin Note' });
    const pinBtn = noteCard.locator('button').nth(1);
    await pinBtn.click();

    await expect(noteCard.locator('[data-testid="PushPinIcon"]').first()).toBeVisible();
  });

  test('searches notes', async ({ page }) => {
    await page.getByRole('button', { name: /new note/i }).click();
    await page.getByLabel('Title').fill('Searchable Note');
    await page.getByLabel('Content').fill('This note should be findable');
    await page.getByRole('button', { name: /create/i }).click();

    const searchInput = page.getByPlaceholder('Search notes...');
    await searchInput.fill('Searchable Note');
    await expect(page.getByText('Searchable Note')).toBeVisible();

    await searchInput.fill('nonexistent xyz');
    await expect(page.getByText('Searchable Note')).not.toBeVisible();

    await searchInput.fill('');
    await expect(page.getByText('Searchable Note')).toBeVisible();
  });

  test('edits an existing note', async ({ page }) => {
    await page.getByRole('button', { name: /new note/i }).click();
    await page.getByLabel('Title').fill('Edit Note');
    await page.getByLabel('Content').fill('Original content');
    await page.getByRole('button', { name: /create/i }).click();

    const noteCard = page.locator('.MuiPaper-root').filter({ hasText: 'Edit Note' });
    await noteCard.locator('button').nth(1).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Title').fill('Edited Title');
    await page.getByLabel('Content').fill('Updated content');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Edited Title')).toBeVisible();
    await expect(page.getByText('Updated content')).toBeVisible();
  });
});
