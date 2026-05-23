# Dream International — Tarjima boshqaruv tizimi

Kompaniya ichidagi tarjima bo'limi uchun web ilova. Xodimlar rasmiy hujjatni
yuklab, turini tanlaydi; tizim AI yordamida o'zbekchadan inglizchaga tarjima qiladi
va natijani **asl formatda** (DOCX→DOCX, PDF→PDF) qaytaradi. Barcha fayllar serverda
saqlanadi, xodimlarning kunlik faoliyati hisobotda ko'rinadi.

## Imkoniyatlar

- 🔐 10 ta xodim uchun login/parol bilan kirish
- 📤 Hujjat yuklash + 10 xil tur (yuridik, tibbiy, moliyaviy, texnik, ...)
- 🤖 Google Cloud Document Translation (formatni saqlab tarjima)
- 🗂 Hujjatlar arxivi (qidiruv va filtrlar bilan), asl va tarjima faylni yuklab olish
- 📊 Boshqaruv paneli (statistika) va kunlik xodimlar hisoboti
- 🔒 Hamma narsa kompaniya serverida qoladi (maxfiylik)

## Texnologiyalar

Node.js + Express, SQLite (better-sqlite3), Google Cloud Translation v3, Tailwind (Stitch dizayni).

---

## 1. O'rnatish

```powershell
# Loyiha papkasida
npm install

# Sozlamalar faylini yarating
copy .env.example .env

# Boshlang'ich foydalanuvchilarni yarating (10 ta xodim)
npm run init-db
```

## 2. Ishga tushirish

```powershell
npm start
```

So'ng brauzerda: **http://localhost:3000**

Boshqa kompyuterlardan kirish uchun (kompaniya tarmog'i):
`http://<server-IP>:3000` (masalan `http://192.168.1.50:3000`).
Server IP manzilini bilish: `ipconfig`.

### Standart loginlar

| Login      | Parol     | Rol         |
|------------|-----------|-------------|
| admin      | admin123  | admin       |
| tarjimon1  | parol123  | tarjimon    |
| ... (tarjimon2 – tarjimon9) | parol123 | tarjimon |

> Birinchi kirgandan keyin **Sozlamalar** sahifasida parolni o'zgartiring.
> Ismlarni o'zgartirish uchun `src/db/seed.js` faylini tahrirlang yoki bazadan
> yangilang.

---

## 3. Google Cloud Translation ulanishi (haqiqiy tarjima)

`.env` da Google sozlamalari bo'sh bo'lsa, ilova **MOCK rejimda** ishlaydi —
ya'ni faylni nusxalaydi (tarjima qilmaydi). Bu test uchun. Haqiqiy tarjima uchun:

1. https://console.cloud.google.com da loyiha yarating.
2. **Cloud Translation API** ni yoqing (APIs & Services → Enable).
3. Billing (to'lov) ni yoqing — Document Translation pullik.
4. **Service Account** yarating, rol: `Cloud Translation API User`.
5. Unga **JSON kalit** yarating va yuklab oling (masalan `dream-translate.json`).
6. `.env` ni to'ldiring:

```env
GOOGLE_PROJECT_ID=sizning-loyiha-id
GOOGLE_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\hasan\keys\dream-translate.json
```

7. Serverni qayta ishga tushiring (`npm start`). Endi tarjima haqiqiy bo'ladi.

Qo'llab-quvvatlanadigan formatlar: **DOCX, PDF, XLSX, PPTX, TXT**.

---

## 4. Loyiha tuzilishi

```
src/
  server.js            Express ilova
  config.js            sozlamalar (.env)
  constants.js         hujjat turlari, formatlar
  db/index.js          SQLite sxema
  db/seed.js           boshlang'ich foydalanuvchilar
  middleware/auth.js   kirish tekshiruvi
  routes/auth.js       login/logout/parol
  routes/documents.js  yuklash, tarjima, arxiv, yuklab olish
  routes/stats.js      dashboard va hisobotlar
  services/translator.js  Google Cloud tarjima
public/                frontend (Stitch dizayni)
  login.html dashboard.html portal.html archive.html reports.html settings.html
data/                  SQLite bazasi (avtomatik)
storage/uploads/       yuklangan asl fayllar
storage/translated/    tarjima qilingan fayllar
```

## 5. Zaxira nusxa (backup)

Muhim ma'lumotlar `data/` (baza) va `storage/` (fayllar) papkalarida.
Bularni muntazam boshqa joyga nusxalab turing.

## Shablonlar haqida

Hujjat turlari bo'yicha maxsus atamalar lug'ati (glossary) kerak bo'lsa,
Google Translation custom glossary qo'shilishi mumkin — shablonlar tayyor bo'lgach
shu yerga qo'shamiz.
