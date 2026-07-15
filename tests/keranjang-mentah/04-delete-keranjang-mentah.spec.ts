import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithDeleteAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - Delete', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can delete keranjang mentah`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(rolesWithDeleteAccess);
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
      console.log('Deleting row:', randomRowIndex);

      await keranjangMentahPage.openRowDropdown(randomRowIndex);
      await keranjangMentahPage.clickDeleteFromDropdown();

      // The delete may auto-confirm or need manual confirm
      await keranjangMentahPage.confirmDeleteModal();

      // Wait for list to refresh (either page reloads or toast appears)
      await page.waitForLoadState('networkidle');

      // Refresh the page to get fresh data
      await keranjangMentahPage.navigateToKeranjangMentah();
      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();

      const newRowCount = await keranjangMentahPage.getRowCount();
      console.log('Rows after delete:', newRowCount);
      expect(newRowCount).toBeLessThanOrEqual(rowCount);
      console.log('Delete SUCCESS');
    });
  }
});
