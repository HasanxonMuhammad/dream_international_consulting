import { PDFParse } from 'pdf-parse';

/**
 * PDF buferidan matn va jadvallarni ajratadi.
 * @returns {Promise<{text: string, tables: string[][][], pages: number, hasText: boolean}>}
 *   tables: jadvallar ro'yxati; har jadval = qatorlar; har qator = kataklar massivi
 */
export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const r = await parser.getText();
  const text = (r.text || '').trim();
  const hasText = text.replace(/\s/g, '').length > 40;

  let tables = [];
  if (hasText) {
    try {
      const t = await parser.getTable();
      // Har bir betdagi jadvallarni bitta ro'yxatga yig'amiz
      for (const page of t.pages || []) {
        for (const tbl of page.tables || []) tables.push(tbl);
      }
    } catch {
      tables = [];
    }
  }

  return { text, tables, pages: r.total || 0, hasText };
}
