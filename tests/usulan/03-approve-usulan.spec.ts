import { test, expect } from '@playwright/test';
import { loginAsRandomRole } from '../../helpers/auth.helper';
import { approveUsulanAtRow, createUsulan, locateUsulanRow, USULAN_APPROVE_ROLES } from '../../helpers/usulan.helper';
import { UsulanPage } from '../../pages/usulan.page';
import { usulanLocators } from '../../locators/usulan.locator';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);

test.describe('Usulan - Approve', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: user can approve an unapproved usulan`, async ({ page }) => {
      test.setTimeout(TIMEOUT.EXTRA_LONG);
      const role = await loginAsRandomRole(page, USULAN_APPROVE_ROLES);
      console.log(`Testing role: ${role}`);

      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();

      let rowIndex = (await usulanPage.getAllRowStatuses()).findIndex(s => s === 'Belum Disetujui');

      // Ensure there is an unapproved usulan to approve, create one if needed
      if (rowIndex === -1) {
        console.log('No unapproved usulan found, creating one to approve...');
        const created = await createUsulan(page, {});
        rowIndex = await locateUsulanRow(usulanPage, created.angle);
        console.log(`Created pending usulan at row ${rowIndex}: ${created.angle}`);
      }
      expect(rowIndex, 'expected an unapproved usulan to approve').toBeGreaterThanOrEqual(0);

      const approved = await approveUsulanAtRow(page, rowIndex);
      console.log(`Approved usulan: ${approved.angle}`);
      console.log(`Reporter: ${approved.reporter} | Editor: ${approved.editor} | Jenis Artikel: ${approved.articleType}`);

      // Modal should close after successful approval
      await expect(page.locator(usulanLocators.approve.heading)).not.toBeVisible({ timeout: TIMEOUT.MEDIUM });

      // Search by the angle only, then verify it appears with status "Sudah Disetujui"
      await usulanPage.navigateToUsulan();
      await usulanPage.searchUsulan(approved.angle);

      const listedRowIndex = await usulanPage.waitForAngleRow(approved.angle);
      expect(listedRowIndex, `usulan with angle "${approved.angle}" should appear in the list`).toBeGreaterThanOrEqual(0);

      const listedAngle = await usulanPage.getRowAngleOnly(listedRowIndex);
      expect(listedAngle).toContain(approved.angle);

      const status = await usulanPage.getRowStatusText(listedRowIndex);
      console.log(`Search "${approved.angle}" -> row ${listedRowIndex}, status: ${status}`);
      expect(status).toBe('Sudah Disetujui');
    });
  }
});
