import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogView } from "@/components/LogView";
import { ReportView } from "@/components/ReportView";
import { cn } from "@/lib/utils";
import type { Artifacts, Artifact, LogEntry, TestResult } from "@/lib/types";
import { stepGroupLabel, stepLabel } from "@/lib/types";
import {
  Play,
  Terminal,
  Video,
  FileText,
  BarChart3,
  Sun,
  Moon,
  Loader2,
  X,
  ChevronLeft,
  Eraser,
  FolderOpen,
  FileCode2,
  BookOpenText,
  ListChecks,
  Image as ImageIcon,
} from "lucide-react";
import "./App.css";

interface TestItem {
  path: string;
  name: string;
  dir: string;
  file: string;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
const APP_TITLE = "Automation Newsroom Pustaka Runner";
const EMPTY_ARTIFACTS: Artifacts = { videos: [], screenshots: [], traces: [], logs: [] };

function App() {
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifacts>(EMPTY_ARTIFACTS);
  const [summary, setSummary] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState("log");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [reportGeneratedAt, setReportGeneratedAt] = useState<number | null>(null);
  const logCounter = useRef(0);
  const currentRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      fetchTests();
    });

    socket.on("disconnect", () => setConnectionStatus("disconnected"));

    socket.on("run-state", (state) => {
      if (!state) return;
      currentRunIdRef.current = state.runId || null;
      setRunning(!!state.running);
      if (state.kind === "test" && state.testPath) setSelectedTest(state.testPath);
      if (Array.isArray(state.logs) && state.logs.length) {
        const maxId = state.logs.reduce(
          (max: number, l: { id?: number }) => Math.max(max, l.id || 0),
          0,
        );
        logCounter.current = maxId + 1;
        setLogs(state.logs);
        setHasResults(true);
      }
      if (state.artifacts) {
        setArtifacts(state.artifacts);
        if (state.artifacts.videos?.length) setVideoUrl(state.artifacts.videos[0].url);
      }
      if (Array.isArray(state.summary) && state.summary.length) {
        setSummary(state.summary.filter((t: TestResult) => t.status));
        setReportGeneratedAt(Date.now());
        setHasResults(true);
      }
    });

    socket.on("run-started", ({ runId }) => {
      currentRunIdRef.current = runId;
      setRunning(true);
      setHasResults(true);
      setLogs([]);
      setVideoUrl(null);
      setArtifacts(EMPTY_ARTIFACTS);
      setSummary([]);
    });

    socket.on("log", ({ runId, data, type, timestamp }) => {
      if (runId && currentRunIdRef.current && runId !== currentRunIdRef.current) return;
      const lines = data.split("\n").filter((l: string) => l.trim() !== "");
      setLogs((prev) => [
        ...prev,
        ...lines.map((line: string) => ({
          id: logCounter.current++,
          text: line,
          type: type as LogEntry["type"],
          timestamp: timestamp || Date.now(),
        })),
      ]);
    });

    socket.on("run-done", ({ runId, artifacts: art, parsedTests }) => {
      if (runId && currentRunIdRef.current && runId !== currentRunIdRef.current) return;
      setRunning(false);
      setArtifacts(art);
      if (art?.videos?.length) {
        setVideoUrl(art.videos[0].url);
        setActiveTab("video");
      }
      if (parsedTests?.length) {
        setSummary(parsedTests.filter((t: TestResult) => t.status));
        setReportGeneratedAt(Date.now());
      } else {
        setReportGeneratedAt(Date.now());
      }
    });

    socket.on("all-done", ({ parsedTests }) => {
      setRunning(false);
      if (parsedTests?.length) {
        setSummary(parsedTests.filter((t: TestResult) => t.status));
      }
      setReportGeneratedAt(Date.now());
    });

    socket.on("run-cleared", () => {
      currentRunIdRef.current = null;
      logCounter.current = 0;
      setRunning(false);
      setLogs([]);
      setSummary([]);
      setArtifacts(EMPTY_ARTIFACTS);
      setVideoUrl(null);
      setHasResults(false);
      setReportGeneratedAt(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/tests`);
      setTests(await res.json());
    } catch (err) {
      console.error("Failed to fetch tests:", err);
    }
  };

  const startRun = (emit: () => void) => {
    if (!socketRef.current) return;
    setRunning(true);
    setActiveTab("log");
    setLogs([]);
    setVideoUrl(null);
    setArtifacts(EMPTY_ARTIFACTS);
    setSummary([]);
    emit();
  };

  const runTest = (path: string) => {
    setSelectedTest(path);
    startRun(() => socketRef.current!.emit("run-test", { testPath: path, options: { headed: false } }));
  };

  const runAllTests = () => {
    startRun(() => socketRef.current!.emit("run-all", { options: { headed: false } }));
  };

  const stopRun = () => {
    socketRef.current?.emit("stop-run");
    setRunning(false);
  };

  const clearRun = () => {
    socketRef.current?.emit("clear-run");
  };

  const groupedTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups = new Map<string, TestItem[]>();
    for (const t of tests) {
      if (q && !t.path.toLowerCase().includes(q)) continue;
      if (!groups.has(t.dir)) groups.set(t.dir, []);
      groups.get(t.dir)!.push(t);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tests, searchQuery]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
  };

  const allArtifacts = [
    ...(artifacts.videos || []).map((a) => ({ ...a, type: "video" as const })),
    ...(artifacts.screenshots || []).map((a) => ({ ...a, type: "image" as const })),
    ...(artifacts.traces || []).map((a) => ({ ...a, type: "trace" as const })),
    ...(artifacts.logs || []).map((a) => ({ ...a, type: "log" as const })),
  ];

  const screenshotGroups = useMemo(() => {
    const map = new Map<string, Artifact[]>();
    for (const s of artifacts.screenshots || []) {
      if (!map.has(s.dir)) map.set(s.dir, []);
      map.get(s.dir)!.push(s);
    }
    return Array.from(map.entries()).map(([dir, items]) => ({
      dir,
      label: stepGroupLabel(dir),
      items,
    }));
  }, [artifacts.screenshots]);

  return (
    <div className={cn("h-screen flex flex-col bg-background text-foreground", darkMode ? "dark" : "")}>
      <header className="border-b border-border bg-card px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpenText className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">{APP_TITLE}</span>
          </div>
          <span className={cn("px-2 py-0.5 text-xs rounded-full", connectionStatus === "connected" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            {connectionStatus}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle theme">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-border bg-card flex flex-col hidden md:flex">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Test Suite</h2>
            <input
              type="search"
              placeholder="Filter test…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {groupedTests.map(([dir, items]) => (
              <div key={dir} className="rounded-md">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{dir}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
                    onClick={() => runTest(dir)}
                    disabled={running}
                    title={`Run all ${dir} tests`}
                  >
                    <Play className="h-3 w-3" />
                    Run
                  </Button>
                </div>
                <ul className="space-y-0.5">
                  {items.map((test) => (
                    <li
                      key={test.path}
                      className={cn(
                        "group flex items-center gap-2 pl-5 pr-2 py-1.5 rounded-md cursor-pointer transition-colors",
                        selectedTest === test.path && "bg-primary/10 border-l-2 border-primary",
                        "hover:bg-accent"
                      )}
                      onClick={() => setSelectedTest(test.path)}
                    >
                      <FileCode2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate text-sm">{test.file}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          runTest(test.path);
                        }}
                        disabled={running}
                        title={`Run ${test.file}`}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {groupedTests.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No tests found</p>}
          </div>
          <div className="p-4 border-t border-border">
            <Button className="w-full" onClick={runAllTests} disabled={running}>
              <Loader2 className={cn("mr-2 h-4 w-4", running && "animate-spin")} />
              {running ? "Running All…" : "Run All Tests"}
            </Button>
          </div>
        </aside>

        <button
          className="md:hidden fixed bottom-4 right-4 z-50 p-2 bg-primary text-primary-foreground rounded-full shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <main className="flex-1 flex flex-col overflow-hidden">
          {running || hasResults ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className={cn("h-5 w-5 text-primary", running && "animate-spin")} />
                  <div>
                    <h2 className="font-semibold">{selectedTest || "All Tests"}</h2>
                    <p className="text-sm text-muted-foreground">{running ? "Running test…" : "Test completed"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {running ? (
                    <Button variant="destructive" size="sm" onClick={stopRun}>
                      <X className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={clearRun} disabled={!hasResults}>
                      <Eraser className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="border-b border-border bg-card">
                  <TabsTrigger value="log"><Terminal className="h-4 w-4 mr-2" />Logs</TabsTrigger>
                  <TabsTrigger value="steps"><FileText className="h-4 w-4 mr-2" />Steps</TabsTrigger>
                  <TabsTrigger value="video"><Video className="h-4 w-4 mr-2" />Video</TabsTrigger>
                  <TabsTrigger value="artifacts"><BarChart3 className="h-4 w-4 mr-2" />Artifacts</TabsTrigger>
                  <TabsTrigger value="summary"><ListChecks className="h-4 w-4 mr-2" />Report</TabsTrigger>
                </TabsList>

                <TabsContent value="log" className="flex-1 data-[state=active]:flex flex-col overflow-hidden mt-0 h-full">
                  <LogView logs={logs} />
                </TabsContent>
                <TabsContent value="steps" className="flex-1 overflow-y-auto p-4 mt-0">
                  {screenshotGroups.length > 0 ? (
                    <div className="space-y-8">
                      {screenshotGroups.map((group) => (
                        <section key={group.dir} className="space-y-3">
                          <div className="flex items-baseline gap-2 border-b border-border pb-2">
                            <span className="text-xs font-mono text-muted-foreground">{group.label.file}</span>
                            <span className="text-sm font-semibold">{group.label.title}</span>
                            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                              {group.items.length} steps
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {group.items.map((s, idx) => (
                              <Card key={s.url} className="overflow-hidden">
                                <CardContent className="p-0 group relative">
                                  <img src={s.url} alt={stepLabel(s.name)} className="w-full aspect-video object-cover" loading="lazy" />
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="truncate">{stepLabel(s.name)}</span>
                                    <span className="tabular-nums">#{idx + 1}</span>
                                  </div>
                                </CardContent>
                                <CardFooter className="p-2 flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="truncate capitalize">Step {idx + 1} · {stepLabel(s.name)}</span>
                                  <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline shrink-0 ml-2">Open</a>
                                </CardFooter>
                              </Card>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-12">
                      <ImageIcon className="h-12 w-12 mb-4 opacity-30" />
                      <p>No step screenshots found</p>
                      <p className="text-xs mt-1">Run a usulan test to capture a screenshot after each step</p>
                    </div>
                  )}
                </TabsContent>


                <TabsContent value="video" className="flex-1 data-[state=active]:flex flex-col overflow-hidden p-4 mt-0">
                  {artifacts.videos.length > 0 ? (
                    <div className="flex-1 flex gap-4 min-h-0">
                      <div className="w-72 shrink-0 flex flex-col rounded-lg border border-border overflow-hidden">
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-card">
                          Videos ({artifacts.videos.length})
                        </div>
                        <div className="flex-1 overflow-y-auto p-1">
                          {artifacts.videos.map((v) => {
                            const active = v.url === videoUrl;
                            return (
                              <button
                                key={v.url}
                                onClick={() => setVideoUrl(v.url)}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                                  active ? "bg-primary/10 text-primary border-l-2 border-primary" : "hover:bg-accent"
                                )}
                              >
                                <p className="truncate font-medium">{v.title || stepGroupLabel(v.dir).file || v.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{v.title ? v.name : stepGroupLabel(v.dir).file}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                        {videoUrl ? (
                          <div className="w-full max-w-4xl">
                            <video ref={videoRef} src={videoUrl} controls className="w-full rounded-lg border border-border bg-black" playsInline />
                            <p className="text-sm text-muted-foreground mt-2 text-center">Video replay (recorded after test completion)</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Select a video to play</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                      <div>
                        <Video className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Video will appear here after test completes</p>
                        <p className="text-xs mt-1">Playwright records video after test completion (video: "on")</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="artifacts" className="flex-1 overflow-y-auto p-4 mt-0">
                  {allArtifacts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">No artifacts</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allArtifacts.map((a) => (
                        <Card key={a.url} className="overflow-hidden">
                          <CardContent className="p-0">
                            {a.type === "video" && <video src={a.url} controls className="w-full aspect-video bg-black" />}
                            {a.type === "image" && <img src={a.url} alt={a.name} className="w-full aspect-video object-cover" />}
                            {(a.type === "trace" || a.type === "log") && (
                              <div className="aspect-video flex items-center justify-center bg-muted">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="p-4 flex-col items-start gap-1">
                            <p className="text-xs font-mono text-muted-foreground truncate w-full">{a.name}</p>
                            <a href={a.url} target="_blank" download className="text-xs text-primary hover:underline">Download</a>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="summary" className="flex-1 data-[state=active]:flex flex-col overflow-hidden mt-0">
                  <ReportView summary={summary} scope={selectedTest || "All Tests"} generatedAt={reportGeneratedAt} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpenText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h2 className="text-xl font-semibold mb-2">Select a test to run</h2>
                <p className="text-muted-foreground">Choose from sidebar or click "Run All Tests"</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
