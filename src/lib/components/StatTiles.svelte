<script>
  // A row of stat tiles for a single headline number each — not a chart,
  // per the dataviz method: when the job is "one number," a stat tile beats
  // a bar with one segment.
  // tiles: [{ value, label, accent? }]
  let { tiles = [] } = $props();
</script>

<div class="stattiles">
  {#each tiles as t}
    <div class="tile" class:accent={t.accent}>
      <span class="value">{t.value}</span>
      <span class="label">{t.label}</span>
    </div>
  {/each}
</div>

<style>
  .stattiles {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 420px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 18px;
    background: var(--surface-1);
    border-left: 4px solid var(--series-blue);
    border-radius: 6px;
  }
  .tile.accent {
    border-left-color: var(--hero-gold);
  }
  .value {
    font-family: var(--serif);
    font-size: clamp(26px, 3.6vw, 34px);
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .label {
    font-size: 13px;
    color: var(--text-muted);
  }
</style>
