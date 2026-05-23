import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { MIME_BY_EXT } from '../constants.js';

let _client = null; // lazy: faqat kerak bo'lganda yuklaymiz

async function getClient() {
  if (_client) return _client;
  const { v3 } = await import('@google-cloud/translate');
  _client = new v3.TranslationServiceClient({ keyFilename: config.google.keyFile });
  return _client;
}

/**
 * Hujjatni tarjima qiladi va natija faylini diskka yozadi.
 * @returns {Promise<{translatedPath: string, translatedName: string}>}
 */
export async function translateDocument({ inputPath, originalName, sourceLang, targetLang }) {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext);
  const translatedName = `${base}_${targetLang}${ext}`;
  const translatedPath = path.join(config.translatedDir, `${Date.now()}_${translatedName}`);

  // --- Mock rejim (Google kaliti yo'q): test uchun ---
  if (config.mockTranslation) {
    await mockTranslate(inputPath, translatedPath, ext);
    return { translatedPath, translatedName };
  }

  // --- .txt fayllar: oddiy matn tarjimasi (translateText) ---
  if (ext === '.txt') {
    await translatePlainText({ inputPath, translatedPath, sourceLang, targetLang });
    return { translatedPath, translatedName };
  }

  // --- DOCX/PDF/XLSX/PPTX: formatni saqlab tarjima (translateDocument) ---
  const client = await getClient();
  const parent = `projects/${config.google.projectId}/locations/${config.google.location}`;
  const content = fs.readFileSync(inputPath);
  const mimeType = MIME_BY_EXT[ext];

  const [response] = await client.translateDocument({
    parent,
    sourceLanguageCode: sourceLang,
    targetLanguageCode: targetLang,
    documentInputConfig: { content, mimeType },
  });

  const out = response.documentTranslation?.byteStreamOutputs?.[0];
  if (!out) throw new Error('Google tarjima natija qaytarmadi');
  fs.writeFileSync(translatedPath, Buffer.from(out));

  return { translatedPath, translatedName };
}

async function translatePlainText({ inputPath, translatedPath, sourceLang, targetLang }) {
  const client = await getClient();
  const parent = `projects/${config.google.projectId}/locations/${config.google.location}`;
  const text = fs.readFileSync(inputPath, 'utf8');

  // Google bir so'rovda 30k baytgacha qabul qiladi; uzun matnni bo'laklarga ajratamiz
  const chunks = splitText(text, 25000);
  const translated = [];
  for (const chunk of chunks) {
    const [resp] = await client.translateText({
      parent,
      contents: [chunk],
      mimeType: 'text/plain',
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
    });
    translated.push(resp.translations.map((t) => t.translatedText).join(''));
  }
  fs.writeFileSync(translatedPath, translated.join(''), 'utf8');
}

function splitText(text, maxBytes) {
  const lines = text.split('\n');
  const chunks = [];
  let cur = '';
  for (const line of lines) {
    if (Buffer.byteLength(cur + line + '\n') > maxBytes && cur) {
      chunks.push(cur);
      cur = '';
    }
    cur += line + '\n';
  }
  if (cur) chunks.push(cur);
  return chunks.length ? chunks : [text];
}

// Kalitsiz test rejimi: faylni nusxalaydi (matn fayliga belgi qo'shadi)
async function mockTranslate(inputPath, translatedPath, ext) {
  if (ext === '.txt') {
    const text = fs.readFileSync(inputPath, 'utf8');
    fs.writeFileSync(
      translatedPath,
      `[MOCK TRANSLATION uz->en]\n\n${text}`,
      'utf8'
    );
  } else {
    fs.copyFileSync(inputPath, translatedPath);
  }
  // Sun'iy kechikish (haqiqiy tarjimaga o'xshatish uchun)
  await new Promise((r) => setTimeout(r, 1200));
}
