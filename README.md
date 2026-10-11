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

## قواعد
- عدد `count` در `CrowdModel` مرجع است؛ spriteها فقط نمایشی‌اند.
- همه‌ی حرکت‌ها بر اساس `dt` (مستقل از FPS).
- متن فارسی فقط در DOM، هیچ‌وقت در Phaser Text.
- جایگزینی آرت = لود کردن spritesheet با همان کلیدهای `scenes/keys.ts`.
