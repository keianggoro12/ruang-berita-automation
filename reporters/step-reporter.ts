import path from 'path';
import type { Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';

const SHOWN_CATEGORIES = new Set(['pw:api', 'test.step', 'expect']);
const HIDDEN_METHODS = ['__waitInfo__', '__waitForEventInfo', 'Wait for load state'];

function normalizeStatus(status: string): string {
  if (status === 'passed') return 'passed';
  if (status === 'failed' || status === 'timedOut' || status === 'interrupted') return 'failed';
  return 'skipped';
}

function depth(step: TestStep): number {
  let level = 1;
  let parent = step.parent;
  while (parent) {
    level += 1;
    parent = parent.parent;
  }
  return level;
}

class StepReporter implements Reporter {
  private startedAt = 0;

  onBegin(): void {
    this.startedAt = Date.now();
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const location = test.location;
    const relativeFile = path.relative(process.cwd(), location.file);
    const file = `${relativeFile}:${location.line}`;
    const titleParts = test.titlePath().filter(Boolean);
    const project = test.parent?.project()?.name ?? titleParts[0] ?? 'chromium';
    const suite = titleParts
      .filter((p) => p !== project && p !== test.title && !p.endsWith('.spec.ts'))
      .join(' › ');
    process.stdout.write(
      `[TEST-START] ${file} :: ${project} :: ${suite} :: Run ${result.retry + 1} :: ${test.title}\n`
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    process.stdout.write(`[TEST-END] ${normalizeStatus(result.status)} :: ${result.duration}\n`);

    const titleParts = test.titlePath().filter(Boolean);
    const project = test.parent?.project()?.name ?? titleParts[0] ?? 'chromium';
    const suite = titleParts
      .filter((p) => p !== project && p !== test.title && !p.endsWith('.spec.ts'))
      .join(' › ');
    const title = suite ? `${suite} › ${test.title}` : test.title;
    const outputDirs = new Set(
      result.attachments
        .filter((a) => a.path)
        .map((a) => path.basename(path.dirname(a.path as string)))
    );
    for (const dir of outputDirs) {
      process.stdout.write(`[TEST-DIR] ${dir} :: ${title}\n`);
    }
  }

  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep): void {
    if (!SHOWN_CATEGORIES.has(step.category)) return;
    if (step.category === 'pw:api' && HIDDEN_METHODS.some((m) => step.title.includes(m))) return;

    const elapsed = ((Date.now() - this.startedAt) / 1000).toFixed(2);
    const indent = '  '.repeat(Math.max(0, depth(step) - 2));
    const mark = step.error ? '✘' : '✔';
    const duration = step.duration ? ` (${(step.duration / 1000).toFixed(2)}s)` : '';
    const title = step.title.replace(/\s+/g, ' ').trim();

    process.stdout.write(`[STEP] +${elapsed}s ${indent}${mark} [${step.category}] ${title}${duration}\n`);
    if (step.error?.message) {
      process.stdout.write(`[STEP] ${indent}   ↳ ${step.error.message.split('\n')[0]}\n`);
    }
  }
}

export default StepReporter;
