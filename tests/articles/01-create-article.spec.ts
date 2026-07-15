import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { ArticlesPage } from '../../pages/articles.page';
import { TIMEOUT } from '../../utils/timeout';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Articles - Create', () => {
  test('create article with all fields filled', async ({ page }) => {
    test.setTimeout(TIMEOUT.EXTRA_LONG);
    const role = pickRandom(['reporter', 'editorMuda', 'editorMadya', 'editorSenior']);
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

    if (success) {
      console.log('Article created successfully!');
      await page.waitForLoadState('load');
      const onList = page.url().includes('/articles');
      console.log('On articles list:', onList);
    }

    await page.screenshot({ path: 'test-results/article-create-result.png', fullPage: true });
  });
});
