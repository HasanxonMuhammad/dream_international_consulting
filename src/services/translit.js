// O'zbek lotin yozuvini ingliz tiliga moslab transliteratsiya qiladi.
// Bu faqat YORDAMCHI — tarjimon natijani formada tahrirlashi mumkin.
// Rasmiy hujjatlarda qabul qilingan yozuvga yaqinlashtiradi (x->kh, o'->o, g'->gh).

const DIGRAPHS = [
  ["o'", 'o'], ["o‘", 'o'], ['oʻ', 'o'],
  ["g'", 'gh'], ["g‘", 'gh'], ['gʻ', 'gh'],
  ['sh', 'sh'], ['ch', 'ch'], ['ng', 'ng'],
  ['ya', 'ya'], ['yo', 'yo'], ['yu', 'yu'], ['ts', 'ts'],
];

const SINGLE = {
  x: 'kh', // Rahimov(x) -> kh
  q: 'q',
  h: 'h',
  'ʼ': '', "'": '', '‘': '', '’': '',
};

function translitWord(word) {
  // Bosh harf kattaligini saqlash uchun: agar so'z butunlay katta bo'lsa, natijani ham katta qilamiz
  const isUpper = word === word.toUpperCase() && /[A-ZА-Я]/.test(word);
  const isTitle = word.length > 1 && word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase();

  let s = word.toLowerCase();
  for (const [from, to] of DIGRAPHS) s = s.split(from).join(to);
  let out = '';
  for (const ch of s) out += SINGLE[ch] ?? ch;

  if (isUpper) return out.toUpperCase();
  if (isTitle) return out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

export function transliterate(text) {
  if (!text) return '';
  return String(text).replace(/[\p{L}'ʼ‘’]+/gu, (w) => translitWord(w));
}
