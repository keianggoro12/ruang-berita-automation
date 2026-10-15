import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import { USULAN_ACCESS_ROLES } from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { pickRandom } from '../../utils/random';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

type StatusFilter = 'Sudah Disetujui' | 'Belum Disetujui';
type MasaBerlakuFilter = 'Aktif' | 'Kadaluarsa';
type FilterChoice =
  | { type: 'status'; value: StatusFilter }
  | { type: 'masa'; value: MasaBerlakuFilter };

test.describe('Usulan - Filter', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: filter status and masa berlaku works`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();
      await usulanPage.openFilter();

      const filterChoice = pickRandom<FilterChoice>([
        { type: 'status', value: 'Sudah Disetujui' },
        { type: 'status', value: 'Belum Disetujui' },
        { type: 'masa', value: 'Aktif' },
        { type: 'masa', value: 'Kadaluarsa' },
      ]);
      console.log(`Filter: ${filterChoice.type} = ${filterChoice.value}`);

      if (filterChoice.type === 'status') {
        await usulanPage.selectFilterStatus(filterChoice.value);
      } else {
        await usulanPage.selectFilterMasaBerlaku(filterChoice.value);
      }
      await usulanPage.applyFilter();
      await page.waitForTimeout(TIMEOUT.TINY);

      const rowCount = await usulanPage.getRowCount();
      console.log('Filtered rows:', rowCount);

      if (filterChoice.type === 'status') {
        const statuses = await usulanPage.getAllRowStatuses();
        for (const status of statuses) {
          if (status) {
            expect(status).toBe(filterChoice.value);
          }
        }
      } else {
        const masaValues = (await usulanPage.getAllRowMasaBerlaku()).filter((value) => value);
        for (const value of masaValues) {
          expect(value).toBe(filterChoice.value);
        }
      }

      await usulanPage.resetFilter();
      await page.waitForTimeout(TIMEOUT.TINY);
      expect(await usulanPage.isListVisible()).toBeTruthy();
    });
  }
});
