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
  usulan: string;
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

  // Prefer editing a keranjang mentah that already has an attached usulan,
  // so the usulan edit scenarios (remove/change/keep) are meaningful.
  let target = -1;
  for (let i = 0; i < rowCount; i++) {
    const usulan = await keranjangMentahPage.getRowUsulan(i);
    if (usulan && usulan !== '-' && usulan !== '—') {
      target = i;
      break;
    }
  }

  const order = target >= 0
    ? [target, ...Array.from({ length: rowCount }, (_, i) => i).filter((i) => i !== target)]
    : Array.from({ length: rowCount }, (_, i) => i);

  for (const i of order) {
    if (!(await keranjangMentahPage.rowHasEditAction(i))) continue;

    const judul = await keranjangMentahPage.getRowJudulOnly(i);
    const usulan = await keranjangMentahPage.getRowUsulan(i);
    await keranjangMentahPage.clickEditFromDropdown();
    await snap(page, 'edit form opened');
    return { rowIndex: i, judul, usulan };
  }

  throw new Error('No editable keranjang mentah found in the list');
}

export type EditUsulanAction = 'remove' | 'change' | 'keep';

export interface EditUsulanResult {
  action: EditUsulanAction;
  usulan: string;
}

/**
 * Picks one of the edit-usulan scenarios and applies it on the opened edit form:
 *  - 30% remove / no longer use the attached usulan
 *  - 40% change to a different usulan
 *  - 30% keep the already-attached usulan
 */
export async function applyEditUsulanScenario(page: Page): Promise<EditUsulanResult> {
  const keranjangMentahPage = new KeranjangMentahPage(page);
  const attached = await keranjangMentahPage.getAttachedUsulan();

  if (!attached) {
    // Nothing attached to remove/keep — attach one so the edit still covers the linkage.
    const picked = await keranjangMentahPage.changeAttachedUsulan();
    console.log(`No attached usulan; attaching one: ${picked.substring(0, 60) || '-'}`);
    return { action: picked ? 'change' : 'keep', usulan: picked };
  }

  const roll = Math.random();
  if (roll < 0.3) {
    await keranjangMentahPage.clearAttachedUsulan();
    console.log('Edit usulan scenario: remove attached usulan (30%)');
    return { action: 'remove', usulan: '' };
  }

  if (roll < 0.7) {
    const picked = await keranjangMentahPage.changeAttachedUsulan();
    console.log('Edit usulan scenario: change usulan (40%)');
    return { action: 'change', usulan: picked || attached };
  }

  console.log('Edit usulan scenario: keep attached usulan (30%)');
  return { action: 'keep', usulan: attached };
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
  const usulan = await keranjangMentahPage.getRowUsulan(rowIndex);
  await keranjangMentahPage.openRowDropdown(rowIndex);
  await snap(page, 'row actions opened');
  await keranjangMentahPage.clickDeleteFromDropdown();
  await snap(page, 'delete confirmation');

  return { rowIndex, judul, usulan };
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
