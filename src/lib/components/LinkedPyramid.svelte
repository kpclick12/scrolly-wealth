<script module>
  // Largest-remainder rounding — same approach as DotWaffle.svelte — turns
  // percentage shares into whole-number counts that sum exactly to `total`.
  function distribute(shares, total) {
    const sum = shares.reduce((a, b) => a + b, 0);
    const raw = shares.map((s) => (s / sum) * total);
    const floors = raw.map(Math.floor);
    let remainder = total - floors.reduce((a, b) => a + b, 0);
    const order = floors
      .map((f, i) => ({ i, frac: raw[i] - f }))
      .sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < remainder; k++) floors[order[k].i]++;
    return floors;
  }

  // Allocates stacked-bar segment heights proportional to `shares`, clamped
  // to a minimum so a 1.2%-of-wealth band still reads as a visible sliver
  // instead of vanishing to a hairline.
  function allocateHeights(shares, total, min) {
    const sum = shares.reduce((a, b) => a + b, 0);
    const raw = shares.map((s) => (s / sum) * total);
    const clamped = raw.map((h) => Math.max(h, min));
    const clampedSum = clamped.reduce((a, b) => a + b, 0);
    const scale = total / clampedSum;
    return clamped.map((h) => h * scale);
  }

  function fmtLead(v) {
    if (v >= 10) return String(Math.round(v));
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
</script>

<script>
  // Our own take on the classic "global wealth pyramid" infographic: a
  // 100%-stacked bar of SHARE OF WEALTH (left) linked by leader lines to a
  // 100-person pictogram of SHARE OF ADULTS (right), for the same four
  // wealth bands. Both read top-to-bottom richest-to-poorest, so the same
  // band always sits at the same height in both — the bar shows a huge
  // chunk of wealth at the top held by a near-empty sliver of people on the
  // grid, and a thin sliver of wealth at the bottom shared by most of the
  // grid. `highlight` ("top" | "bottom") spotlights one linkage at a time.
  // bands: pyramid.json's `tiers` — [{ key, color, adults, wealth }],
  // poorest-first (Under $10k -> Over $1M).
  let { bands = [], highlight = "top", caption = "" } = $props();

  const W = 500;
  const H = 332;
  const PAD_TOP = 26;
  const PLOT_H = 280;
  const BAR_X = 26;
  const BAR_W = 56;
  const GRID_X = 200;
  const GRID_COLS = 10;
  const CELL = 28;
  const MIN_BAR = 12;

  // Richest-first — the order both visuals render top to bottom.
  const ordered = $derived([...bands].slice().reverse());

  const barHeights = $derived(allocateHeights(ordered.map((b) => b.wealth), PLOT_H, MIN_BAR));
  const barTops = $derived.by(() => {
    let acc = PAD_TOP;
    const out = [];
    for (const h of barHeights) {
      out.push(acc);
      acc += h;
    }
    return out;
  });

  const counts = $derived(distribute(ordered.map((b) => b.adults), 100));
  const dotStarts = $derived.by(() => {
    let acc = 0;
    const out = [];
    for (const c of counts) {
      out.push(acc);
      acc += c;
    }
    return out;
  });

  const dots = $derived.by(() => {
    const out = [];
    for (let b = 0; b < ordered.length; b++) {
      for (let i = 0; i < counts[b]; i++) {
        const idx = dotStarts[b] + i;
        const row = Math.floor(idx / GRID_COLS);
        const col = idx % GRID_COLS;
        out.push({
          key: `${b}-${i}`,
          band: b,
          x: GRID_X + col * CELL,
          y: PAD_TOP + row * CELL,
          fill: ordered[b].color,
        });
      }
    }
    return out;
  });

  // One row-band per wealth tier: bar segment geometry + the vertical span
  // of that tier's dot cluster on the grid, so a leader line can connect
  // the two at their true centers.
  const rows = $derived(
    ordered.map((b, i) => {
      const barTop = barTops[i];
      const barH = barHeights[i];
      const barMid = barTop + barH / 2;
      const dotStart = dotStarts[i];
      const dotEnd = dotStart + Math.max(counts[i], 1) - 1;
      const rowFirst = Math.floor(dotStart / GRID_COLS);
      const rowLast = Math.floor(dotEnd / GRID_COLS);
      const clusterMid = PAD_TOP + ((rowFirst + rowLast) / 2 + 0.5) * CELL;
      return {
        ...b,
        i,
        barTop,
        barH,
        barMid,
        clusterMid,
      };
    })
  );

  const highlightIndex = $derived(highlight === "bottom" ? ordered.length - 1 : 0);
  const activeRow = $derived(rows[highlightIndex]);

  const topBand = $derived(ordered[0]);
  const bottomBand = $derived(ordered[ordered.length - 1]);

  const connectorPath = $derived.by(() => {
    if (!activeRow) return "";
    const x1 = BAR_X + BAR_W;
    const y1 = activeRow.barMid;
    const x2 = GRID_X;
    const y2 = activeRow.clusterMid;
    const midX = (x1 + x2) / 2;
    return `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
  });

  const ariaLabel = $derived(
    caption ||
      `Linked wealth pyramid. ${ordered
        .map((b) => `${b.key}: ${b.adults}% of adults, ${b.wealth}% of wealth`)
        .join(". ")}.`
  );
</script>

<figure class="linked-pyramid">
  <div class="lp-heads">
    <p class="lp-head">Share of wealth</p>
    <p class="lp-head lp-head-right">Share of adults</p>
  </div>

  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaLabel}>
    <defs>
      <symbol id="lp-person" viewBox="0 0 10 14">
        <circle cx="5" cy="3" r="3" />
        <path d="M0,14 C0,8.2 1,6 5,6 C9,6 10,8.2 10,14 Z" />
      </symbol>
    </defs>

    <!-- Stacked bar: share of wealth -->
    {#each rows as r (r.key)}
      <rect
        x={BAR_X}
        y={r.barTop}
        width={BAR_W}
        height={Math.max(r.barH - 2, 0)}
        rx="2"
        fill={r.color}
        class="lp-bar-seg"
        class:dim={r.i !== highlightIndex}
      />
    {/each}

    <!-- Leader line linking the highlighted band's bar segment to its dot cluster -->
    <path d={connectorPath} class="lp-connector" fill="none" />
    {#if activeRow}
      <circle cx={BAR_X + BAR_W} cy={activeRow.barMid} r="3.5" class="lp-connector-dot" />
      <circle cx={GRID_X} cy={activeRow.clusterMid} r="3.5" class="lp-connector-dot" />
    {/if}

    <!-- 100-person pictogram: share of adults -->
    {#each dots as d (d.key)}
      <use
        href="#lp-person"
        x={d.x + CELL * 0.22}
        y={d.y + CELL * 0.18}
        width={CELL * 0.56}
        height={CELL * 0.72}
        fill={d.fill}
        class="lp-dot"
        class:dim={d.band !== highlightIndex}
      />
    {/each}
  </svg>

  <div class="lp-callouts">
    <div class="lp-callout" class:is-active={highlight === "top"}>
      <span class="lp-callout-dot" style="background:{topBand.color}"></span>
      <p class="lp-callout-fact">
        ~{fmtLead(topBand.adults)}% of adults hold ~{fmtLead(topBand.wealth)}% of all wealth
      </p>
      <p class="lp-callout-sub">Everyone worth over {topBand.key.replace("Over ", "")}</p>
    </div>
    <div class="lp-callout" class:is-active={highlight === "bottom"}>
      <span class="lp-callout-dot" style="background:{bottomBand.color}"></span>
      <p class="lp-callout-fact">
        ~{fmtLead(bottomBand.adults)}% of adults share ~{fmtLead(bottomBand.wealth)}%
      </p>
      <p class="lp-callout-sub">Everyone worth {bottomBand.key.toLowerCase()}</p>
    </div>
  </div>

  <ul class="lp-legend">
    {#each ordered as b (b.key)}
      <li class:is-active={b.i === highlightIndex}>
        <span class="swatch" style="background:{b.color}"></span>
        <span class="legend-key">{b.key}</span>
        <span class="legend-nums">{b.adults}% of adults · {b.wealth}% of wealth</span>
      </li>
    {/each}
  </ul>

  {#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
  .linked-pyramid {
    margin: 0;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
  }
  .lp-heads {
    order: 0;
    display: flex;
    justify-content: space-between;
    margin: 0 0 4px;
  }
  .linked-pyramid > svg {
    order: 1;
  }
  .lp-callouts {
    order: 2;
  }
  .lp-legend {
    order: 3;
  }
  .linked-pyramid > figcaption {
    order: 4;
  }
  .lp-head {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--text-muted);
    margin: 0;
  }
  .lp-head-right {
    text-align: right;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    max-height: 260px;
  }
  .lp-bar-seg {
    transition: opacity 0.4s ease;
  }
  .lp-bar-seg.dim {
    /* Diverging fills wash toward the surface as opacity drops — 0.32 (the
       old value, tuned for a one-hue ramp) let adjacent dimmed bands
       collapse into each other. 0.48 keeps the two color families visibly
       distinct while still reading as de-emphasized next to the
       full-opacity highlighted band. */
    opacity: 0.48;
  }
  .lp-dot {
    transition: opacity 0.4s ease;
  }
  .lp-dot.dim {
    opacity: 0.48;
  }
  .lp-connector {
    stroke: var(--hero-gold);
    stroke-width: 2;
    stroke-dasharray: 1 5;
    stroke-linecap: round;
    transition: d 0.5s ease;
  }
  .lp-connector-dot {
    fill: var(--hero-gold);
    stroke: var(--surface-1);
    stroke-width: 1.5;
  }

  .lp-callouts {
    display: flex;
    gap: 12px;
    margin-top: 14px;
  }
  .lp-callout {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    opacity: 0.55;
    transition: opacity 0.35s ease, border-color 0.35s ease, transform 0.35s ease;
  }
  .lp-callout.is-active {
    opacity: 1;
    border-color: var(--hero-gold);
    transform: translateY(-1px);
  }
  .lp-callout-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;
    margin-bottom: 2px;
  }
  .lp-callout-fact {
    margin: 0;
    font-family: var(--serif);
    font-weight: 700;
    font-size: 15px;
    line-height: 1.3;
    color: var(--text-primary);
  }
  .lp-callout-sub {
    margin: 0;
    font-size: 11.5px;
    color: var(--text-muted);
  }

  .lp-legend {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lp-legend li {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 11.5px;
    color: var(--text-secondary);
    transition: opacity 0.35s ease;
  }
  .swatch {
    flex: 0 0 auto;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .legend-key {
    flex: 0 0 auto;
    font-weight: 700;
    color: var(--text-primary);
    min-width: 92px;
  }
  .legend-nums {
    color: var(--text-muted);
  }
  figcaption {
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-muted);
  }

  @media (max-width: 860px) {
    /* The two callout facts are the point of this chart — on the narrow
       mobile sticky panel, where an incoming step card can slide up over
       the bottom of the visual, they move to the top of the stack so
       they're never the part that gets covered. The diagram that explains
       them follows underneath. */
    .lp-callouts {
      order: -1;
    }
    .lp-heads {
      order: 1;
      margin-top: 8px;
      margin-bottom: 2px;
    }
    .linked-pyramid > svg {
      order: 2;
    }
    .lp-legend {
      order: 3;
    }
    .linked-pyramid > figcaption {
      order: 4;
    }
    .lp-head {
      font-size: 10px;
    }
    svg {
      max-height: 158px;
    }
    .lp-callouts {
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }
    .lp-callout {
      padding: 7px 10px;
    }
    .lp-callout-dot {
      margin-bottom: 1px;
    }
    .lp-callout-fact {
      font-size: 13px;
      line-height: 1.25;
    }
    .lp-callout-sub {
      font-size: 11px;
    }
    .lp-legend {
      margin-top: 10px;
      gap: 2px;
    }
    .legend-key {
      min-width: 78px;
    }
    .lp-legend li {
      font-size: 10.5px;
    }
    figcaption {
      margin-top: 8px;
      font-size: 10.5px;
    }
  }
</style>
