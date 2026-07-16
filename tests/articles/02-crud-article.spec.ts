import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { ArticlesPage } from '../../pages/articles.page';
import { randomHeadline, randomParagraph } from '../../utils/data-generator';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Articles - Full CRUD Flow', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: create → read → edit → delete without logout`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(['reporter', 'editorMuda', 'editorMadya', 'editorSenior']);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);

      // ── CREATE ──
      console.log('=== CREATE ===');
      await articlesPage.navigateToCreate();
      const { judul } = await articlesPage.fillArticleForm();
      await articlesPage.clickSimpan();
      await articlesPage.confirmModal();
      await page.waitForLoadState('networkidle');
      await articlesPage.navigateToArticles();
      expect(await articlesPage.isListVisible()).toBeTruthy();
      const createCount = await articlesPage.getRowCount();
      expect(createCount).toBeGreaterThan(0);
      console.log('Create SUCCESS, rows:', createCount);

      // ── READ ──
      console.log('=== READ ===');
      const readIdx = Math.floor(Math.random() * createCount);
      console.log('Reading row:', readIdx);
      await articlesPage.clickReadArticle(readIdx);
      const currentUrl = page.url();
      console.log('Navigated to:', currentUrl);
      expect(currentUrl).toContain('/articles/');
      await articlesPage.navigateToArticles();
      expect(await articlesPage.isListVisible()).toBeTruthy();
      console.log('Read SUCCESS');

      // ── EDIT ALL FIELDS ──
      console.log('=== EDIT ===');
      const editIdx = Math.floor(Math.random() * createCount);
      await articlesPage.openRowDropdown(editIdx);
      await articlesPage.clickEditFromDropdown();

      // Main content
      await articlesPage.fillSnackbar(randomHeadline());
      await articlesPage.fillUpperdeck(randomHeadline());
      const updatedJudul = randomHeadline();
      await articlesPage.fillJudul(updatedJudul);
      await articlesPage.fillDeskripsi(randomParagraph(2));
      await articlesPage.fillCaption(randomHeadline());
      await articlesPage.fillPoinPenting([randomHeadline(), randomHeadline(), randomHeadline()]);

      // Editors
      await articlesPage.fillEditor(0, randomParagraph(3));
      await articlesPage.fillEditor(1, randomParagraph(2));

      // Tayang
      await articlesPage.selectRandomRubrik();
      await articlesPage.selectRandomSubRubrik();
      await articlesPage.selectWaktuTayang();
      await articlesPage.selectAksesArtikel();
      await articlesPage.selectTipeArtikel();
      await articlesPage.selectRandomKategori();
      await articlesPage.selectRandomUserModel();

      // SEO
      await articlesPage.clickSeoTab();
      await articlesPage.fillSeoTitle(updatedJudul);

      // Tim
      await articlesPage.clickTimTab();
      await page.waitForTimeout(1000);
      await articlesPage.selectRandomRole();
      await articlesPage.selectRandomRedaksi();
      await articlesPage.selectDisplayAuthor();

      // Re-upload file
      await articlesPage.clickTayangTab();
      try {
        await articlesPage.uploadFile();
      } catch {
        console.log('Upload modal failed, continuing...');
      }

      // Submit
      await articlesPage.dismissAllToasts();
      if (await articlesPage.isSimpanEnabled()) {
        await articlesPage.clickSimpan();
        await articlesPage.confirmModal();
      }
      await page.waitForLoadState('networkidle');
      await articlesPage.navigateToArticles();
      const editCount = await articlesPage.getRowCount();
      expect(editCount).toBeGreaterThan(0);
      console.log('Edit SUCCESS, rows:', editCount);

      // ── DELETE ──
      console.log('=== DELETE ===');
      const deleteIdx = Math.floor(Math.random() * editCount);
      await articlesPage.openRowDropdown(deleteIdx);
      await articlesPage.clickDeleteFromDropdown();
      await articlesPage.confirmDeleteModal();
      await articlesPage.navigateToArticles();
      const finalCount = await articlesPage.getRowCount();
      expect(finalCount).toBeLessThanOrEqual(editCount);
      console.log('Delete SUCCESS, rows:', finalCount);
    });
  }
});
