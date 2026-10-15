import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  openEditOnExistingUsulan,
  locateUsulanRow,
  USULAN_ACCESS_ROLES,
} from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { generateReferenceCode } from '../../utils/data-generator';
import { generateUsulanContent } from '../../utils/ai-generator';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Usulan - Edit', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user can edit an existing usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      const { angle: originalAngle } = await openEditOnExistingUsulan(page);
      console.log(`Editing existing usulan: ${originalAngle}`);

      const content = await generateUsulanContent();
      const updatedAngle = `${content.angle} ${generateReferenceCode()}`;

      await usulanPage.selectRandomTanggal();
      await usulanPage.fillAngle(updatedAngle);
      await usulanPage.fillLatarBelakang(content.latarBelakang);
      await usulanPage.updateNarasumberList(content.narasumber);
      await usulanPage.waitForNarasumberToastDisappear();
      await usulanPage.clickSubmit();
      await usulanPage.confirmModal();

      const updatedRowIndex = await locateUsulanRow(usulanPage, updatedAngle);
      expect(
        updatedRowIndex,
        `edited usulan "${updatedAngle}" should appear in the list`
      ).toBeGreaterThanOrEqual(0);
    });
  }
});
