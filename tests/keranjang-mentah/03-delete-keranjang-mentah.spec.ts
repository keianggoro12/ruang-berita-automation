import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  openDeleteOnExistingKeranjangMentah,
  KERANJANG_MENTAH_ACCESS_ROLES,
} from '../../helpers/keranjang-mentah.helper';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Keranjang Mentah - Delete', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user can delete a keranjang mentah`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      const { judul } = await openDeleteOnExistingKeranjangMentah(page);
      console.log(`Deleting existing keranjang mentah: ${judul}`);

      await keranjangMentahPage.confirmDeleteModal();

      // Reload the list, search for the deleted judul, and confirm it is gone.
      await keranjangMentahPage.navigateToKeranjangMentah();
      await keranjangMentahPage.searchKeranjangMentah(judul);

      const isGone = await keranjangMentahPage.waitForJudulRowGone(judul, TIMEOUT.SHORT);
      expect(
        isGone,
        `deleted keranjang mentah "${judul}" should no longer appear in the list`
      ).toBe(true);
    });
  }
});
