import { Page } from '@playwright/test';
import { KeranjangMentahPage } from '../pages/keranjang-mentah.page';
import { generateKeranjangMentahContent } from '../utils/ai-generator';
import { snap } from '../utils/snap';
import { TIMEOUT } from '../utils/timeout';

export const KERANJANG_MENTAH_ACCESS_ROLES = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'] as const;

export const KERANJANG_MENTAH_DENIED_ROLES = ['fotografer', 'penulisLuar'] as const;

export interface CreatedKeranjangMentah {
  judul: string;
}

export async function createKeranjangMentah(page: Page): Promise<CreatedKeranjangMentah> {
  const keranjangMentahPage = new KeranjangMentahPage(page);
  const content = await generateKeranjangMentahContent();

  await keranjangMentahPage.navigateToKeranjangMentah();
  await snap(page, 'keranjang mentah list');
  await keranjangMentahPage.clickCreateButton();
  await snap(page, 'create form opened');

  await keranjangMentahPage.fillKeranjangMentahForm({
    judul: content.judul,
    deskripsi: content.deskripsi,
    isi: content.isi,
    narasumber: content.narasumber[0],
  });
  await snap(page, 'create form filled');

  await keranjangMentahPage.clickSubmit();
  await snap(page, 'submit confirmation');
  await keranjangMentahPage.confirmModal();
  await page.waitForLoadState('networkidle');
  await snap(page, 'keranjang mentah created');

  return { judul: content.judul };
}

export interface ExistingKeranjangMentah {
  rowIndex: number;
  judul: string;
}

export async function openEditOnExistingKeranjangMentah(page: Page): Promise<ExistingKeranjangMentah> {
  const keranjangMentahPage = new KeranjangMentahPage(page);
  await keranjangMentahPage.navigateToKeranjangMentah();
  await snap(page, 'keranjang mentah list');

  let rowCount = await keranjangMentahPage.getRowCount();
  if (rowCount === 0) {
    console.log('No existing keranjang mentah found; creating one to edit...');
    await createKeranjangMentah(page);
    await keranjangMentahPage.navigateToKeranjangMentah();
    rowCount = await keranjangMentahPage.getRowCount();
  }

  if (rowCount === 0) {
    throw new Error('No keranjang mentah available to edit');
  }

  for (let i = 0; i < rowCount; i++) {
    if (!(await keranjangMentahPage.rowHasEditAction(i))) continue;

    const judul = await keranjangMentahPage.getRowJudulOnly(i);
    await keranjangMentahPage.clickEditFromDropdown();
    await snap(page, 'edit form opened');
    return { rowIndex: i, judul };
  }

  throw new Error('No editable keranjang mentah found in the list');
}

export async function openDeleteOnExistingKeranjangMentah(page: Page): Promise<ExistingKeranjangMentah> {
  const keranjangMentahPage = new KeranjangMentahPage(page);
  await keranjangMentahPage.navigateToKeranjangMentah();

  const rowCount = await keranjangMentahPage.getRowCount();
  if (rowCount === 0) {
    throw new Error('No keranjang mentah found to delete');
  }

  const rowIndex = Math.floor(Math.random() * rowCount);
  const judul = await keranjangMentahPage.getRowJudulOnly(rowIndex);
  await keranjangMentahPage.openRowDropdown(rowIndex);
  await snap(page, 'row actions opened');
  await keranjangMentahPage.clickDeleteFromDropdown();
  await snap(page, 'delete confirmation');

  return { rowIndex, judul };
}

export async function locateKeranjangMentahRow(
  page: Page,
  judul: string,
  timeout: number = TIMEOUT.MEDIUM
): Promise<number> {
  const keranjangMentahPage = new KeranjangMentahPage(page);
  await keranjangMentahPage.navigateToKeranjangMentah();
  await keranjangMentahPage.searchKeranjangMentah(judul);

  const rowIndex = await keranjangMentahPage.waitForJudulRow(judul, timeout);
  if (rowIndex >= 0) return rowIndex;

  // Fallback: search in unfiltered list (search may have issues)
  await keranjangMentahPage.navigateToKeranjangMentah();
  return keranjangMentahPage.waitForJudulRow(judul, TIMEOUT.SHORT);
}
