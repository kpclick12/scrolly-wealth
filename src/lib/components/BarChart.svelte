<script>
  import { scaleLinear } from "d3-scale";

  // data: [{ label, value, color? }]
  // active: replay the grow-in animation on (re-)entry — the chart can now
  // stay mounted across several steps of an act instead of remounting.
  // highlight: optional array of labels to keep at full opacity while the
  // rest dim — lets one persistent bar chart "do something" per step
  // (e.g. spotlight the richest countries, then spotlight the poorest)
  // without ever swapping the component out.
  let {
    data = [],
    color = "var(--series-blue)",
    unit = "%",
    title = "",
    maxValue = null,
    valueFormatter = null,
    active = true,
    highlight = null,
  } = $props();

  const domainMax = $derived(
    maxValue ?? Math.max(...data.map((d) => d.value)) * 1.15
  );
  const x = $derived(scaleLinear().domain([0, domainMax]).range([0, 100]));

  const fmt = (v, i) => (valueFormatter ? valueFormatter(v, i) : `${v.toFixed(1)}${unit}`);

  const highlightSet = $derived(highlight ? new Set(highlight) : null);
  const isDimmed = (label) => highlightSet != null && !highlightSet.has(label);

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

<figure class="barchart">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <div class="rows">
    {#each data as d, i (d.label)}
      <div class="row" class:dim={isDimmed(d.label)}>
        <span class="label">{d.label}</span>
        <div class="bar-line">
          <div class="track">
            <div
              class="bar"
              style="width:{revealed ? x(d.value) : 0}%; background:{d.color ??
                color}; transition-delay: {i * 45}ms;"
            ></div>
          </div>
          <span class="value" class:revealed style="transition-delay: {i * 45 + 250}ms">
            {fmt(d.value, i)}
          </span>
        </div>
      </div>
    {/each}
  </div>
</figure>

<style>
  .barchart {
    margin: 0;
    width: 100%;
    max-width: 520px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 14px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }
  .row {
    transition: opacity 0.4s ease, filter 0.4s ease;
  }
  .row.dim {
    opacity: 0.32;
    filter: saturate(0.6);
  }
  .label {
    display: block;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 4px;
    line-height: 1.3;
  }
  .bar-line {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .track {
    flex: 1;
    height: 13px;
    background: var(--gridline);
    border-radius: 4px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.6s cubic-bezier(0.25, 1, 0.35, 1);
  }
  .value {
    flex: 0 0 64px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    text-align: right;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .value.revealed {
    opacity: 1;
  }
  @media (max-width: 860px) {
    .title {
      font-size: 13px;
      margin-bottom: 10px;
    }
    .rows {
      gap: 7px;
    }
    .label {
      font-size: 12px;
      margin-bottom: 2px;
    }
    .track {
      height: 10px;
    }
    .value {
      font-size: 12px;
      flex-basis: 56px;
    }
  }
</style>
