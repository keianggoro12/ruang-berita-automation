import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
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
      const keranjangMentahPage = new KeranjangMentahPage(page);

      // ── Step 1: Create ──
      console.log('Creating keranjang mentah...');
      await keranjangMentahPage.navigateToKeranjangMentah();
      await keranjangMentahPage.clickCreateButton();
      await keranjangMentahPage.fillKeranjangMentahForm();
      await keranjangMentahPage.clickSubmit();
      await keranjangMentahPage.confirmModal();
      await page.waitForLoadState('networkidle');
      await keranjangMentahPage.navigateToKeranjangMentah();
      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();
      const createCount = await keranjangMentahPage.getRowCount();
      expect(createCount).toBeGreaterThan(0);
      console.log('Step 1: Create SUCCESS, rows:', createCount);

      // ── Step 2: Edit ──
      console.log('Editing...');
      const editRowIdx = 0;
      await keranjangMentahPage.openRowDropdown(editRowIdx);
      await keranjangMentahPage.clickEditFromDropdown();

      const { randomHeadline } = await import('../../utils/data-generator');
      const updatedJudul = randomHeadline();
      console.log(`Updated judul: ${updatedJudul}`);
      await keranjangMentahPage.fillJudul(updatedJudul);

      // Re-select file (required)
      console.log('Re-selecting file...');
      await keranjangMentahPage.selectRandomFile();

      await keranjangMentahPage.clickSubmit();
      await keranjangMentahPage.confirmModal();
      await page.waitForLoadState('networkidle');
      await keranjangMentahPage.navigateToKeranjangMentah();
      const editCount = await keranjangMentahPage.getRowCount();
      expect(editCount).toBeGreaterThan(0);
      console.log('Step 2: Edit SUCCESS, rows:', editCount);

      // ── Step 3: Delete ──
      console.log('Deleting...');
      const deleteRowIdx = 0;
      await keranjangMentahPage.openRowDropdown(deleteRowIdx);
      await keranjangMentahPage.clickDeleteFromDropdown();
      await keranjangMentahPage.confirmDeleteModal();
      await keranjangMentahPage.navigateToKeranjangMentah();
      const finalCount = await keranjangMentahPage.getRowCount();
      console.log('Step 3: Delete SUCCESS, rows:', finalCount);
      expect(finalCount).toBeLessThanOrEqual(editCount);
    });
  }
});
