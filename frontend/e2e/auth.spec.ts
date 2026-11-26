import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function expectNoHorizontalOverflow(page: Page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
}

test('registers, restores a session, signs out, and signs back in', async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Set E2E_BASE_URL to a running Apex stack with an isolated database.');
  const email = `browser-${randomUUID()}@example.com`;
  const password = 'Browser1!';
  const accountHeading = page.getByRole('heading', { name: 'Welcome to the application.' });
  await page.clock.setFixedTime(Date.now() + 2 * 60 * 60 * 1000);
  await page.goto('/app');
  await expect(page).toHaveURL('/signin');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email')).toBeFocused();
  await expect(page.getByLabel('Email')).toHaveCSS('outline-style', 'solid');

  await page.getByRole('link', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByLabel('Full name').fill('Browser Test');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await expect(page.getByRole('listitem').filter({ hasText: '(met)' })).toHaveCount(4);
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL('/app');
  await expect(accountHeading).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.reload();
  await expect(accountHeading).toBeVisible();
  await page.goto('/signup');
  await expect(page).toHaveURL('/app');

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('status')).toHaveText('You signed out.');
  await page.goto('/app');
  await expect(page).toHaveURL('/signin');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(accountHeading).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/signin');
});
