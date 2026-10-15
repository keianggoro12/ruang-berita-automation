import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  testDuration,
  testTitle,
  type TestResult,
} from "@/lib/types";
import { downloadSummaryPdf } from "@/lib/pdf-report";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Loader2,
  ListChecks,
  XCircle,
} from "lucide-react";

interface ReportViewProps {
  summary: TestResult[];
  scope: string;
  generatedAt?: number | null;
}

const STATUS_STYLES: Record<
  TestResult["status"],
  { dot: string; text: string; badge: string; label: string }
> = {
  passed: { dot: "bg-green-500", text: "text-green-500", badge: "bg-green-500/15 text-green-500", label: "Passed" },
  failed: { dot: "bg-red-500", text: "text-red-500", badge: "bg-red-500/15 text-red-500", label: "Failed" },
  running: { dot: "bg-yellow-500 animate-pulse", text: "text-yellow-500", badge: "bg-yellow-500/15 text-yellow-500", label: "Running" },
  skipped: { dot: "bg-gray-500", text: "text-gray-400", badge: "bg-gray-500/15 text-gray-400", label: "Skipped" },
};

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-center justify-between">
        <div>
          <div className={cn("text-3xl font-bold tabular-nums", accent)}>{value}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
        </div>
        <div className={cn("opacity-70", accent)}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function TestReportCard({ test, order }: { test: TestResult; order: number }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[test.status];
  const logs = (test.logs || []).filter((l) => l.text && l.text.trim());

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">{order}</span>
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", style.dot)} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{testTitle(test)}</div>
            <div className="text-xs text-muted-foreground truncate font-mono">{test.suite}</div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(testDuration(test))}
          </span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold shrink-0", style.badge)}>
            {style.label}
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-border bg-background/60">
          <div className="flex items-center gap-4 px-4 py-2 text-[11px] text-muted-foreground border-b border-border/60">
            <span>Run {test.run}</span>
            <span>Project {test.project}</span>
            <span>{logs.length} log lines</span>
          </div>
          <div className="max-h-72 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed">
            {logs.length === 0 && <p className="text-muted-foreground italic">No logs captured for this case.</p>}
            {logs.map((log, i) => (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap break-words py-0.5",
                  log.type === "error" && "text-red-400",
                  log.type === "stderr" && "text-amber-300",
                  log.type === "system" && "text-sky-400",
                  log.type === "step" && (log.text.includes("✘") ? "text-red-400" : "text-emerald-300/90"),
                  log.type === "stdout" && "text-foreground/80"
                )}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function ReportView({ summary, scope, generatedAt }: ReportViewProps) {
  const passed = summary.filter((t) => t.status === "passed").length;
  const failed = summary.filter((t) => t.status === "failed").length;
  const running = summary.filter((t) => t.status === "running").length;
  const totalDuration = summary.reduce((sum, t) => sum + testDuration(t), 0);

  if (summary.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
        <FileText className="h-12 w-12 mb-4 opacity-30" />
        <p>No summary data yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Test Report
          </h2>
          <p className="text-sm text-muted-foreground">
            {scope}
            {generatedAt ? ` • ${new Date(generatedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <Button
          onClick={() =>
            downloadSummaryPdf({
              scope,
              tests: summary,
              generatedAt: generatedAt ? new Date(generatedAt) : undefined,
            })
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total" value={summary.length} icon={<ListChecks className="h-6 w-6 md:h-7 md:w-7" />} accent="text-blue-500" />
        <StatCard label="Passed" value={passed} icon={<CheckCircle2 className="h-6 w-6 md:h-7 md:w-7" />} accent="text-green-500" />
        <StatCard label="Failed" value={failed} icon={<XCircle className="h-6 w-6 md:h-7 md:w-7" />} accent="text-red-500" />
        <StatCard
          label="Duration"
          value={running ? <Loader2 className="h-6 w-6 md:h-7 md:w-7 animate-spin" /> : formatDuration(totalDuration)}
          icon={<Clock className="h-6 w-6 md:h-7 md:w-7" />}
          accent="text-violet-500"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Per Case Detail</h3>
        {summary.map((test, i) => (
          <TestReportCard key={`${test.suite}-${test.run}-${i}`} test={test} order={i + 1} />
        ))}
      </div>
    </div>
  );
}
