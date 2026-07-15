import { expect, Page } from '@playwright/test';
import { articlesLocators as loc } from '../locators/articles.locator';
import { TIMEOUT } from '../utils/timeout';
import { randomHeadline, randomParagraph } from '../utils/data-generator';

export class ArticlesPage {
  constructor(private page: Page) {}

  // ── Navigation ──

  async navigateToArticles(): Promise<void> {
    await this.page.goto('/articles');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCreate(): Promise<void> {
    await this.page.goto('/articles/create', { waitUntil: 'networkidle' });
    await expect(this.page.locator(loc.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  // ── Visibility Checks ──

  async isPageVisible(): Promise<boolean> {
    return this.page.locator(loc.list.heading).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isListVisible(): Promise<boolean> {
    return this.page.locator(loc.list.table).first()
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isAccessDenied(): Promise<boolean> {
    const forbiddenText = this.page.locator('text=403, text=Forbidden, text=Anda tidak memiliki akses');
    return forbiddenText.first().isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
  }

  async getRowCount(): Promise<number> {
    return this.page.locator(loc.list.rows).count();
  }

  // ── List Actions ──

  async openRowDropdown(rowIndex: number): Promise<void> {
    const row = this.page.locator(loc.list.rows).nth(rowIndex);
    await row.locator(loc.list.kebabButton).last().click();
  }

  async clickEditFromDropdown(): Promise<void> {
    await this.page.locator(loc.list.dropdownMenu.editArticle).first().click();
    await this.page.waitForLoadState('load');
    await expect(this.page.locator(loc.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickDeleteFromDropdown(): Promise<void> {
    await this.page.locator(loc.list.dropdownMenu.deleteArticle).first().click();
    await expect(this.page.locator(loc.deleteModal.confirmButton).first()).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async clickCreateButton(): Promise<void> {
    await this.page.locator(loc.list.createButton).first().click();
    await this.page.waitForLoadState('load');
    await expect(this.page.locator(loc.create.heading)).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async search(query: string): Promise<void> {
    const input = this.page.locator(loc.list.searchInput).first();
    await input.fill(query);
    await input.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Main Content Fields ──

  async fillSnackbar(text: string): Promise<void> {
    const input = this.page.locator(loc.create.snackbarInput).first();
    const isVisible = await input.isVisible({ timeout: TIMEOUT.TINY }).catch(() => false);
    if (!isVisible) {
      console.log('Snackbar input not visible, skipping');
      return;
    }
    await input.fill(text);
  }

  async fillUpperdeck(text: string): Promise<void> {
    await this.page.locator(loc.create.upperdeckInput).first().fill(text);
  }

  async fillJudul(judul: string): Promise<void> {
    const textarea = this.page.locator(loc.create.judulTextarea).first();
    await textarea.click();
    await textarea.fill(judul);
  }

  async fillDeskripsi(deskripsi: string): Promise<void> {
    const textarea = this.page.locator(loc.create.deskripsiTextarea).first();
    await textarea.click();
    await textarea.fill(deskripsi);
  }

  async fillCaption(caption: string): Promise<void> {
    await this.page.locator(loc.create.captionInput).first().fill(caption);
  }

  async fillPoinPenting(poin: string[]): Promise<void> {
    const inputs = [
      this.page.locator(loc.create.poinPenting1).first(),
      this.page.locator(loc.create.poinPenting2).first(),
      this.page.locator(loc.create.poinPenting3).first(),
    ];
    for (let i = 0; i < Math.min(poin.length, 3); i++) {
      if (await inputs[i].isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        await inputs[i].fill(poin[i]);
      }
    }
  }

  // ── File Upload (via modal) ──

  async uploadFile(): Promise<void> {
    const uploadArea = this.page.locator(loc.create.uploadArea).first();
    await uploadArea.click();
    console.log('Clicked upload area');

    const modal = this.page.locator(loc.fileModal.container).first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    console.log('File modal visible');

    const tabs = ['TM', 'TECO'] as const;

    for (const tab of tabs) {
      console.log(`Trying file from: Foto Master ${tab}`);

      if (tab === 'TECO') {
        await modal.locator(loc.fileModal.tabTeco).first().click();
      } else {
        await modal.locator(loc.fileModal.tabTM).first().click();
      }

      await this.page.waitForTimeout(3000);

      let imageCards = modal.locator(loc.fileModal.imageCards);
      let imageCount = await imageCards.count();

      if (imageCount === 0) {
        imageCards = modal.locator('img[class*="object-cover"]').locator('..');
        imageCount = await imageCards.count();
      }
      if (imageCount === 0) {
        imageCards = modal.locator('div[class*="cursor"]:has(img)');
        imageCount = await imageCards.count();
      }
      if (imageCount === 0) {
        const allImgs = modal.locator('img');
        const imgCount = await allImgs.count();
        console.log(`Modal has ${imgCount} total imgs`);
        const photoImgs = [];
        for (let i = 0; i < imgCount; i++) {
          const box = await allImgs.nth(i).boundingBox().catch(() => null);
          if (box && box.width > 50 && box.height > 50) {
            photoImgs.push(i);
          }
        }
        console.log(`Found ${photoImgs.length} photo-sized images`);
        if (photoImgs.length > 0) {
          imageCards = allImgs.nth(photoImgs[0]).locator('..');
          imageCount = photoImgs.length;
        }
      }

      console.log(`Found ${imageCount} images in ${tab} tab`);

      if (imageCount > 0) {
        const randomIdx = Math.floor(Math.random() * imageCount);
        await imageCards.nth(randomIdx).click();
        console.log(`Selected image ${randomIdx}`);
        await this.page.waitForTimeout(500);

        const selectBtn = modal.locator(loc.fileModal.selectButton).last();
        await expect(selectBtn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
        await selectBtn.click();
        console.log('Clicked Pilih Foto');

        await expect(modal).not.toBeVisible({ timeout: TIMEOUT.MEDIUM });
        console.log('File modal closed');
        return;
      }
    }

    console.log('No images found in any tab, closing modal');
    const cancelBtn = modal.locator(loc.fileModal.cancelButton).first();
    if (await cancelBtn.isVisible({ timeout: TIMEOUT.TINY }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.page.waitForTimeout(500);
  }

  // ── Rich Text Editors (Slate) ──

  async fillEditor(index: number, content: string): Promise<void> {
    const editor = this.page.locator(loc.create.editorContainer).nth(index);
    await editor.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(content, { delay: 5 });
  }

  // ── Autocomplete Helper ──

  private async selectAutocomplete(inputLocator: any, label: string): Promise<string> {
    await inputLocator.scrollIntoViewIfNeeded();
    await inputLocator.click();
    await this.page.waitForTimeout(500);

    const dropdowns = this.page.locator(loc.autocomplete.dropdown);
    const count = await dropdowns.count();
    console.log(`[${label}] Found ${count} visible dropdown(s)`);

    for (let i = 0; i < count; i++) {
      const dd = dropdowns.nth(i);
      const buttons = dd.locator(loc.autocomplete.options);
      const btnCount = await buttons.count();
      if (btnCount > 0) {
        console.log(`Found ${btnCount} ${label} options`);
        const randomIdx = Math.floor(Math.random() * btnCount);
        const text = (await buttons.nth(randomIdx).textContent()) || '';
        console.log(`Picking ${label}: ${text}`);
        await buttons.nth(randomIdx).click({ force: true });
        await this.page.waitForTimeout(300);
        return text;
      }
    }

    console.log(`No ${label} options found`);
    await this.page.keyboard.press('Escape');
    return '';
  }

  async selectRandomRubrik(): Promise<string> {
    return this.selectAutocomplete(
      this.page.locator(loc.create.rubrikInput).first(),
      'rubrik'
    );
  }

  async selectRandomSubRubrik(): Promise<string> {
    return this.selectAutocomplete(
      this.page.locator(loc.create.subRubrikInput).first(),
      'sub rubrik'
    );
  }

  async selectRandomKategori(): Promise<string> {
    return this.selectAutocomplete(
      this.page.locator(loc.create.kategoriInput).first(),
      'kategori'
    );
  }

  async selectRandomUserModel(): Promise<string> {
    return this.selectAutocomplete(
      this.page.locator(loc.create.userModelInput).first(),
      'user model'
    );
  }

  // ── Waktu Tayang ──

  async selectWaktuTayang(): Promise<void> {
    const btn = this.page.locator(loc.create.waktuTayangButton).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await this.page.waitForTimeout(1000);

    const picker = this.page.locator(loc.create.waktuTayangPicker).first();
    if (!await picker.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      console.log('Date picker not visible');
      return;
    }

    const monthSelect = picker.locator(loc.create.waktuTayangMonthSelect).first();
    if (await monthSelect.isVisible({ timeout: TIMEOUT.TINY }).catch(() => false)) {
      const currentMonth = await monthSelect.inputValue();
      const nextMonth = (parseInt(currentMonth) + 1) % 12;
      await monthSelect.selectOption(String(nextMonth));
      console.log(`Selected month: ${nextMonth}`);
      await this.page.waitForTimeout(500);
    }

    let enabledDays = picker.locator(loc.create.waktuTayangDayGrid);
    let dayCount = await enabledDays.count();
    console.log(`Found ${dayCount} enabled day buttons`);

    if (dayCount === 0) {
      enabledDays = picker.locator('table button:not([disabled])');
      dayCount = await enabledDays.count();
      console.log(`Found ${dayCount} enabled day buttons (table fallback)`);
    }

    if (dayCount === 0) {
      enabledDays = picker.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}$/ });
      dayCount = await enabledDays.count();
      console.log(`Found ${dayCount} enabled day buttons (number filter)`);
    }

    if (dayCount > 0) {
      const dayIdx = Math.floor(Math.random() * Math.min(dayCount, 15));
      await enabledDays.nth(dayIdx).click({ force: true });
      console.log(`Selected day: ${await enabledDays.nth(dayIdx).textContent()}`);
    }
    await this.page.waitForTimeout(500);

    const timeButtons = picker.locator('button:not([disabled])');

    const hourBtn = timeButtons.filter({ hasText: /^08$/ }).first();
    if (await hourBtn.isVisible({ timeout: TIMEOUT.TINY }).catch(() => false)) {
      await hourBtn.click({ force: true });
      console.log('Selected hour: 08');
      await this.page.waitForTimeout(300);
    }

    const minuteBtn = timeButtons.filter({ hasText: /^00$/ }).first();
    if (await minuteBtn.isVisible({ timeout: TIMEOUT.TINY }).catch(() => false)) {
      await minuteBtn.click({ force: true });
      console.log('Selected minute: 00');
      await this.page.waitForTimeout(300);
    }

    await this.page.waitForTimeout(300);

    const confirmBtn = picker.locator(loc.create.waktuTayangConfirm).first();
    const isConfirmEnabled = await confirmBtn.isEnabled().catch(() => false);
    console.log('Confirm enabled:', isConfirmEnabled);

    await confirmBtn.click({ force: true });
    console.log('Clicked Confirm (force)');

    await this.page.waitForTimeout(500);
  }

  // ── Select Elements ──

  async selectAksesArtikel(): Promise<string> {
    const select = this.page.locator(loc.create.aksesArtikelSelect).first();
    if (!await select.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      const container = this.page.locator('label:has-text("Akses Artikel")').first().locator('..');
      const fallbackSelect = container.locator('select').first();
      if (await fallbackSelect.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
        return this.pickRandomSelectOption(fallbackSelect, 'akses artikel');
      }
      console.log('Akses Artikel select not found');
      return '';
    }
    return this.pickRandomSelectOption(select, 'akses artikel');
  }

  async selectTipeArtikel(): Promise<string> {
    const selects = this.page.locator('select');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const sel = selects.nth(i);
      if (!await sel.isVisible().catch(() => false)) continue;
      const options = await sel.locator('option').allTextContents();
      if (options.some(o => o.includes('Article Text'))) {
        await sel.selectOption({ label: 'Article Text' });
        console.log('Selected tipe artikel: Article Text (forced)');
        return 'Article Text';
      }
    }
    console.log('Tipe Artikel select not found');
    return '';
  }

  private async pickRandomSelectOption(select: any, label: string): Promise<string> {
    const options = await select.locator('option').all();
    const values: { value: string; text: string }[] = [];

    for (const opt of options) {
      const val = await opt.getAttribute('value') || '';
      const text = (await opt.textContent()) || '';
      if (val && !(await opt.isDisabled())) {
        values.push({ value: val, text });
      }
    }

    if (values.length > 0) {
      const pick = values[Math.floor(Math.random() * values.length)];
      await select.selectOption(pick.value);
      console.log(`Selected ${label}: ${pick.text}`);
      return pick.text;
    }
    return '';
  }

  // ── SEO Settings ──

  async fillSeoTitle(title: string): Promise<void> {
    await this.page.locator(loc.create.judulSeoInput).first().fill(title);
  }

  async fillMetaDescription(desc: string): Promise<void> {
    const textarea = this.page.locator(loc.create.metaDescriptionTextarea).first();
    const isDisabled = await textarea.isDisabled().catch(() => true);
    if (isDisabled) {
      console.log('Meta description is disabled/auto-filled, skipping');
      return;
    }
    await textarea.fill(desc);
  }

  async addTag(): Promise<void> {
    const input = this.page.locator(loc.create.tagInput).first();
    if (!await input.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      console.log('Tag input not visible');
      return;
    }
    await input.scrollIntoViewIfNeeded();
    await input.click();

    await input.pressSequentially('tem', { delay: 80 });
    await this.page.waitForTimeout(1500);

    const allDropdowns = this.page.locator(loc.autocomplete.dropdown);
    const ddCount = await allDropdowns.count();
    console.log(`[tag] Found ${ddCount} visible dropdown(s)`);

    for (let i = 0; i < ddCount; i++) {
      const dd = allDropdowns.nth(i);
      const buttons = dd.locator(loc.autocomplete.options);
      const btnCount = await buttons.count();

      if (btnCount > 0) {
        const firstBtnText = (await buttons.first().textContent()) || '';
        console.log(`[tag] Dropdown ${i}: ${btnCount} buttons, first="${firstBtnText.trim()}"`);

        const randomIdx = Math.floor(Math.random() * btnCount);
        const text = (await buttons.nth(randomIdx).textContent()) || '';
        await buttons.nth(randomIdx).click({ force: true });
        console.log(`Selected tag: ${text.trim()}`);
        await this.page.waitForTimeout(300);
        return;
      }
    }

    await input.press('Enter');
    console.log('Added tag via Enter: tem');
    await this.page.waitForTimeout(500);
  }

  // ── Tim Settings ──

  async selectRandomRole(): Promise<string> {
    const selectors = [
      loc.create.roleSelect,
      'select:near(:text-is("Role"))',
      'div:has(> label:has-text("Role")) select',
      'div:has(> :text-is("Role")) select',
    ];

    for (const sel of selectors) {
      const select = this.page.locator(sel).first();
      if (await select.isVisible({ timeout: TIMEOUT.TINY }).catch(() => false)) {
        const options = await select.locator('option').all();
        for (const opt of options) {
          const text = (await opt.textContent()) || '';
          if (text.toLowerCase().includes('reporter') || text.toLowerCase().includes('penulis')) {
            const val = await opt.getAttribute('value');
            if (val) {
              await select.selectOption(val);
              console.log(`Selected role (forced Reporter): ${text.trim()}`);
              return text.trim();
            }
          }
        }
        return this.pickRandomSelectOption(select, 'role');
      }
    }

    const allSelects = this.page.locator('select:visible');
    const count = await allSelects.count();
    for (let i = 0; i < count; i++) {
      const s = allSelects.nth(i);
      const opts = await s.locator('option').allTextContents();
      if (opts.some(o => o.includes('Reporter') || o.includes('Editor'))) {
        console.log(`Found role select at index ${i}`);
        const options = await s.locator('option').all();
        for (const opt of options) {
          const text = (await opt.textContent()) || '';
          if (text.toLowerCase().includes('reporter') || text.toLowerCase().includes('penulis')) {
            const val = await opt.getAttribute('value');
            if (val) {
              await s.selectOption(val);
              console.log(`Selected role (forced Reporter fallback): ${text.trim()}`);
              return text.trim();
            }
          }
        }
        return this.pickRandomSelectOption(s, 'role');
      }
    }

    console.log('Role select not found');
    return '';
  }

  async selectRandomRedaksi(): Promise<string> {
    const input = this.page.locator(loc.create.namaRedaksiInput).first();
    if (!await input.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      console.log('Nama redaksi input not visible');
      return '';
    }
    return this.selectAutocomplete(input, 'redaksi');
  }

  async selectDisplayAuthor(): Promise<string> {
    const radios: { value: string; locator: string }[] = [
      { value: 'normal', locator: loc.create.displayAuthorNormal },
      { value: 'top', locator: loc.create.displayAuthorTop },
      { value: 'hidden', locator: loc.create.displayAuthorHidden },
    ];
    const pick = radios[Math.floor(Math.random() * radios.length)];
    const radio = this.page.locator(pick.locator).first();
    if (await radio.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false)) {
      await radio.check({ force: true });
      console.log(`Selected display author: ${pick.value}`);
    }
    return pick.value;
  }

  // ── Tab Navigation ──

  async clickTayangTab(): Promise<void> {
    await this.page.locator(loc.create.tayangTab).first().click({ force: true });
    await this.page.waitForTimeout(300);
  }

  async clickSeoTab(): Promise<void> {
    await this.page.locator(loc.create.seoTab).first().click({ force: true });
    await this.page.waitForTimeout(300);
  }

  async clickTimTab(): Promise<void> {
    await this.page.locator(loc.create.timTab).first().click({ force: true });
    await this.page.waitForTimeout(300);
  }

  // ── Submit ──

  async clickSimpan(): Promise<void> {
    await this.dismissAllToasts();
    const btn = this.page.locator(loc.create.simpanButton).first();
    await expect(btn).toBeEnabled({ timeout: TIMEOUT.MEDIUM });
    await btn.click();
  }

  async isSimpanEnabled(): Promise<boolean> {
    const btn = this.page.locator(loc.create.simpanButton).first();
    return btn.isEnabled({ timeout: TIMEOUT.SHORT }).catch(() => false);
  }

  async confirmModal(): Promise<void> {
    const confirmBtn = this.page.locator(loc.confirmModal.confirmButton).first();
    const isVisible = await confirmBtn.isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
    if (isVisible) {
      await confirmBtn.click({ force: true });
      await this.page.waitForLoadState('load');
      await this.page.waitForTimeout(2000);
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

  // ── Fill Complete Form ──

  async fillArticleForm(): Promise<{ judul: string; deskripsi: string }> {
    const snackbar = randomHeadline();
    console.log(`Filling snackbar: ${snackbar.substring(0, 50)}`);
    await this.fillSnackbar(snackbar);

    const upperdeck = randomHeadline();
    console.log(`Filling upperdeck: ${upperdeck.substring(0, 50)}`);
    await this.fillUpperdeck(upperdeck);

    const judul = randomHeadline().substring(0, 60);
    console.log(`Filling judul: ${judul.substring(0, 50)}`);
    await this.fillJudul(judul);

    const deskripsi = randomParagraph(2);
    console.log(`Filling deskripsi: ${deskripsi.substring(0, 50)}...`);
    await this.fillDeskripsi(deskripsi);

    console.log('Uploading file...');
    await this.uploadFile();

    const caption = randomHeadline();
    console.log(`Filling caption: ${caption.substring(0, 50)}`);
    await this.fillCaption(caption);

    const poin = [randomHeadline(), randomHeadline(), randomHeadline()];
    console.log('Filling poin penting...');
    await this.fillPoinPenting(poin);

    console.log('Filling editor 1...');
    await this.fillEditor(0, randomParagraph(3));
    console.log('Filling editor 2...');
    await this.fillEditor(1, randomParagraph(2));

    console.log('Selecting rubrik...');
    await this.selectRandomRubrik();

    console.log('Selecting sub rubrik...');
    await this.selectRandomSubRubrik();

    console.log('Selecting waktu tayang...');
    await this.selectWaktuTayang();

    console.log('Selecting akses artikel...');
    await this.selectAksesArtikel();

    console.log('Selecting tipe artikel...');
    await this.selectTipeArtikel();

    console.log('Selecting kategori...');
    await this.selectRandomKategori();

    console.log('Selecting user model...');
    await this.selectRandomUserModel();

    console.log('Filling SEO...');
    await this.clickSeoTab();
    await this.fillSeoTitle(judul);
    await this.fillMetaDescription(deskripsi.substring(0, 150));
    await this.addTag();

    console.log('Filling Tim...');
    await this.clickTimTab();
    await this.page.waitForTimeout(1000);
    await this.selectRandomRole();
    await this.selectRandomRedaksi();
    await this.selectDisplayAuthor();

    await this.clickTayangTab();

    return { judul, deskripsi };
  }
}
