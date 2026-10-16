import { expect, Locator, Page } from '@playwright/test';
import { usulanLocators } from '../locators/usulan.locator';
import { TIMEOUT } from '../utils/timeout';
import { generateNarasumber, Narasumber } from '../utils/data-generator';
import { pickRandom } from '../utils/random';
import { RUBRIK_OPTIONS, USER_NEED_MODEL_OPTIONS } from '../fixtures/usulan';

export class UsulanPage {
  constructor(private page: Page) {}

  async navigateToUsulan(): Promise<void> {
    await this.page.goto('/proposals');
    await this.page.waitForLoadState('networkidle');
  }

  async isPageVisible(): Promise<boolean> {
    return this.page.locator('main').first().isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isListVisible(): Promise<boolean> {
    return this.page.locator(usulanLocators.list.table).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isCreateButtonVisible(): Promise<boolean> {
    return this.page.locator(usulanLocators.list.createButton).first()
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
    // Exclude the empty-state row (a single colspan cell → no 2nd cell).
    return this.page.locator(`${usulanLocators.list.rows}:has(td:nth-child(2))`).count();
  }

  async getRowAngleText(rowIndex: number): Promise<string> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    const secondTd = row.locator('td').nth(1);
    return (await secondTd.textContent()) || '';
  }

  async getRowAngleOnly(rowIndex: number): Promise<string> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    const angleEl = row.locator('td').nth(1).locator('p').first();
    return ((await angleEl.textContent()) || '').trim();
  }

  async openRowDropdown(rowIndex: number): Promise<void> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    await row.locator(usulanLocators.list.kebabButton).last().click();
    await expect(this.page.locator(usulanLocators.list.dropdownMenu.editUsulan).first()).toBeVisible({ timeout: TIMEOUT.SHORT });
  }

  async rowHasEditAction(rowIndex: number): Promise<boolean> {
    const row = this.page.locator(usulanLocators.list.rows).nth(rowIndex);
    await row.locator(usulanLocators.list.kebabButton).last().click();
    const editItem = this.page.locator(usulanLocators.list.dropdownMenu.editUsulan).first();
    const visible = await editItem.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
    if (!visible) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
    return visible;
  }

  async isRowAngleContaining(rowIndex: number, text: string): Promise<boolean> {
    const rowAngle = await this.getRowAngleText(rowIndex);
    return rowAngle.includes(text);
  }

  private normalize(text: string): string {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  async getAllRowAngles(): Promise<string[]> {
    const cells = this.page.locator(`${usulanLocators.list.rows} td:nth-child(2)`);
    return (await cells.allInnerTexts()).map((text) => text.trim());
  }

  async waitForAngleRow(angle: string, timeout: number = TIMEOUT.MEDIUM): Promise<number> {
    const deadline = Date.now() + timeout;
    const needle = this.normalize(angle);

    while (Date.now() < deadline) {
      const angles = await this.getAllRowAngles();
      const index = angles.findIndex((text) => this.normalize(text).includes(needle));
      if (index >= 0) return index;
      await this.page.waitForTimeout(TIMEOUT.TOAST_CHECK);
    }

    return -1;
  }

  async isAnglePresent(angle: string): Promise<boolean> {
    const needle = this.normalize(angle);
    const angles = await this.getAllRowAngles();
    return angles.some((text) => this.normalize(text).includes(needle));
  }

  async waitForAngleRowGone(angle: string, timeout: number = TIMEOUT.SHORT): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (!(await this.isAnglePresent(angle))) {
        return true;
      }
      await this.page.waitForTimeout(TIMEOUT.TOAST_CHECK);
    }
    return !(await this.isAnglePresent(angle));
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
    await expect(this.page.locator(usulanLocators.approve.heading).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickRejectFromDropdown(): Promise<void> {
    await this.page.locator(usulanLocators.list.dropdownMenu.tolakUsulan).first().click();
    await expect(this.page.locator(usulanLocators.reject.confirmModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
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
    const statusDropdown = this.page.locator(usulanLocators.filter.statusDropdown).first();
    if (!(await statusDropdown.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false))) {
      await this.page.locator(usulanLocators.filter.toggleButton).first().click();
      await expect(statusDropdown).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    }
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
    await this.clickButtonByText('Terapkan Filter');
    await this.page.waitForLoadState('networkidle');
  }

  async resetFilter(): Promise<void> {
    await this.clickButtonByText('Reset');
    await this.page.waitForLoadState('networkidle');
  }

  async clickButtonByText(text: string): Promise<void> {
    await this.page.evaluate((label) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find((button) => (button.textContent || '').includes(label));
      if (target) {
        (target as HTMLButtonElement).click();
      }
    }, text);
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

  // ── Reject ──

  async openRejectModal(rowIndex: number): Promise<void> {
    await this.openRowDropdown(rowIndex);
    await this.clickRejectFromDropdown();
  }

  async confirmRejectModal(): Promise<void> {
    const confirmBtn = this.page.locator(usulanLocators.reject.confirmModal.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await confirmBtn.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  // ── Approve ──

  async openApproveModal(rowIndex: number): Promise<void> {
    await this.openRowDropdown(rowIndex);
    await this.clickApproveFromDropdown();
  }

  private async selectApproveDropdownOption(inputSelector: string, query?: string): Promise<string> {
    const input = this.page.locator(inputSelector).first();
    await input.click();
    if (query) await input.fill(query);
    const option = this.page
      .locator(`${usulanLocators.approve.modal} ${usulanLocators.approve.option}:visible`)
      .first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    const text = ((await option.textContent()) || '').trim();
    await option.click();
    return text;
  }

  async fillApproveReporter(query?: string): Promise<string> {
    return this.selectApproveDropdownOption(usulanLocators.approve.reporterInput, query);
  }

  async fillApproveEditor(query?: string): Promise<string> {
    return this.selectApproveDropdownOption(usulanLocators.approve.editorInput, query);
  }

  async fillApproveEdisi(query?: string): Promise<string> {
    return this.selectApproveDropdownOption(usulanLocators.approve.edisiInput, query);
  }

  async fillApproveJumlahHalaman(value: number): Promise<void> {
    const input = this.page.locator(usulanLocators.approve.jumlahHalamanInput).first();
    if (await input.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await input.fill(String(value));
    }
  }

  async selectApproveArticleType(value?: 'FREE' | 'FREEMIUM' | 'VIP'): Promise<string> {
    const radios = this.page.locator(usulanLocators.approve.articleTypeRadio);
    const count = await radios.count();
    const target: Locator = value
      ? this.page.locator(`${usulanLocators.approve.articleTypeRadio}[value="${value}"]`).first()
      : radios.nth(Math.floor(Math.random() * count));
    await target.check({ force: true });
    return (await target.getAttribute('value')) || '';
  }

  async isApproveConfirmEnabled(): Promise<boolean> {
    return this.page.locator(usulanLocators.approve.confirmModal.confirmButton).first()
      .isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
  }

  async confirmApproveModal(): Promise<void> {
    const confirmBtn = this.page.locator(usulanLocators.approve.confirmModal.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await expect(confirmBtn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await confirmBtn.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async fillApproveForm(options: { reporter?: string; editor?: string; articleType?: 'FREE' | 'FREEMIUM' | 'VIP'; edisi?: string; jumlahHalaman?: number } = {}): Promise<{ reporter: string; editor: string; articleType: string }> {
    const reporter = await this.fillApproveReporter(options.reporter);
    const editor = await this.fillApproveEditor(options.editor);
    const articleType = await this.selectApproveArticleType(options.articleType);
    if (options.edisi) await this.fillApproveEdisi(options.edisi);
    if (options.jumlahHalaman) await this.fillApproveJumlahHalaman(options.jumlahHalaman);
    return { reporter, editor, articleType };
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
      // Edit mode: find any button with date text like "6 Sept 2026"
      const dateBtn = this.page.locator('button').filter({ hasText: /\d{1,2}\s+\w{3,}\s+\d{4}/ }).first();
      await dateBtn.scrollIntoViewIfNeeded();
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

  async selectRubrik(rubrik: string): Promise<void> {
    const input = this.page.locator(usulanLocators.create.rubrikInput).first();
    await input.click();
    await input.fill(rubrik);
    const option = this.page.locator(usulanLocators.create.dropdownOption).filter({ hasText: rubrik }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await option.click();
    await expect(input).toHaveValue(rubrik, { timeout: TIMEOUT.SHORT });
  }

  async selectUserNeedModel(model: string): Promise<void> {
    const input = this.page.locator(usulanLocators.create.userNeedModelInput).first();
    await input.click();
    const option = this.page.locator(usulanLocators.create.dropdownOption).filter({ hasText: model }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await option.click();
    await expect(input).toHaveValue(model, { timeout: TIMEOUT.SHORT });
  }

  async fillLatarBelakang(content: string): Promise<void> {
    const editor = this.page.locator(usulanLocators.create.latarBelakangEditor).first();
    await editor.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });

    await editor.click();
    await this.page.keyboard.type(content, { delay: 5 });

    await expect(editor).not.toBeEmpty({ timeout: TIMEOUT.SHORT });
  }

  async fillNarasumberList(sources: Narasumber[] = generateNarasumber()): Promise<void> {
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

  async fillCreateForm(angle: string, latarBelakang: string, narasumber?: Narasumber[]): Promise<void> {
    console.log('Filling date...');
    await this.selectRandomTanggal();

    console.log('Filling angle...');
    await this.fillAngle(angle);

    console.log('Filling rubrik...');
    await this.selectRubrik(pickRandom(RUBRIK_OPTIONS));

    console.log('Filling user need model...');
    await this.selectUserNeedModel(pickRandom(USER_NEED_MODEL_OPTIONS));

    console.log('Filling latar belakang...');
    await this.fillLatarBelakang(latarBelakang);

    console.log('Filling narasumber list...');
    await this.fillNarasumberList(narasumber);
    await this.waitForNarasumberToastDisappear();
  }

  async updateNarasumberList(sources: Narasumber[] = generateNarasumber()): Promise<void> {
    const nameInputs = this.page.locator(usulanLocators.create.narasumber.nameInput);
    const jabatanInputs = this.page.locator(usulanLocators.create.narasumber.jabatanInput);
    const kontakInputs = this.page.locator(usulanLocators.create.narasumber.kontakInput);
    const existingCount = await nameInputs.count();
    console.log(`Updating ${existingCount} existing narasumber`);

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
    await this.dismissAllToasts();
    const btn = this.page.locator(usulanLocators.create.submitButton).first();
    await expect(btn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent?.includes('Submit') && !b.textContent?.includes('Approve'));
      if (submitBtn) submitBtn.click();
    });
    await expect(this.page.locator(usulanLocators.create.confirmModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickSubmitAndApprove(): Promise<void> {
    await this.dismissAllToasts();
    await this.dismissAllToasts();
    const btn = this.page.locator(usulanLocators.create.submitAndApproveButton).first();
    await expect(btn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent?.includes('Submit & Approve'));
      if (submitBtn) submitBtn.click();
    });
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
