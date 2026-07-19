<script>
  // The fifth-islander "fork" sparkline: two tiny projections (takes vs.
  // organizes-and-contributes) that show which future the toggle points
  // toward. Extracted from IslandMeter so the exact same markup can render
  // either inside the sticky visual's meter (desktop) or inline inside the
  // step-4 card itself (mobile) — see IslandAct.svelte and IslandMeter.svelte.
  // fork: island.json's `fork` — { takes:[5], contributes:[5] }
  let { fork = null, fifthState = "takes", max = 100, compact = false } = $props();

  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SPARK_W = 140;
  const SPARK_H = $derived(compact ? 34 : 46);
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

{#if fork}
  <div class="fork" class:reduced class:compact>
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

<style>
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
    min-width: 0;
  }
  .fork-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    opacity: 0.45;
    min-width: 0;
    transition: opacity 0.4s ease;
  }
  .fork-item svg {
    /* The svg carries a fixed width/height attribute (its intrinsic size,
       needed for the viewBox aspect ratio) — without this, two of them
       side by side have a combined content-driven floor wide enough to
       force the card (and the page) past the viewport edge on a narrow,
       large-font phone. max-width lets it shrink when the flex item is
       tighter than its intrinsic size; height:auto keeps the aspect ratio. */
    max-width: 100%;
    height: auto;
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
  .fork.compact {
    margin-top: 6px;
    padding: 6px 10px 6px;
  }
  .fork.compact .fork-caption {
    margin-bottom: 2px;
    font-size: 10.5px;
  }
  .fork.compact .fork-charts {
    gap: 10px;
  }
  .fork.compact .fork-item {
    gap: 2px;
  }
  @media (max-width: 860px) {
    .fork {
      margin-top: 8px;
      padding: 8px 10px;
    }
    .fork-charts {
      gap: 10px;
    }
  }
</style>
