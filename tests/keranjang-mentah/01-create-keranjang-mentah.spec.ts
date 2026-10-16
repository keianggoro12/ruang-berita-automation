import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  createKeranjangMentah,
  locateKeranjangMentahRow,
  KERANJANG_MENTAH_ACCESS_ROLES,
  KERANJANG_MENTAH_DENIED_ROLES,
} from '../../helpers/keranjang-mentah.helper';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Keranjang Mentah - Create', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user with access can create keranjang mentah`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      const { judul } = await createKeranjangMentah(page);
      const rowIndex = await locateKeranjangMentahRow(page, judul);

      expect(rowIndex).toBeGreaterThanOrEqual(0);

      const juduls = await keranjangMentahPage.getAllRowJuduls();
      expect(juduls.length).toBeGreaterThan(0);
      expect(juduls.every((text) => text.includes(judul))).toBeTruthy();
      console.log('Create SUCCESS, keranjang mentah found in list at row', rowIndex);
    });

    test(`Run ${i + 1}: user without access is denied`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_DENIED_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();

      const hasList = await keranjangMentahPage.isListVisible();
      const denied = await keranjangMentahPage.isAccessDenied();
      expect(denied || !hasList || !(await keranjangMentahPage.isCreateButtonVisible())).toBeTruthy();
      console.log('Create button not available (expected)');
    });
  }
});
