const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const cors = require('cors');

function stripAnsi(str) {
  return str.replace(/\u001b\[[0-9;]*m|\u001b\[[0-9;]*[A-Z]/g, '');
}

const app = express();
app.use(cors({ origin: '*' }));
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEST_DIR = path.join(PROJECT_ROOT, 'tests');
const REPORT_DIR = path.join(PROJECT_ROOT, 'playwright-report');
const RESULTS_DIR = path.join(PROJECT_ROOT, 'test-results');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/report', express.static(REPORT_DIR));
app.use('/results', express.static(RESULTS_DIR));
app.use('/videos', express.static(RESULTS_DIR));

app.get('/api/tests', (req, res) => {
  const files = glob.sync('**/*.spec.ts', { cwd: TEST_DIR })
    .map(f => ({
      path: f,
      name: f.replace(/\.spec\.ts$/, '').replace(/\//g, ' › '),
      dir: path.dirname(f),
      file: path.basename(f, '.spec.ts'),
    }));
  res.json(files);
});

app.get('/api/artifacts/:testPath(*)', (req, res) => {
  const testPath = req.params.testPath;
  const artifacts = findArtifacts(testPath);
  res.json(artifacts);
});

app.get('/api/video/:testPath(*)', (req, res) => {
  const testPath = req.params.testPath;
  const video = findVideo(testPath);
  if (video) {
    res.redirect(`/results/${video}`);
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

function convertWebmToMp4(webmPath) {
  return new Promise((resolve) => {
    const mp4Path = webmPath.replace(/\.webm$/, '.mp4');
    if (fs.existsSync(mp4Path)) return resolve(mp4Path);
    execFile(
      'ffmpeg',
      ['-y', '-i', webmPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-movflags', '+faststart', '-an', mp4Path],
      { timeout: 120000 },
      (err) => {
        if (err) {
          console.error('ffmpeg conversion failed:', err.message);
          return resolve(null);
        }
        resolve(mp4Path);
      }
    );
  });
}

async function convertAllVideos() {
  if (!fs.existsSync(RESULTS_DIR)) return;
  const dirs = fs.readdirSync(RESULTS_DIR);
  for (const d of dirs) {
    const full = path.join(RESULTS_DIR, d);
    if (!fs.statSync(full).isDirectory()) continue;
    const webm = path.join(full, 'video.webm');
    const mp4 = path.join(full, 'video.mp4');
    if (fs.existsSync(webm) && !fs.existsSync(mp4)) {
      await convertWebmToMp4(webm);
    }
  }
}

function findArtifacts(testPath, dirTitles = {}) {
  const normalized = testPath.replace(/\.spec\.ts$/, '').replace(/\//g, '-');
  const dirs = fs.existsSync(RESULTS_DIR) ? fs.readdirSync(RESULTS_DIR) : [];
  const matching = dirs.filter(d => d.includes(normalized.slice(0, 80)) || d.includes(testPath.split('/').pop()?.replace('.spec.ts', '') || ''));
  const artifacts = { videos: [], screenshots: [], traces: [], logs: [] };
  for (const dir of matching) {
    const full = path.join(RESULTS_DIR, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    const title = dirTitles[dir] || '';
    const files = fs.readdirSync(full);
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      const rel = `/results/${dir}/${f}`;
      if (['.webm', '.mp4'].includes(ext)) artifacts.videos.push({ url: rel, name: f, dir, title });
      else if (['.png', '.jpg', '.jpeg'].includes(ext)) artifacts.screenshots.push({ url: rel, name: f, dir, title });
      else if (ext === '.zip') artifacts.traces.push({ url: rel, name: f, dir, title });
      else if (['.txt', '.md', '.json'].includes(ext)) artifacts.logs.push({ url: rel, name: f, dir, title });
    }
  }
  const videosByDir = new Map();
  for (const v of artifacts.videos) {
    const current = videosByDir.get(v.dir);
    if (!current || (current.name.endsWith('.webm') && v.name.endsWith('.mp4'))) {
      videosByDir.set(v.dir, v);
    }
  }
  artifacts.videos = Array.from(videosByDir.values());
  artifacts.videos.sort((a, b) => a.dir.localeCompare(b.dir));
  artifacts.screenshots.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir.localeCompare(b.dir)));
  return artifacts;
}

function findVideo(testPath) {
  const artifacts = findArtifacts(testPath);
  return artifacts.videos[0]?.url.replace('/results/', '');
}

function parseTestOutput(output) {
  const lines = output.split('\n');
  const tests = [];
  const dirTitles = {};
  let currentTest = null;
  let buffer = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('[TEST-DIR] ')) {
      const rest = trimmed.slice('[TEST-DIR] '.length);
      const sep = rest.indexOf(' :: ');
      if (sep > 0) dirTitles[rest.slice(0, sep)] = rest.slice(sep + 4);
      continue;
    }

    const markerStart = trimmed.startsWith('[TEST-START] ')
      ? trimmed.slice('[TEST-START] '.length).split(' :: ')
      : null;
    if (markerStart) {
      if (currentTest) {
        currentTest.output = buffer.join('\n');
        tests.push(currentTest);
      }
      currentTest = {
        index: '',
        project: markerStart[1] || 'chromium',
        suite: [markerStart[0], markerStart[2]].filter(Boolean).join(' › '),
        run: (markerStart[3] || 'Run 1').replace('Run ', ''),
        name: markerStart.slice(4).join(' :: '),
        status: 'running',
        startTime: Date.now(),
        logs: [],
        output: '',
      };
      buffer = [];
      continue;
    }

    const markerEnd = trimmed.match(/^\[TEST-END\] (\w+) :: (\d+)$/);
    if (markerEnd) {
      if (currentTest) {
        currentTest.status = markerEnd[1];
        currentTest.duration = Number(markerEnd[2]);
      }
      continue;
    }

    const passed = trimmed.match(/^(\s+)?(\d+)\s+passed/);
    const failed = trimmed.match(/^(\s+)?(\d+)\s+failed/);
    if (passed || failed) continue;

    if (currentTest) {
      let type = 'stdout';
      if (trimmed.startsWith('[STEP]')) type = 'step';
      else if (trimmed.startsWith('Error:') || trimmed.includes('expect(') || trimmed.toLowerCase().includes('timeout')) type = 'error';
      else if (trimmed.startsWith('at ') || trimmed.includes('Call log:') || trimmed.includes('attachment')) type = 'stderr';
      else if (trimmed.startsWith('Testing role:') || trimmed.startsWith('Filter:') || trimmed.startsWith('Filling ') || trimmed.startsWith('Picking ') || trimmed.startsWith('Clicking ') || trimmed.startsWith('Row count') || trimmed.startsWith('Filtered rows') || trimmed.startsWith('AFTER_') || trimmed.startsWith('BEFORE_') || trimmed.startsWith('CREATED_') || trimmed.startsWith('MODAL_') || trimmed.startsWith('FORM_') || trimmed.startsWith('FILTER_') || trimmed.startsWith('MODEL_') || trimmed.startsWith('OPTIONS_') || trimmed.startsWith('APPLY_') || trimmed.startsWith('CLICK_') || trimmed.startsWith('RUBRIK_') || trimmed.startsWith('YA_') || trimmed.startsWith('CLICK_')) type = 'system';

      currentTest.logs.push({ text: line, type, time: Date.now() });
      buffer.push(line);
    } else {
      tests.push({ type: 'system', text: line, time: Date.now() });
    }
  }
  if (currentTest) {
    currentTest.output = buffer.join('\n');
    tests.push(currentTest);
  }
  return { tests, dirTitles };
}

let runningChild = null;
let currentRunId = null;
let testOutputBuffer = '';
let logSeq = 0;

const MAX_STORED_LOGS = 10000;
const runState = {
  running: false,
  runId: null,
  testPath: null,
  kind: null,
  logs: [],
  summary: [],
  artifacts: null,
  code: null,
  startedAt: null,
};

function broadcastLog(runId, data, type, onlySocket) {
  const timestamp = Date.now();
  for (const line of String(data).split('\n')) {
    if (line.trim() === '') continue;
    runState.logs.push({ id: ++logSeq, text: line, type, timestamp });
  }
  if (runState.logs.length > MAX_STORED_LOGS) {
    runState.logs.splice(0, runState.logs.length - MAX_STORED_LOGS);
  }
  const payload = { runId, data, type, timestamp };
  if (onlySocket) onlySocket.emit('log', payload);
  else io.emit('log', payload);
}

function resetRunState(runId, testPath, kind) {
  runState.running = true;
  runState.runId = runId;
  runState.testPath = testPath;
  runState.kind = kind;
  runState.logs = [];
  runState.summary = [];
  runState.artifacts = null;
  runState.code = null;
  runState.startedAt = Date.now();
  logSeq = 0;
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.onAny((eventName, ...args) => {
    console.log('Socket event:', eventName, args);
  });

  socket.emit('run-state', {
    running: runState.running,
    runId: runState.runId,
    testPath: runState.testPath,
    kind: runState.kind,
    logs: runState.logs,
    summary: runState.summary,
    artifacts: runState.artifacts,
    code: runState.code,
  });

  socket.on('run-test', ({ testPath, options = {} }) => {
    console.log('Run test:', testPath, options);
    if (runState.running) {
      broadcastLog(runState.runId, '⚠ Masih ada test yang sedang berjalan. Tunggu sampai selesai atau tekan Stop.\n', 'error', socket);
      return;
    }
    currentRunId = `run-${Date.now()}`;
    testOutputBuffer = '';
    resetRunState(currentRunId, testPath, 'test');

    const args = ['npx', 'playwright', 'test', testPath];
    if (options.headed) args.push('--headed');
    if (options.debug) args.push('--debug');
    if (options.workers) args.push('--workers', options.workers);
    if (options.retries !== undefined) args.push('--retries', options.retries);

    console.log('About to spawn:', args.join(' '));

    let child;
    try {
      child = spawn(args[0], args.slice(1), {
        cwd: PROJECT_ROOT,
        env: { ...process.env, FORCE_COLOR: '1', PLAYWRIGHT_VIDEO: 'on' },
        shell: true,
      });
    } catch (err) {
      console.error('Spawn error:', err);
      broadcastLog(currentRunId, `Spawn exception: ${err.message}`, 'error');
      runState.running = false;
      return;
    }

    console.log('Spawn returned, child:', !!child, 'PID:', child?.pid);

    runningChild = child;

    console.log('Child process spawned, PID:', child.pid);

    child.on('spawn', () => {
      console.log('Child process spawned event');
    });

    io.emit('run-started', { runId: currentRunId, testPath, timestamp: Date.now() });

    child.stdout.on('data', (data) => {
      const text = stripAnsi(data.toString());
      testOutputBuffer += text;
      console.log('STDOUT:', text.substring(0, 200));
      broadcastLog(currentRunId, text, 'stdout');
    });

    child.stderr.on('data', (data) => {
      const text = stripAnsi(data.toString());
      testOutputBuffer += text;
      console.log('STDERR:', text.substring(0, 200));
      broadcastLog(currentRunId, text, 'stderr');
    });

    child.on('close', async (code) => {
      broadcastLog(currentRunId, '🎬 Menyiapkan video (konversi ke MP4)...\n', 'system');
      await convertAllVideos();
      const { tests: parsed, dirTitles } = parseTestOutput(testOutputBuffer);
      parsed.forEach(t => { if (t.status === 'running') t.status = code === 0 ? 'passed' : 'failed'; });
      const artifacts = findArtifacts(testPath, dirTitles);
      runState.running = false;
      runState.code = code;
      runState.summary = parsed;
      runState.artifacts = artifacts;
      io.emit('run-done', { runId: currentRunId, code, artifacts, parsedTests: parsed, timestamp: Date.now() });
      runningChild = null;
      currentRunId = null;
    });

    child.on('error', (err) => {
      broadcastLog(currentRunId, `Spawn error: ${err.message}`, 'error');
      runState.running = false;
      runState.code = -1;
      io.emit('run-done', { runId: currentRunId, code: -1, artifacts: {}, error: err.message, timestamp: Date.now() });
      runningChild = null;
      currentRunId = null;
    });
  });

  socket.on('run-all', ({ options = {} }) => {
    if (runState.running) {
      broadcastLog(runState.runId, '⚠ Masih ada test yang sedang berjalan. Tunggu sampai selesai atau tekan Stop.\n', 'error', socket);
      return;
    }
    currentRunId = `run-all-${Date.now()}`;
    testOutputBuffer = '';
    resetRunState(currentRunId, 'all', 'all');

    const args = ['npx', 'playwright', 'test'];
    if (options.headed) args.push('--headed');
    if (options.workers) args.push('--workers', options.workers);
    if (options.retries !== undefined) args.push('--retries', options.retries);

    const child = spawn(args[0], args.slice(1), {
      cwd: PROJECT_ROOT,
      env: { ...process.env, FORCE_COLOR: '1', PLAYWRIGHT_VIDEO: 'on' },
      shell: true,
    });

    runningChild = child;

    io.emit('run-started', { runId: currentRunId, testPath: 'all', timestamp: Date.now() });
    broadcastLog(currentRunId, '🚀 Menjalankan semua test...\n', 'system');

    child.stdout.on('data', (data) => {
      const text = stripAnsi(data.toString());
      testOutputBuffer += text;
      broadcastLog(currentRunId, text, 'stdout');
    });

    child.stderr.on('data', (data) => {
      const text = stripAnsi(data.toString());
      testOutputBuffer += text;
      broadcastLog(currentRunId, text, 'stderr');
    });

    child.on('close', async (code) => {
      await convertAllVideos();
      const { tests: parsed } = parseTestOutput(testOutputBuffer);
      parsed.forEach(t => { if (t.status === 'running') t.status = code === 0 ? 'passed' : 'failed'; });
      runState.running = false;
      runState.code = code;
      runState.summary = parsed;
      io.emit('all-done', { runId: currentRunId, code, parsedTests: parsed, timestamp: Date.now() });
      runningChild = null;
      currentRunId = null;
    });

    child.on('error', (err) => broadcastLog(currentRunId, `Error: ${err.message}`, 'error'));
  });

  socket.on('stop-run', () => {
    if (runningChild) {
      runningChild.kill();
      runningChild = null;
      runState.running = false;
      broadcastLog(currentRunId, '\n⏹ Test dihentikan manual\n', 'error');
      currentRunId = null;
    }
  });

  socket.on('clear-run', () => {
    console.log('Clear run requested');
    if (runningChild) {
      runningChild.kill();
      runningChild = null;
    }
    currentRunId = null;
    testOutputBuffer = '';
    logSeq = 0;
    runState.running = false;
    runState.runId = null;
    runState.testPath = null;
    runState.kind = null;
    runState.logs = [];
    runState.summary = [];
    runState.artifacts = null;
    runState.code = null;
    runState.startedAt = null;
    io.emit('run-cleared', { timestamp: Date.now() });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Playwright UI running at http://localhost:${PORT}`));