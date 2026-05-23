// Namuna docx fayllarini {tag}'li shablonga aylantiradi.
// Ishga tushirish: node src/templates/build.js
import fs from 'node:fs';
import path from 'node:path';
import PizZip from 'pizzip';
import { ROOT } from '../config.js';
import { REGISTRY } from './registry.js';

const NAMUNA_DIR = path.join(ROOT, 'tarjima_uchun_shablon');
const BUILT_DIR = path.join(ROOT, 'src', 'templates', 'built');

const W_T = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;

function templatizeXml(xml, field_byRun) {
  let i = -1;
  return xml.replace(W_T, (m, open, content, close) => {
    i++;
    if (field_byRun.has(i)) {
      return `${open}${field_byRun.get(i)}${close}`;
    }
    return m;
  });
}

// Katak matnini bitta tag bilan almashtiradi (qolgan run'larni tozalaydi)
function setCellText(cellXml, tag) {
  let done = false;
  const out = cellXml.replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/g, () => {
    if (!done) {
      done = true;
      return `<w:t xml:space="preserve">${tag}</w:t>`;
    }
    return '<w:t xml:space="preserve"></w:t>';
  });
  if (done) return out;
  // Bo'sh katak: birinchi paragraf ichiga yangi run qo'shamiz (tegni yo'qotmaslik uchun)
  return cellXml.replace(/<\/w:p>/, `<w:r><w:t xml:space="preserve">${tag}</w:t></w:r></w:p>`);
}

// Namuna ma'lumot qatorini loop shabloniga aylantiradi
function transformRow(rowXml, columns, loop) {
  const cells = rowXml.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || [];
  let out = rowXml;
  cells.forEach((cell, i) => {
    if (i >= columns.length) return;
    const open = i === 0 ? `{#${loop}}` : '';
    const close = i === columns.length - 1 ? `{/${loop}}` : '';
    const field = columns[i] ? `{${columns[i]}}` : ''; // bo'sh ustun = faqat loop belgisi (masalan avto-raqamli № ustun)
    if (!open && !close && !field) return;
    out = out.replace(cell, setCellText(cell, `${open}${field}${close}`));
  });
  return out;
}

function templatizeTable(xml, spec, docType) {
  const tables = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || [];
  const tableXml = tables[spec.tableIndex || 0];
  if (!tableXml) throw new Error(`${docType}: jadval topilmadi (index ${spec.tableIndex || 0})`);

  const rows = tableXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || [];
  const headerRows = spec.headerRows ?? 1;
  if (rows.length <= headerRows) throw new Error(`${docType}: ma'lumot qatori yo'q`);

  const tmpl = transformRow(rows[headerRows], spec.columns, spec.loop);
  // Ma'lumot qatorlari: headerRows..dataEndRow (qolgani — masalan maxsus oxirgi qator — saqlanadi)
  const dataEnd = spec.dataEndRow ?? rows.length - 1;
  const firstIdx = tableXml.indexOf(rows[headerRows]);
  const lastDataRow = rows[dataEnd];
  const endIdx = tableXml.indexOf(lastDataRow) + lastDataRow.length;
  const newTableXml = tableXml.slice(0, firstIdx) + tmpl + tableXml.slice(endIdx);
  return xml.replace(tableXml, newTableXml);
}

export function buildOne(docType) {
  const def = REGISTRY[docType];
  if (!def) throw new Error('Noma\'lum hujjat turi: ' + docType);

  const src = path.join(NAMUNA_DIR, def.templateFile);
  if (!fs.existsSync(src)) throw new Error('Shablon topilmadi: ' + src);

  const zip = new PizZip(fs.readFileSync(src));
  const docXmlPath = 'word/document.xml';
  let xml = zip.file(docXmlPath).asText();

  // run indeksi -> yangi matn
  const byRun = new Map();
  const maxRun = xml.match(W_T)?.length ?? 0;
  for (const f of def.fields) {
    // runIndex: raqam YOKI massiv; element raqam YOKI {i, prefix, suffix}
    const targets = Array.isArray(f.runIndex) ? f.runIndex : [f.runIndex];
    for (const t of targets) {
      const i = typeof t === 'object' ? t.i : t;
      const prefix = (typeof t === 'object' ? t.prefix : f.prefix) || '';
      const suffix = (typeof t === 'object' ? t.suffix : f.suffix) || '';
      if (i >= maxRun) {
        throw new Error(`${docType}: "${f.name}" runIndex=${i} mavjud emas (jami ${maxRun})`);
      }
      byRun.set(i, `${prefix}{${f.name}}${suffix}`);
    }
    for (const r of f.clearRuns || []) byRun.set(r, '');
  }

  xml = templatizeXml(xml, byRun);

  // Dinamik jadval: bitta namuna qatorni {#loop}...{/loop} bilan o'rab, qolganini o'chiramiz
  if (def.table) xml = templatizeTable(xml, def.table, docType);

  zip.file(docXmlPath, xml);

  fs.mkdirSync(BUILT_DIR, { recursive: true });
  const out = path.join(BUILT_DIR, `${docType}.docx`);
  fs.writeFileSync(out, zip.generate({ type: 'nodebuffer' }));
  return out;
}

// To'g'ridan-to'g'ri ishga tushirilsa, barcha turlarni quradi
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('build.js')) {
  for (const docType of Object.keys(REGISTRY)) {
    try {
      const out = buildOne(docType);
      console.log(`OK  ${docType} -> ${path.relative(ROOT, out)}`);
    } catch (e) {
      console.error(`XATO  ${docType}: ${e.message}`);
    }
  }
}
