# دوان (Davan)

Crowd-runner موبایل با تم ایرانی. Three.js (سه‌بعدی) + TypeScript + Vite، و بعداً Capacitor.

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
  main.ts                 # بارگذاری فونت و شروع بازی (#tehran-01 در آدرس = شروع از آن مرحله)
  config/
    game.config.ts        # ثابت‌های tuning: سرعت، عرض جاده، سقف آدمک‌ها، نبرد، زاویه‌های دوربین
    worlds/               # یک فایل برای هر world (رنگ‌ها، مه، بنای شاخص، override دوربین)
    levels/               # داده‌ی مراحل به‌صورت TS تایپ‌شده
  core/                   # منطق خالص بدون وابستگی به موتور، با unit test
  game/                   # Game.ts (حلقه‌ی بازی و فازها)، Input.ts (drag)
  render/                 # Three.js: Stage، CameraRig، CrowdMesh (instanced)، GatePair، labels
    environment/          # سازنده‌ی صحنه‌ی هر world + بناها (میلاد، سی‌وسه‌پل، گنبد)
  ui/                     # DOM overlay راست‌چین: HUD، پنل نتیجه، ارقام فارسی
  services/               # Storage، Audio
  assets/                 # فونت Vazirmatn (local)
tests/                    # تست‌های Vitest
```

## دوربین
سه حالت در `GAME.camera`: `intro` (نمای سینمایی رو به بنای شاخص)، `run` (پشت سر و کمی بالا)، `battle`.
هر world می‌تونه این‌ها رو در فیلد `camera` خودش override کنه. عوض کردن زاویه = عوض کردن همین عددها.

## وضعیت
- **M1 ✅** حرکت مسیر، کنترل با drag، گیت‌ها، count، نبرد، Win/Lose، HUD.
- **سه‌بعدی ✅** انتقال رندر از Phaser به Three.js، دوربین از پشت، سه world با بنای شاخص، یک مرحله برای هر world.
- M2: مانع‌ها (ترافیک عرضی تهران)، مدل‌های Kenney، چند مرحله برای هر world · M3: منو و ذخیره‌ی پیشرفت · M4: Capacitor (Android/iOS)

## قواعد
- عدد `count` در `CrowdModel` مرجع است؛ spriteها فقط نمایشی‌اند.
- همه‌ی حرکت‌ها بر اساس `dt` (مستقل از FPS).
- متن فارسی (کلمه و جمله) فقط در DOM. داخل صحنه‌ی سه‌بعدی فقط عدد و علامت (مثل `+۱۰`) به‌صورت texture نوشته می‌شه.
- قوانین گیت: نتیجه گرد می‌شه و منفی نمی‌شه. ضرب و تقسیم حداقل ۱ نفر رو نگه می‌دارن. تفریق می‌تونه به ۰ برسه که یعنی باخت فوری.
- نبرد: هر tick هر دو طرف به یک اندازه کم می‌شن. بازیکن فقط وقتی می‌بره که تعدادش بیشتر باشه (تساوی یعنی باخت). مدت نبرد حدود ۲.۵ ثانیه‌ست، هر عددی که باشه.
- هر مرحله با تست چک می‌شه: بهترین انتخاب‌ها باید ببرن و بدترین‌ها باید ببازن.
- جایگزینی آرت = لود کردن مدل glTF در سازنده‌های `render/environment/` به جای placeholderها.
