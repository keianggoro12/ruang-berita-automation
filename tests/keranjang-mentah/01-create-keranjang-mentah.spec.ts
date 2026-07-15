import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { randomHeadline, randomParagraph } from '../../utils/data-generator';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithCreateAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Keranjang Mentah - Create', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can create keranjang mentah`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = pickRandom(rolesWithCreateAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const keranjangMentahPage = new KeranjangMentahPage(page);
      await keranjangMentahPage.navigateToKeranjangMentah();
      await keranjangMentahPage.clickCreateButton();

      // ── Fill Rubrik ──
      console.log('Selecting rubrik...');
      await keranjangMentahPage.selectRandomRubrik();

      // ── Fill Judul ──
      const judul = randomHeadline();
      console.log(`Filling judul: ${judul}`);
      await keranjangMentahPage.fillJudul(judul);

      // ── Fill Deskripsi ──
      const deskripsi = randomParagraph(2);
      console.log(`Filling deskripsi: ${deskripsi.substring(0, 50)}...`);
      await keranjangMentahPage.fillDeskripsi(deskripsi);

      // ── Fill Isi ──
      const isi = randomParagraph(5);
      console.log(`Filling isi: ${isi.substring(0, 50)}...`);
      await keranjangMentahPage.fillIsi(isi);

      // ── Select Article Type ──
      const articleType = await keranjangMentahPage.selectRandomArticleType();

      // ── Select File (random TECO/TM) ──
      console.log('Selecting file...');
      await keranjangMentahPage.selectRandomFile();

      // ── Select Usulan (50/50) ──
      const useUsulan = await keranjangMentahPage.selectRandomUsulan();

      // ── Fill Narasumber if usulan selected ──
      if (useUsulan) {
        console.log('Filling narasumber...');
        await keranjangMentahPage.fillRandomNarasumber();
      }

      // ── Submit ──
      console.log('Submitting...');
      await keranjangMentahPage.clickSubmit();
      await keranjangMentahPage.confirmModal();

      // ── Verify Success ──
      await page.waitForLoadState('networkidle');
      await keranjangMentahPage.navigateToKeranjangMentah();
      expect(await keranjangMentahPage.isListVisible()).toBeTruthy();
      const rowCount = await keranjangMentahPage.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
      console.log('Create SUCCESS, rows:', rowCount);
    });
  }
});
