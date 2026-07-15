import { expect, Page } from '@playwright/test';
import { usulanLocators } from '../locators/usulan.locator';
import { TIMEOUT } from '../utils/timeout';
import { generateNarasumber } from '../utils/data-generator';

export class UsulanPage {
  constructor(private page: Page) {}

  async navigateToUsulan(): Promise<void> {
    await this.page.locator(usulanLocators.nav.link).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async isPageVisible(): Promise<boolean> {
    return this.page.locator('main').first().isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isListVisible(): Promise<boolean> {
    return this.page.locator(usulanLocators.list.table).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isAccessDenied(): Promise<boolean> {
    for (const text of ['403', 'Akses Ditolak', 'Forbidden', 'Anda tidak memiliki akses']) {
      if (await this.page.locator(`:has-text("${text}")`).first().isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  // ── List Actions ──

  async getRowCount(): Promise<number> {
    return this.page.locator(usulanLocators.list.rows).count();
  }

  async getRowAngleText(rowIndex: number): Promise<string> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    const secondTd = row.locator('td').nth(1);
    return (await secondTd.textContent()) || '';
  }

  async openRowDropdown(rowIndex: number): Promise<void> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    await row.locator(usulanLocators.list.kebabButton).last().click();
    await expect(this.page.locator(usulanLocators.list.dropdownMenu.editUsulan).first()).toBeVisible({ timeout: TIMEOUT.SHORT });
  }

  async clickEditFromDropdown(): Promise<void> {
    await this.page.locator(usulanLocators.list.dropdownMenu.editUsulan).first().click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(usulanLocators.edit.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickDeleteFromDropdown(): Promise<void> {
    await this.page.locator(usulanLocators.list.dropdownMenu.deleteUsulan).first().click();
    await expect(this.page.locator(usulanLocators.delete.confirmModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickApproveFromDropdown(): Promise<void> {
    await this.page.locator(usulanLocators.list.dropdownMenu.approveUsulan).first().click();
    await expect(this.page.locator(usulanLocators.delete.confirmModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  // ── Search ──

  async searchUsulan(query: string): Promise<void> {
    const input = this.page.locator(usulanLocators.list.searchInput).first();
    await input.fill(query);
    await input.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Filter ──

  async openFilter(): Promise<void> {
    await this.page.locator(usulanLocators.filter.toggleButton).first().click();
    await expect(this.page.locator(usulanLocators.filter.statusDropdown).first()).toBeVisible({ timeout: TIMEOUT.SHORT });
  }

  async selectFilterStatus(status: 'Sudah Disetujui' | 'Belum Disetujui'): Promise<void> {
    const dropdown = this.page.locator(usulanLocators.filter.statusDropdown).first();
    await dropdown.selectOption({ label: status });
    await expect(dropdown).toHaveValue(await dropdown.inputValue(), { timeout: TIMEOUT.SHORT });
  }

  async selectFilterMasaBerlaku(masa: 'Aktif' | 'Kadaluarsa'): Promise<void> {
    const dropdown = this.page.locator(usulanLocators.filter.masaBerlakuDropdown).first();
    await dropdown.selectOption({ label: masa });
    await expect(dropdown).toHaveValue(await dropdown.inputValue(), { timeout: TIMEOUT.SHORT });
  }

  async applyFilter(): Promise<void> {
    await this.page.locator(usulanLocators.filter.applyButton).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async resetFilter(): Promise<void> {
    await this.page.locator(usulanLocators.filter.resetButton).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async getRowStatusText(rowIndex: number): Promise<string> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    const statusCell = row.locator('td').nth(3);
    return ((await statusCell.textContent()) || '').trim();
  }

  async getRowMasaBerlakuText(rowIndex: number): Promise<string> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    const cell = row.locator('td').nth(7);
    return (await cell.textContent()) || '';
  }

  async getAllRowStatuses(): Promise<string[]> {
    const rows = this.page.locator(usulanLocators.list.rows);
    const count = await rows.count();
    const statuses: string[] = [];
    for (let i = 0; i < count; i++) {
      const cell = rows.nth(i).locator('td').nth(3);
      statuses.push(((await cell.textContent()) || '').trim());
    }
    return statuses;
  }

  async getAllRowMasaBerlaku(): Promise<string[]> {
    const rows = this.page.locator(usulanLocators.list.rows);
    const count = await rows.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const cell = rows.nth(i).locator('td').nth(7);
      values.push(((await cell.textContent()) || '').trim());
    }
    return values;
  }

  async waitForNarasumberToastDisappear(): Promise<void> {
    const toast = this.page.locator('[role="region"][aria-label="Notifications alt+T"] li:has-text("berhasil ditambahkan")').first();
    if (await toast.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      console.log('Narasumber toast detected, removing...');
      await this.page.evaluate(() => {
        document.querySelectorAll('[role="region"][aria-label="Notifications alt+T"] li').forEach((el: Element) => el.remove());
      });
      await expect(toast).not.toBeVisible({ timeout: TIMEOUT.SHORT });
      console.log('Narasumber toast removed');
    }
  }

  // ── Delete ──

  async confirmDeleteModal(): Promise<void> {
    const confirmBtn = this.page.locator(usulanLocators.delete.confirmModal.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await confirmBtn.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  // ── Create ──

  async clickCreateButton(): Promise<void> {
    await this.page.locator(usulanLocators.list.createButton).first().click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(usulanLocators.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async selectRandomTanggal(): Promise<void> {
    const calendarPicker = this.page.locator('[role="grid"], .react-datepicker, [class*="calendar"], [class*="datepicker"]').first();

    // Try create mode button first ("Pilih tanggal")
    const createBtn = this.page.locator(usulanLocators.create.tanggalButton).first();
    if (await createBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await createBtn.click();
      await expect(calendarPicker).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    } else {
      // Edit mode: find button with date pattern like "25 Sept 2026"
      const dateBtn = this.page.locator('button', { hasText: /\d{1,2}\s+\w{3}\s+\d{4}/ }).first();
      await dateBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
      await dateBtn.click();
      await expect(calendarPicker).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    }

    const monthForward = Math.floor(Math.random() * 3) + 1;
    const nextMonthBtn = this.page.locator('button:has(.lucide-chevron-right)').first();
    for (let i = 0; i < monthForward; i++) {
      if (await nextMonthBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await nextMonthBtn.click();
        await expect(nextMonthBtn).toBeVisible({ timeout: TIMEOUT.SHORT });
      }
    }

    const dayButtons = this.page.locator('button.p-1\\.5.text-center.text-sm');
    const count = await dayButtons.count();

    if (count > 0) {
      const randomIdx = Math.floor(Math.random() * count);
      const dayText = await dayButtons.nth(randomIdx).textContent();
      console.log(`Picking date day: ${dayText}`);
      await dayButtons.nth(randomIdx).click();
    }
  }

  async fillAngle(angle: string): Promise<void> {
    const input = this.page.locator(usulanLocators.create.angleInput).first();
    await input.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await input.fill(angle);
    await expect(input).toHaveValue(angle, { timeout: TIMEOUT.SHORT });
  }

  async fillLatarBelakang(content: string): Promise<void> {
    const editor = this.page.locator(usulanLocators.create.latarBelakangEditor).first();
    await editor.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });

    await editor.click();
    await this.page.keyboard.insertText(content);

    await expect(editor).not.toBeEmpty({ timeout: TIMEOUT.SHORT });
  }

  async fillNarasumberList(): Promise<void> {
    const sources = generateNarasumber();
    console.log(`Filling ${sources.length} narasumber`);

    for (let i = 0; i < sources.length; i++) {
      if (i > 0) {
        const addBtn = this.page.locator(usulanLocators.create.narasumber.addButton).first();
        if (await addBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
          await addBtn.click();
          await this.waitForNarasumberToastDisappear();
        }
      }

      const nameInputs = this.page.locator(usulanLocators.create.narasumber.nameInput);
      const jabatanInputs = this.page.locator(usulanLocators.create.narasumber.jabatanInput);
      const kontakInputs = this.page.locator(usulanLocators.create.narasumber.kontakInput);

      if (await nameInputs.nth(i).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await nameInputs.nth(i).fill(sources[i].nama);
        await expect(nameInputs.nth(i)).toHaveValue(sources[i].nama, { timeout: TIMEOUT.SHORT });
      }
      if (await jabatanInputs.nth(i).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await jabatanInputs.nth(i).fill(sources[i].jabatan);
        await expect(jabatanInputs.nth(i)).toHaveValue(sources[i].jabatan, { timeout: TIMEOUT.SHORT });
      }
      if (await kontakInputs.nth(i).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await kontakInputs.nth(i).fill(sources[i].kontak);
        await expect(kontakInputs.nth(i)).toHaveValue(sources[i].kontak, { timeout: TIMEOUT.SHORT });
      }
    }
  }

  async fillCreateForm(angle: string, latarBelakang: string): Promise<void> {
    console.log('Filling date...');
    await this.selectRandomTanggal();

    console.log('Filling angle...');
    await this.fillAngle(angle);

    console.log('Filling latar belakang...');
    await this.fillLatarBelakang(latarBelakang);

    console.log('Filling narasumber list...');
    await this.fillNarasumberList();
    await this.waitForNarasumberToastDisappear();
  }

  async updateNarasumberList(): Promise<void> {
    const nameInputs = this.page.locator(usulanLocators.create.narasumber.nameInput);
    const jabatanInputs = this.page.locator(usulanLocators.create.narasumber.jabatanInput);
    const kontakInputs = this.page.locator(usulanLocators.create.narasumber.kontakInput);
    const existingCount = await nameInputs.count();
    console.log(`Updating ${existingCount} existing narasumber`);

    const sources = generateNarasumber();

    for (let i = 0; i < existingCount; i++) {
      if (await nameInputs.nth(i).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await nameInputs.nth(i).clear();
        await nameInputs.nth(i).fill(sources[i % sources.length].nama);
      }
      if (await jabatanInputs.nth(i).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await jabatanInputs.nth(i).clear();
        await jabatanInputs.nth(i).fill(sources[i % sources.length].jabatan);
      }
      if (await kontakInputs.nth(i).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await kontakInputs.nth(i).clear();
        await kontakInputs.nth(i).fill(sources[i % sources.length].kontak);
      }
    }

    const addBtn = this.page.locator(usulanLocators.create.narasumber.addButton).first();
    if (await addBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await addBtn.click();
      await this.waitForNarasumberToastDisappear();
      const newIdx = existingCount;
      const newSource = sources[newIdx % sources.length];
      if (await nameInputs.nth(newIdx).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await nameInputs.nth(newIdx).fill(newSource.nama);
      }
      if (await jabatanInputs.nth(newIdx).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await jabatanInputs.nth(newIdx).fill(newSource.jabatan);
      }
      if (await kontakInputs.nth(newIdx).isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await kontakInputs.nth(newIdx).fill(newSource.kontak);
      }
    }
  }

  async isSubmitEnabled(): Promise<boolean> {
    return this.page.locator(usulanLocators.create.submitButton).first()
      .isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
  }

  async dismissAllToasts(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll('[role="region"][aria-label="Notifications alt+T"] li').forEach((el: Element) => el.remove());
    });
  }

  async clickSubmit(): Promise<void> {
    await this.dismissAllToasts();
    const btn = this.page.locator(usulanLocators.create.submitButton).first();
    await expect(btn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await btn.click();
    await expect(this.page.locator(usulanLocators.create.confirmModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickSubmitAndApprove(): Promise<void> {
    await this.dismissAllToasts();
    const btn = this.page.locator(usulanLocators.create.submitAndApproveButton).first();
    await expect(btn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await btn.click();
    await expect(this.page.locator(usulanLocators.create.confirmModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async confirmModal(): Promise<void> {
    const confirmBtn = this.page.locator(usulanLocators.create.confirmModal.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await confirmBtn.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async isSuccessToastVisible(): Promise<boolean> {
    return this.page.locator(usulanLocators.toast.success).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
