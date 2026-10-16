import { expect, Page } from '@playwright/test';
import { keranjangMentahLocators as loc } from '../locators/keranjang-mentah.locator';
import { TIMEOUT } from '../utils/timeout';
import { randomHeadline, randomParagraph } from '../utils/data-generator';

export interface KeranjangMentahFormData {
  judul?: string;
  deskripsi?: string;
  isi?: string;
  narasumber?: { nama?: string; jabatan?: string; kontak?: string };
}

export class KeranjangMentahPage {
  constructor(private page: Page) {}

  async navigateToKeranjangMentah(): Promise<void> {
    await this.page.goto('/drafts');
    await this.page.waitForLoadState('networkidle');
  }

  async isPageVisible(): Promise<boolean> {
    return this.page.locator('main').first().isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isListVisible(): Promise<boolean> {
    return this.page.locator(loc.list.table).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isCreateButtonVisible(): Promise<boolean> {
    return this.page.locator(loc.list.createButton).first()
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
    return this.page.locator(`${loc.list.rows}:has(td:nth-child(2))`).count();
  }

  async getRowJudulText(rowIndex: number): Promise<string> {
    const cell = this.page.locator(loc.list.rows).nth(rowIndex).locator('td').nth(1);
    return ((await cell.textContent()) || '').trim();
  }

  async getRowJudulOnly(rowIndex: number): Promise<string> {
    const judulEl = this.page.locator(loc.list.rows).nth(rowIndex).locator('td').nth(1).locator('p').first();
    return ((await judulEl.textContent()) || '').trim();
  }

  private normalize(text: string): string {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  async getAllRowJuduls(): Promise<string[]> {
    const cells = this.page.locator(`${loc.list.rows} td:nth-child(2)`);
    return (await cells.allInnerTexts()).map((text) => text.trim());
  }

  async waitForJudulRow(judul: string, timeout: number = TIMEOUT.MEDIUM): Promise<number> {
    const deadline = Date.now() + timeout;
    const needle = this.normalize(judul);

    while (Date.now() < deadline) {
      const juduls = await this.getAllRowJuduls();
      const index = juduls.findIndex((text) => this.normalize(text).includes(needle));
      if (index >= 0) return index;
      await this.page.waitForTimeout(TIMEOUT.TOAST_CHECK);
    }

    return -1;
  }

  async isJudulPresent(judul: string): Promise<boolean> {
    const needle = this.normalize(judul);
    const juduls = await this.getAllRowJuduls();
    return juduls.some((text) => this.normalize(text).includes(needle));
  }

  async waitForJudulRowGone(judul: string, timeout: number = TIMEOUT.SHORT): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (!(await this.isJudulPresent(judul))) {
        return true;
      }
      await this.page.waitForTimeout(TIMEOUT.TOAST_CHECK);
    }
    return !(await this.isJudulPresent(judul));
  }

  async openRowDropdown(rowIndex: number): Promise<void> {
    const row = this.page.locator(loc.list.rows).nth(rowIndex);
    await row.locator(loc.list.kebabButton).last().click();
    await expect(this.page.locator(loc.list.dropdownMenu.editKeranjangMentah).first()).toBeVisible({ timeout: TIMEOUT.SHORT });
  }

  async rowHasEditAction(rowIndex: number): Promise<boolean> {
    const row = this.page.locator(loc.list.rows).nth(rowIndex);
    await row.locator(loc.list.kebabButton).last().click();
    const editItem = this.page.locator(loc.list.dropdownMenu.editKeranjangMentah).first();
    const visible = await editItem.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
    if (!visible) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
    return visible;
  }

  async clickEditFromDropdown(): Promise<void> {
    await this.page.locator(loc.list.dropdownMenu.editKeranjangMentah).first().click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(loc.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickDeleteFromDropdown(): Promise<void> {
    await this.page.locator(loc.list.dropdownMenu.deleteKeranjangMentah).first().click();
    await expect(this.page.locator(loc.delete.confirmModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickUseFromDropdown(): Promise<void> {
    await this.page.locator(loc.list.dropdownMenu.useKeranjangMentah).first().click();
  }

  async getFirstRowDetailUrl(): Promise<string> {
    return await this.page.locator(loc.list.detailLink).first().getAttribute('href') || '';
  }

  // ── Search ──

  async searchKeranjangMentah(query: string): Promise<void> {
    const input = this.page.locator(loc.list.searchInput).first();
    await input.fill(query);

    // The list is server-side filtered; wait for the search request so we don't
    // read the still-unfiltered table (the created row also exists in the full list).
    const searchResponse = this.page
      .waitForResponse(
        (res) => res.url().includes('/article-raw') && res.url().includes('search=') && res.request().method() === 'GET',
        { timeout: TIMEOUT.MEDIUM }
      )
      .catch(() => null);

    const searchButton = this.page.locator(loc.list.searchButton).first();
    if (await searchButton.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await searchButton.click();
    } else {
      await input.press('Enter');
    }

    await searchResponse;
    await this.page.waitForLoadState('networkidle');
  }

  // ── Filter ──

  async openFilter(): Promise<boolean> {
    const rubrikInput = this.page.locator(loc.filter.rubrikInput).first();
    if (await rubrikInput.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) return true;

    const toggle = this.page.locator(loc.filter.toggleButton).first();
    if (!(await toggle.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false))) return false;

    await toggle.click();
    return rubrikInput.isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async filterByFirstRubrik(): Promise<boolean> {
    if (!(await this.openFilter())) return false;

    const input = this.page.locator(loc.filter.rubrikInput).first();
    if (!(await input.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false))) return false;

    await input.click();
    const dropdown = this.page.locator('.absolute.z-50:has(button[type="button"])').first();
    const opened = await dropdown
      .waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM })
      .then(() => true)
      .catch(() => false);
    if (!opened) return false;

    const options = dropdown.locator('button[type="button"]');
    if ((await options.count()) === 0) return false;

    await options.first().click();
    await this.applyFilter();
    return true;
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

  // ── Create ──

  async clickCreateButton(): Promise<void> {
    await this.page.locator(loc.list.createButton).first().click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(loc.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async selectRandomRubrik(): Promise<string> {
    const input = this.page.locator(loc.create.rubrikInput).first();

    // On the edit form the rubrik is locked (disabled) when the keranjang is
    // linked to a usulan, so there is nothing to change.
    if (!(await input.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false))) {
      const current = (await input.inputValue().catch(() => '')) || '';
      console.log(`Rubrik input disabled (locked to "${current}"), skipping`);
      return current;
    }

    await input.click();

    const dropdown = this.page.locator('.absolute.z-50:has(button[type="button"])').first();
    await dropdown.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });

    const options = dropdown.locator('button[type="button"]');
    const count = await options.count();
    console.log(`Found ${count} rubrik options`);

    if (count === 0) {
      console.log('No rubrik options found');
      return '';
    }

    const index = Math.floor(Math.random() * count);
    const rubrik = ((await options.nth(index).textContent()) || '').trim();
    console.log(`Picking rubrik: ${rubrik}`);
    await options.nth(index).click();
    await expect(input).toHaveValue(rubrik, { timeout: TIMEOUT.SHORT });
    return rubrik;
  }

  async fillJudul(judul: string): Promise<void> {
    const input = this.page.locator(loc.create.judulInput).first();
    await input.click();
    await this.page.keyboard.press('Meta+a');
    await input.fill(judul);
    await expect(input).toHaveValue(judul, { timeout: TIMEOUT.SHORT });
  }

  async fillDeskripsi(deskripsi: string): Promise<void> {
    const input = this.page.locator(loc.create.deskripsiInput).first();
    await input.click();
    await this.page.keyboard.press('Meta+a');
    await input.fill(deskripsi);
    await expect(input).toHaveValue(deskripsi, { timeout: TIMEOUT.SHORT });
  }

  async fillIsi(content: string): Promise<void> {
    const editor = this.page.locator(loc.create.isiEditor).first();
    await editor.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(content, { delay: 5 });
    await expect(editor).not.toBeEmpty({ timeout: TIMEOUT.SHORT });
  }

  async selectRandomArticleType(value?: 'FREE' | 'FREEMIUM' | 'VIP'): Promise<string> {
    const types = ['FREE', 'FREEMIUM', 'VIP'] as const;
    const target = value ?? types[Math.floor(Math.random() * types.length)];
    const radio = this.page.locator(`${loc.create.articleTypeRadio}[value="${target}"]`).first();
    await radio.check({ force: true });
    await expect(radio).toBeChecked({ timeout: TIMEOUT.SHORT });
    console.log(`Selected article type: ${target}`);
    return target;
  }

  async selectRandomFile(): Promise<void> {
    await this.dismissAllToasts();
    await this.page.locator(loc.create.pilihFileButton).first().click();

    const modal = this.page.locator(loc.fileModal.container).first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT.MEDIUM });

    const tab = Math.random() > 0.5 ? loc.fileModal.tabTeco : loc.fileModal.tabTM;
    console.log(`Picking file from: ${tab === loc.fileModal.tabTeco ? 'TECO' : 'TM'}`);
    await modal.locator(tab).first().click();

    const cards = modal.locator(loc.fileModal.imageCards);
    await cards.first().waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    const imageCount = await cards.count();
    console.log(`Found ${imageCount} images`);

    if (imageCount === 0) {
      throw new Error('No images available to select in the file modal');
    }

    const index = Math.floor(Math.random() * imageCount);
    await cards.nth(index).click();
    await expect(cards.nth(index)).toHaveClass(/ring-2/, { timeout: TIMEOUT.SHORT });
    console.log(`Selected image ${index}`);

    const selectBtn = modal.locator(loc.fileModal.selectButton).first();
    await expect(selectBtn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await selectBtn.click();
    await expect(modal).not.toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async selectRandomUsulan(): Promise<boolean> {
    // 70% of runs use an existing usulan, 30% do not.
    const useUsulan = Math.random() < 0.7;
    console.log(`Using usulan: ${useUsulan}`);

    if (!useUsulan) return false;

    const input = this.page.locator(loc.create.usulanInput).first();
    await input.click();

    const dropdown = this.page.locator('.absolute.z-50:has(button[type="button"])').first();
    await dropdown.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });

    const options = dropdown.locator('button[type="button"]');
    const count = await options.count();
    console.log(`Found ${count} usulan options`);

    if (count > 0) {
      const index = Math.floor(Math.random() * count);
      const text = await options.nth(index).textContent();
      console.log(`Picking usulan: ${text?.substring(0, 80)}`);
      await options.nth(index).click();
      return true;
    }

    console.log('No usulan options found, skipping');
    await this.page.keyboard.press('Escape');
    return false;
  }

  async fillRandomNarasumber(source?: { nama?: string; jabatan?: string; kontak?: string }): Promise<void> {
    const nameInput = this.page.locator(loc.create.narasumber.nameInput).first();
    const isVisible = await nameInput.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);

    if (!isVisible) {
      console.log('No narasumber fields visible, trying to add one');
      const addBtn = this.page.locator(loc.create.narasumber.addButton).first();
      if (await addBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await addBtn.click();
        await nameInput.waitFor({ state: 'visible', timeout: TIMEOUT.SHORT });
      } else {
        console.log('No narasumber section found, skipping');
        return;
      }
    }

    const name = this.page.locator(loc.create.narasumber.nameInput).first();
    const jabatan = this.page.locator(loc.create.narasumber.jabatanInput).first();
    const kontak = this.page.locator(loc.create.narasumber.kontakInput).first();

    const nama = source?.nama || randomHeadline();
    const pekerjaan = source?.jabatan || randomHeadline();
    const telepon = source?.kontak || `08${Math.floor(100000000 + Math.random() * 900000000)}`;

    if (await name.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await name.fill(nama);
    }
    if (await jabatan.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await jabatan.fill(pekerjaan);
    }
    if (await kontak.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await kontak.fill(telepon);
    }

    console.log(`Filled narasumber: ${nama} / ${pekerjaan} / ${telepon}`);
  }

  async fillKeranjangMentahForm(data: KeranjangMentahFormData = {}): Promise<{ judul: string; deskripsi: string }> {
    console.log('Selecting rubrik...');
    await this.selectRandomRubrik();

    const judul = data.judul || randomHeadline();
    console.log(`Filling judul: ${judul}`);
    await this.fillJudul(judul);

    const deskripsi = (data.deskripsi || randomParagraph(2)).slice(0, 300);
    console.log(`Filling deskripsi: ${deskripsi.substring(0, 50)}...`);
    await this.fillDeskripsi(deskripsi);

    const isi = data.isi || randomParagraph(5);
    console.log(`Filling isi: ${isi.substring(0, 50)}...`);
    await this.fillIsi(isi);

    await this.selectRandomArticleType();

    console.log('Selecting file...');
    await this.selectRandomFile();

    const useUsulan = await this.selectRandomUsulan();
    if (useUsulan) {
      console.log('Filling narasumber...');
      await this.fillRandomNarasumber(data.narasumber);
    }

    return { judul, deskripsi };
  }

  // ── Submit ──

  async isSubmitEnabled(): Promise<boolean> {
    return this.page.locator(loc.create.submitButton).first()
      .isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
  }

  async clickSubmit(): Promise<void> {
    await this.dismissAllToasts();
    const btn = this.page.locator(loc.create.submitButton).first();
    await expect(btn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await btn.click();
  }

  async confirmModal(): Promise<void> {
    const confirmBtn = this.page.locator(loc.create.confirmModal.confirmButton).first();
    const isVisible = await confirmBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
    if (isVisible) {
      await confirmBtn.click({ force: true });
      await this.page.waitForLoadState('networkidle');
    }
  }

  async confirmDeleteModal(): Promise<void> {
    const confirmBtn = this.page.locator(loc.delete.confirmModal.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await confirmBtn.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async dismissAllToasts(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll('[role="region"][aria-label="Notifications alt+T"] li').forEach((el: Element) => el.remove());
    });
  }

  async isSuccessToastVisible(): Promise<boolean> {
    return this.page.locator(loc.toast.success).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
