import { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { roles } from '../fixtures/roles';
import { pickRandom } from '../utils/random';
import { snap } from '../utils/snap';
import { addClickEffect } from '../utils/click-effect';

export async function login(page: Page, email: string, password: string): Promise<void> {
  await addClickEffect(page);
  const loginPage = new LoginPage(page);
  await loginPage.login(email, password);
  await snap(page, 'logged in');
}

export async function loginAsRandomRole(page: Page, roleKeys: readonly string[]): Promise<string> {
  const roleKey = pickRandom(roleKeys);
  const role = roles[roleKey];
  await login(page, role.email, role.password);
  return roleKey;
}

export async function logout(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.logout();
  await snap(page, 'logged out');
}
