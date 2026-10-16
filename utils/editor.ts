import { Locator, Page } from '@playwright/test';
import { TIMEOUT } from './timeout';

/**
 * Clear a rich-text (contenteditable) field before typing, so new content
 * replaces the existing one instead of being appended to it.
 *
 * Uses the platform select-all shortcut: Cmd+A on macOS, Ctrl+A elsewhere.
 */
export async function clearRichText(page: Page, editor: Locator, attempts = 3): Promise<void> {
  const selectAll = process.platform === 'darwin' ? 'Meta+a' : 'Control+a';
  const isBlank = async (): Promise<boolean> => {
    const text = ((await editor.textContent().catch(() => '')) || '').replace(/\u00a0/g, ' ').trim();
    return text === '';
  };

  for (let i = 0; i < attempts; i++) {
    if (await isBlank()) return;
    await editor.click();
    await page.keyboard.press(selectAll).catch(() => undefined);
    await page.keyboard.press('Backspace').catch(() => undefined);
    await page.waitForTimeout(TIMEOUT.TINY);
  }
}
