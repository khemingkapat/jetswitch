import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('http://localhost:5173/register');
	await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
	await page.getByRole('button', { name: 'Continue with Google' }).click();
	await page.getByRole('textbox', { name: 'Email or phone' }).click();
	await expect(page.getByText('Sign in', { exact: true })).toBeVisible();
	await page.goto('http://localhost:5173/register');
	await page.locator('input[name="username"]').click();
	await page.locator('input[name="username"]').fill('test2');
	await page.locator('input[name="email"]').click();
	await page.locator('input[name="email"]').fill('test2@example.com');
	await page.locator('input[name="password"]').click();
	await page.locator('input[name="password"]').fill('testtest');
	await page.locator('input[name="confirm_password"]').click();
	await page.locator('input[name="confirm_password"]').fill('testtest');
	await page.getByRole('button', { name: 'Register' }).click();
	await expect(page.getByRole('heading', { name: 'What best describe you?' })).toBeVisible();
	await expect(page.getByRole('heading', { name: '🎧 Listener' })).toBeVisible();
	await expect(page.getByRole('heading', { name: '🎤 Artist' })).toBeVisible();
	await page.getByText('🎧 ListenerI want to discover').click();
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByRole('heading', { name: 'Welcome back, test2!' })).toBeVisible();
});
