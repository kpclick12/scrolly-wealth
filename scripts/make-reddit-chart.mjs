#!/usr/bin/env node
/**
 * Generates public/reddit-birth-lottery.png — a standalone data-visualization
 * PNG for a Reddit r/dataisbeautiful [OC] post.
 *
 * Finding: of the ten countries where the most of the world's babies are
 * born, exactly one (the United States) appears anywhere in the top 30
 * countries ranked by median wealth per adult.
 *
 * Data sources (no numbers here are invented — see the two JSON files):
 *   - src/data/wheel.json                births 2024, UN WPP 2024 revision
 *   - src/data/gwr2026Wealth.json         median wealth 2025, UBS GWR 2026
 *
 * Usage:
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/node22/lib/node_modules \
 *     node scripts/make-reddit-chart.mjs
 *
 * Renders an HTML/SVG page (self-hosted Playfair Display, base64-inlined so
 * the render has no network dependency) and screenshots it with Playwright
 * Chromium at exactly 2000x1500px.
 */

import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const OUT_PNG = path.join(ROOT, "public", "reddit-birth-lottery.png");
const TMP_HTML = path.join(ROOT, "scripts", ".reddit-chart.tmp.html");

const WIDTH = 2000;
const HEIGHT = 1500;

// ---------------------------------------------------------------------------
// Data — read from the repo's own JSON, not retyped, so this script can't
// drift from the corrected wheel.json / the new gwr2026Wealth.json.
// ---------------------------------------------------------------------------

const wheel = JSON.parse(readFileSync(path.join(ROOT, "src/data/wheel.json"), "utf8"));
const gwr = JSON.parse(readFileSync(path.join(ROOT, "src/data/gwr2026Wealth.json"), "utf8"));

// Top 10 birth countries in 2024, ranked by raw birth count (per the UN WPP
// 2024 revision figures verified in the task brief). wheel.json's own entry
// order isn't guaranteed to match this rank (drc/indonesia tie at 3.4%), so
// the rank order is pinned explicitly here and the *values* (birthShare) are
// pulled live from wheel.json.
const BIRTH_RANK_IDS = [
  "india",
  "china",
  "nigeria",
  "pakistan",
  "indonesia",
  "drc",
  "ethiopia",
  "us",
  "bangladesh",
  "brazil",
];

const wheelById = Object.fromEntries(wheel.entries.map((e) => [e.id, e]));
const births = BIRTH_RANK_IDS.map((id, i) => {
  const e = wheelById[id];
  if (!e) throw new Error(`missing wheel.json entry for ${id}`);
  return { rank: i + 1, id, name: e.name, birthShare: e.birthShare };
});
const maxBirthShare = Math.max(...births.map((b) => b.birthShare));

const wealth = gwr.medianWealthTop30.map((r) => ({
  rank: r.rank,
  country: r.country,
  medianWealthUsd: r.medianWealthUsd,
}));
const maxMedian = Math.max(...wealth.map((w) => w.medianWealthUsd));

// Sanity: confirm the claim the image makes is exactly true before we render
// a single pixel of it.
const birthNames = new Set(births.map((b) => b.name));
const wealthNames = new Set(wealth.map((w) => w.country));
const overlap = [...birthNames].filter((n) => wealthNames.has(n));
if (overlap.length !== 1 || overlap[0] !== "United States") {
  throw new Error(
    `Claim check FAILED — expected exactly ["United States"], got ${JSON.stringify(overlap)}`
  );
}
console.log("Claim check passed: overlap between the two lists is exactly", overlap);

const usBirth = births.find((b) => b.id === "us");
const usWealth = wealth.find((w) => w.country === "United States");
console.log(
  `US: birth rank ${usBirth.rank}/10 (${usBirth.birthShare}% of world births), ` +
    `wealth rank ${usWealth.rank}/30 ($${usWealth.medianWealthUsd.toLocaleString("en-US")} median)`
);

// ---------------------------------------------------------------------------
// Fonts — self-hosted, inlined as base64 so the headless render has zero
// network dependency (egress is blocked anyway).
// ---------------------------------------------------------------------------
const fontRegular = readFileSync(
  path.join(ROOT, "public/fonts/playfair-display-latin.woff2")
).toString("base64");

// ---------------------------------------------------------------------------
// Palette — tokens lifted verbatim from src/app.css (paper/ink/brass
// identity). Accent = --ink-gold (US highlight); de-emphasis = --text-secondary
// (the "gray" half of the dataviz skill's emphasis form: 1 hue + gray).
// See the validator run in the task report for why this pairing was chosen
// over --hero-gold / --text-muted alternatives.
// ---------------------------------------------------------------------------
const COLOR = {
  surface1: "#fdfbf5",
  pagePlane: "#f6f0e3",
  textPrimary: "#201a12",
  textSecondary: "#4a4032",
  textMuted: "#8a7f68",
  gridline: "#e6ddc7",
  baseline: "#c9bd9d",
  border: "rgba(32, 26, 18, 0.12)",
  heroGold: "#d9a94a",
  inkGold: "#8a5a12",
};

const fmtUsd = (n) => "$" + n.toLocaleString("en-US");
const fmtUsdK = (n) => "$" + Math.round(n / 1000) + "k";
const fmtPct = (n) => n.toFixed(1) + "%";

// ---------------------------------------------------------------------------
// Row markup
// ---------------------------------------------------------------------------

const birthRowsHtml = births
  .map((b) => {
    const isUs = b.id === "us";
    const widthPct = (b.birthShare / maxBirthShare) * 100;
    return `
    <div class="bar-row${isUs ? " is-us" : ""}" data-id="${b.id}">
      <div class="bar-label-row">
        <span class="bar-rank">${b.rank}</span>
        <span class="bar-name">${b.name}</span>
        <span class="bar-pct">${fmtPct(b.birthShare)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${widthPct.toFixed(2)}%"></div></div>
    </div>`;
  })
  .join("\n");

const wealthRowsHtml = wealth
  .map((w) => {
    const isUs = w.country === "United States";
    const widthPct = (w.medianWealthUsd / maxMedian) * 100;
    return `
    <div class="wealth-row${isUs ? " is-us" : ""}" data-country="${w.country}">
      <span class="w-rank">${w.rank}</span>
      <span class="w-country">${w.country}</span>
      <div class="w-track"><div class="w-fill" style="width:${widthPct.toFixed(2)}%"></div></div>
      <span class="w-amt">${isUs ? fmtUsd(w.medianWealthUsd) : fmtUsdK(w.medianWealthUsd)}</span>
    </div>`;
  })
  .join("\n");

const TITLE =
  "More than half the world&rsquo;s babies are born in these ten countries. Only one of them ranks among the world&rsquo;s 30 richest by median wealth.";
const SUBTITLE =
  "Median wealth is what the typical adult actually owns &mdash; not the average, which a handful of billionaires drag upward. Births: 2024. Wealth: 2025.";
const SOURCE_LINE =
  "Sources: UN World Population Prospects 2024 revision (2024 births, share of 132,405,927 world total) · UBS Global Wealth Report 2026 (median wealth per adult, 2025, USD at market exchange rates)";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>reddit-birth-lottery</title>
<style>
  @font-face {
    font-family: "Playfair Display";
    font-style: normal;
    font-weight: 400 900;
    src: url("data:font/woff2;base64,${fontRegular}") format("woff2");
  }

  :root {
    --surface-1: ${COLOR.surface1};
    --page-plane: ${COLOR.pagePlane};
    --text-primary: ${COLOR.textPrimary};
    --text-secondary: ${COLOR.textSecondary};
    --text-muted: ${COLOR.textMuted};
    --gridline: ${COLOR.gridline};
    --baseline: ${COLOR.baseline};
    --border: ${COLOR.border};
    --hero-gold: ${COLOR.heroGold};
    --ink-gold: ${COLOR.inkGold};
    --serif: "Playfair Display", Georgia, "Times New Roman", serif;
    --sans: "Helvetica Neue", Arial, "Segoe UI", sans-serif;
  }

  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    width: ${WIDTH}px; height: ${HEIGHT}px;
    overflow: hidden;
    background: var(--page-plane);
    font-family: var(--sans);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  .page {
    width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    padding: 48px 64px 36px;
  }

  header.hd {
    flex: 0 0 auto;
    margin-bottom: 22px;
  }
  h1.title {
    font-family: var(--serif);
    font-weight: 800;
    font-size: 52px;
    line-height: 1.16;
    margin: 0 0 14px;
    color: var(--text-primary);
    max-width: 1820px;
  }
  p.subtitle {
    font-size: 23px;
    line-height: 1.45;
    margin: 0;
    color: var(--text-secondary);
    max-width: 1780px;
  }

  .columns {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: stretch;
  }
  .col {
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 26px 30px 22px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .col-left { width: 700px; flex: 0 0 700px; }
  .gutter { width: 130px; flex: 0 0 130px; }
  .col-right { flex: 1 1 auto; }

  h2.col-title {
    font-size: 25px;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--text-primary);
    line-height: 1.25;
  }
  p.col-note {
    font-size: 16px;
    margin: 0 0 14px;
    color: var(--text-muted);
  }

  /* ---------------- Left column: birth-share bars ---------------- */
  .bars {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .bar-row { }
  .bar-label-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 6px;
  }
  .bar-rank {
    font-size: 15px;
    color: var(--text-muted);
    font-weight: 700;
    width: 20px;
    flex: 0 0 auto;
  }
  .bar-name {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    flex: 1 1 auto;
  }
  .bar-pct {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    flex: 0 0 auto;
  }
  .bar-track {
    height: 22px;
    background: var(--page-plane);
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: var(--text-secondary);
    border-radius: 4px;
  }
  .bar-row.is-us .bar-name,
  .bar-row.is-us .bar-pct {
    font-size: 34px;
    color: var(--ink-gold);
  }
  .bar-row.is-us .bar-rank { color: var(--ink-gold); }
  .bar-row.is-us .bar-fill { background: var(--ink-gold); }
  .bar-row.is-us .bar-track { height: 26px; }

  .col-footnote {
    margin-top: 16px;
    font-size: 16px;
    line-height: 1.4;
    color: var(--text-muted);
    font-style: italic;
  }

  /* ---------------- Right column: wealth ranked list ---------------- */
  .wealth-list {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .wealth-row {
    display: grid;
    grid-template-columns: 34px 168px 1fr 84px;
    align-items: center;
    gap: 12px;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .w-rank {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .w-country {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .w-track {
    height: 9px;
    background: var(--page-plane);
    border-radius: 3px;
    overflow: hidden;
  }
  .w-fill {
    height: 100%;
    background: var(--text-secondary);
    border-radius: 3px;
    opacity: 0.55;
  }
  .w-amt {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .wealth-row.is-us {
    background: rgba(217, 169, 74, 0.16);
  }
  .wealth-row.is-us .w-rank,
  .wealth-row.is-us .w-country,
  .wealth-row.is-us .w-amt {
    font-size: 25px;
    color: var(--ink-gold);
    font-weight: 800;
  }
  .wealth-row.is-us .w-track { height: 15px; }
  .wealth-row.is-us .w-fill { background: var(--ink-gold); opacity: 1; }

  svg.connector-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }

  .callout-label {
    font-size: 16px;
    font-weight: 700;
    font-style: italic;
    fill: var(--ink-gold);
    font-family: var(--sans);
  }

  footer.src {
    flex: 0 0 auto;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--gridline);
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.4;
  }
</style>
</head>
<body>
  <div class="page">
    <header class="hd">
      <h1 class="title">${TITLE}</h1>
      <p class="subtitle">${SUBTITLE}</p>
    </header>

    <div class="columns" id="columns">
      <section class="col col-left">
        <h2 class="col-title">Where the world&rsquo;s babies are born</h2>
        <p class="col-note">Share of 132,405,927 births worldwide, 2024</p>
        <div class="bars" id="bars">
          ${birthRowsHtml}
        </div>
        <p class="col-footnote">The other nine of these ten countries appear nowhere on the 30-country median-wealth list at right.</p>
      </section>

      <div class="gutter"></div>

      <section class="col col-right">
        <h2 class="col-title">Where the world&rsquo;s highest median wealth is</h2>
        <p class="col-note">Median wealth per adult, 2025, USD &mdash; top 30 markets</p>
        <div class="wealth-list" id="wealthList">
          ${wealthRowsHtml}
        </div>
      </section>

      <svg class="connector-overlay" id="overlay"></svg>
    </div>

    <footer class="src">${SOURCE_LINE}</footer>
  </div>

<script>
function draw() {
  const columns = document.getElementById('columns');
  const overlay = document.getElementById('overlay');
  const colRect = columns.getBoundingClientRect();

  const svgNS = 'http://www.w3.org/2000/svg';
  const frag = document.createDocumentFragment();

  // --- dead-end stubs for the nine non-US birth bars ---
  document.querySelectorAll('.bar-row:not(.is-us) .bar-track').forEach((track) => {
    const r = track.getBoundingClientRect();
    const x0 = r.right - colRect.left;
    const y = r.top + r.height / 2 - colRect.top;
    const x1 = x0 + 46;
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x0);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x1);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '${COLOR.textMuted}');
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('stroke-dasharray', '2 5');
    line.setAttribute('stroke-linecap', 'round');
    frag.appendChild(line);
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', x1);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', 5);
    dot.setAttribute('fill', '${COLOR.pagePlane}');
    dot.setAttribute('stroke', '${COLOR.textMuted}');
    dot.setAttribute('stroke-width', '2');
    frag.appendChild(dot);
  });

  // --- the one real connector: US birth bar -> US wealth row ---
  const usBarTrack = document.querySelector('.bar-row.is-us .bar-track');
  const usWealthRow = document.querySelector('.wealth-row.is-us');
  if (usBarTrack && usWealthRow) {
    const a = usBarTrack.getBoundingClientRect();
    const b = usWealthRow.getBoundingClientRect();
    const x0 = a.right - colRect.left;
    const y0 = a.top + a.height / 2 - colRect.top;
    const x1 = b.left - colRect.left;
    const y1 = b.top + b.height / 2 - colRect.top;
    const dx = (x1 - x0) * 0.5;

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute(
      'd',
      \`M \${x0} \${y0} C \${x0 + dx} \${y0}, \${x1 - dx} \${y1}, \${x1} \${y1}\`
    );
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '${COLOR.inkGold}');
    path.setAttribute('stroke-width', '5');
    path.setAttribute('stroke-linecap', 'round');
    frag.appendChild(path);

    [[x0, y0], [x1, y1]].forEach(([cx, cy]) => {
      const ring = document.createElementNS(svgNS, 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', 9);
      ring.setAttribute('fill', '${COLOR.inkGold}');
      ring.setAttribute('stroke', '${COLOR.pagePlane}');
      ring.setAttribute('stroke-width', '3');
      frag.appendChild(ring);
    });

    // Callout label — sits in the clear gutter space right at the top of the
    // connector's curve (before it dips down), so it never crosses the
    // stroke or collides with either column's row text.
    const labelX = x0 + (x1 - x0) * 0.22;
    const labelY = y0 - 18;
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', labelX);
    label.setAttribute('y', labelY);
    label.setAttribute('text-anchor', 'start');
    label.setAttribute('class', 'callout-label');
    label.textContent = 'the one match →';
    frag.appendChild(label);
  }

  overlay.appendChild(frag);
  window.__connectorsDrawn = true;
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(draw)));
} else {
  window.addEventListener('load', draw);
}
</script>
</body>
</html>`;

writeFileSync(TMP_HTML, html, "utf8");
console.log("Wrote", TMP_HTML);

// ---------------------------------------------------------------------------
// Screenshot with Playwright Chromium.
// ---------------------------------------------------------------------------
const PLAYWRIGHT_ENTRY =
  process.env.PLAYWRIGHT_MODULE_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
const { chromium } = await import(PLAYWRIGHT_ENTRY);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.goto("file://" + TMP_HTML);
  await page.waitForFunction(() => window.__connectorsDrawn === true, null, { timeout: 10000 });
  // Small settle delay for font shaping / paint.
  await page.waitForTimeout(150);

  mkdirSync(path.dirname(OUT_PNG), { recursive: true });
  await page.screenshot({ path: OUT_PNG, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  console.log("Wrote", OUT_PNG);
} finally {
  await browser.close();
  // The intermediate HTML is a build artifact, not a source file — clean it
  // up so re-running the script never leaves a stray file for git to see.
  try {
    unlinkSync(TMP_HTML);
  } catch {}
}
