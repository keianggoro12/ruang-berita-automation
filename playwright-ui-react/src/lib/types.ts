export type TestStatus = "passed" | "failed" | "running" | "skipped";

export type LogType = "stdout" | "stderr" | "error" | "system" | "step";

export interface LogEntry {
  id: number;
  text: string;
  type: LogType;
  timestamp: number;
}

export interface TestLog {
  text: string;
  type: string;
  time: number;
}

export interface TestResult {
  index: string;
  project: string;
  suite: string;
  run: string;
  name: string;
  status: TestStatus;
  startTime: number;
  duration?: number;
  logs: TestLog[];
  output?: string;
}

export interface Artifact {
  url: string;
  name: string;
  dir: string;
  title?: string;
}

export interface Artifacts {
  videos: Artifact[];
  screenshots: Artifact[];
  traces: Artifact[];
  logs: Artifact[];
}

export function testDuration(test: TestResult): number {
  if (typeof test.duration === "number" && test.duration > 0) return test.duration;
  const times = (test.logs || []).map((l) => l.time).filter((t) => typeof t === "number");
  if (times.length < 2) return 0;
  return Math.max(...times) - Math.min(...times);
}

export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "-";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function testTitle(test: TestResult): string {
  return test.name || `${test.suite} › Run ${test.run}`;
}

function prettifySlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

export function stepGroupLabel(dir: string): { file: string; title: string } {
  const base = dir.replace(/-steps$/, "");
  const [filePart, ...rest] = base.split("__");
  return { file: prettifySlug(filePart), title: prettifySlug(rest.join("__")) };
}

export function stepLabel(name: string): string {
  const match = name.match(/^step-\d+-(.+)\.png$/i);
  const slug = match ? match[1] : name.replace(/\.[a-z0-9]+$/i, "");
  return prettifySlug(slug) || name;
}
