<script>
  import { fly } from "svelte/transition";

  // A tower of unit blocks, adapting KlossTorn's stacking-blocks idea to
  // compounding: contribution blocks (the paycheck) stack first, return
  // blocks (the accelerator) stack on top of them. The same $200/month
  // habit produces both — the tower makes it visible that, by year 40,
  // most of the blocks are blocks nobody deposited.
  // series: compounding.json's `series` — [{ id: "saved"|"grown", serie: [{x,y}] }]
  let { series = [], active = true, unit = 22000 } = $props();

  const saved = $derived(series.find((s) => s.id === "saved")?.serie ?? []);
  const grown = $derived(series.find((s) => s.id === "grown")?.serie ?? []);
  const N = $derived(saved.length);

  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let frame = $state(0);
  $effect(() => {
    if (!active || N === 0) {
      frame = 0;
      return;
    }
    if (reduced) {
      frame = N - 1;
      return;
    }
    frame = 0;
    const id = setInterval(() => {
      frame = frame + 1 >= N - 1 ? N - 1 : frame + 1;
      if (frame >= N - 1) clearInterval(id);
    }, 460);
    return () => clearInterval(id);
  });

  const contribTotal = $derived(saved[frame]?.y ?? 0);
  const returnTotal = $derived(Math.max(0, (grown[frame]?.y ?? 0) - contribTotal));
  const contribCount = $derived(Math.round(contribTotal / unit));
  const returnCount = $derived(Math.round(returnTotal / unit));
  const yearLabel = $derived(saved[frame]?.x ?? "0");
  const fmt = (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);
</script>

<figure class="tower-fig">
  <p class="year-label">Year <strong>{yearLabel}</strong></p>
  <div class="tower-row">
    <div class="tower">
      {#each Array.from({ length: contribCount }) as _, i (i)}
        <div class="block contrib" in:fly={{ y: reduced ? 0 : 14, duration: reduced ? 0 : 260 }}></div>
      {/each}
      {#each Array.from({ length: returnCount }) as _, i (i)}
        <div
          class="block returns"
          in:fly={{ y: reduced ? 0 : 14, duration: reduced ? 0 : 260 }}
        ></div>
      {/each}
    </div>
    <div class="totals">
      <div class="total-row">
        <span class="swatch contrib"></span>
        <span class="total-value">{fmt(contribTotal)}</span>
        <span class="total-label">saved from paychecks</span>
      </div>
      <div class="total-row">
        <span class="swatch returns"></span>
        <span class="total-value accent">{fmt(returnTotal)}</span>
        <span class="total-label">from compounding returns</span>
      </div>
    </div>
  </div>
  <figcaption>
    Each block ≈ {fmt(unit)}. $200 saved every month for 40 years, 7% average
    annual return, compounded monthly. Illustrative, not investment advice.
  </figcaption>
</figure>

<style>
  .tower-fig {
    margin: 0;
    width: 100%;
    max-width: 460px;
  }
  .year-label {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0 0 10px;
  }
  .year-label strong {
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .tower-row {
    display: flex;
    align-items: flex-end;
    gap: 22px;
  }
  .tower {
    flex: 0 0 auto;
    width: 78px;
    height: 250px;
    display: flex;
    flex-direction: column-reverse;
    gap: 2px;
    padding: 2px;
    background: var(--gridline);
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .block {
    flex: 0 0 9px;
    border-radius: 2px;
  }
  .block.contrib {
    background: var(--series-blue);
  }
  .block.returns {
    background: var(--hero-gold);
  }
  .totals {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 6px;
  }
  .total-row {
    display: grid;
    grid-template-columns: 12px auto;
    column-gap: 8px;
    align-items: baseline;
  }
  .swatch {
    grid-row: 1 / span 2;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    align-self: center;
  }
  .swatch.contrib {
    background: var(--series-blue);
  }
  .swatch.returns {
    background: var(--hero-gold);
  }
  .total-value {
    font-family: var(--serif);
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .total-value.accent {
    color: var(--ink-gold);
  }
  .total-label {
    grid-column: 2;
    font-size: 11.5px;
    color: var(--text-muted);
  }
  figcaption {
    margin-top: 14px;
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }
  @media (max-width: 860px) {
    .tower {
      width: 58px;
      height: 160px;
    }
    .block {
      flex-basis: 6px;
    }
    .total-value {
      font-size: 16px;
    }
    .tower-row {
      gap: 14px;
    }
  }
</style>
