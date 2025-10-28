import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('http://localhost:5173/login');
	await expect(page.getByRole('link', { name: 'Register here' })).toBeVisible();
	await page.getByRole('link', { name: 'Register here' }).click();
	await page.locator('input[name="username"]').click();
	await page.locator('input[name="username"]').fill('test');
	await page.locator('input[name="email"]').click();
	await page.locator('input[name="email"]').fill('test@example.com');
	await page.locator('input[name="password"]').click();
	await page.locator('input[name="password"]').fill('');
	await page.locator('input[name="password"]').click();
	await page.locator('input[name="password"]').fill('testtest');
	await page.locator('input[name="confirm_password"]').click();
	await page.locator('input[name="confirm_password"]').fill('testtest');
	await page.getByRole('button', { name: 'Register' }).click();
	await page.getByText('I want to discover new music').click();
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByRole('button', { name: 'LOGOUT' }).click();
	await page.getByRole('button', { name: 'JOIN US' }).click();
	await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
	await page.locator('input[name="username"]').click();
	await page.locator('input[name="username"]').fill('test');
	await page.locator('input[name="password"]').click();
	await page.locator('input[name="password"]').fill('testtest');
	await page.getByRole('button', { name: 'Login' }).click();
	await expect(page.getByRole('heading', { name: 'Welcome back, test!' })).toBeVisible();
});
