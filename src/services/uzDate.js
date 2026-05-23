// O'zbekcha sanalarni inglizcha matn ko'rinishiga o'giradi.
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// O'zbekcha oy nomlari -> raqam (1-12)
const UZ_MONTHS = {
  yanvar: 1, fevral: 2, mart: 3, aprel: 4, may: 5, iyun: 6,
  iyul: 7, avgust: 8, sentyabr: 9, oktyabr: 10, noyabr: 11, dekabr: 12,
};

function fmt(y, m, d) {
  if (!m || m < 1 || m > 12) return null;
  return `${MONTHS_EN[m - 1]} ${Number(d)}, ${y}`;
}

/**
 * "06.12.2007" / "2007-12-06" / "6 dekabr 2007" -> "December 6, 2007"
 * Tushunmasa, kiritilgan matnni o'zini qaytaradi.
 */
export function uzDateToEnglish(input) {
  if (!input) return '';
  const s = String(input).trim();

  let m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/); // dd.mm.yyyy
  if (m) return fmt(m[3], +m[2], +m[1]) || s;

  m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/); // yyyy-mm-dd
  if (m) return fmt(m[1], +m[2], +m[3]) || s;

  m = s.match(/(\d{1,2})\s*[-–]?\s*([a-zʻʼ‘’]+)\s+(\d{4})/i); // 6 dekabr 2007
  if (m) {
    const mon = UZ_MONTHS[m[2].toLowerCase().replace(/[ʻʼ'‘’]/g, '')];
    return fmt(m[3], mon, m[1]) || s;
  }
  return s;
}
