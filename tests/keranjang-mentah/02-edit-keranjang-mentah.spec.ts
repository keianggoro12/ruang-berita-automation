import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { randomHeadline, randomParagraph } from '../../utils/data-generator';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithEditAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - Edit', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can edit keranjang mentah via dropdown`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(rolesWithEditAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();

      const rowCount = await keranjangMentahPage.getRowCount();
      console.log('Row count:', rowCount);
      if (rowCount === 0) {
        console.log('No keranjang mentah found, skipping');
        test.skip();
        return;
      }

      const randomRowIndex = Math.floor(Math.random() * rowCount);
      console.log('Picking row:', randomRowIndex);

      await keranjangMentahPage.openRowDropdown(randomRowIndex);
      await keranjangMentahPage.clickEditFromDropdown();

      // Update judul
      const updatedJudul = randomHeadline();
      console.log(`Updated judul: ${updatedJudul}`);
      await keranjangMentahPage.fillJudul(updatedJudul);

      // Update deskripsi
      const updatedDeskripsi = randomParagraph(2);
      console.log(`Updated deskripsi: ${updatedDeskripsi.substring(0, 50)}...`);
      await keranjangMentahPage.fillDeskripsi(updatedDeskripsi);

      // Update isi
      const updatedIsi = randomParagraph(5);
      console.log(`Updated isi: ${updatedIsi.substring(0, 50)}...`);
      await keranjangMentahPage.fillIsi(updatedIsi);

      // Re-select file (required field)
      console.log('Re-selecting file...');
      await keranjangMentahPage.selectRandomFile();

      // Submit
      console.log('Submitting...');
      await keranjangMentahPage.dismissAllToasts();
      const submitEnabled = await keranjangMentahPage.isSubmitEnabled();
      console.log('Submit enabled:', submitEnabled);

      if (submitEnabled) {
        await keranjangMentahPage.clickSubmit();
        await keranjangMentahPage.confirmModal();
      }

      // Wait for navigation back to keranjang mentah list
      await page.waitForURL('**/drafts', { timeout: TIMEOUT.MEDIUM });

      const successVisible = await page.locator('table tbody tr').first()
        .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
      expect(successVisible).toBeTruthy();
      console.log('Edit SUCCESS');
    });
  }
});
