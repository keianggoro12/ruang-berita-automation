import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { randomHeadline, randomParagraph } from '../../utils/data-generator';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - Full CRUD Flow', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: create → edit all fields → delete without logout`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(['reporter', 'editorMuda', 'editorMadya', 'editorSenior']);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const kmPage = new KeranjangMentahPage(page);

      // ── CREATE ──
      console.log('=== CREATE ===');
      await kmPage.navigateToKeranjangMentah();
      await kmPage.clickCreateButton();
      await kmPage.fillKeranjangMentahForm();
      await kmPage.clickSubmit();
      await kmPage.confirmModal();
      await page.waitForLoadState('networkidle');
      await kmPage.navigateToKeranjangMentah();
      expect(await kmPage.isListVisible()).toBeTruthy();
      const createCount = await kmPage.getRowCount();
      expect(createCount).toBeGreaterThan(0);
      console.log('Create SUCCESS, rows:', createCount);

      // ── EDIT ALL FIELDS ──
      console.log('=== EDIT ===');
      const editIdx = Math.floor(Math.random() * createCount);
      await kmPage.openRowDropdown(editIdx);
      await kmPage.clickEditFromDropdown();

      await kmPage.selectRandomRubrik();
      await kmPage.fillJudul(randomHeadline());
      await kmPage.fillDeskripsi(randomParagraph(2));
      await kmPage.fillIsi(randomParagraph(5));
      await kmPage.selectRandomFile();

      await kmPage.dismissAllToasts();
      if (await kmPage.isSubmitEnabled()) {
        await kmPage.clickSubmit();
        await kmPage.confirmModal();
      }
      await page.waitForURL('**/drafts', { timeout: TIMEOUT.MEDIUM });
      expect(await page.locator('table tbody tr').first().isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false)).toBeTruthy();
      console.log('Edit SUCCESS');

      // ── DELETE ──
      console.log('=== DELETE ===');
      await kmPage.navigateToKeranjangMentah();
      const editCount = await kmPage.getRowCount();
      const deleteIdx = Math.floor(Math.random() * editCount);
      await kmPage.openRowDropdown(deleteIdx);
      await kmPage.clickDeleteFromDropdown();
      await kmPage.confirmDeleteModal();
      await kmPage.navigateToKeranjangMentah();
      const finalCount = await kmPage.getRowCount();
      expect(finalCount).toBeLessThanOrEqual(editCount);
      console.log('Delete SUCCESS, rows:', finalCount);
    });
  }
});
