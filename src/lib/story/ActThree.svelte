<script>
  import { fade } from "svelte/transition";
  import Scrolly from "../components/Scrolly.svelte";
  import BarChart from "../components/BarChart.svelte";
  import StackedBars from "../components/StackedBars.svelte";
  import StatTiles from "../components/StatTiles.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  // A curated span from richest to poorest, so the chart stays readable —
  // the full approximate list lives in src/data/countries.json.
  const CHART_NAMES = [
    "Belgium",
    "Switzerland",
    "United Kingdom",
    "France",
    "Netherlands",
    "United States",
    "Japan",
    "Sweden",
    "Germany",
    "China",
    "Brazil",
    "India",
    "Nigeria",
    "Ethiopia",
  ];
  const countryBars = $derived(
    CHART_NAMES.map((name) => {
      const c = data.countries.countries.find((d) => d.name === name);
      return { label: name, value: c.median, color: "var(--series-blue)" };
    })
  );
  const moneyFmt = (v) =>
    v >= 1000000
      ? `$${(v / 1000000).toFixed(1)}M`
      : v >= 100000
        ? `$${Math.round(v / 1000)}k`
        : v >= 1000
          ? `$${(v / 1000).toFixed(1)}k`
          : `$${Math.round(v)}`;

  const pyramidRows = $derived([
    {
      label: "Share of adults",
      parts: data.pyramid.tiers.map((t) => ({ key: t.key, value: t.adults, color: t.color, light: t.light })),
    },
    {
      label: "Share of world wealth",
      parts: data.pyramid.tiers.map((t) => ({ key: t.key, value: t.wealth, color: t.color, light: t.light })),
    },
  ]);
  const pyramidLegend = $derived(data.pyramid.tiers.map((t) => ({ key: t.key, color: t.color })));

  const thresholdTiles = $derived(
    data.thresholds.thresholds.map((t, i) => ({
      value: moneyFmt(t.value),
      label: t.key,
      accent: i === data.thresholds.thresholds.length - 1,
    }))
  );

  const steps = [
    { kicker: "Median wealth", headline: "Where you're born sets the scale" },
    { kicker: "The global pyramid", headline: "Half the world splits about 1% of it" },
    { kicker: "Where you'd rank", headline: "Three numbers that place anyone, anywhere" },
  ];
</script>

<section class="act" aria-label="Act 3: Wealth between countries">
  <div class="act-head">
    <p class="act-kicker">Act Three</p>
    <h2>Wealth between countries</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-stack">
        {#key currentStep}
          <div class="visual-frame" in:fade={{ duration: 250 }}>
            {#if currentStep === 0}
              <BarChart
                data={countryBars}
                valueFormatter={moneyFmt}
                title="Median wealth per adult, USD (approximate)"
              />
            {:else if currentStep === 1}
              <StackedBars rows={pyramidRows} legend={pyramidLegend} title="Global wealth pyramid (approximate)" />
            {:else if currentStep === 2}
              <StatTiles tiles={thresholdTiles} />
            {/if}
          </div>
        {/key}
      </div>
    {/snippet}

    {#each steps as step, i}
      <section class="scrolly-step" data-index={i}>
        <p class="kicker">{step.kicker}</p>
        <h3>{step.headline}</h3>
        {#if i === 0}
          <p>
            Line up countries by <strong>median wealth per adult</strong> —
            the net worth of the person exactly in the middle — and the
            range is staggering. A median adult in Belgium holds around
            <strong>$250,000</strong>. A median adult in Ethiopia holds less
            than <strong>$1,000</strong>.
          </p>
          <p>
            That's not the top 1% versus everyone else. That's the ordinary,
            middle-of-the-pack person in each place. Figures are approximate
            (UBS/Credit Suisse Global Wealth Report 2023, data year 2022).
          </p>
        {:else if i === 1}
          <p>
            Zoom out to the whole planet and the picture gets sharper.
            About <strong>53% of the world's adults</strong> own less than
            $10,000 — and together they hold roughly
            <strong>1.2%</strong> of all household wealth on Earth.
          </p>
          <p>
            At the other end, the <strong>1.1%</strong> of adults who are
            dollar-millionaires hold nearly <strong>46%</strong> of it. The
            share of people and the share of wealth barely resemble each
            other at any level of this pyramid.
          </p>
        {:else if i === 2}
          <p>
            Three thresholds place anyone on Earth. Roughly
            <strong>$8,700</strong> in net worth puts you in the richer half
            of humanity. Around <strong>$140,000</strong> puts you in the
            global top 10%. About <strong>$1.1 million</strong> puts you in
            the global top 1%.
          </p>
          <p>
            A middle-class net worth in a rich country can be an
            extraordinary fortune by global standards — and the reverse is
            just as true.
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
    color: var(--series-violet);
    font-weight: 700;
    margin: 0 0 10px;
  }
  .act-head h2 {
    font-family: var(--serif);
    font-size: clamp(28px, 4vw, 40px);
    margin: 0;
  }
  .visual-stack {
    position: relative;
    width: 100%;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .visual-frame {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global(.act .scrolly-step) {
    background: var(--surface-1);
    border-left: 6px solid var(--series-violet);
    padding: 28px 32px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(32, 26, 18, 0.08);
  }
  :global(.act .scrolly-step > *) {
    opacity: 0.35;
    transition: opacity 0.3s ease;
  }
  :global(.act .scrolly-step.is-active > *) {
    opacity: 1;
  }
  :global(.act .scrolly-step) .kicker {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--series-violet);
    margin: 0 0 8px;
    font-weight: 700;
  }
  :global(.act .scrolly-step) h3 {
    font-family: var(--serif);
    margin: 0 0 14px;
    font-size: 23px;
    line-height: 1.25;
  }
  :global(.act .scrolly-step) p {
    margin: 0 0 12px;
    font-size: 15px;
    line-height: 1.6;
  }
  :global(.act .scrolly-step) p:last-child {
    margin-bottom: 0;
  }
</style>
