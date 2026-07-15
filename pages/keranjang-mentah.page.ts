import { expect, Page } from '@playwright/test';
import { keranjangMentahLocators as loc } from '../locators/keranjang-mentah.locator';
import { TIMEOUT } from '../utils/timeout';
import { randomHeadline, randomParagraph } from '../utils/data-generator';

export class KeranjangMentahPage {
  constructor(private page: Page) {}

  async navigateToKeranjangMentah(): Promise<void> {
    await this.page.goto('/drafts');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateButton(): Promise<void> {
    await this.page.locator(loc.list.createButton).first().click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(loc.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async isPageVisible(): Promise<boolean> {
    return this.page.locator('main').first().isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isListVisible(): Promise<boolean> {
    return this.page.locator(loc.list.table).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async getRowCount(): Promise<number> {
    return this.page.locator(loc.list.rows).count();
  }

  async getRowJudulText(rowIndex: number): Promise<string> {
    const row = this.page.locator(loc.list.rows).nth(rowIndex);
    const judulCell = row.locator('td').nth(1);
    return ((await judulCell.textContent()) || '').trim();
  }

  // ── List Actions ──

  async openRowDropdown(rowIndex: number): Promise<void> {
    const row = this.page.locator(loc.list.rows).nth(rowIndex);
    await row.locator(loc.list.kebabButton).last().click();
    await expect(this.page.locator(loc.list.dropdownMenu.editKeranjangMentah).first()).toBeVisible({ timeout: TIMEOUT.SHORT });
  }

  async clickEditFromDropdown(): Promise<void> {
    await this.page.locator(loc.list.dropdownMenu.editKeranjangMentah).first().click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(loc.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickDeleteFromDropdown(): Promise<void> {
    await this.page.locator(loc.list.dropdownMenu.deleteKeranjangMentah).first().click();
    await expect(this.page.locator(loc.deleteModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
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
    await input.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Rubrik ──

  async selectRandomRubrik(): Promise<void> {
    const input = this.page.locator(loc.create.rubrikInput).first();
    await input.click();

    const dropdown = this.page.locator('.absolute.z-50:has(button[type="button"])').first();
    await dropdown.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });

    const options = dropdown.locator('button[type="button"]');
    const count = await options.count();
    console.log(`Found ${count} rubrik options`);

    if (count > 0) {
      const randomIdx = Math.floor(Math.random() * count);
      const text = await options.nth(randomIdx).textContent();
      console.log(`Picking rubrik: ${text}`);
      await options.nth(randomIdx).click();
      await expect(input).toHaveValue(text || '', { timeout: TIMEOUT.SHORT });
    } else {
      console.log('No rubrik options found');
    }
  }

  // ── Judul ──

  async fillJudul(judul: string): Promise<void> {
    const input = this.page.locator(loc.create.judulInput).first();
    await input.click();
    await this.page.keyboard.press('Meta+a');
    await input.fill(judul);
    await expect(input).toHaveValue(judul, { timeout: TIMEOUT.SHORT });
  }

  // ── Deskripsi ──

  async fillDeskripsi(deskripsi: string): Promise<void> {
    const input = this.page.locator(loc.create.deskripsiInput).first();
    await input.click();
    await this.page.keyboard.press('Meta+a');
    await input.fill(deskripsi);
    await expect(input).toHaveValue(deskripsi, { timeout: TIMEOUT.SHORT });
  }

  // ── Isi (Plate/Slate editor) ──

  async fillIsi(content: string): Promise<void> {
    const editor = this.page.locator(loc.create.isiEditor).first();
    await editor.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(content, { delay: 5 });
    await expect(editor).not.toBeEmpty({ timeout: TIMEOUT.SHORT });
  }

  // ── Jenis Keranjang Mentah ──

  async selectRandomArticleType(): Promise<'PAID' | 'FREE'> {
    const type = Math.random() > 0.5 ? 'PAID' : 'FREE';
    const radio = this.page.locator(`input[name="articleType"][value="${type}"]`).first();
    await radio.check({ force: true });
    expect(await radio.isChecked()).toBeTruthy();
    console.log(`Selected article type: ${type}`);
    return type;
  }

  // ── File Upload ──

  async selectRandomFile(): Promise<void> {
    await this.page.locator(loc.create.pilihFileButton).first().click({ force: true });

    const modal = this.page.locator(loc.fileModal.container).first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT.MEDIUM });

    const tab = Math.random() > 0.5 ? 'TECO' : 'TM';
    console.log(`Picking file from: Foto Master ${tab}`);

    if (tab === 'TECO') {
      await modal.locator(loc.fileModal.tabTeco).first().click();
    } else {
      await modal.locator(loc.fileModal.tabTM).first().click();
    }

    await this.page.waitForLoadState('networkidle');
    const imageCards = modal.locator(loc.fileModal.imageCards);
    await imageCards.first().waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    const imageCount = await imageCards.count();
    console.log(`Found ${imageCount} images`);

    if (imageCount > 0) {
      const randomIdx = Math.floor(Math.random() * imageCount);
      await imageCards.nth(randomIdx).click();
      console.log(`Selected image ${randomIdx}`);
    }

    await modal.locator(loc.fileModal.selectButton).first().click();
    await expect(modal).not.toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  // ── Usulan ──

  async selectRandomUsulan(): Promise<boolean> {
    const useUsulan = Math.random() > 0.5;
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
      const randomIdx = Math.floor(Math.random() * count);
      const text = await options.nth(randomIdx).textContent();
      console.log(`Picking usulan: ${text?.substring(0, 80)}`);
      await options.nth(randomIdx).click();
      return true;
    } else {
      console.log('No usulan options found, skipping');
      await this.page.keyboard.press('Escape');
      return false;
    }
  }

  // ── Narasumber ──

  async fillRandomNarasumber(): Promise<void> {
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

    const randomName = randomHeadline();
    const randomJabatan = randomHeadline();
    const randomKontak = `08${Math.floor(100000000 + Math.random() * 900000000)}`;

    if (await name.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await name.fill(randomName);
    }
    if (await jabatan.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await jabatan.fill(randomJabatan);
    }
    if (await kontak.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await kontak.fill(randomKontak);
    }

    console.log(`Filled narasumber: ${randomName} / ${randomJabatan} / ${randomKontak}`);
  }

  // ── Submit ──

  async clickSubmit(): Promise<void> {
    await this.dismissAllToasts();
    const btn = this.page.locator(loc.create.submitButton).first();
    await expect(btn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await btn.click();
    const confirmBtn = this.page.locator(loc.confirmModal.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: TIMEOUT.SHORT }).catch(() => {});
  }

  async isSubmitEnabled(): Promise<boolean> {
    return this.page.locator(loc.create.submitButton).first()
      .isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
  }

  async confirmModal(): Promise<void> {
    const confirmBtn = this.page.locator(loc.confirmModal.confirmButton).first();
    const isVisible = await confirmBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
    if (isVisible) {
      await confirmBtn.click({ force: true });
      await this.page.waitForLoadState('networkidle');
    }
  }

  async confirmDeleteModal(): Promise<void> {
    const confirmBtn = this.page.locator(loc.deleteModal.confirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await confirmBtn.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async isSuccessToastVisible(): Promise<boolean> {
    return this.page.locator(loc.toast.success).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async dismissAllToasts(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll('[role="region"][aria-label="Notifications alt+T"] li').forEach((el: Element) => el.remove());
    });
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  // ── Fill form helper ──

  async fillKeranjangMentahForm(): Promise<{ judul: string; deskripsi: string }> {
    console.log('Selecting rubrik...');
    await this.selectRandomRubrik();

    const judul = randomHeadline();
    console.log(`Filling judul: ${judul}`);
    await this.fillJudul(judul);

    const deskripsi = randomParagraph(2);
    console.log(`Filling deskripsi: ${deskripsi.substring(0, 50)}...`);
    await this.fillDeskripsi(deskripsi);

    const isi = randomParagraph(5);
    console.log(`Filling isi: ${isi.substring(0, 50)}...`);
    await this.fillIsi(isi);

    await this.selectRandomArticleType();

    console.log('Selecting file...');
    await this.selectRandomFile();

    const useUsulan = await this.selectRandomUsulan();
    if (useUsulan) {
      console.log('Filling narasumber...');
      await this.fillRandomNarasumber();
    }

    return { judul, deskripsi };
  }
}
