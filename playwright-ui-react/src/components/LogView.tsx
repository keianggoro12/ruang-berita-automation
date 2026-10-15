import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/lib/types";
import { ArrowDownToLine } from "lucide-react";

interface LogViewProps {
  logs: LogEntry[];
}

function isStep(log: LogEntry): boolean {
  return log.type === "step" || log.text.trimStart().startsWith("[STEP]");
}

function lineClass(log: LogEntry): string {
  const text = log.text.toLowerCase();
  if (isStep(log)) {
    if (log.text.includes("✘")) return "text-red-400";
    if (text.includes("[expect]")) return "text-cyan-300";
    return "text-emerald-300/90";
  }
  if (
    log.type === "error" ||
    text.includes("error") ||
    text.includes("failed") ||
    text.includes("expect(") ||
    text.includes("timeout") ||
    text.includes("gagal") ||
    text.includes("✘") ||
    text.includes("✗")
  ) {
    return "text-red-400";
  }
  if (text.includes("passed") || text.includes("✓") || text.includes("berhasil") || text.includes("sukses")) {
    return "text-green-400";
  }
  if (
    log.type === "system" ||
    text.startsWith("testing role:") ||
    text.startsWith("filling ") ||
    text.startsWith("picking ") ||
    text.startsWith("filtered rows") ||
    text.startsWith("clicking ")
  ) {
    return "text-sky-400";
  }
  if (log.type === "stderr" || text.startsWith("at ") || text.includes("attachment") || text.includes("call log")) {
    return "text-amber-300";
  }
  return "text-foreground/90";
}

function borderClass(log: LogEntry): string {
  if (log.type === "error") return "border-l-red-500";
  if (isStep(log)) return log.text.includes("✘") ? "border-l-red-500" : "border-l-emerald-500/60";
  if (log.type === "stderr") return "border-l-amber-400";
  if (log.type === "system") return "border-l-sky-500";
  return "border-l-transparent";
}

export function LogView({ logs }: LogViewProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!autoScroll) return;
    const area = areaRef.current;
    if (area) {
      requestAnimationFrame(() => {
        area.scrollTop = area.scrollHeight;
      });
    }
  }, [logs, autoScroll]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{logs.length} lines</span>
          <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400" />passed</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" />error</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-400" />system</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" />step</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" />stderr</span>
          </span>
        </div>
        <Button
          variant={autoScroll ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setAutoScroll((v) => !v)}
          title="Toggle auto-scroll"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          {autoScroll ? "Auto-scroll: ON" : "Auto-scroll: OFF"}
        </Button>
      </div>
      <div ref={areaRef} className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-6 bg-background/95">
        {logs.length === 0 && <p className="text-muted-foreground italic">Waiting for output…</p>}
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn("flex gap-3 py-1 border-l-2 pl-3 -ml-3", borderClass(log))}
          >
            <span className="text-muted-foreground/60 select-none shrink-0 tabular-nums">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className={cn("whitespace-pre-wrap break-words", lineClass(log))}>{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
