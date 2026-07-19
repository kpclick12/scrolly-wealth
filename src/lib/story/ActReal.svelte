<script>
  import Scrolly from "../components/Scrolly.svelte";
  import LineChart from "../components/LineChart.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const gdpSeries = $derived(data.pie.worldGdp.series);
  const gdpFmt = (v) => `$${v.toLocaleString("en-US")}`;

  const countrySeries = $derived(data.pie.countryGrowth.series);
  const wealthFmt = (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`);

  const steps = [
    { kicker: "The island, for real", headline: "Earth ran the island's story — for two thousand years" },
    { kicker: "Not zero-sum", headline: "China and the US both got richer, at the same time" },
  ];
</script>

<section class="act" aria-label="Act 2: The island is real" style="--act-accent: var(--ink-green);">
  <div class="act-head">
    <p class="act-kicker">Act Two</p>
    <h2>The island is real</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:480px; --stack-height-mobile:380px;">
        <div class="frame" class:is-active={currentStep === 0}>
          <LineChart
            series={gdpSeries}
            title="World GDP per capita, inflation-adjusted (approximate)"
            valueFormatter={gdpFmt}
            note="Source: Maddison Project Database, international dollars. Years 1 through 2020 (CE). Approximate — pre-modern figures are rough estimates."
            active={currentStep === 0}
          />
        </div>
        <div class="frame" class:is-active={currentStep === 1}>
          <LineChart
            series={countrySeries}
            title="Median wealth per adult, USD (approximate)"
            valueFormatter={wealthFmt}
            note="Source: UBS/Credit Suisse Global Wealth Report/Databook. Approximate historical estimates for 2000 and 2022."
            active={currentStep === 1}
          />
        </div>
      </div>
    {/snippet}

    {#each steps as step, i}
      <section class="scrolly-step" data-index={i}>
        <p class="kicker">{step.kicker}</p>
        <h3>{step.headline}</h3>
        {#if i === 0}
          <p>
            Every beat of the island's story — trade, ideas, rules, shocks —
            happened on Earth too, for real, for about two thousand years.
            For most of that time, output per person barely moved: around
            <strong>$470</strong> a year in the year 1, still under
            <strong>$700</strong> in 1820. Then, in roughly the last two
            centuries, it went nearly vertical: over <strong>$15,000</strong>
            by 2020. The pie itself got enormously bigger — nobody had to
            lose for the rest of the world to gain.
          </p>
        {:else if i === 1}
          <p>
            Money can be printed; wealth can't — prices just rise to match,
            the same way a fire year on the island shows the difference
            between counting more and having more. Real growth is the
            slower kind: better tools, more skills, sturdier institutions.
            <strong>China's</strong> median adult wealth went from about
            <strong>$3,000</strong> in 2000 to roughly <strong>$27,000</strong>
            in 2022 — and the <strong>United States</strong> got richer too,
            not poorer, over that same stretch. One country's growth didn't
            require another's loss.
          </p>
        {/if}
      </section>
    {/each}
  </Scrolly>
</section>

<style>
  .act {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 24px;
  }
  .act-head {
    max-width: 640px;
    margin: 0 auto 56px;
    text-align: center;
  }
  .act-kicker {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--act-accent);
    font-weight: 700;
    margin: 0 0 10px;
  }
  .act-head h2 {
    font-family: var(--serif);
    font-size: clamp(28px, 4vw, 40px);
    margin: 0;
  }
</style>
