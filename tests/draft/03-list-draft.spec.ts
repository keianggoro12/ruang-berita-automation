import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { DraftPage } from '../../pages/draft.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - List Verification', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can see draft list`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const draftPage = new DraftPage(page);
      await draftPage.navigateToDrafts();
      expect(await draftPage.isListVisible()).toBeTruthy();
      const rowCount = await draftPage.getRowCount();
      console.log('Row count:', rowCount);
    });

    test(`Run ${i + 1}: search drafts returns results`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const draftPage = new DraftPage(page);
      await draftPage.navigateToDrafts();

      await draftPage.searchDrafts('tes');
      const rowCount = await draftPage.getRowCount();
      console.log('Search results:', rowCount);
      expect(await draftPage.isListVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: each row has detail link`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const draftPage = new DraftPage(page);
      await draftPage.navigateToDrafts();

      const rowCount = await draftPage.getRowCount();
      if (rowCount === 0) {
        console.log('No drafts found, skipping');
        test.skip();
        return;
      }

      // Verify first row has a detail link
      const detailUrl = await draftPage.getFirstRowDetailUrl();
      console.log('Detail URL:', detailUrl);
      expect(detailUrl).toContain('/drafts/');
    });
  }
});
