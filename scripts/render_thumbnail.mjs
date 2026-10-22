// Render every variant of an episode's thumbnail (thumbnail/thumbnail.html + thumb.config.js)
// to thumbnail/thumbnail-<slug>-<variant>.jpg (1920×1080, JPEG q90, well under YouTube's 2 MB).
// Usage: node scripts/render_thumbnail.mjs episodes/<slug>
// Env overrides: PLAYWRIGHT_CORE (module path), CHROMIUM (executable path).
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const ep = path.resolve(process.argv[2] || "");
const dir = path.join(ep, "thumbnail");
if (!fs.existsSync(path.join(dir, "thumbnail.html"))) throw new Error("no thumbnail/thumbnail.html in " + ep);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || "/opt/node-tools/node_modules/playwright-core");
const exe = process.env.CHROMIUM || "/opt/pw-browsers/chromium";

const cfg = fs.readFileSync(path.join(dir, "thumb.config.js"), "utf8");
const variants = [...cfg.matchAll(/^\s{4}(\w+):\s*\{/gm)].map((m) => m[1]);
const slug = path.basename(ep);
const browser = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
for (const v of variants) {
  await page.goto("file://" + path.join(dir, "thumbnail.html") + "?v=" + v);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const png = path.join(dir, `.tmp-${v}.png`);
  await page.screenshot({ path: png });
  const jpg = path.join(dir, `thumbnail-${slug}-${v}.jpg`);
  execFileSync("python3", ["-c", `from PIL import Image; Image.open(${JSON.stringify(png)}).convert("RGB").save(${JSON.stringify(jpg)}, quality=90, optimize=True)`]);
  fs.unlinkSync(png);
  console.log(jpg, Math.round(fs.statSync(jpg).size / 1024) + " KB");
}
await browser.close();
