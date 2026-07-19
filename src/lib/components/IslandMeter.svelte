<script>
  // A persistent "island wealth" meter that runs alongside the scene across
  // all seven steps — the one piece of the parable that's already a chart,
  // so the meter itself rhymes visually with the real charts later in the
  // story. At the fifth-islander step it grows a second, small element: a
  // mini sparkline forking into two futures depending on the toggle.
  // fork: island.json's `fork` — { takes:[5], contributes:[5] }
  import IslandFork from "./IslandFork.svelte";

  let { value = 0, max = 100, showFork = false, fork = null, fifthState = "takes" } = $props();

  const pct = $derived(Math.max(0, Math.min(100, (value / max) * 100)));
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
    <!-- Desktop only: on mobile this same fork lives inside the step-4 card
         itself (see IslandAct.svelte) so the toggle and its feedback are one
         self-contained block instead of feedback hiding behind the card. -->
    <div class="sticky-fork">
      <IslandFork {fork} {fifthState} {max} />
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

  @media (max-width: 860px) {
    .island-meter {
      margin-top: 8px;
    }
    /* On mobile the toggle's fork sparkline moves into the step-4 card
       itself (see IslandAct.svelte's `.mobile-fork`) so the feedback is
       never left sitting behind the card. Don't render it twice. */
    .sticky-fork {
      display: none;
    }
  }
</style>
