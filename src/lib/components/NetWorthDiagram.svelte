<script>
  import { onMount } from "svelte";

  // Three columns: assets, minus debts, equals net worth.
  let { assets, debts, netWorth } = $props();

  const max = $derived(Math.max(assets, debts, netWorth) * 1.1);
  const fmt = (v) => `$${Math.round(v).toLocaleString("en-US")}`;

  let revealed = $state(false);
  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => (revealed = true)));
  });
</script>

<figure class="networth">
  <div class="cols">
    <div class="col">
      <div class="bar-wrap">
        <div class="bar assets" style="height:{revealed ? (assets / max) * 100 : 0}%"></div>
      </div>
      <span class="val">{fmt(assets)}</span>
      <span class="cap">What you own</span>
    </div>
    <span class="op">&minus;</span>
    <div class="col">
      <div class="bar-wrap">
        <div class="bar debts" style="height:{revealed ? (debts / max) * 100 : 0}%"></div>
      </div>
      <span class="val">{fmt(debts)}</span>
      <span class="cap">What you owe</span>
    </div>
    <span class="op">=</span>
    <div class="col result">
      <div class="bar-wrap">
        <div class="bar net" style="height:{revealed ? (netWorth / max) * 100 : 0}%"></div>
      </div>
      <span class="val">{fmt(netWorth)}</span>
      <span class="cap">Net worth</span>
    </div>
  </div>
</figure>

<style>
  .networth {
    margin: 0;
    width: 100%;
    max-width: 460px;
  }
  .cols {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 14px;
  }
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 92px;
  }
  .bar-wrap {
    height: 220px;
    width: 100%;
    display: flex;
    align-items: flex-end;
    background: var(--gridline);
    border-radius: 6px;
    overflow: hidden;
  }
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
    font-family: var(--serif);
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .cap {
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
  }
  .op {
    font-family: var(--serif);
    font-size: 30px;
    color: var(--text-muted);
    padding-bottom: 60px;
  }
  .result .val {
    color: var(--ink-gold);
  }
  @media (max-width: 860px) {
    .bar-wrap {
      height: 140px;
    }
    .col {
      width: 74px;
    }
    .op {
      font-size: 22px;
      padding-bottom: 40px;
    }
  }
</style>
