import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { ArticlesPage } from '../../pages/articles.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Articles - List, Tabs, Search & Filter', () => {
  const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: list visible and has table rows`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);
      await articlesPage.navigateToArticles();
      expect(await articlesPage.isListVisible()).toBeTruthy();

      const rowCount = await articlesPage.getRowCount();
      console.log('Row count:', rowCount);

      if (rowCount > 0) {
        const cellCount = await page.locator('table tbody tr').first().locator('td').count();
        expect(cellCount).toBeGreaterThan(0);
        console.log('Row cells:', cellCount);
      }
    });

    test(`Run ${i + 1}: search returns results`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);
      await articlesPage.navigateToArticles();

      const rowCount = await articlesPage.getRowCount();
      if (rowCount === 0) {
        test.skip();
        return;
      }

      const firstRow = page.locator('table tbody tr').first();
      const judul = ((await firstRow.locator('td').nth(1).textContent()) || '').trim().substring(0, 10);
      console.log('Searching:', judul);

      await articlesPage.search(judul);
      expect(await articlesPage.getRowCount()).toBeGreaterThan(0);
    });

    test(`Run ${i + 1}: switch all tabs (unpublished/draft/scheduled/published)`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);
      await articlesPage.navigateToArticles();
      expect(await articlesPage.isListVisible()).toBeTruthy();

      for (const tab of ['unpublished', 'draft', 'scheduled', 'published'] as const) {
        if (!(await articlesPage.isTabActive(tab))) continue;
        await articlesPage.clickTab(tab);
        const visible = await articlesPage.isListVisible().catch(() => false);
        const rows = await articlesPage.getRowCount();
        console.log(`Tab ${tab}: visible=${visible}, rows=${rows}`);
      }
    });

    test(`Run ${i + 1}: filter by date range and reset`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const articlesPage = new ArticlesPage(page);
      await articlesPage.navigateToArticles();

      const dateBtn = page.locator('button:has-text("Pilih rentang tanggal")').first();
      if (!(await dateBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false))) {
        console.log('Date picker not found, skipping');
        test.skip();
        return;
      }

      await dateBtn.click();
      await page.waitForTimeout(1000);

      const calendar = page.locator('[role="grid"], [class*="calendar"]').first();
      if (await calendar.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        const days = calendar.locator('button:not([disabled])');
        const dayCount = await days.count();
        if (dayCount > 0) {
          await days.nth(Math.floor(Math.random() * Math.min(dayCount, 15))).click();
          await page.waitForTimeout(500);
        }
      }

      const applyBtn = page.locator('button:has-text("Terapkan"), button:has-text("Apply")').first();
      if (await applyBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForLoadState('networkidle');
      }

      expect(await articlesPage.isListVisible()).toBeTruthy();
      console.log('Filter rows:', await articlesPage.getRowCount());

      const resetBtn = page.locator('button:has-text("Reset")').first();
      if (await resetBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await resetBtn.click();
        await page.waitForLoadState('networkidle');
      }

      expect(await articlesPage.isListVisible()).toBeTruthy();
      console.log('Filter test SUCCESS');
    });
  }
});
