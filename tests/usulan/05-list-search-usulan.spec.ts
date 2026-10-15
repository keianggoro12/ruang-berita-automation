import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  createUsulan,
  locateUsulanRow,
  USULAN_ACCESS_ROLES,
} from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Usulan - List & Search', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: usulan list and create button are visible`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();

      expect(await usulanPage.isListVisible()).toBeTruthy();
      expect(await usulanPage.isCreateButtonVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: search finds matching usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      const { angle } = await createUsulan(page);
      const rowIndex = await locateUsulanRow(usulanPage, angle);

      expect(rowIndex).toBeGreaterThanOrEqual(0);
    });

    test(`Run ${i + 1}: search with unknown keyword returns no result`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();
      await usulanPage.searchUsulan(`NOTFOUND-${Date.now()}`);
      await page.waitForTimeout(TIMEOUT.TINY);

      expect(await usulanPage.getRowCount()).toBe(0);
    });
  }
});
