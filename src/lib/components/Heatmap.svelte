<script>
  import { scaleQuantize } from "d3-scale";

  // Sequential single-hue ramp (share of wealth = magnitude, light → dark).
  // Dark mode uses its own ramp running the other way — low values stay
  // recessive against the dark surface instead of glowing brightest.
  const BLUE_RAMP = ["#eef3fb", "#cfe0f5", "#a3c5ea", "#6fa5db", "#3d84c9", "#1f66ac", "#134a80"];
  const BLUE_RAMP_DARK = ["#142743", "#1c3350", "#204769", "#2d6291", "#4482b7", "#63a4d6", "#96c7ec"];
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

  // rows/cols: string labels. data: [{ row, col, value }] (value in %,
  // may be negative — a group whose debts exceed its assets).
  // highlightRow / highlightCol: dim every cell outside the matching
  // row/column — this is how the SAME persistent heatmap "does something"
  // across an act's steps instead of being swapped for a new chart.
  let {
    rows = [],
    cols = [],
    data = [],
    title = "",
    unit = "%",
    rowTitle = "",
    colTitle = "",
    lowLabel = "Low",
    highLabel = "High",
    colors = prefersDark ? BLUE_RAMP_DARK : BLUE_RAMP,
    showValues = true,
    highlightRow = null,
    highlightCol = null,
  } = $props();

  const byKey = $derived(new Map(data.map((d) => [`${d.row}__${d.col}`, d.value])));
  const positiveValues = $derived(data.map((d) => d.value).filter((v) => v >= 0));
  const color = $derived(
    scaleQuantize()
      .domain([Math.min(...positiveValues), Math.max(...positiveValues)])
      .range(colors)
  );
  const isDark = (v) => {
    const idx = colors.indexOf(color(v));
    return prefersDark ? idx <= 2 : idx >= colors.length - 3;
  };
  const dimmed = (row, col) =>
    (highlightRow != null && row !== highlightRow) || (highlightCol != null && col !== highlightCol);
</script>

<figure class="heatmap">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  {#if colTitle}<div class="col-title">{colTitle} →</div>{/if}
  <div class="wrap">
    {#if rowTitle}<div class="row-title">{rowTitle} ↓</div>{/if}
    <div class="grid" style="grid-template-columns: auto repeat({cols.length}, 1fr);">
      <div class="corner"></div>
      {#each cols as col}
        <div class="col-label" class:dim={highlightCol != null && col !== highlightCol}>{col}</div>
      {/each}
      {#each rows as row}
        <div class="row-label" class:dim={highlightRow != null && row !== highlightRow}>{row}</div>
        {#each cols as col}
          {@const v = byKey.get(`${row}__${col}`)}
          {@const negative = v != null && v < 0}
          <div
            class="cell"
            class:hl={(highlightRow === row || highlightCol === col) && !dimmed(row, col)}
            class:dim={dimmed(row, col)}
            class:negative
            style="background:{v != null ? (negative ? colors[0] : color(v)) : 'var(--gridline)'}"
            title="{row} → {col}: {v}{unit}"
          >
            {#if showValues && v != null}
              <span class="cell-value" class:light={!negative && isDark(v)} class:neg-value={negative}>
                {negative ? "−" : ""}{Math.abs(v).toFixed(1)}{unit}
              </span>
            {/if}
          </div>
        {/each}
      {/each}
    </div>
  </div>
  <div class="scale-legend">
    <span class="scale-label">{lowLabel}</span>
    <span class="scale-bar">
      {#each colors as c}<span class="scale-step" style="background:{c}"></span>{/each}
    </span>
    <span class="scale-label">{highLabel}</span>
  </div>
</figure>

<style>
  .heatmap {
    margin: 0;
    width: 100%;
    max-width: 560px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .col-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-align: center;
    margin-bottom: 4px;
  }
  .wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .row-title {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .grid {
    display: grid;
    gap: 3px;
    flex: 1;
  }
  .corner {
    width: 92px;
  }
  .col-label,
  .row-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.4s ease;
  }
  .row-label {
    justify-content: flex-end;
    padding-right: 8px;
    white-space: nowrap;
  }
  .col-label.dim,
  .row-label.dim {
    opacity: 0.4;
  }
  .cell {
    aspect-ratio: 1;
    border-radius: 3px;
    min-width: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: cell-in 0.45s ease backwards;
    transition: opacity 0.4s ease, outline-color 0.3s ease;
  }
  .cell.hl {
    outline: 2.5px solid var(--series-red);
    outline-offset: -2.5px;
  }
  .cell.dim {
    opacity: 0.28;
  }
  .cell.negative {
    outline: 2px dashed var(--series-red);
    outline-offset: -2px;
  }
  .cell-value {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
  }
  .cell-value.light {
    color: rgba(255, 255, 255, 0.92);
  }
  .cell-value.neg-value {
    color: var(--series-red);
    font-weight: 700;
  }
  @media (prefers-color-scheme: dark) {
    .cell-value {
      color: #16283a;
    }
    .cell-value.light {
      color: rgba(255, 255, 255, 0.92);
    }
    .cell-value.neg-value {
      color: var(--series-red);
    }
  }
  @keyframes cell-in {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .scale-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
  }
  .scale-label {
    font-size: 10.5px;
    color: var(--text-muted);
  }
  .scale-bar {
    display: flex;
    height: 8px;
    flex: 1;
    max-width: 140px;
    border-radius: 4px;
    overflow: hidden;
  }
  .scale-step {
    flex: 1;
  }
  @media (max-width: 860px) {
    .corner {
      width: 68px;
    }
    .cell-value {
      font-size: 8.5px;
    }
    .col-label,
    .row-label {
      font-size: 9.5px;
    }
  }
</style>
