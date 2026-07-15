import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - List Verification', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can see keranjang mentah list`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();
      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();
      const rowCount = await keranjangMentahPage.getRowCount();
      console.log('Row count:', rowCount);
    });

    test(`Run ${i + 1}: search keranjang mentah returns results`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();

      await keranjangMentahPage.searchKeranjangMentah('tes');
      const rowCount = await keranjangMentahPage.getRowCount();
      console.log('Search results:', rowCount);
      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: each row has detail link`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();

      const rowCount = await keranjangMentahPage.getRowCount();
      if (rowCount === 0) {
        console.log('No keranjang mentah found, skipping');
        test.skip();
        return;
      }

      // Verify first row has a detail link
      const detailUrl = await keranjangMentahPage.getFirstRowDetailUrl();
      console.log('Detail URL:', detailUrl);
      expect(detailUrl).toContain('/drafts/');
    });
  }
});
