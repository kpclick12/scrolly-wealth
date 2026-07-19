<script>
  // A persistent "island wealth" meter that runs alongside the scene across
  // all seven steps — the one piece of the parable that's already a chart,
  // so the meter itself rhymes visually with the real charts later in the
  // story. At the fifth-islander step it grows a second, small element: a
  // mini sparkline forking into two futures depending on the toggle.
  // fork: island.json's `fork` — { takes:[5], contributes:[5] }
  let { value = 0, max = 100, showFork = false, fork = null, fifthState = "takes" } = $props();

  const pct = $derived(Math.max(0, Math.min(100, (value / max) * 100)));

  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tiny inline sparkline geometry for the two forked futures.
  const SPARK_W = 140;
  const SPARK_H = 46;
  function sparkPath(series) {
    if (!series || series.length === 0) return "";
    const lo = 0;
    const hi = max;
    const stepX = SPARK_W / (series.length - 1);
    return series
      .map((v, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${SPARK_H - ((v - lo) / (hi - lo)) * SPARK_H}`)
      .join(" ");
  }
</script>

<div class="island-meter">
  <div class="meter-row">
    <span class="meter-label">Island wealth</span>
    <span class="meter-value">{Math.round(value)}</span>
  </div>
  <div class="meter-track">
    <div class="meter-fill" style="width:{pct}%"></div>
  </div>

  {#if showFork && fork}
    <div class="fork" class:reduced>
      <p class="fork-caption">If this keeps going…</p>
      <div class="fork-charts">
        <div class="fork-item" class:selected={fifthState === "takes"}>
          <svg viewBox="0 0 {SPARK_W} {SPARK_H}" width={SPARK_W} height={SPARK_H} aria-hidden="true">
            <path d={sparkPath(fork.takes)} class="fork-line takes" />
          </svg>
          <span class="fork-tag">Takes only</span>
        </div>
        <div class="fork-item" class:selected={fifthState === "contributes"}>
          <svg viewBox="0 0 {SPARK_W} {SPARK_H}" width={SPARK_W} height={SPARK_H} aria-hidden="true">
            <path d={sparkPath(fork.contributes)} class="fork-line contributes" />
          </svg>
          <span class="fork-tag">Organizes &amp; contributes</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .island-meter {
    width: 100%;
    max-width: 420px;
    margin-top: 18px;
  }
  .meter-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .meter-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    font-weight: 700;
  }
  .meter-value {
    font-family: var(--serif);
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .meter-track {
    height: 14px;
    border-radius: 7px;
    background: var(--gridline);
    overflow: hidden;
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .meter-fill {
    height: 100%;
    border-radius: 7px;
    background: linear-gradient(90deg, var(--series-blue), var(--hero-gold));
    transition: width 0.7s cubic-bezier(0.25, 1, 0.35, 1);
  }

  .fork {
    margin-top: 14px;
    padding: 12px 14px;
    background: var(--surface-1);
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .fork-caption {
    margin: 0 0 8px;
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .fork-charts {
    display: flex;
    gap: 16px;
  }
  .fork-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    opacity: 0.45;
    transition: opacity 0.4s ease;
  }
  .fork-item.selected {
    opacity: 1;
  }
  .fork-line {
    fill: none;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .fork-line.takes {
    stroke: var(--series-red);
  }
  .fork-line.contributes {
    stroke: var(--ink-green);
  }
  .fork-tag {
    font-size: 10.5px;
    color: var(--text-secondary);
    text-align: center;
  }
  @media (max-width: 860px) {
    .island-meter {
      margin-top: 8px;
    }
    .fork {
      margin-top: 8px;
      padding: 8px 10px;
    }
    .fork-charts {
      gap: 10px;
    }
  }
</style>
