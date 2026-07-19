<script>
  // Two illustrative people side by side: high income/low wealth vs the reverse.
  // people: [{ name, income, netWorth, note }]
  let { people = [], active = true } = $props();
  const fmt = (v) => `$${Math.round(v).toLocaleString("en-US")}`;

  // Cards slide/fade in with a stagger whenever this becomes the active
  // step — replayed on re-entry, not just first mount.
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

<div class="compare">
  {#each people as p, i}
    <div class="card" class:revealed style="transition-delay: {i * 140}ms">
      <p class="name">{p.name}</p>
      <div class="metric">
        <span class="metric-value">{fmt(p.income)}<span class="unit">/yr</span></span>
        <span class="metric-label">Income — a flow</span>
      </div>
      <div class="metric">
        <span class="metric-value net">{fmt(p.netWorth)}</span>
        <span class="metric-label">Net worth — a stock</span>
      </div>
      <p class="note">{p.note}</p>
    </div>
  {/each}
</div>

<style>
  .compare {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 420px;
  }
  .card {
    background: var(--surface-1);
    border-radius: 8px;
    padding: 16px 18px;
    border: 1px solid var(--border);
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.25, 1, 0.35, 1);
  }
  .card.revealed {
    opacity: 1;
    transform: translateY(0);
  }
  .name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 10px;
  }
  .metric {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 6px 0;
    border-top: 1px solid var(--border);
  }
  .metric:first-of-type {
    border-top: none;
  }
  .metric-value {
    font-family: var(--serif);
    font-size: 19px;
    font-weight: 700;
    color: var(--series-blue);
    font-variant-numeric: tabular-nums;
  }
  .metric-value.net {
    color: var(--ink-gold);
  }
  .unit {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-muted);
  }
  .metric-label {
    font-size: 12px;
    color: var(--text-muted);
  }
  .note {
    margin-top: 8px;
    font-size: 12.5px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  @media (max-width: 860px) {
    .card {
      padding: 12px 14px;
    }
    .metric-value {
      font-size: 16px;
    }
  }
</style>
