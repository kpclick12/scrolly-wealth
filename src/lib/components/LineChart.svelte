<script>
  import { scaleLinear, scalePoint } from "d3-scale";

  // series: [{ id, label, color, serie: [{ x, y }] }]
  // y = null breaks the line (e.g. a missing measurement).
  // labelAll: print the value at every point — for sparse series (few points).
  let {
    series = [],
    title = "",
    unit = "%",
    note = "",
    labelAll = false,
    valueFormatter = null,
  } = $props();

  const W = 580;
  const H = 380;
  const M = { top: 18, right: 150, bottom: 34, left: 46 };

  const fmt = (v) => (valueFormatter ? valueFormatter(v) : `${v}${unit}`);

  const xList = $derived(series[0]?.serie.map((p) => String(p.x)) ?? []);
  const x = $derived(scalePoint().domain(xList).range([M.left, W - M.right]));
  const yMax = $derived(
    Math.max(...series.flatMap((s) => s.serie.map((p) => p.y ?? 0))) * 1.08
  );
  const y = $derived(scaleLinear().domain([0, yMax]).range([H - M.bottom, M.top]));

  // Break the path at null values — a hole in the series should look like a hole.
  function pathFor(s) {
    let d = "";
    let pen = false;
    for (const p of s.serie) {
      if (p.y == null) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"} ${x(String(p.x))} ${y(p.y)} `;
      pen = true;
    }
    return d.trim();
  }

  const lastPoint = (s) => [...s.serie].reverse().find((p) => p.y != null);

  const yTicks = $derived(y.ticks(5));
  // Thin out the x labels when there are many points.
  const xLabelEvery = $derived(xList.length > 9 ? 2 : 1);
</script>

<figure class="linechart">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={title}>
    {#each yTicks as t}
      <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} class="grid" />
      <text x={M.left - 8} y={y(t)} class="tick" text-anchor="end" dominant-baseline="middle">{fmt(t)}</text>
    {/each}
    {#each xList as l, i}
      {#if i % xLabelEvery === 0}
        <text x={x(l)} y={H - M.bottom + 20} class="tick" text-anchor="middle">{l}</text>
      {/if}
    {/each}
    <line x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} class="axis" />

    {#each series as s, si}
      <path
        d={pathFor(s)}
        class="line"
        style="stroke: {s.color}; animation-delay: {si * 250}ms"
        pathLength="1"
      />
      {#each s.serie as p, pi}
        {#if p.y != null}
          <circle
            cx={x(String(p.x))}
            cy={y(p.y)}
            r={p === lastPoint(s) ? 5.5 : 4}
            fill={s.color}
            stroke="var(--surface-1)"
            stroke-width="2"
            class="pt"
            style="animation-delay: {si * 250 + pi * 120}ms"
          >
            <title>{s.label} {p.x}: {fmt(p.y)}</title>
          </circle>
          {#if labelAll && p !== lastPoint(s)}
            <text
              x={x(String(p.x))}
              y={y(p.y) - 14}
              class="pt-label"
              text-anchor="middle"
              style="fill: {s.color}; animation-delay: {si * 250 + pi * 120 + 200}ms"
            >{fmt(p.y)}</text>
          {/if}
        {/if}
      {/each}
      {@const last = lastPoint(s)}
      {#if last}
        <text
          x={x(String(last.x)) + 12}
          y={y(last.y)}
          class="end-label"
          style="animation-delay: {si * 250 + 900}ms"
          dominant-baseline="middle"
        >
          <tspan class="end-value" style="fill: {s.color}">{fmt(last.y)}</tspan>
          <tspan class="end-name" x={x(String(last.x)) + 12} dy="15">{s.label}</tspan>
        </text>
      {/if}
    {/each}
  </svg>
  {#if note}<p class="note">{note}</p>{/if}
</figure>

<style>
  .linechart {
    margin: 0;
    width: 100%;
    max-width: 580px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .grid {
    stroke: var(--gridline);
    stroke-width: 1;
  }
  .axis {
    stroke: var(--baseline);
    stroke-width: 1;
  }
  .tick {
    font-size: 11px;
    fill: var(--text-muted);
  }
  .line {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 1.1s cubic-bezier(0.5, 0, 0.3, 1) forwards;
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  .pt {
    opacity: 0;
    animation: pt-in 0.3s ease forwards;
  }
  @keyframes pt-in {
    to {
      opacity: 1;
    }
  }
  .end-label {
    opacity: 0;
    animation: pt-in 0.4s ease forwards;
  }
  .pt-label {
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    opacity: 0;
    animation: pt-in 0.4s ease forwards;
  }
  .end-value {
    font-size: 16px;
    font-weight: 700;
  }
  .end-name {
    font-size: 11.5px;
    fill: var(--text-secondary);
  }
  .note {
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }
  @media (max-width: 860px) {
    .end-value {
      font-size: 14px;
    }
  }
</style>
