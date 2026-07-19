<script module>
  // Largest-remainder rounding: turns a list of percentage shares into
  // whole-number counts that sum exactly to `total`, instead of rounding
  // each one independently and drifting off by one or two dots.
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

  // Allocates vertical strip heights proportional to `shares`, but clamps
  // every strip to at least `min` px and rescales the rest to still sum to
  // `total` — otherwise a 1.2%-of-wealth band would compute to a couple of
  // px and vanish entirely instead of reading as a felt, visible sliver.
  function allocateHeights(shares, total, min) {
    const sum = shares.reduce((a, b) => a + b, 0);
    const raw = shares.map((s) => (s / sum) * total);
    const clamped = raw.map((h) => Math.max(h, min));
    const clampedSum = clamped.reduce((a, b) => a + b, 0);
    const scale = total / clampedSum;
    return clamped.map((h) => h * scale);
  }
</script>

<script>
  // Every dot is a fixed, stable share of the world's adults, colored by
  // wealth band. Across the two modes the SAME dots re-group: in "adults"
  // mode each band's strip height is proportional to its share of people;
  // in "wealth" mode the identical dots re-pack into a strip proportional
  // to that band's share of wealth instead — so a huge population squeezed
  // into a thin sliver is something you can actually see, not just read.
  // bands: [{ key, color, light?, adults, wealth }]
  let { bands = [], mode = "adults", active = true, totalDots = 1000, caption = "" } = $props();

  const W = 420;
  const H = 360;
  const COLS = 40;
  const MIN_STRIP = 26;

  const counts = $derived(distribute(bands.map((b) => b.adults), totalDots));
  const heights = $derived(
    allocateHeights(bands.map((b) => (mode === "wealth" ? b.wealth : b.adults)), H, MIN_STRIP)
  );
  const tops = $derived.by(() => {
    let acc = 0;
    const out = [];
    for (const h of heights) {
      out.push(acc);
      acc += h;
    }
    return out;
  });

  // Flat list of every dot with a stable band+index key, positioned for
  // the current mode. Changing `mode` only changes cx/cy/r for each dot —
  // it never adds, removes, or re-keys a dot, so the browser can animate
  // the transition smoothly instead of a hard cut.
  const dots = $derived.by(() => {
    const cellW = W / COLS;
    const out = [];
    let flat = 0;
    for (let b = 0; b < bands.length; b++) {
      const count = counts[b];
      const rows = Math.max(1, Math.ceil(count / COLS));
      const cellH = heights[b] / rows;
      const r = Math.min(6.4, Math.max(0.85, 0.42 * Math.min(cellW, cellH)));
      for (let i = 0; i < count; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        out.push({
          key: `${b}-${i}`,
          band: b,
          cx: col * cellW + cellW / 2,
          cy: tops[b] + row * cellH + cellH / 2,
          r,
          fill: bands[b].color,
          delay: flat * 0.6,
        });
        flat++;
      }
    }
    return out;
  });

  let revealed = $state(false);
  $effect(() => {
    if (active) {
      revealed = false;
      let raf1 = requestAnimationFrame(() => {
        raf1 = requestAnimationFrame(() => (revealed = true));
      });
      return () => cancelAnimationFrame(raf1);
    }
    revealed = false;
  });
</script>

<figure class="dotwaffle">
  <p class="mode-label">
    Sized here by: <strong>{mode === "wealth" ? "share of wealth" : "share of adults"}</strong>
  </p>
  <svg
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label={caption}
    class:revealed
  >
    {#each dots as d (d.key)}
      <circle
        cx={d.cx}
        cy={d.cy}
        r={revealed ? d.r : 0}
        fill={d.fill}
        class="dot"
        style="transition-delay: {d.delay}ms"
      />
    {/each}
  </svg>
  <div class="legend">
    {#each bands as b, i}
      <span class="legend-item">
        <span class="swatch" style="background:{b.color}"></span>
        <span class="legend-text">
          {b.key} —
          <span class:emph={mode === "adults"}>{b.adults}% of adults</span>
          ·
          <span class:emph={mode === "wealth"}>{b.wealth}% of wealth</span>
        </span>
      </span>
    {/each}
  </div>
  {#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
  .dotwaffle {
    margin: 0;
    width: 100%;
    max-width: 480px;
  }
  .mode-label {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0 0 6px;
  }
  .mode-label strong {
    color: var(--text-primary);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    max-height: 220px;
  }
  .dot {
    transition: cx 0.7s cubic-bezier(0.25, 1, 0.35, 1), cy 0.7s cubic-bezier(0.25, 1, 0.35, 1),
      r 0.7s cubic-bezier(0.25, 1, 0.35, 1);
  }
  .legend {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 12px;
  }
  .legend-item {
    display: inline-flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
  }
  .legend-text .emph {
    color: var(--text-primary);
    font-weight: 700;
  }
  .swatch {
    flex: 0 0 auto;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    margin-top: 3px;
  }
  figcaption {
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-muted);
  }
  @media (max-width: 860px) {
    svg {
      max-height: 150px;
    }
    .legend {
      gap: 3px;
    }
    .legend-item {
      font-size: 10.5px;
    }
  }
</style>
