<script>
  // Three columns: assets, minus debts, equals net worth.
  // Built as a single CSS grid so all three bar tracks share one baseline
  // (row 1), and the value row (row 2) and label row (row 3) are shared
  // rows too — a column with a longer wrapped label can never push its
  // own bar or value out of line with the other two, because the row
  // heights are set by the tallest cell across ALL columns, not per-column.
  let { assets, debts, netWorth, active = true } = $props();

  const max = $derived(Math.max(assets, debts, netWorth) * 1.1);
  const fmt = (v) => `$${Math.round(v).toLocaleString("en-US")}`;

  // Replay the grow-in animation every time this becomes the active step,
  // not just on first mount — the visual now stays mounted across the
  // whole act, so "revealed" must be able to reset and fire again.
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

<figure class="networth">
  <div class="grid">
    <div class="bar-wrap col-a">
      <div class="bar assets" style="height:{revealed ? (assets / max) * 100 : 0}%"></div>
    </div>
    <span class="op op-minus">&minus;</span>
    <div class="bar-wrap col-b">
      <div class="bar debts" style="height:{revealed ? (debts / max) * 100 : 0}%"></div>
    </div>
    <span class="op op-equals">=</span>
    <div class="bar-wrap col-c result">
      <div class="bar net" style="height:{revealed ? (netWorth / max) * 100 : 0}%"></div>
    </div>

    <span class="val col-a">{fmt(assets)}</span>
    <span class="val col-b">{fmt(debts)}</span>
    <span class="val col-c result">{fmt(netWorth)}</span>

    <span class="cap col-a">What you own</span>
    <span class="cap col-b">What you owe</span>
    <span class="cap col-c">Net worth</span>
  </div>
</figure>

<style>
  .networth {
    margin: 0;
    width: 100%;
    max-width: 460px;
  }
  .grid {
    display: grid;
    /* Bare 1fr columns default to minmax(auto, 1fr): a nowrap dollar value
       (.val below) can then force a column — and this whole diagram, and
       the page around it — wider than the viewport. minmax(0, 1fr) lets
       the columns shrink below that content-driven floor instead. */
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    column-gap: 10px;
    row-gap: 8px;
    align-items: center;
    justify-items: center;
  }
  .bar-wrap {
    grid-row: 1;
    height: 200px;
    width: 100%;
    max-width: 92px;
    min-width: 0;
    display: flex;
    align-items: flex-end;
    background: var(--gridline);
    border-radius: 6px;
    overflow: hidden;
  }
  .col-a { grid-column: 1; }
  .col-b { grid-column: 3; }
  .col-c { grid-column: 5; }
  .op {
    grid-row: 1;
    align-self: center;
    font-family: var(--serif);
    font-size: 28px;
    color: var(--text-muted);
  }
  .op-minus { grid-column: 2; }
  .op-equals { grid-column: 4; }
  .bar {
    width: 100%;
    border-radius: 6px 6px 0 0;
    transition: height 0.7s cubic-bezier(0.25, 1, 0.35, 1);
  }
  .bar.assets {
    background: var(--series-blue);
  }
  .bar.debts {
    background: var(--series-red);
  }
  .bar.net {
    background: var(--hero-gold);
  }
  .val {
    grid-row: 2;
    font-family: var(--serif);
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    min-width: 0;
    max-width: 100%;
    white-space: nowrap;
    /* Keep the whole number together whenever there's room (the normal
       case), but allow an emergency mid-string break rather than pushing
       the grid — and the page — wider than the viewport on a cramped,
       large-font phone. */
    overflow-wrap: anywhere;
  }
  .val.result {
    color: var(--ink-gold);
  }
  .cap {
    grid-row: 3;
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.3;
  }
  @media (max-width: 860px) {
    .bar-wrap {
      height: 130px;
      max-width: 72px;
    }
    .op {
      font-size: 20px;
    }
    .val {
      font-size: 13px;
    }
    .cap {
      font-size: 10.5px;
    }
    .grid {
      column-gap: 6px;
      row-gap: 5px;
    }
  }
</style>
