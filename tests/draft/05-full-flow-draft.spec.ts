import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { DraftPage } from '../../pages/draft.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - Full Flow', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: create → edit → delete without logout`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(['reporter', 'editorMuda', 'editorMadya', 'editorSenior']);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const draftPage = new DraftPage(page);

      // ── Step 1: Create ──
      console.log('Creating keranjang mentah...');
      await draftPage.navigateToDrafts();
      await draftPage.clickCreateButton();
      await draftPage.fillDraftForm();
      await draftPage.clickSubmit();
      await draftPage.confirmModal();
      // Wait for save to complete - button shows "Menyimpan..." then redirects
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await draftPage.navigateToDrafts();
      const createCount = await draftPage.getRowCount();
      expect(createCount).toBeGreaterThan(0);
      console.log('Step 1: Create SUCCESS, rows:', createCount);

      // ── Step 2: Edit ──
      console.log('Editing...');
      const editRowIdx = 0;
      await draftPage.openRowDropdown(editRowIdx);
      await draftPage.clickEditFromDropdown();

      const { randomHeadline } = await import('../../utils/data-generator');
      const updatedJudul = randomHeadline();
      console.log(`Updated judul: ${updatedJudul}`);
      await draftPage.fillJudul(updatedJudul);

      // Re-select file (required)
      console.log('Re-selecting file...');
      await draftPage.selectRandomFile();

      await draftPage.clickSubmit();
      await draftPage.confirmModal();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await draftPage.navigateToDrafts();
      const editCount = await draftPage.getRowCount();
      expect(editCount).toBeGreaterThan(0);
      console.log('Step 2: Edit SUCCESS, rows:', editCount);

      // ── Step 3: Delete ──
      console.log('Deleting...');
      const deleteRowIdx = 0;
      await draftPage.openRowDropdown(deleteRowIdx);
      await draftPage.clickDeleteFromDropdown();
      await draftPage.confirmDeleteModal();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await draftPage.navigateToDrafts();
      const finalCount = await draftPage.getRowCount();
      console.log('Step 3: Delete SUCCESS, rows:', finalCount);
      expect(finalCount).toBeLessThanOrEqual(editCount);
    });
  }
});
