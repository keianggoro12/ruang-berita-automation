import { Page } from '@playwright/test';
import { UsulanPage } from '../pages/usulan.page';
import { generateReferenceCode } from '../utils/data-generator';
import { generateUsulanContent } from '../utils/ai-generator';
import { snap } from '../utils/snap';
import { TIMEOUT } from '../utils/timeout';

export const USULAN_ACCESS_ROLES = ['reporter', 'editorMuda', 'editorMadya', 'editorSenior'] as const;

export const USULAN_APPROVE_ROLES = ['editorMuda', 'editorMadya', 'editorSenior'] as const;

export const USULAN_DENIED_ROLES = ['fotografer', 'penulisLuar'] as const;

export interface CreatedUsulan {
  angle: string;
  referenceCode: string;
}

export async function createUsulan(
  page: Page,
  options: { approve?: boolean } = {}
): Promise<CreatedUsulan> {
  const usulanPage = new UsulanPage(page);
  const content = await generateUsulanContent();
  const referenceCode = generateReferenceCode();
  const angle = `${content.angle} ${referenceCode}`;

  await usulanPage.navigateToUsulan();
  await snap(page, 'usulan list');
  await usulanPage.clickCreateButton();
  await snap(page, 'create form opened');
  await usulanPage.fillCreateForm(angle, content.latarBelakang, content.narasumber);
  await snap(page, 'create form filled');

  if (options.approve) {
    await usulanPage.clickSubmitAndApprove();
  } else {
    await usulanPage.clickSubmit();
  }

  await snap(page, 'submit confirmation');
  await usulanPage.confirmModal();
  await page.waitForLoadState('networkidle');
  await snap(page, 'usulan created');

  return { angle, referenceCode };
}

export interface ExistingUsulan {
  rowIndex: number;
  angle: string;
}

export async function openEditOnExistingUsulan(page: Page): Promise<ExistingUsulan> {
  const usulanPage = new UsulanPage(page);
  await usulanPage.navigateToUsulan();
  await snap(page, 'usulan list');

  let rowCount = await usulanPage.getRowCount();
  if (rowCount === 0) {
    console.log('No existing usulan found; creating one to edit...');
    await createUsulan(page);
    await usulanPage.navigateToUsulan();
    rowCount = await usulanPage.getRowCount();
  }

  if (rowCount === 0) {
    throw new Error('No usulan available to edit');
  }

  for (let i = 0; i < rowCount; i++) {
    const hasEdit = await usulanPage.rowHasEditAction(i);
    if (!hasEdit) continue;

    const angle = await usulanPage.getRowAngleOnly(i);
    await usulanPage.clickEditFromDropdown();
    await snap(page, 'edit form opened');
    return { rowIndex: i, angle };
  }

  throw new Error('No editable usulan found in the list');
}

export async function openDeleteOnExistingUsulan(page: Page): Promise<ExistingUsulan> {
  const usulanPage = new UsulanPage(page);
  await usulanPage.navigateToUsulan();

  const statuses = await usulanPage.getAllRowStatuses();
  const rowIndex = statuses.findIndex((status) => status.includes('Belum Disetujui'));
  if (rowIndex < 0) {
    throw new Error('No unapproved usulan found to delete');
  }

  const angle = await usulanPage.getRowAngleOnly(rowIndex);
  await usulanPage.openRowDropdown(rowIndex);
  await snap(page, 'row actions opened');
  await usulanPage.clickDeleteFromDropdown();
  await snap(page, 'delete confirmation');

  return { rowIndex, angle };
}

export interface ApprovedUsulan {
  angle: string;
  reporter: string;
  editor: string;
  articleType: string;
}

export async function approveUsulanAtRow(
  page: Page,
  rowIndex: number,
  options: { reporter?: string; editor?: string; articleType?: 'FREE' | 'FREEMIUM' | 'VIP'; edisi?: string; jumlahHalaman?: number } = {}
): Promise<ApprovedUsulan> {
  const usulanPage = new UsulanPage(page);
  const angle = await usulanPage.getRowAngleOnly(rowIndex);

  await usulanPage.openApproveModal(rowIndex);
  await snap(page, 'approve form opened');
  const selected = await usulanPage.fillApproveForm(options);
  await snap(page, 'approve form filled');
  await usulanPage.confirmApproveModal();
  await snap(page, 'usulan approved');

  return { angle, ...selected };
}

export async function locateUsulanRow(
  usulanPage: UsulanPage,
  angle: string,
  timeout: number = TIMEOUT.MEDIUM
): Promise<number> {
  await usulanPage.navigateToUsulan();
  await usulanPage.searchUsulan(angle);

  const rowIndex = await usulanPage.waitForAngleRow(angle, timeout);
  if (rowIndex >= 0) return rowIndex;

  // Fallback: search in unfiltered list (search may have issues)
  await usulanPage.navigateToUsulan();
  return usulanPage.waitForAngleRow(angle, TIMEOUT.SHORT);
}
