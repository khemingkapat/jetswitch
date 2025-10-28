import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('http://localhost:5173/');
	await expect(page.getByRole('heading', { name: 'JetSwitch' })).toBeVisible();
	await page.getByRole('button', { name: 'JOIN US' }).click();
	await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
	await page.getByRole('link', { name: 'Register here' }).click();
	await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
	await page.goto('http://localhost:5173/');
	await expect(page.getByRole('heading', { name: 'JetSwitch' })).toBeVisible();
});
