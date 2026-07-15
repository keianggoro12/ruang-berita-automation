import { Page } from '@playwright/test';
import { authLocators } from '../locators/auth.locator';

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.getByRole('textbox', { name: authLocators.emailInput.name }).fill(email);
  await page.getByRole('textbox', { name: authLocators.passwordInput.name }).fill(password);
  await page.getByRole('button', { name: authLocators.loginButton.name }).click();

  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page): Promise<void> {
  const logoutBtn = page.locator(authLocators.logoutButton).first();
  if (await logoutBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForLoadState('networkidle');
  }
}
