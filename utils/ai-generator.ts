import {
  generateAngle,
  generateLatarBelakang,
  generateNarasumber,
  generatePhone,
  randomHeadline,
  randomParagraph,
  Narasumber,
} from './data-generator';

export interface UsulanContent {
  angle: string;
  latarBelakang: string;
  narasumber: Narasumber[];
  source: 'ai' | 'dummy';
  model?: string;
}

export interface KeranjangMentahContent {
  judul: string;
  deskripsi: string;
  isi: string;
  narasumber: Narasumber[];
  source: 'ai' | 'dummy';
  model?: string;
}

const API_KEY = process.env.GEMINI_API_KEY || '';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const TOPIC = process.env.GEMINI_TOPIC || 'Anime dan Jepang';

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
  'gemma-4-31b-it',
];

const EXCLUDE_MODEL =
  /embedding|image|tts|transcribe|robotics|computer-use|lyria|deep-research|antigravity|aqa|nano-banana|omni|clip|customtools/i;

const MAX_ATTEMPTS = 6;
const AI_BUDGET = 60000;
const LIST_TIMEOUT = 10000;
const PER_ATTEMPT_TIMEOUT = 15000;
const MAX_NARASUMBER = 5;

const NARASUMBER_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      nama: { type: 'STRING' },
      jabatan: { type: 'STRING' },
      kontak: { type: 'STRING' },
    },
    required: ['nama', 'jabatan', 'kontak'],
  },
};

const USULAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    angle: { type: 'STRING' },
    latarBelakang: { type: 'STRING' },
    narasumber: NARASUMBER_SCHEMA,
  },
  required: ['angle', 'latarBelakang', 'narasumber'],
};

const KERANJANG_MENTAH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    judul: { type: 'STRING' },
    deskripsi: { type: 'STRING' },
    isi: { type: 'STRING' },
    narasumber: NARASUMBER_SCHEMA,
  },
  required: ['judul', 'deskripsi', 'isi', 'narasumber'],
};

let cachedModels: string[] | null = null;

async function listModels(): Promise<string[]> {
  if (cachedModels) return cachedModels;

  try {
    const res = await fetch(`${API_BASE}/models?key=${API_KEY}`, {
      signal: AbortSignal.timeout(LIST_TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
    const models = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter((name) => name && !EXCLUDE_MODEL.test(name));

    cachedModels = models.length ? models : FALLBACK_MODELS;
  } catch {
    cachedModels = FALLBACK_MODELS;
  }

  return cachedModels;
}

function buildUsulanPrompt(): string {
  return [
    'Kamu adalah generator data uji untuk aplikasi berita.',
    `Buat SATU usulan berita FIKSI (bukan kejadian nyata) bertema ${TOPIC} dalam Bahasa Indonesia.`,
    'Balas HANYA JSON valid dengan struktur:',
    '{"angle": string, "latarBelakang": string, "narasumber": [{"nama": string, "jabatan": string, "kontak": string}]}',
    'Aturan:',
    '- angle: judul singkat dan spesifik, maksimal 14 kata.',
    '- latarBelakang: 2-3 paragraf, tiap paragraf 3-5 kalimat, dipisah dengan "\\n\\n".',
    `- narasumber: 1-${MAX_NARASUMBER} orang dengan nama bernuansa Jepang/Indonesia, jabatan relevan, kontak berupa nomor HP Indonesia diawali "08".`,
  ].join('\n');
}

function buildKeranjangMentahPrompt(): string {
  return [
    'Kamu adalah generator data uji untuk aplikasi berita.',
    `Buat SATU keranjang mentah (draf artikel) FIKSI (bukan kejadian nyata) bertema ${TOPIC} dalam Bahasa Indonesia.`,
    'Balas HANYA JSON valid dengan struktur:',
    '{"judul": string, "deskripsi": string, "isi": string, "narasumber": [{"nama": string, "jabatan": string, "kontak": string}]}',
    'Aturan:',
    '- judul: judul artikel yang spesifik dan menarik, maksimal 12 kata, tanpa tanda titik di akhir.',
    '- deskripsi: 1-2 kalimat ringkas, maksimal 280 karakter.',
    '- isi: 3-4 paragraf, tiap paragraf 3-5 kalimat, dipisah dengan "\\n\\n".',
    `- narasumber: 1-${MAX_NARASUMBER} orang dengan nama bernuansa Jepang/Indonesia, jabatan relevan, kontak berupa nomor HP Indonesia diawali "08".`,
  ].join('\n');
}

async function callModel(model: string, prompt: string, schema: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE}/models/${model}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 1.3,
      },
    }),
    signal: AbortSignal.timeout(PER_ATTEMPT_TIMEOUT),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${body.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return JSON.parse(text);
}

interface Generated<T> {
  content: T;
  model: string;
}

async function generateJson<T>(
  prompt: string,
  schema: unknown,
  sanitizeFn: (raw: unknown) => T | null,
  label: string
): Promise<Generated<T> | null> {
  if (!API_KEY) {
    console.log('[AI] GEMINI_API_KEY not set, using local dummy data');
    return null;
  }

  const pool = [...(await listModels())];
  const deadline = Date.now() + AI_BUDGET;

  for (let attempt = 0; attempt < MAX_ATTEMPTS && pool.length; attempt++) {
    if (Date.now() >= deadline) {
      console.log('[AI] time budget exceeded, falling back to local dummy data');
      break;
    }
    const model = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    try {
      const content = sanitizeFn(await callModel(model, prompt, schema));
      if (content) {
        console.log(`[AI] ${label} generated via ${model}`);
        return { content, model };
      }
      console.log(`[AI] ${model} returned incomplete ${label}, trying another model`);
    } catch (err) {
      console.log(`[AI] ${model} failed: ${(err as Error).message}`);
    }
  }

  console.log('[AI] all models failed or rate-limited, falling back to local dummy data');
  return null;
}

function parseNarasumber(raw: unknown): Narasumber[] {
  return Array.isArray(raw)
    ? raw
        .filter((n): n is Record<string, unknown> => !!n && typeof (n as { nama?: unknown }).nama === 'string')
        .map((n) => ({
          nama: String(n.nama).trim(),
          jabatan: String(n.jabatan || '').trim() || 'Narasumber',
          kontak: String(n.kontak || '').trim() || generatePhone(),
        }))
        .slice(0, MAX_NARASUMBER)
    : [];
}

function sanitizeUsulan(raw: unknown): { angle: string; latarBelakang: string; narasumber: Narasumber[] } | null {
  const source = (raw || {}) as { angle?: unknown; latarBelakang?: unknown; narasumber?: unknown };

  const angle = typeof source.angle === 'string' ? source.angle.replace(/\s+/g, ' ').trim() : '';
  const latarBelakang = typeof source.latarBelakang === 'string' ? source.latarBelakang.trim() : '';
  const narasumber = parseNarasumber(source.narasumber);

  if (!angle || !latarBelakang || narasumber.length === 0) return null;
  return { angle, latarBelakang, narasumber };
}

function sanitizeKeranjangMentah(
  raw: unknown
): { judul: string; deskripsi: string; isi: string; narasumber: Narasumber[] } | null {
  const source = (raw || {}) as { judul?: unknown; deskripsi?: unknown; isi?: unknown; narasumber?: unknown };

  const judul = typeof source.judul === 'string' ? source.judul.replace(/\s+/g, ' ').trim() : '';
  const deskripsi = typeof source.deskripsi === 'string' ? source.deskripsi.replace(/\s+/g, ' ').trim() : '';
  const isi = typeof source.isi === 'string' ? source.isi.trim() : '';
  const narasumber = parseNarasumber(source.narasumber);

  if (!judul || !deskripsi || !isi) return null;
  return { judul, deskripsi, isi, narasumber };
}

export async function generateUsulanContent(): Promise<UsulanContent> {
  const result = await generateJson(buildUsulanPrompt(), USULAN_SCHEMA, sanitizeUsulan, 'usulan content');
  if (result) return { ...result.content, source: 'ai', model: result.model };
  return dummyUsulanContent();
}

export async function generateKeranjangMentahContent(): Promise<KeranjangMentahContent> {
  const result = await generateJson(
    buildKeranjangMentahPrompt(),
    KERANJANG_MENTAH_SCHEMA,
    sanitizeKeranjangMentah,
    'keranjang mentah content'
  );
  if (result) return { ...result.content, source: 'ai', model: result.model };
  return dummyKeranjangMentahContent();
}

function dummyUsulanContent(): UsulanContent {
  const angle = generateAngle();
  return {
    angle,
    latarBelakang: generateLatarBelakang(angle),
    narasumber: generateNarasumber(),
    source: 'dummy',
  };
}

function dummyKeranjangMentahContent(): KeranjangMentahContent {
  const judul = randomHeadline().replace(/\.$/, '');
  return {
    judul,
    deskripsi: randomParagraph(2),
    isi: [randomParagraph(4), randomParagraph(4)].join('\n\n'),
    narasumber: generateNarasumber(),
    source: 'dummy',
  };
}
