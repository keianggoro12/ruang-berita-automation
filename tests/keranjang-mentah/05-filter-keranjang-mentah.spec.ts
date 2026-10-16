import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import { KERANJANG_MENTAH_ACCESS_ROLES } from '../../helpers/keranjang-mentah.helper';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { shuffle } from '../../utils/random';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

type JenisFilter = 'Artikel Free' | 'Artikel Freemium' | 'Artikel VIP';

interface FilterScenario {
  label: string;
  rubrik?: string;
  jenis?: JenisFilter;
  dibuatOleh?: string;
}

const FILTER_SCENARIOS: FilterScenario[] = [
  { label: 'jenis = Artikel Freemium', jenis: 'Artikel Freemium' },
  { label: 'jenis = Artikel Free', jenis: 'Artikel Free' },
  { label: 'jenis = Artikel VIP', jenis: 'Artikel VIP' },
];

test.describe('Keranjang Mentah - Filter', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: berbagai filter keranjang mentah terverifikasi`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();
      const baselineCount = await keranjangMentahPage.getRowCount();
      console.log(`Baseline rows (tanpa filter): ${baselineCount}`);

      // Get sample data for realistic filters
      if (baselineCount > 0) {
        const infoPenayangan = await keranjangMentahPage.getRowInfoPenayanganText(0);
        const jenis = await keranjangMentahPage.getRowJenisText(0);
        const dibuatOleh = await keranjangMentahPage.getRowDibuatOlehText(0);

        // Extract rubrik (after "↳")
        const rubrikMatch = infoPenayangan.match(/↳\s*(.+)$/);
        const rubrik = rubrikMatch ? rubrikMatch[1].trim() : '';

        // Extract email from dibuatOleh (contains email)
        const emailMatch = dibuatOleh.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
        const email = emailMatch ? emailMatch[0] : '';

        // Add dynamic scenarios if data exists
        if (rubrik) {
          FILTER_SCENARIOS.push({ label: `rubrik = ${rubrik}`, rubrik });
        }
        if (email) {
          FILTER_SCENARIOS.push({ label: `dibuat oleh = ${email}`, dibuatOleh: email });
        }
        if (rubrik && jenis && (jenis === 'Artikel Free' || jenis === 'Artikel Freemium' || jenis === 'Artikel VIP')) {
          FILTER_SCENARIOS.push({ label: `kombinasi ${rubrik} + ${jenis}`, rubrik, jenis });
        } else if (rubrik) {
          // default to Freemium if jenis doesn't match expected
        }
      }

      for (const scenario of shuffle(FILTER_SCENARIOS.slice(0, 5))) {
        console.log(`\n── Filter: ${scenario.label}`);

        await keranjangMentahPage.navigateToKeranjangMentah();
        await keranjangMentahPage.openFilter();

        if (scenario.rubrik) {
          await keranjangMentahPage.selectFilterRubrik(scenario.rubrik);
        }
        if (scenario.jenis) {
          await keranjangMentahPage.selectFilterJenis(scenario.jenis);
        }
        if (scenario.dibuatOleh) {
          await keranjangMentahPage.selectFilterDibuatOleh(scenario.dibuatOleh);
        }

        await keranjangMentahPage.applyFilter();
        await page.waitForTimeout(TIMEOUT.TINY);

        const rowCount = await keranjangMentahPage.getRowCount();
        console.log(`   hasil: ${rowCount} baris`);
        expect(
          rowCount,
          'jumlah baris hasil filter tidak boleh melebihi total tanpa filter'
        ).toBeLessThanOrEqual(baselineCount);

        if (scenario.rubrik && rowCount > 0) {
          const infoValues = await keranjangMentahPage.getAllRowInfoPenayangan();
          for (const value of infoValues) {
            expect(
              value.toLowerCase(),
              `setiap baris harus mengandung rubrik "${scenario.rubrik}"`
            ).toContain(scenario.rubrik.toLowerCase());
          }
        }

        if (scenario.jenis && rowCount > 0) {
          const jenisValues = await keranjangMentahPage.getAllRowJenis();
          for (const value of jenisValues) {
            expect(
              value,
              `setiap baris harus berjenis "${scenario.jenis}"`
            ).toBe(scenario.jenis);
          }
        }

        if (scenario.dibuatOleh && rowCount > 0) {
          const creatorValues = await keranjangMentahPage.getAllRowDibuatOleh();
          for (const value of creatorValues) {
            expect(
              value.toLowerCase(),
              `setiap baris harus mengandung pembuat "${scenario.dibuatOleh}"`
            ).toContain(scenario.dibuatOleh.toLowerCase());
          }
        }

        await keranjangMentahPage.resetFilter();
        await page.waitForTimeout(TIMEOUT.TINY);
        const restoredCount = await keranjangMentahPage.getRowCount();
        console.log(`   setelah reset: ${restoredCount} baris`);
        expect(
          restoredCount,
          'daftar harus kembali seperti semula setelah reset filter'
        ).toBe(baselineCount);
      }

      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();
    });
  }
});
