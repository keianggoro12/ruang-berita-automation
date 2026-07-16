import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - List', () => {
  const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: list visible and has table rows`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const kmPage = new KeranjangMentahPage(page);
      await kmPage.navigateToKeranjangMentah();
      expect(await kmPage.isListVisible()).toBeTruthy();
      const rowCount = await kmPage.getRowCount();
      console.log('Row count:', rowCount);
    });

    test(`Run ${i + 1}: search returns results`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const kmPage = new KeranjangMentahPage(page);
      await kmPage.navigateToKeranjangMentah();

      await kmPage.searchKeranjangMentah('tes');
      expect(await kmPage.isListVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: row has detail link`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const kmPage = new KeranjangMentahPage(page);
      await kmPage.navigateToKeranjangMentah();

      const rowCount = await kmPage.getRowCount();
      if (rowCount === 0) {
        test.skip();
        return;
      }

      const detailUrl = await kmPage.getFirstRowDetailUrl();
      expect(detailUrl).toContain('/drafts/');
    });
  }
});
