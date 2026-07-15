import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { UsulanPage } from '../../pages/usulan.page';
import { generateAngle, generateLatarBelakang } from '../../utils/data-generator';
import { TIMEOUT } from '../../utils/timeout';
import { usulanLocators } from '../../locators/usulan.locator';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithEditAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Usulan - Edit', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can edit usulan via dropdown`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithEditAccess);
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
      console.log('Picking row:', randomRowIndex);

      // Wait for status column to be populated
      await page.waitForFunction(
        (idx) => {
          const rows = document.querySelectorAll('table tbody tr');
          const row = rows[idx];
          if (!row) return false;
          const cells = row.querySelectorAll('td');
          const statusCell = cells[3];
          return statusCell && statusCell.textContent?.trim().length > 0;
        },
        randomRowIndex,
        { timeout: TIMEOUT.MEDIUM }
      );

      const rowStatus = await usulanPage.getRowStatusText(randomRowIndex);
      console.log('Row status:', rowStatus);

      await usulanPage.openRowDropdown(randomRowIndex);
      await usulanPage.clickEditFromDropdown();

      console.log('Updating tanggal...');
      await usulanPage.selectRandomTanggal();

      const updatedAngle = generateAngle();
      const updatedLatarBelakang = generateLatarBelakang(updatedAngle);
      console.log(`Updated angle: ${updatedAngle}`);

      await usulanPage.fillAngle(updatedAngle);
      await usulanPage.fillLatarBelakang(updatedLatarBelakang);

      console.log('Updating narasumber...');
      await usulanPage.updateNarasumberList();

      await usulanPage.waitForNarasumberToastDisappear();

      const submitEnabled = await usulanPage.isSubmitEnabled();
      console.log('Submit enabled after edit:', submitEnabled);

      if (submitEnabled) {
        const approved = rowStatus === 'Sudah Disetujui';
        console.log('Already approved:', approved);

        if (approved) {
          console.log('Status Sudah Disetujui → Submit only');
          await usulanPage.clickSubmit();
        } else {
          const approveBtn = page.locator(usulanLocators.create.submitAndApproveButton).first();
          const hasApprove = await approveBtn.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
          const useApprove = hasApprove && Math.random() > 0.5;
          console.log('Status Belum Disetujui | Has approve:', hasApprove, '| Choosing:', useApprove ? 'Submit & Approve' : 'Submit');
          if (useApprove) {
            await usulanPage.clickSubmitAndApprove();
          } else {
            await usulanPage.clickSubmit();
          }
        }

        await usulanPage.confirmModal();
      }

      const successVisible = await usulanPage.isSuccessToastVisible();
      expect(successVisible).toBeTruthy();
    });
  }
});
