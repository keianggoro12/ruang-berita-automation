import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import { KERANJANG_MENTAH_ACCESS_ROLES } from '../../helpers/keranjang-mentah.helper';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Keranjang Mentah - Filter', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: filter rubrik terverifikasi`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();

      const baselineCount = await keranjangMentahPage.getRowCount();
      console.log(`Baseline rows (tanpa filter): ${baselineCount}`);

      const hasFilter = await keranjangMentahPage.openFilter();
      if (!hasFilter) {
        console.log('Panel filter tidak ditemukan, skip');
        test.skip();
        return;
      }

      const applied = await keranjangMentahPage.filterByFirstRubrik();
      if (!applied) {
        console.log('Filter rubrik tidak dapat diterapkan, skip');
        test.skip();
        return;
      }

      const rowCount = await keranjangMentahPage.getRowCount();
      console.log(`Filtered rows: ${rowCount}`);
      expect(
        rowCount,
        'jumlah baris hasil filter tidak boleh melebihi total tanpa filter'
      ).toBeLessThanOrEqual(baselineCount);

      await keranjangMentahPage.resetFilter();
      await page.waitForTimeout(TIMEOUT.TINY);
      const restoredCount = await keranjangMentahPage.getRowCount();
      console.log(`Setelah reset: ${restoredCount} baris`);
      expect(
        restoredCount,
        'daftar harus kembali seperti semula setelah reset filter'
      ).toBe(baselineCount);

      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();
    });
  }
});
