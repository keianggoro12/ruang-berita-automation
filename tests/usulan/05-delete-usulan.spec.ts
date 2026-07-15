import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithDeleteAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Usulan - Delete', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can delete usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithDeleteAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();

      const rowCount = await usulanPage.getRowCount();
      console.log('Row count:', rowCount);
      if (rowCount === 0) {
        console.log('No usulan found, skipping');
        test.skip();
        return;
      }

      const randomRowIndex = Math.floor(Math.random() * rowCount);
      const rowAngle = await usulanPage.getRowAngleText(randomRowIndex);
      console.log('Deleting row:', randomRowIndex);

      await usulanPage.openRowDropdown(randomRowIndex);
      await usulanPage.clickDeleteFromDropdown();
      await usulanPage.confirmDeleteModal();

      const successVisible = await usulanPage.isSuccessToastVisible();
      expect(successVisible).toBeTruthy();
    });
  }
});
