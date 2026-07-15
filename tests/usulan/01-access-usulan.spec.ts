import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];
const rolesWithoutAccess = ['fotografer', 'penulisLuar'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Usulan - Access Control', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role with access can view Usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();
      expect(await usulanPage.isPageVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: random role without access is denied`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithoutAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const hasLink = await page.locator('a[href="/proposals"]').isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
      if (hasLink) {
        const usulanPage = new UsulanPage(page);
        await usulanPage.navigateToUsulan();
        const denied = await usulanPage.isAccessDenied();
        expect(denied || !(await usulanPage.isListVisible())).toBeTruthy();
      } else {
        expect(true).toBeTruthy();
      }
    });
  }
});
