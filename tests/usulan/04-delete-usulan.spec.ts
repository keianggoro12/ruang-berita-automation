import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import {
  openDeleteOnExistingUsulan,
  USULAN_ACCESS_ROLES,
} from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Usulan - Delete', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user can delete an unapproved usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_ACCESS_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      const { angle } = await openDeleteOnExistingUsulan(page);
      console.log(`Deleting existing unapproved usulan: ${angle}`);

      await usulanPage.confirmDeleteModal();

      // Reload the list, search for the deleted angle, and confirm it is gone.
      await usulanPage.navigateToUsulan();
      await usulanPage.searchUsulan(angle);

      const isGone = await usulanPage.waitForAngleRowGone(angle, TIMEOUT.SHORT);
      expect(
        isGone,
        `deleted usulan "${angle}" should no longer appear in the list`
      ).toBe(true);
    });
  }
});
