// Har bir hujjat turi uchun: manba shablon (namuna docx), forma maydonlari,
// va har bir maydon docx ichidagi qaysi matn-run'ga (w:t indeksi) joylanishi.
//
// "runIndex" — docx ichidagi nechanchi <w:t> ekani (0 dan boshlab).
// "clearRuns" — shu maydon bilan birga tozalanadigan qo'shimcha run'lar
//   (masalan ism ikki run'ga bo'lingan bo'lsa).
// "translit: true" — kiritilgan o'zbekcha qiymatni avtomatik transliteratsiya
//   qilib taklif etadi (tarjimon tahrirlashi mumkin).

export const REGISTRY = {
  tugilganlik: {
    label: 'Tug\'ilganlik haqida guvohnoma',
    templateFile: 'tugilganlik_haqida_guvohnoma_asl.docx',
    fields: [
      { name: 'child_name', label: 'Bola F.I.Sh', runIndex: 4, translit: true },
      { name: 'child_dob', label: 'Tug\'ilgan sana (ing.)', runIndex: 8, clearRuns: [9, 10], placeholder: 'February 26, 2006' },
      { name: 'dob_words', label: 'Tug\'ilgan yil (so\'z bilan)', runIndex: 13, clearRuns: [14], placeholder: 'Two thousand and six' },
      { name: 'birth_district', label: 'Tug\'ilgan tuman', runIndex: 17, translit: true },
      { name: 'birth_region', label: 'Tug\'ilgan viloyat', runIndex: 24, translit: true },
      { name: 'record_no', label: 'Yozuv raqami', runIndex: 30, placeholder: '412' },
      { name: 'record_date', label: 'Yozuv sanasi (ing.)', runIndex: 35, clearRuns: [36, 37], placeholder: 'March 1, 2006' },
      { name: 'father_name', label: 'Ota F.I.Sh', runIndex: 41, translit: true },
      { name: 'mother_name', label: 'Ona F.I.Sh', runIndex: 46, translit: true },
      { name: 'reg_district', label: 'Ro\'yxat tumani', runIndex: 51, suffix: ' ', translit: true },
      { name: 'issue_date', label: 'Berilgan sana (ing.)', runIndex: 54, placeholder: 'March 1, 2006' },
      { name: 'seal_district', label: 'Muhr tumani', runIndex: 64, suffix: ' ', translit: true },
      { name: 'seal_region', label: 'Muhr viloyati', runIndex: 67, translit: true },
      { name: 'cert_series', label: 'Guvohnoma seriyasi', runIndex: 70, clearRuns: [71], placeholder: 'I-AN' },
      { name: 'cert_number', label: 'Guvohnoma raqami', runIndex: 73, placeholder: '0103330' },
    ],
  },

  // Skaner hujjat — qo'lda to'ldiriladi (avto-o'qish yo'q, OCR yaramaydi)
  maktab_attestat: {
    label: 'Maktab attestati (ilova)',
    templateFile: 'maktab_attestat_namuna.docx',
    manualOnly: true,
    fields: [
      { name: 'cert_number', label: 'Attestat raqami', runIndex: 6, placeholder: '1436862' },
      { name: 'student_name', label: 'O\'quvchi F.I.Sh', runIndex: 9, clearRuns: [10], translit: true },
      { name: 'complete_year', label: 'Tamomlagan yili', runIndex: 13, placeholder: '2022' },
      { name: 'school_no', label: 'Maktab raqami', runIndex: 20, placeholder: '2' },
      { name: 'place', label: 'Tuman/Viloyat (ing.)', runIndex: 23, prefix: ' ', placeholder: 'Gulistan district Syrdarya' },
      { name: 'dob', label: 'Tug\'ilgan sana', runIndex: 30, clearRuns: [31, 32, 33, 34], placeholder: '30.06.2004' },
      { name: 'director_name', label: 'Direktor (F.I.Sh)', runIndex: 156, clearRuns: [157, 158, 159], translit: true },
      { name: 'issue_date', label: 'Berilgan sana', runIndex: 161, clearRuns: [162, 163, 164], placeholder: '18.06.2022' },
      { name: 'reg_no', label: 'Ro\'yxat raqami', runIndex: 168, placeholder: '79' },
      { name: 'seal_district', label: 'Muhr tumani', runIndex: 174, suffix: ' ', translit: true },
      { name: 'seal_region', label: 'Muhr viloyati', runIndex: 175, translit: true },
      { name: 'seal_school_no', label: 'Muhr maktab raqami', runIndex: 179, placeholder: '2' },
    ],
    table: {
      tableIndex: 0,
      headerRows: 1,
      loop: 'subjects',
      columns: ['subject', 'score'],
      rowLabels: { subject: 'Fan (ing.)', score: 'Baho (ing.)' },
    },
  },

  shahodatnoma: {
    label: 'Shahodatnoma (umumiy o\'rta ta\'lim)',
    templateFile: 'shahodatnoma_namuna.docx',
    sourcePdf: 'shahodatnoma.pdf',
    fields: [
      { name: 'cert_number', label: 'Shahodatnoma raqami', runIndex: 18, placeholder: '02151021' },
      { name: 'student_name', label: 'O\'quvchi F.I.Sh', runIndex: 28, translit: true },
      { name: 'dob', label: 'Tug\'ilgan sana (ing.)', runIndex: 30, clearRuns: [31, 32, 33, 34], placeholder: 'August 18, 2006' },
      { name: 'school_no', label: 'Maktab raqami', runIndex: 40, prefix: ' ', suffix: ' in ', placeholder: '34' },
      { name: 'district', label: 'Tuman', runIndex: 41, translit: true },
      { name: 'region', label: 'Viloyat', runIndex: 43, translit: true },
      { name: 'grad_year', label: 'Bitirgan yili', runIndex: 47, prefix: 'received General Secondary Education in ', clearRuns: [48], placeholder: '2024' },
      { name: 'director_name', label: 'Direktor F.I.Sh', runIndex: 108, clearRuns: [109], translit: true },
      { name: 'avg_grade', label: 'O\'rtacha baho', runIndex: 118, prefix: '        ', clearRuns: [119], placeholder: '4.37' },
      { name: 'issue_date', label: 'Berilgan sana', runIndex: 130, clearRuns: [131, 132], placeholder: '13.06.2024' },
      { name: 'instrument', label: 'Musiqa asbobi (bo\'lsa, tarjimasiz)', runIndex: 106, prefix: '                                                                          ', suffix: ' has the ability to play a melody on a musical instrument' },
    ],
    table: {
      tableIndex: 0,
      headerRows: 1,
      dataEndRow: 24,
      loop: 'subjects',
      columns: ['', 'subject', 'score'],
      rowLabels: { subject: 'Fan (ing.)', score: 'Baho (ing.)' },
    },
  },

  turar_joy_mavjudligi: {
    label: 'Turar joy mavjudligi ma\'lumotnomasi',
    templateFile: 'turar_joy_mavjudligi_namuna.docx',
    sourcePdf: 'turar_joy_mavjudligi.pdf',
    fields: [
      { name: 'citizen_name', label: 'F.I.Sh', runIndex: [3, 9, 32], translit: true },
      { name: 'tin', label: 'STIR / JShShIR', runIndex: [6, 12], placeholder: '30609792940014' },
      { name: 'doc_uid', label: 'Hujjat raqami (№)', runIndex: 15, placeholder: '5624-...' },
      { name: 'issue_date', label: 'Berilgan sana', runIndex: 18, clearRuns: [19], placeholder: '2025-07-04' },
      { name: 'statement_no', label: 'Ariza raqami', runIndex: [22, 26], placeholder: '201347607' },
      { name: 'app_date', label: 'Ariza sanasi (ing.)', runIndex: 29, clearRuns: [30], placeholder: 'July 3, 2025' },
      { name: 'app_date2', label: 'Holat sanasi (ing.)', runIndex: 34, clearRuns: [35], placeholder: 'July 3, 2025' },
      { name: 'ref_no', label: 'QR tartib raqami', runIndex: [60, 61], placeholder: '2847' },
    ],
    table: {
      tableIndex: 0,
      headerRows: 1,
      loop: 'rows',
      columns: ['no', 'name', 'prev_name', 'territory', 'residential', 'right_type', 'note'],
      rowLabels: { no: '№', name: 'F.I.Sh', prev_name: 'Oldingi F.I.Sh', territory: 'Hudud', residential: 'Turar joy', right_type: 'Huquq turi', note: 'Izoh (kadastr)' },
    },
  },

  mehnat_faoliyat: {
    label: 'Mehnat faoliyati ma\'lumotnomasi',
    templateFile: 'mehnat_faoliyat.docx',
    sourcePdf: 'mehnat_faoliyat.pdf',
    fields: [
      { name: 'citizen_name', label: 'F.I.Sh', runIndex: [4, 10], translit: true },
      { name: 'tin', label: 'STIR / JShShIR', runIndex: [7, 13], placeholder: '30609792940014' },
      { name: 'doc_uid', label: 'Hujjat raqami (№)', runIndex: 16, placeholder: '5624-...' },
      { name: 'issue_date', label: 'Berilgan sana', runIndex: 19, clearRuns: [20], placeholder: '2025-07-04' },
      { name: 'statement_no', label: 'Ariza raqami', runIndex: 23, placeholder: '201347607' },
    ],
    table: {
      tableIndex: 0,
      headerRows: 1,
      loop: 'rows',
      columns: ['no', 'start', 'end', 'org', 'org_tin', 'position', 'division'],
      rowLabels: { no: '№', start: 'Boshlanish', end: 'Tugash', org: 'Tashkilot', org_tin: 'Tashkilot STIR', position: 'Lavozim (ing.)', division: 'Bo\'lim (ing.)' },
    },
  },

  ish_haqi: {
    label: 'Hisoblangan ish haqi ma\'lumotnomasi',
    templateFile: 'ish_haqi.docx',
    sourcePdf: 'ish_haqi.pdf',
    fields: [
      { name: 'citizen_name', label: 'F.I.Sh', runIndex: [19, 27, 35], translit: true },
      { name: 'pinfl', label: 'JShShIR / INPS', runIndex: [22, 30, 40], placeholder: '33001842610060' },
      { name: 'doc_uid', label: 'Hujjat raqami (№)', runIndex: 4, placeholder: '3403-...' },
      { name: 'issue_date', label: 'Berilgan sana', runIndex: 11, clearRuns: [12], placeholder: '2025-07-08' },
      { name: 'statement_no', label: 'Ariza raqami', runIndex: 14, placeholder: '202322681' },
      { name: 'total_salary', label: 'Umumiy ish haqi', runIndex: 42, placeholder: '31 505 578' },
      { name: 'total_tax', label: 'Umumiy daromad solig\'i', runIndex: 47, placeholder: '3 780 669' },
      { name: 'ref_no', label: 'Tartib raqami', runIndex: 269, placeholder: '4459' },
    ],
    table: {
      tableIndex: 0,
      headerRows: 1,
      loop: 'rows',
      columns: ['year', 'month', 'company', 'salary', 'tax', 'pension'],
      rowLabels: { year: 'Yil', month: 'Oy', company: 'Korxona', salary: 'Ish haqi', tax: 'Soliq', pension: 'Pensiya (INPS)' },
    },
  },

  uzini_uzi_band: {
    label: 'O\'zini o\'zi band qilganlik ma\'lumotnomasi',
    templateFile: 'uzini_uzi_band.docx',
    sourcePdf: 'uzini_uzi_band.pdf',
    fields: [
      { name: 'citizen_name', label: 'F.I.Sh', runIndex: [15, 25], translit: true },
      { name: 'pinfl', label: 'JShShIR (PINFL)', runIndex: 18, placeholder: '32111755450011' },
      { name: 'cert_no', label: 'Ma\'lumotnoma raqami', runIndex: 22, placeholder: '0012652772' },
      { name: 'statement_no', label: 'Ariza raqami', runIndex: 11, placeholder: '259800822' },
      { name: 'doc_uid', label: 'Hujjat raqami (№)', runIndex: 5, placeholder: '3636-...' },
      { name: 'issue_date', label: 'Berilgan sana', runIndex: 7, clearRuns: [8], placeholder: '2026-02-16' },
      { name: 'reg_date', label: 'Ro\'yxat sanasi (ing.)', runIndex: 30, clearRuns: [31, 32, 33, 34], placeholder: 'February 16, 2026' },
      { name: 'activity_district', label: 'Faoliyat tumani', runIndex: 38, clearRuns: [39, 40], translit: true },
      { name: 'activity_region', label: 'Faoliyat viloyati', runIndex: 43, translit: true },
      { name: 'activity_type', label: 'Faoliyat turi (ing. tarjima)', runIndex: 51, clearRuns: [52, 53], placeholder: 'Making items from gypsum...' },
      { name: 'activity_date', label: 'Faoliyat boshlanish sanasi', runIndex: 54, placeholder: '16.02.2026' },
      { name: 'ref_no', label: 'Tartib raqami', runIndex: [57, 58], placeholder: '6420' },
    ],
  },

  nikohda_turmaganlik: {
    label: 'Nikohda turmaganlik ma\'lumotnomasi',
    templateFile: 'nikohda_turmaganlik.docx',
    sourcePdf: 'nikohda_turmaganlik.pdf',
    fields: [
      { name: 'citizen_name', label: 'F.I.Sh', runIndex: [28, 34, 48], translit: true },
      { name: 'dob', label: 'Tug\'ilgan sana (ing.)', runIndex: 51, clearRuns: [52, 53, 54], placeholder: 'April 19, 2005' },
      { name: 'pinfl', label: 'JShShIR (PINFL)', runIndex: [31, 37], placeholder: '51904055310030' },
      { name: 'statement_no', label: 'Ariza raqami', runIndex: [17, 25, 45], placeholder: '198822653' },
      { name: 'doc_uid', label: 'Hujjat raqami (№)', runIndex: [13, 21], placeholder: '4407-6668-...' },
      { name: 'issue_date', label: 'Berilgan sana', runIndex: [15, 23], placeholder: '2025-06-30' },
      { name: 'region', label: 'Viloyat', runIndex: [{ i: 4, suffix: ' ' }, 58], translit: true },
      { name: 'official_name', label: 'Mas\'ul shaxs F.I.Sh', runIndex: 68, translit: true },
      { name: 'ref_no', label: 'Tartib raqami', runIndex: [71, 72], placeholder: '9982' },
    ],
  },

  nikoh: {
    label: 'Nikoh guvohnomasi',
    templateFile: 'nikoh_namuna.docx',
    fields: [
      { name: 'husband_name', label: 'Kuyov F.I.Sh', runIndex: 1, translit: true },
      { name: 'husband_dob', label: 'Kuyov tug\'ilgan sana (ing.)', runIndex: 4, placeholder: 'January 3, 1985' },
      { name: 'husband_district', label: 'Kuyov tug\'ilgan tuman', runIndex: 7, translit: true },
      { name: 'husband_region', label: 'Kuyov tug\'ilgan viloyat', runIndex: 10, translit: true },
      { name: 'wife_name', label: 'Kelin F.I.Sh', runIndex: 15, clearRuns: [14], translit: true },
      { name: 'wife_dob', label: 'Kelin tug\'ilgan sana (ing.)', runIndex: 18, placeholder: 'February 16, 1987' },
      { name: 'wife_district', label: 'Kelin tug\'ilgan tuman', runIndex: 20, translit: true },
      { name: 'wife_region', label: 'Kelin tug\'ilgan viloyat', runIndex: 22, translit: true },
      { name: 'marriage_date', label: 'Nikoh sanasi (ing.)', runIndex: 26, placeholder: 'September 19, 2005' },
      { name: 'record_date', label: 'Yozuv sanasi (ing.)', runIndex: 34, clearRuns: [35, 36], placeholder: 'September 19, 2005' },
      { name: 'act_number', label: 'Akt raqami', runIndex: 39, placeholder: '627' },
      { name: 'husband_surname_after', label: 'Kuyovga berilgan familiya', runIndex: 43, translit: true },
      { name: 'wife_surname_after', label: 'Kelinga berilgan familiya', runIndex: 46, translit: true },
      { name: 'reg_district', label: 'Ro\'yxat tumani (FHDYo)', runIndex: 48, translit: true },
      { name: 'issue_date', label: 'Berilgan sana (ing.)', runIndex: 52, placeholder: 'September 19, 2005' },
      { name: 'head_initial', label: 'FHDYo boshlig\'i (bosh harf)', runIndex: 56, placeholder: 'D.' },
      { name: 'head_surname', label: 'FHDYo boshlig\'i familiyasi', runIndex: 58, translit: true },
    ],
  },
};
