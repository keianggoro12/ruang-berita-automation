import { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export async function login(page: Page, email: string, password: string): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(email, password);
}

export async function logout(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.logout();
}
