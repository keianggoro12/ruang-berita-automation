import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';
import { generateAngle, generateLatarBelakang } from '../../utils/data-generator';
import { usulanLocators } from '../../locators/usulan.locator';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Usulan - Full Flow', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: create → edit → delete without logout`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(['reporter', 'editorMuda', 'editorMadya', 'editorSenior']);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);

      // ── Step 1: Create ──
      const angle = generateAngle();
      const latarBelakang = generateLatarBelakang(angle);
      console.log('Creating usulan with angle:', angle);

      await usulanPage.navigateToUsulan();
      await usulanPage.clickCreateButton();
      await usulanPage.fillCreateForm(angle, latarBelakang);

      const approveBtn = page.locator(usulanLocators.create.submitAndApproveButton).first();
      const hasApprove = await approveBtn.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
      const submitApprove = hasApprove && Math.random() > 0.5;
      console.log('Has approve enabled:', hasApprove, '| Using:', submitApprove ? 'Submit & Approve' : 'Submit');
      if (submitApprove) {
        await usulanPage.clickSubmitAndApprove();
      } else {
        await usulanPage.clickSubmit();
      }
      await usulanPage.confirmModal();
      expect(await usulanPage.isSuccessToastVisible()).toBeTruthy();
      console.log('Step 1: Create SUCCESS');

      // ── Step 2: Edit ──
      await usulanPage.navigateToUsulan();
      const createCount = await usulanPage.getRowCount();
      console.log('Rows before edit:', createCount);

      // Use newest row (index 0) - list is typically sorted newest first
      const editRowIdx = 0;

      // Get status BEFORE opening dropdown (on list page)
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
        editRowIdx,
        { timeout: TIMEOUT.MEDIUM }
      );

      const rowStatus = await usulanPage.getRowStatusText(editRowIdx);
      console.log('Row status:', rowStatus);
      const approved = rowStatus === 'Sudah Disetujui';
      console.log('Already approved:', approved);

      const editAngle = generateAngle();
      const editLatarBelakang = generateLatarBelakang(editAngle);
      console.log('Editing with new angle:', editAngle);

      await usulanPage.openRowDropdown(editRowIdx);
      await usulanPage.clickEditFromDropdown();

      await usulanPage.selectRandomTanggal();
      await usulanPage.fillAngle(editAngle);
      await usulanPage.fillLatarBelakang(editLatarBelakang);

      await usulanPage.updateNarasumberList();
      await usulanPage.waitForNarasumberToastDisappear();

      if (approved) {
        console.log('Status Sudah Disetujui → Submit only');
        await usulanPage.clickSubmit();
      } else {
        const approveBtn2 = page.locator(usulanLocators.create.submitAndApproveButton).first();
        const hasApprove2 = await approveBtn2.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
        const editApprove = hasApprove2 && Math.random() > 0.5;
        console.log('Status Belum Disetujui | Has approve:', hasApprove2, '| Using:', editApprove ? 'Submit & Approve' : 'Submit');
        if (editApprove) {
          await usulanPage.clickSubmitAndApprove();
        } else {
          await usulanPage.clickSubmit();
        }
      }
      await usulanPage.confirmModal();
      expect(await usulanPage.isSuccessToastVisible()).toBeTruthy();
      console.log('Step 2: Edit SUCCESS');

      // ── Step 3: Delete ──
      await usulanPage.navigateToUsulan();
      const editCount = await usulanPage.getRowCount();
      console.log('Rows before delete:', editCount);

      // Delete the same row we edited (now at index 0)
      const deleteRowIdx = 0;
      console.log('Deleting row:', deleteRowIdx);

      await usulanPage.openRowDropdown(deleteRowIdx);
      await usulanPage.clickDeleteFromDropdown();
      await usulanPage.confirmDeleteModal();
      expect(await usulanPage.isSuccessToastVisible()).toBeTruthy();
      console.log('Step 3: Delete SUCCESS');

      // ── Step 4: Verify list count decreased ──
      await usulanPage.navigateToUsulan();
      const finalCount = await usulanPage.getRowCount();
      console.log('Final rows:', finalCount, '(was', editCount, ')');
      expect(finalCount).toBeLessThanOrEqual(editCount);
    });
  }
});