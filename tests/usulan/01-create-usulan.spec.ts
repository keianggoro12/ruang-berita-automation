import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  createUsulan,
  locateUsulanRow,
  USULAN_ACCESS_ROLES,
  USULAN_DENIED_ROLES,
} from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Usulan - Create', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user with access can create usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      const { angle } = await createUsulan(page);
      const rowIndex = await locateUsulanRow(usulanPage, angle);

      expect(rowIndex).toBeGreaterThanOrEqual(0);
    });

    test(`Run ${i + 1}: user without access is denied`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = await loginAsRandomRole(page, USULAN_DENIED_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();

      const hasList = await usulanPage.isListVisible();
      const denied = await usulanPage.isAccessDenied();
      expect(denied || !hasList).toBeTruthy();
    });
  }
});
