import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { ArticlesPage } from '../../pages/articles.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Articles - Create', () => {
  const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];
  const rolesWithoutAccess = ['fotografer', 'penulisLuar'];

  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can create article`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);

      await articlesPage.navigateToCreate();
      await articlesPage.fillArticleForm();

      const simpanEnabled = await articlesPage.isSimpanEnabled();
      expect(simpanEnabled).toBeTruthy();

      await articlesPage.clickSimpan();
      await articlesPage.confirmModal();

      const success = await articlesPage.isSuccessToastVisible();
      expect(success).toBeTruthy();

      await page.waitForLoadState('networkidle');
      await articlesPage.navigateToArticles();
      expect(await articlesPage.isListVisible()).toBeTruthy();
      const rowCount = await articlesPage.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
      console.log('Create SUCCESS, rows:', rowCount);
    });

    test(`Run ${i + 1}: role without access cannot create article`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithoutAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);
      await articlesPage.navigateToArticles();

      const hasLink = await page.locator('a[href="/articles/create"]')
        .isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);

      if (!hasLink) {
        console.log('Create button not found (expected for restricted role)');
        expect(true).toBeTruthy();
        return;
      }

      await articlesPage.clickCreateButton();
      const denied = await articlesPage.isAccessDenied();
      const pageVisible = await articlesPage.isPageVisible();
      console.log(`Access denied: ${denied}, page visible: ${pageVisible}`);
      expect(denied || !pageVisible).toBeTruthy();
    });
  }
});
