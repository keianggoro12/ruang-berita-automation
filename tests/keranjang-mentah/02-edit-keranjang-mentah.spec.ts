import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  openEditOnExistingKeranjangMentah,
  locateKeranjangMentahRow,
  KERANJANG_MENTAH_ACCESS_ROLES,
} from '../../helpers/keranjang-mentah.helper';
import { KeranjangMentahPage } from '../../pages/keranjang-mentah.page';
import { generateKeranjangMentahContent } from '../../utils/ai-generator';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Keranjang Mentah - Edit', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user can edit an existing keranjang mentah`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, KERANJANG_MENTAH_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const keranjangMentahPage = new KeranjangMentahPage(page);
      const { judul: originalJudul } = await openEditOnExistingKeranjangMentah(page);
      console.log(`Editing existing keranjang mentah: ${originalJudul}`);

      const content = await generateKeranjangMentahContent();

      await keranjangMentahPage.selectRandomRubrik();
      await keranjangMentahPage.fillJudul(content.judul);
      await keranjangMentahPage.fillDeskripsi(content.deskripsi);
      await keranjangMentahPage.fillIsi(content.isi);
      await keranjangMentahPage.selectRandomFile();

      await keranjangMentahPage.dismissAllToasts();
      await keranjangMentahPage.clickSubmit();
      await keranjangMentahPage.confirmModal();

      const updatedRowIndex = await locateKeranjangMentahRow(page, content.judul);
      expect(
        updatedRowIndex,
        `edited keranjang mentah "${content.judul}" should appear in the list`
      ).toBeGreaterThanOrEqual(0);
    });
  }
});
