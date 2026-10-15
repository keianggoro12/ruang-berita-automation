import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import { openRejectOnExistingUsulan, USULAN_APPROVE_ROLES } from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Usulan - Tolak', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user can reject an unapproved usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_APPROVE_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);

      // Reject is only allowed for usulan that are "Belum Disetujui",
      // so the helper filters the list before picking a row.
      const { angle } = await openRejectOnExistingUsulan(page);
      console.log(`Rejecting usulan: ${angle}`);

      await usulanPage.confirmRejectModal();
      await page.waitForLoadState('networkidle');

      // Search the rejected angle and verify its status is now "Ditolak".
      await usulanPage.navigateToUsulan();
      await usulanPage.searchUsulan(angle);

      const rowIndex = await usulanPage.waitForAngleRow(angle, TIMEOUT.SHORT);
      expect(
        rowIndex,
        `rejected usulan "${angle}" should still appear in the list`
      ).toBeGreaterThanOrEqual(0);

      const status = await usulanPage.getRowStatusText(rowIndex);
      console.log(`Status after reject: ${status}`);
      expect(status, `usulan "${angle}" should be rejected`).toBe('Ditolak');
    });
  }
});
