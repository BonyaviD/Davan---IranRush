# دوان (Davan)

Crowd-runner موبایل با تم ایرانی. Phaser 3 + TypeScript + Vite، و بعداً Capacitor.

## اجرا
```bash
npm install
npm run dev        # سرور توسعه (روی گوشی هم از طریق IP شبکه باز می‌شه)
npm test           # unit testها (Vitest)
npm run build      # typecheck + build در dist/
```

## ساختار
```
src/
  main.ts                 # راه‌اندازی Phaser (Scale.FIT، 720×1280، بدون physics)
  config/
    game.config.ts        # ثابت‌های tuning (سرعت، عرض مسیر، سقف sprite، نبرد)
    worlds/               # یک فایل برای هر world + index
    levels/               # داده‌ی مراحل به‌صورت TS تایپ‌شده + index
  core/                   # منطق خالص، بدون Phaser، با unit test
    types.ts              # قراردادهای داده (Level، Gate، World، ...)
    GateLogic.ts  CrowdModel.ts  BattleLogic.ts  LevelLoader.ts
  scenes/                 # Boot (تکسچرهای placeholder)، Menu، Game، Result + keys.ts
  entities/               # CrowdRenderer (pool + چیدمان Vogel)، Gate، Enemy، Obstacle
  ui/                     # DOM overlay راست‌چین: styles.css، digits.ts (ارقام فارسی)، HUD/منو/نتیجه
  services/               # Storage (localStorage، بعداً Capacitor Preferences)، Audio
  assets/                 # فونت Vazirmatn (local) و بعداً آرت واقعی
tests/                    # تست‌های Vitest
```

## وضعیت
- **M1 ✅** حرکت مسیر، کنترل با drag، گیت‌ها، count، نبرد، Win/Lose، HUD. یک مرحله‌ی نمونه (`bazaar-01`).
- M2: سه world با پارالکس، مانع‌ها، چند مرحله · M3: منو و ذخیره‌ی پیشرفت · M4: Capacitor (Android/iOS)

## قواعد
- عدد `count` در `CrowdModel` مرجع است؛ spriteها فقط نمایشی‌اند.
- همه‌ی حرکت‌ها بر اساس `dt` (مستقل از FPS).
- متن فارسی (کلمه و جمله) فقط در DOM. داخل canvas فقط عدد و علامت (مثل `+۱۰`) نوشته می‌شه که نیاز به شکل‌دهی حروف نداره.
- قوانین گیت: نتیجه گرد می‌شه و منفی نمی‌شه. ضرب و تقسیم حداقل ۱ نفر رو نگه می‌دارن. تفریق می‌تونه به ۰ برسه که یعنی باخت فوری.
- نبرد: هر tick هر دو طرف به یک اندازه کم می‌شن. بازیکن فقط وقتی می‌بره که تعدادش بیشتر باشه (تساوی یعنی باخت). مدت نبرد حدود ۲.۵ ثانیه‌ست، هر عددی که باشه.
- هر مرحله با تست چک می‌شه: بهترین انتخاب‌ها باید ببرن و بدترین‌ها باید ببازن.
- جایگزینی آرت = لود کردن spritesheet با همان کلیدهای `scenes/keys.ts`.
