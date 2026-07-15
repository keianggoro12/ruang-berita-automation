import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { UsulanPage } from '../../pages/usulan.page';
import { generateAngle, generateLatarBelakang } from '../../utils/data-generator';
import { TIMEOUT } from '../../utils/timeout';
import { usulanLocators } from '../../locators/usulan.locator';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithCreateAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Usulan - Create', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can create usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithCreateAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();
      await usulanPage.clickCreateButton();

      const angle = generateAngle();
      const latarBelakang = generateLatarBelakang(angle);
      console.log(`Angle: ${angle}`);
      await usulanPage.fillCreateForm(angle, latarBelakang);

      const submitEnabled = await usulanPage.isSubmitEnabled();
      expect(submitEnabled).toBeTruthy();

      const approveBtn = page.locator(usulanLocators.create.submitAndApproveButton).first();
      const hasApprove = await approveBtn.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
      const useApprove = hasApprove && Math.random() > 0.5;
      console.log('Has approve enabled:', hasApprove, '| Choosing:', useApprove ? 'Submit & Approve' : 'Submit');

      if (useApprove) {
        await usulanPage.clickSubmitAndApprove();
      } else {
        await usulanPage.clickSubmit();
      }

      await usulanPage.confirmModal();
      const successVisible = await usulanPage.isSuccessToastVisible();
      expect(successVisible).toBeTruthy();
    });
  }
});
