import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'JOIN US' }).click();
  await page.locator('input[name="username"]').click();
  await page.locator('input[name="username"]').fill('w');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('wwwwww');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'LOGOUT' }).click();
  await page.getByRole('button', { name: 'JOIN US' }).click();
});
