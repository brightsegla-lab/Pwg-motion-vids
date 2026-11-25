// Render handout.html to an A4 PDF and report whether the content fits on the page.
// Usage: node make_pdf.cjs handout.html out.pdf [preview.png]
const { chromium } = require("playwright");
(async () => {
  const [html, pdf, png] = process.argv.slice(2).map((p) => require("path").resolve(p));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.4 });
  await p.goto("file://" + html, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: pdf, format: "A4", printBackground: true, preferCSSPageSize: true });
  const over = await p.evaluate(() => [...document.querySelectorAll(".page")].map((pg) => {
    const limit = pg.getBoundingClientRect().bottom - 34; // bottom padding
    return Math.round(Math.max(...[...pg.children].map((c) => c.getBoundingClientRect().bottom)) - limit);
  }));
  console.log("overflow px per page (must be <= 0):", over);
  if (png) await p.screenshot({ path: png, fullPage: true });
  await b.close();
})();
