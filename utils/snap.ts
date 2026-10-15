import fs from 'fs';
import path from 'path';
import { test, type Page } from '@playwright/test';

function slugify(label: string): string {
  return label
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

/**
 * Capture the current page state to disk for the UI runner's "Steps" tab.
 *
 * Playwright deletes the contents of a test's output directory when the test
 * passes, so attachments registered via `testInfo.attach` are not kept for
 * green tests. To keep a durable step gallery we write the PNGs into a sibling
 * `*-steps` directory inside `test-results`, which the runner discovers and
 * serves under `/results`.
 */
export async function snap(page: Page, label: string): Promise<void> {
  try {
    const info = test.info();
    const specSlug = path
      .relative(process.cwd(), info.file)
      .replace(/\.spec\.ts$/, '')
      .replace(/[\\/]+/g, '-');
    const testSlug = slugify(info.title) || 'test';
    const stepsDir = path.join(
      path.dirname(info.outputDir),
      `${specSlug}__${testSlug}-steps`
    );
    const index = fs.existsSync(stepsDir)
      ? fs.readdirSync(stepsDir).filter((f) => f.endsWith('.png')).length + 1
      : 1;
    const name = `step-${String(index).padStart(2, '0')}-${slugify(label) || 'snapshot'}.png`;
    fs.mkdirSync(stepsDir, { recursive: true });
    await page.screenshot({ path: path.join(stepsDir, name) });
  } catch (err) {
    console.log(`[snap] skipped "${label}": ${(err as Error).message}`);
  }
}
