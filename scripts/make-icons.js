/* Генерація іконок застосунку зі знака бренду (brand/logo-mark-rays.svg).
   Вивід: build/icon.png, build/icon.ico (Windows), appicon/* (Android @capacitor/assets).
   Запуск: node scripts/make-icons.js */
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const sharp = require("sharp");
const _pti = require("png-to-ico");
const pngToIco = typeof _pti === "function" ? _pti : _pti.default;

const ROOT = path.join(__dirname, "..");
const BLUE = "#15356B";
const SVG = path.join(ROOT, "brand", "logo-mark-rays.svg");

function ensure(dir) { fs.mkdirSync(path.join(ROOT, dir), { recursive: true }); }

async function run() {
  ensure("build"); ensure("appicon");

  // 1) Растеризуємо знак (прозоре тло) у великий PNG
  const resvg = new Resvg(fs.readFileSync(SVG), {
    fitTo: { mode: "width", value: 900 },
    background: "rgba(0,0,0,0)"
  });
  const logoPng = resvg.render().asPng();

  // helper: знак заданої ширини, по центру квадрата (фон bg або прозорий)
  async function compose(logoWidth, bg, size = 1024) {
    const logo = await sharp(logoPng).resize({ width: logoWidth }).png().toBuffer();
    const base = sharp({
      create: { width: size, height: size, channels: 4,
        background: bg || { r: 0, g: 0, b: 0, alpha: 0 } }
    });
    return base.composite([{ input: logo, gravity: "center" }]).png().toBuffer();
  }

  // 2) Основна іконка (синє тло + знак) — для Windows і Android legacy
  const iconColor = await compose(720, BLUE);
  fs.writeFileSync(path.join(ROOT, "build", "icon.png"), iconColor);
  fs.writeFileSync(path.join(ROOT, "appicon", "icon-only.png"), iconColor);

  // 3) Android adaptive: окремо передній план (знак, прозоре) і тло (суцільний колір)
  const fg = await compose(600, null); // менше — у «безпечній зоні» адаптивної іконки
  fs.writeFileSync(path.join(ROOT, "appicon", "icon-foreground.png"), fg);
  const bg = await sharp({ create: { width: 1024, height: 1024, channels: 4,
    background: BLUE } }).png().toBuffer();
  fs.writeFileSync(path.join(ROOT, "appicon", "icon-background.png"), bg);

  // 3b) Сплеш-екран Android (синє тло + знак), 2732×2732
  const splash = await compose(900, BLUE, 2732);
  fs.writeFileSync(path.join(ROOT, "appicon", "splash.png"), splash);
  fs.writeFileSync(path.join(ROOT, "appicon", "splash-dark.png"), splash);

  // 4) Windows .ico (кілька розмірів)
  const sizes = [256, 128, 64, 48, 32, 24, 16];
  const pngs = await Promise.all(sizes.map(s =>
    sharp(iconColor).resize(s, s).png().toBuffer()));
  fs.writeFileSync(path.join(ROOT, "build", "icon.ico"), await pngToIco(pngs));

  console.log("OK: build/icon.png, build/icon.ico, appicon/icon-only|foreground|background.png");
}
run().catch(e => { console.error(e); process.exit(1); });
