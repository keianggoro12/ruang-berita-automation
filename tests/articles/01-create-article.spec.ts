import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { ArticlesPage } from '../../pages/articles.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithCreateAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Articles - Create', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can create article`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(rolesWithCreateAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);

      console.log('Navigating to articles create...');
      await articlesPage.navigateToCreate();

      console.log('Filling article form...');
      const { judul, deskripsi } = await articlesPage.fillArticleForm();
      console.log(`Form filled. Judul: ${judul.substring(0, 50)}`);

      const simpanEnabled = await articlesPage.isSimpanEnabled();
      console.log('Simpan enabled:', simpanEnabled);
      expect(simpanEnabled).toBeTruthy();

      console.log('Clicking Simpan...');
      await articlesPage.clickSimpan();
      await articlesPage.confirmModal();

      const success = await articlesPage.isSuccessToastVisible();
      console.log('Success toast:', success);

      await page.waitForLoadState('networkidle');
      await articlesPage.navigateToArticles();
      expect(await articlesPage.isListVisible()).toBeTruthy();
      const rowCount = await articlesPage.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
      console.log('Create SUCCESS, rows:', rowCount);
    });
  }
});
