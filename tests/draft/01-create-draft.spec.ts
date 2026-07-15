import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { DraftPage } from '../../pages/draft.page';
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
      const draftPage = new DraftPage(page);
      await draftPage.navigateToDrafts();
      await draftPage.clickCreateButton();

      // ── Fill Rubrik ──
      console.log('Selecting rubrik...');
      await draftPage.selectRandomRubrik();

      // ── Fill Judul ──
      const judul = randomHeadline();
      console.log(`Filling judul: ${judul}`);
      await draftPage.fillJudul(judul);

      // ── Fill Deskripsi ──
      const deskripsi = randomParagraph(2);
      console.log(`Filling deskripsi: ${deskripsi.substring(0, 50)}...`);
      await draftPage.fillDeskripsi(deskripsi);

      // ── Fill Isi ──
      const isi = randomParagraph(5);
      console.log(`Filling isi: ${isi.substring(0, 50)}...`);
      await draftPage.fillIsi(isi);

      // ── Select Article Type ──
      const articleType = await draftPage.selectRandomArticleType();

      // ── Select File (random TECO/TM) ──
      console.log('Selecting file...');
      await draftPage.selectRandomFile();

      // ── Select Usulan (50/50) ──
      const useUsulan = await draftPage.selectRandomUsulan();

      // ── Fill Narasumber if usulan selected ──
      if (useUsulan) {
        console.log('Filling narasumber...');
        await draftPage.fillRandomNarasumber();
      }

      // ── Submit ──
      console.log('Submitting...');
      await draftPage.clickSubmit();
      await draftPage.confirmModal();

      // ── Verify Success ──
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await draftPage.navigateToDrafts();
      const rowCount = await draftPage.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
      console.log('Create SUCCESS, rows:', rowCount);
    });
  }
});
