// Build qilingan {tag}'li shablonni forma qiymatlari bilan to'ldiradi.
import fs from 'node:fs';
import path from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { ROOT } from '../config.js';
import { REGISTRY } from '../templates/registry.js';

const BUILT_DIR = path.join(ROOT, 'src', 'templates', 'built');

/**
 * @param {string} docType
 * @param {Object} values  forma qiymatlari { fieldName: 'qiymat' }
 * @returns {{buffer: Buffer, fileName: string}}
 */
export function fillTemplate(docType, values) {
  const def = REGISTRY[docType];
  if (!def) throw new Error('Noma\'lum hujjat turi: ' + docType);

  const builtPath = path.join(BUILT_DIR, `${docType}.docx`);
  if (!fs.existsSync(builtPath)) {
    throw new Error(`Shablon hali tayyorlanmagan: ${docType}. "node src/templates/build.js" ni ishga tushiring.`);
  }

  // Barcha maydonlar uchun qiymat (bo'sh bo'lsa ham) — docxtemplater xato bermasligi uchun
  const data = {};
  for (const f of def.fields) data[f.name] = values[f.name] ?? '';
  // Dinamik jadval qatorlari (massiv)
  if (def.table) {
    const rows = Array.isArray(values[def.table.loop]) ? values[def.table.loop] : [];
    data[def.table.loop] = rows;
  }

  const zip = new PizZip(fs.readFileSync(builtPath));
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '{', end: '}' } });
  doc.render(data);

  const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { buffer, fileName: `${docType}_translated.docx` };
}
