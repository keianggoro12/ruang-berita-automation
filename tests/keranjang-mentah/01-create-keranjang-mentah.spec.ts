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

test.describe('Keranjang Mentah - Create', () => {
  const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];
  const rolesWithoutAccess = ['fotografer', 'penulisLuar'];

  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can create keranjang mentah`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const kmPage = new KeranjangMentahPage(page);
      await kmPage.navigateToKeranjangMentah();
      await kmPage.clickCreateButton();

      await kmPage.selectRandomRubrik();
      await kmPage.fillJudul(randomHeadline());
      await kmPage.fillDeskripsi(randomParagraph(2));
      await kmPage.fillIsi(randomParagraph(5));
      await kmPage.selectRandomArticleType();
      await kmPage.selectRandomFile();

      const useUsulan = await kmPage.selectRandomUsulan();
      if (useUsulan) {
        await kmPage.fillRandomNarasumber();
      }

      await kmPage.clickSubmit();
      await kmPage.confirmModal();
      await page.waitForLoadState('networkidle');
      await kmPage.navigateToKeranjangMentah();
      expect(await kmPage.isListVisible()).toBeTruthy();
      const rowCount = await kmPage.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
      console.log('Create SUCCESS, rows:', rowCount);
    });

    test(`Run ${i + 1}: role without access cannot create`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithoutAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const kmPage = new KeranjangMentahPage(page);
      await kmPage.navigateToKeranjangMentah();

      const hasCreateBtn = await page.locator('a[href="/drafts/create"], a:has-text("Buat Keranjang Mentah")')
        .isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);

      if (!hasCreateBtn) {
        console.log('Create button not found (expected)');
        expect(true).toBeTruthy();
      } else {
        await kmPage.clickCreateButton();
        const denied = await kmPage.isPageVisible();
        expect(!denied).toBeTruthy();
      }
    });
  }
});
