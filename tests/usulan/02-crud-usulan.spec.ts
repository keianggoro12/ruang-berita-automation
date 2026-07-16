import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { UsulanPage } from '../../pages/usulan.page';
import { generateAngle, generateLatarBelakang } from '../../utils/data-generator';
import { TIMEOUT } from '../../utils/timeout';
import { usulanLocators } from '../../locators/usulan.locator';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Usulan - Full CRUD Flow', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: create → edit all fields → delete without logout`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(['reporter', 'editorMuda', 'editorMadya', 'editorSenior']);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);

      // ── CREATE ──
      console.log('=== CREATE ===');
      const angle = generateAngle();
      const latarBelakang = generateLatarBelakang(angle);
      await usulanPage.navigateToUsulan();
      await usulanPage.clickCreateButton();
      await usulanPage.fillCreateForm(angle, latarBelakang);

      const approveBtn = page.locator(usulanLocators.create.submitAndApproveButton).first();
      const hasApprove = await approveBtn.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
      const useApprove = hasApprove && Math.random() > 0.5;
      if (useApprove) {
        await usulanPage.clickSubmitAndApprove();
      } else {
        await usulanPage.clickSubmit();
      }
      await usulanPage.confirmModal();
      await page.waitForLoadState('networkidle');
      console.log('Create SUCCESS');

      // ── EDIT ALL FIELDS ──
      console.log('=== EDIT ===');
      await usulanPage.navigateToUsulan();
      const createCount = await usulanPage.getRowCount();
      const editIdx = Math.floor(Math.random() * createCount);

      await page.waitForFunction(
        (idx) => {
          const rows = document.querySelectorAll('table tbody tr');
          const row = rows[idx];
          if (!row) return false;
          const cells = row.querySelectorAll('td');
          const statusCell = cells[3];
          return statusCell && statusCell.textContent?.trim().length > 0;
        },
        editIdx,
        { timeout: TIMEOUT.MEDIUM }
      );

      const rowStatus = await usulanPage.getRowStatusText(editIdx);
      const approved = rowStatus === 'Sudah Disetujui';
      console.log('Row status:', rowStatus, '| Approved:', approved);

      await usulanPage.openRowDropdown(editIdx);
      await usulanPage.clickEditFromDropdown();

      await usulanPage.selectRandomTanggal();
      await usulanPage.fillAngle(generateAngle());
      await usulanPage.fillLatarBelakang(generateLatarBelakang(''));
      await usulanPage.updateNarasumberList();
      await usulanPage.waitForNarasumberToastDisappear();

      if (approved) {
        await usulanPage.clickSubmit();
      } else {
        const approveBtn2 = page.locator(usulanLocators.create.submitAndApproveButton).first();
        const hasApprove2 = await approveBtn2.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
        if (hasApprove2 && Math.random() > 0.5) {
          await usulanPage.clickSubmitAndApprove();
        } else {
          await usulanPage.clickSubmit();
        }
      }
      await usulanPage.confirmModal();
      expect(await usulanPage.isSuccessToastVisible()).toBeTruthy();
      console.log('Edit SUCCESS');

      // ── DELETE ──
      console.log('=== DELETE ===');
      await usulanPage.navigateToUsulan();
      const editCount = await usulanPage.getRowCount();
      const deleteIdx = Math.floor(Math.random() * editCount);
      await usulanPage.openRowDropdown(deleteIdx);
      await usulanPage.clickDeleteFromDropdown();
      await usulanPage.confirmDeleteModal();
      await page.waitForLoadState('networkidle');
      console.log('Delete SUCCESS');
    });
  }
});
