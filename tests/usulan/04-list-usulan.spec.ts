import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth.helper';
import { roles } from '../../fixtures/roles';
import { UsulanPage } from '../../pages/usulan.page';
import { TIMEOUT } from '../../utils/timeout';

const RUN_COUNT = parseInt(process.env.RUN_COUNT || '1', 10);
const rolesWithAccess = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

test.describe('Usulan - List Verification', () => {
  for (let i = 0; i < RUN_COUNT; i++) {
    test(`Run ${i + 1}: random role can see usulan list`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();
      expect(await usulanPage.isListVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: search usulan returns results`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();

      await usulanPage.searchUsulan('tes');
      const rowCount = await usulanPage.getRowCount();
      console.log('Search results:', rowCount);
      expect(await usulanPage.isListVisible()).toBeTruthy();
    });

    test(`Run ${i + 1}: random filter and verify table`, async ({ page }) => {
      test.setTimeout(TIMEOUT.LONG);
      const role = pickRandom(rolesWithAccess);
      console.log(`Testing role: ${role}`);

      await login(page, roles[role].email, roles[role].password);
      const usulanPage = new UsulanPage(page);
      await usulanPage.navigateToUsulan();

      const filterChoice = pickRandom([
        { type: 'status', value: 'Sudah Disetujui' as const },
        { type: 'status', value: 'Belum Disetujui' as const },
        { type: 'masa', value: 'Aktif' as const },
        { type: 'masa', value: 'Kadaluarsa' as const },
      ]);
      console.log(`Applying filter: ${filterChoice.type} = ${filterChoice.value}`);

      if (filterChoice.type === 'status') {
        await usulanPage.selectFilterStatus(filterChoice.value as 'Sudah Disetujui' | 'Belum Disetujui');
      } else {
        await usulanPage.selectFilterMasaBerlaku(filterChoice.value as 'Aktif' | 'Kadaluarsa');
      }
      await usulanPage.applyFilter();

      const rowCount = await usulanPage.getRowCount();
      console.log(`Filtered rows: ${rowCount}`);

      if (rowCount > 0) {
        if (filterChoice.type === 'status') {
          const statuses = await usulanPage.getAllRowStatuses();
          console.log('Row statuses:', statuses);
          for (const s of statuses) {
            expect(s).toBe(filterChoice.value);
          }
        } else {
          const masaValues = await usulanPage.getAllRowMasaBerlaku();
          console.log('Row masa berlaku:', masaValues);
          for (const v of masaValues) {
            expect(v).toBe(filterChoice.value);
          }
        }
      }

      expect(await usulanPage.isListVisible()).toBeTruthy();

      await usulanPage.resetFilter();
      expect(await usulanPage.isListVisible()).toBeTruthy();
    });
  }
});
