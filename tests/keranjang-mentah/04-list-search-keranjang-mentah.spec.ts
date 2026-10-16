import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  createKeranjangMentah,
  locateKeranjangMentahRow,
  KERANJANG_MENTAH_ACCESS_ROLES,
} from '../../helpers/keranjang-mentah.helper';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Keranjang Mentah - List & Search', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: keranjang mentah list and create button are visible`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();

      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();
      expect(await keranjangMentahPage.isCreateButtonVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: search finds matching keranjang mentah`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      const { judul } = await createKeranjangMentah(page);
      const rowIndex = await locateKeranjangMentahRow(page, judul);

      expect(rowIndex).toBeGreaterThanOrEqual(0);
    });

    test(`Run ${i + 1}: search with unknown keyword returns no result`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();
      await keranjangMentahPage.searchKeranjangMentah(`NOTFOUND-${Date.now()}`);
      await page.waitForTimeout(TIMEOUT.TINY);

      expect(await keranjangMentahPage.getRowCount()).toBe(0);
    });

    test(`Run ${i + 1}: row has detail link`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();

      const rowCount = await keranjangMentahPage.getRowCount();
      if (rowCount === 0) {
        test.skip();
        return;
      }

      const detailUrl = await keranjangMentahPage.getFirstRowDetailUrl();
      expect(detailUrl).toContain('/drafts/');
    });
  }
});
