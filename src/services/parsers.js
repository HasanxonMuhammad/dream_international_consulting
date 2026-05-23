// Asl PDF matnidan maydon qiymatlarini ajratuvchi parserlar (hujjat turi bo'yicha).
// Har bir parser: (text) => { fieldName: value }. Qiymatlar shu yerda
// transliteratsiya/sana o'girish bilan inglizchaga moslashtiriladi.
// Natija formani OLDINDAN to'ldiradi — tarjimon tekshirib/tuzatadi.
import { transliterate } from './translit.js';
import { uzDateToEnglish } from './uzDate.js';

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// Ko'p qatorli katta harfli ism qatorlarini topadi (lotin/kirill)
function findCapsNames(text) {
  return text
    .split('\n')
    .map((l) => clean(l))
    .filter((l) => /^[A-ZʻʼQ'‘’Ѐ-ӿ\s.]{6,}$/.test(l) && l.split(' ').length >= 2);
}

// O'zbekcha oy nomi -> inglizcha
const UZ_MONTH_EN = {
  yanvar: 'January', fevral: 'February', mart: 'March', aprel: 'April',
  may: 'May', iyun: 'June', iyul: 'July', avgust: 'August',
  sentabr: 'September', sentyabr: 'September', oktabr: 'October', oktyabr: 'October',
  noyabr: 'November', dekabr: 'December',
};
const MONTH_RE = Object.keys(UZ_MONTH_EN).join('|');

function monthEn(s) {
  return UZ_MONTH_EN[clean(s).toLowerCase()] || clean(s);
}

// QR kod oldidagi tartib raqami: hujjat oxiridagi alohida 3-6 xonali son (yil emas)
function refNo(text) {
  const all = [...text.matchAll(/(?:^|\n)\s*(\d{3,6})\s*(?=\n|$)/g)]
    .map((m) => m[1])
    .filter((n) => !/^(19|20)\d{2}$/.test(n));
  return all.length ? all[all.length - 1] : '';
}

// "Andijon viloyati" -> "Andijon region", "... tumani" -> "... district"
function mapTerritory(s) {
  let t = clean(s)
    .replace(/\bviloyati\b/gi, 'region')
    .replace(/\btumani\b/gi, 'district')
    .replace(/\bshahri\b/gi, 'city');
  return transliterate(t);
}

// tables ichidan sarlavhasi mos keladigan jadvalni topadi -> {header, dataRows}
function pickTable(tables, headerTest) {
  for (const t of tables || []) {
    if (!t.length) continue;
    const header = t[0].join(' | ');
    if (headerTest(header)) return { header: t[0], dataRows: t.slice(1) };
  }
  // mos kelmasa, eng katta jadvalni qaytaramiz
  const biggest = (tables || []).slice().sort((a, b) => b.length - a.length)[0];
  return biggest ? { header: biggest[0], dataRows: biggest.slice(1) } : null;
}

const PARSERS = {
  // Nikohda turmaganlik ma'lumotnomasi (repo.gov.uz e-hujjati)
  nikohda_turmaganlik(text) {
    const v = {};

    // Ism + tug'ilgan sana ("F.I.Sh 06.12.2007 yilda tug'ilgan")
    const body = text.match(/([A-ZʻʼQ'‘’Ѐ-ӿ\s]+?)\s+(\d{1,2}\.\d{1,2}\.\d{4})\s+yil/);
    if (body) {
      v.citizen_name = transliterate(clean(body[1]));
      v.dob = uzDateToEnglish(body[2]);
    } else {
      const issued = text.match(/Hujjat berilgan:\s*([A-ZʻʼQ'‘’\s]+)/);
      if (issued) v.citizen_name = transliterate(clean(issued[1]));
    }

    const pinfl = text.match(/JShShIR:\s*(\d{10,})/i) || text.match(/PINFL:\s*(\d{10,})/i);
    if (pinfl) v.pinfl = pinfl[1];

    const stmt = text.match(/Ariza raqami:\s*(\d+)/i) || text.match(/(\d{6,})\s*-\s*son/);
    if (stmt) v.statement_no = stmt[1];

    const uid = text.match(/№\s*([0-9a-f]{4}(?:-[0-9a-f]{4}){5,6})/i);
    if (uid) v.doc_uid = uid[1];

    const issDate = text.match(/Hujjat yaratilgan sana:\s*([\d-]+)/i);
    if (issDate) v.issue_date = issDate[1];

    const region = text.match(/([A-Za-zʻʼ'‘’]+)\s+viloyat/);
    if (region) v.region = transliterate(clean(region[1]));
    v.ref_no = refNo(text);

    // Mas'ul shaxs: citizen'dan boshqa katta harfli ism (odatda matn oxirida)
    const caps = findCapsNames(text);
    const citizenRaw = body ? clean(body[1]) : '';
    const official = caps.reverse().find((n) => n && n !== citizenRaw && !/RESPUBLIKAS|VAZIRLIK|ARXIV|FHDY/i.test(n));
    if (official) v.official_name = transliterate(official);

    return v;
  },
  // Shahodatnoma (umumiy o'rta ta'lim) — ikki tilli, har fan bitta qatorda
  shahodatnoma(text) {
    const v = {};
    const lines = text.split('\n').map((s) => clean(s)).filter(Boolean);

    // Fanlar: "<n>. <uz> <uz baho> <n>. <ing fan> <ing baho>" — ingliz qismini olamiz
    const subjects = [];
    const GRADE = '\\d\\s*\\((?:excellent|good|satisfactory|unsatisfactory|fail)\\)';
    const lineRe = new RegExp(`.*\\d+\\.\\s+(.+?)\\s+(${GRADE})\\s*$`, 'i');
    for (const l of lines) {
      const m = l.match(lineRe);
      if (m) subjects.push({ no: String(subjects.length + 1), subject: clean(m[1]), score: clean(m[2]) });
    }
    if (subjects.length) v.subjects = subjects;

    // Sanalar: birinchisi — tug'ilgan, oxirgisi — berilgan
    const dates = text.match(/\d{2}\.\d{2}\.\d{4}/g) || [];
    if (dates[0]) v.dob = uzDateToEnglish(dates[0]);
    if (dates.length) v.issue_date = dates[dates.length - 1];

    const cert = text.match(/\b(\d{8})\b/);
    if (cert) v.cert_number = cert[1];
    const avg = lines.find((l) => /^\d\.\d{1,2}$/.test(l));
    if (avg) v.avg_grade = avg;
    const sch = text.match(/(\d+)-sonli/i);
    if (sch) v.school_no = sch[1];

    // Bitirgan yil + joy: "2025 Samarqand viloyati, Toyloq tumani"
    const place = text.match(/(\d{4})\s+([A-Za-zʻʼ'‘’]+)\s+viloyati,?\s*([A-Za-zʻʼ'‘’]+)\s+tumani/i);
    if (place) {
      v.grad_year = place[1];
      v.region = transliterate(place[2]);
      v.district = transliterate(place[3]) + ' district';
    }

    // Ismlar: sarlavhasiz katta harfli lotin qatorlar
    const HEAD = /RESPUBLIK|REPUBLIC|UZBEKISTAN|CERTIFICATE|EDUCATION|SECONDARY|SHAHODATNOMA|DIRECTOR|UMUMIY|TA.LIM|RISIDA|O.RTA/i;
    const caps = lines.filter(
      (l) => /^[A-ZʻʼQ'‘’\s]{4,}$/.test(l) && !HEAD.test(l) && l.split(/\s+/).every((w) => w.length >= 2)
    );
    if (caps[0]) v.student_name = transliterate(caps[0]);
    if (caps.length > 1) {
      let dir = caps[caps.length - 1];
      if (caps.length >= 2 && dir.split(' ').length < 2) dir = caps[caps.length - 2] + ' ' + dir;
      v.director_name = transliterate(dir);
    }
    return v;
  },

  // Turar joy mavjudligi ma'lumotnomasi (Kadastr agentligi, mulklar jadvali)
  turar_joy_mavjudligi(text, tables) {
    const v = {};
    const name = text.match(/Фуқаро\s+([A-Z'‘’ ]{5,})/i) || text.match(/берилган:\s*([A-Z'‘’ ]{5,})/i);
    if (name) v.citizen_name = transliterate(clean(name[1]));
    const tin = text.match(/(?:ЖШШИР|JShShIR|STIR):\s*(\d{8,})/i) || text.match(/\b(\d{14})\b/);
    if (tin) v.tin = tin[1];
    const uid = text.match(/№\s*([0-9a-f]{4}(?:-[0-9a-f]{4}){5,6})/i);
    if (uid) v.doc_uid = uid[1];
    const stmt = text.match(/(?:Ариза рақами|Ariza raqami):\s*(\d+)/i) || text.match(/(\d{6,})-(?:сонли|son)/);
    if (stmt) v.statement_no = stmt[1];
    const issDate = text.match(/(?:яратилган сана|yaratilgan sana):\s*([\d-]+)/i);
    if (issDate) v.issue_date = issDate[1];
    const appDate = text.match(/(\d{4}-\d{2}-\d{2})\s*(?:даги|dagi)/i);
    if (appDate) { v.app_date = uzDateToEnglish(appDate[1]); v.app_date2 = v.app_date; }
    v.ref_no = refNo(text);

    const tbl = pickTable(tables, (h) => /Izoh|Note|Huquq|Right|Hudud/i.test(h));
    v.rows = (tbl?.dataRows || []).map((r, i) => ({
      no: clean(r[0]) || String(i + 1),
      name: transliterate(clean(r[1])),
      prev_name: transliterate(clean(r[2])),
      territory: mapTerritory(clean(r[3])),
      residential: /emas|not/i.test(clean(r[4])) ? 'Not Available' : (clean(r[4]) ? 'Available' : ''),
      right_type: /mulk|ownership/i.test(clean(r[5])) ? 'Ownership right' : clean(r[5]),
      note: clean(r[6]),
    }));
    return v;
  },

  // Mehnat faoliyati ma'lumotnomasi (ish joylari jadvali)
  mehnat_faoliyat(text, tables) {
    const v = {};
    const name = text.match(/Hujjat berilgan:\s*([^\n]+)/i) || text.match(/Issued to:\s*([^\n]+)/i);
    if (name) v.citizen_name = transliterate(clean(name[1]));
    const tin = text.match(/(?:JShShIR|STIR|TIN):\s*(\d{8,})/i);
    if (tin) v.tin = tin[1];
    const uid = text.match(/№\s*([0-9a-f]{4}(?:-[0-9a-f]{4}){5,6})/i);
    if (uid) v.doc_uid = uid[1];
    const stmt = text.match(/Ariza raqami:\s*(\d+)/i) || text.match(/Application Number:\s*(\d+)/i);
    if (stmt) v.statement_no = stmt[1];
    const issDate = text.match(/(?:Hujjat yaratilgan sana|Date of Issue):\s*([\d-]+)/i);
    if (issDate) v.issue_date = issDate[1];

    // Manba jadval: [№, (bo'sh), boshlanish, tugash, tashkilot, STIR, lavozim, bo'lim]
    const tbl = pickTable(tables, (h) => /STIR|TIN|Tashkilot|Organization/i.test(h));
    v.rows = (tbl?.dataRows || []).map((r, i) => ({
      no: clean(r[0]) || String(i + 1),
      start: clean(r[2]),
      end: /hozirgi|present/i.test(clean(r[3])) ? 'Present' : clean(r[3]),
      org: clean(r[4]).replace(/^["“”`']+|["“”`']+$/g, ''),
      org_tin: clean(r[5]),
      position: clean(r[6]),
      division: clean(r[7]),
    }));
    return v;
  },

  // Hisoblangan ish haqi ma'lumotnomasi (Soliq qo'mitasi e-hujjati, oylik jadval)
  ish_haqi(text, tables) {
    const v = {};
    const name = text.match(/F\.I\.SH:\s*([^\n]+)/i) || text.match(/Hujjat berilgan:\s*([^\n]+)/i);
    if (name) v.citizen_name = transliterate(clean(name[1]));
    const pinfl = text.match(/(?:JShShIR|INPS|PRSA):\s*(\d{10,})/i);
    if (pinfl) v.pinfl = pinfl[1];
    const uid = text.match(/№\s*([0-9a-f]{4}(?:-[0-9a-f]{4}){5,6})/i);
    if (uid) v.doc_uid = uid[1];
    const stmt = text.match(/Ariza raqami:\s*(\d+)/i);
    if (stmt) v.statement_no = stmt[1];
    const issDate = text.match(/Hujjat yaratilgan sana:\s*([\d-]+)/i);
    if (issDate) v.issue_date = issDate[1];
    const tSal = text.match(/Umumiy hisoblangan ish haqi:\s*([\d ]+)/i);
    if (tSal) v.total_salary = clean(tSal[1]);
    const tTax = text.match(/Daromad solig[‘'’]i:\s*([\d ]+)/i);
    if (tTax) v.total_tax = clean(tTax[1]);
    v.ref_no = refNo(text);

    // Oylik jadval (getTable'dan): [Yil, Oy, Korxona, ish haqi, soliq, boshqa, pensiya]
    const tbl = pickTable(tables, (h) => /yil|year/i.test(h));
    v.rows = (tbl?.dataRows || []).map((r) => ({
      year: clean(r[0]),
      month: monthEn(r[1]),
      company: clean(r[2]).replace(/^["“”`']+|["“”`']+$/g, ''),
      salary: clean(r[3]),
      tax: clean(r[4]),
      pension: clean(r[6] ?? r[r.length - 1]),
    }));
    return v;
  },

  // O'zini o'zi band qilganlik ma'lumotnomasi (Soliq qo'mitasi e-hujjati)
  uzini_uzi_band(text) {
    const v = {};
    const body = text.match(/Fuqaro\s+([A-ZʻʼQ'‘’\s]+?)\s+ga\s+(\d{1,2}\.\d{1,2}\.\d{4})/);
    if (body) {
      v.citizen_name = transliterate(clean(body[1]));
      v.reg_date = uzDateToEnglish(body[2]);
      v.activity_date = body[2];
    } else {
      const issued = text.match(/Hujjat berilgan:\s*([A-ZʻʼQ'‘’\s]+)/);
      if (issued) v.citizen_name = transliterate(clean(issued[1]));
    }
    const pinfl = text.match(/JShShIR:\s*(\d{10,})/i);
    if (pinfl) v.pinfl = pinfl[1];
    const stmt = text.match(/Ariza raqami:\s*(\d+)/i);
    if (stmt) v.statement_no = stmt[1];
    const uid = text.match(/№\s*([0-9a-f]{4}(?:-[0-9a-f]{4}){5,6})/i);
    if (uid) v.doc_uid = uid[1];
    const certNo = text.match(/№\s*(\d{8,})/);
    if (certNo) v.cert_no = certNo[1];
    const issDate = text.match(/Hujjat yaratilgan sana:\s*([\d-]+)/i);
    if (issDate) v.issue_date = issDate[1];
    v.ref_no = refNo(text);
    return v;
  },
};

export function parseDocument(docType, text, tables = []) {
  const p = PARSERS[docType];
  return p ? p(text, tables) : {};
}

export function hasParser(docType) {
  return !!PARSERS[docType];
}
