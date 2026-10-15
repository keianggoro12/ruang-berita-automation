import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import { USULAN_ACCESS_ROLES } from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { shuffle } from '../../utils/random';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

type StatusFilter = 'Sudah Disetujui' | 'Belum Disetujui';
type MasaBerlakuFilter = 'Aktif' | 'Kadaluarsa';

interface FilterScenario {
  label: string;
  status?: StatusFilter;
  masa?: MasaBerlakuFilter;
}

const FILTER_SCENARIOS: FilterScenario[] = [
  { label: 'status = Sudah Disetujui', status: 'Sudah Disetujui' },
  { label: 'status = Belum Disetujui', status: 'Belum Disetujui' },
  { label: 'masa berlaku = Aktif', masa: 'Aktif' },
  { label: 'masa berlaku = Kadaluarsa', masa: 'Kadaluarsa' },
  { label: 'kombinasi Sudah Disetujui + Aktif', status: 'Sudah Disetujui', masa: 'Aktif' },
  { label: 'kombinasi Belum Disetujui + Aktif', status: 'Belum Disetujui', masa: 'Aktif' },
  { label: 'kombinasi Sudah Disetujui + Kadaluarsa', status: 'Sudah Disetujui', masa: 'Kadaluarsa' },
];

test.describe('Usulan - Filter', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: berbagai filter status & masa berlaku terverifikasi`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();
      const baselineCount = await usulanPage.getRowCount();
      console.log(`Baseline rows (tanpa filter): ${baselineCount}`);

      for (const scenario of shuffle(FILTER_SCENARIOS)) {
        console.log(`\n── Filter: ${scenario.label}`);

        await usulanPage.navigateToUsulan();
        await usulanPage.openFilter();

        if (scenario.status) {
          await usulanPage.selectFilterStatus(scenario.status);
        }
        if (scenario.masa) {
          await usulanPage.selectFilterMasaBerlaku(scenario.masa);
        }

        await usulanPage.applyFilter();
        await page.waitForTimeout(TIMEOUT.TINY);

        const rowCount = await usulanPage.getRowCount();
        console.log(`   hasil: ${rowCount} baris`);
        expect(
          rowCount,
          'jumlah baris hasil filter tidak boleh melebihi total tanpa filter'
        ).toBeLessThanOrEqual(baselineCount);

        if (scenario.status) {
          const statuses = (await usulanPage.getAllRowStatuses()).filter((value) => value);
          console.log(`   status baris: ${statuses.join(', ') || '(kosong)'}`);
          for (const status of statuses) {
            expect(
              status,
              `setiap baris harus berstatus "${scenario.status}"`
            ).toBe(scenario.status);
          }
        }

        if (scenario.masa) {
          const masaValues = (await usulanPage.getAllRowMasaBerlaku()).filter((value) => value);
          console.log(`   masa berlaku baris: ${masaValues.join(', ') || '(kosong)'}`);
          for (const value of masaValues) {
            expect(
              value,
              `setiap baris harus bermasa berlaku "${scenario.masa}"`
            ).toBe(scenario.masa);
          }
        }

        await usulanPage.resetFilter();
        await page.waitForTimeout(TIMEOUT.TINY);
        const restoredCount = await usulanPage.getRowCount();
        console.log(`   setelah reset: ${restoredCount} baris`);
        expect(
          restoredCount,
          'daftar harus kembali seperti semula setelah reset filter'
        ).toBe(baselineCount);
      }

      expect(await usulanPage.isListVisible()).toBeTruthy();
    });
  }
});
