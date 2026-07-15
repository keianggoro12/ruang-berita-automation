import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { roles } from '../../fixtures/roles';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const allowedRoles = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Login & Logout', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: login lalu logout`, async ({ page }) => {
      test.setTimeout(TIMEOUT.MEDIUM);
      const role = pickRandom(allowedRoles);
      const { email, password } = roles[role];
      const loginPage = new LoginPage(page);

      await loginPage.login(email, password);
      expect(await loginPage.isLoggedIn()).toBeTruthy();

      await loginPage.logout();
      expect(await loginPage.isLoginPageVisible()).toBeTruthy();
    });
  }
});
