<script>
  import Scrolly from "../components/Scrolly.svelte";
  import BarChart from "../components/BarChart.svelte";
  import DotWaffle from "../components/DotWaffle.svelte";
  import StatTiles from "../components/StatTiles.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  // A curated span from richest to poorest — short enough to stay legible
  // (and fit the mobile sticky panel without scrolling) while still
  // spanning the full range. The full approximate list lives in
  // src/data/countries.json.
  const CHART_NAMES = [
    "Belgium",
    "Switzerland",
    "United Kingdom",
    "United States",
    "Japan",
    "China",
    "India",
    "Nigeria",
    "Ethiopia",
  ];
  // The bar chart is ONE persistent visual across steps 0 and 1 — it never
  // remounts. Only which countries are highlighted (and dimmed) changes,
  // so the chart itself "does something" instead of sitting there static.
  const RICHEST = ["Belgium", "Switzerland", "United Kingdom"];
  const MOST_HUMANS = ["China", "India", "Nigeria"];

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

  // Same 1,000 dots, both pyramid steps — bands come straight from
  // pyramid.json (key, color, adults%, wealth%), which is exactly the
  // shape DotWaffle expects.
  const bands = $derived(data.pyramid.tiers);

  const thresholdTiles = $derived(
    data.thresholds.thresholds.map((t, i) => ({
      value: moneyFmt(t.value),
      label: t.key,
      accent: i === data.thresholds.thresholds.length - 1,
    }))
  );

  const steps = [
    { kicker: "Median wealth", headline: "Where you're born sets the scale" },
    { kicker: "Where most people live", headline: "Most of humanity lives far below that line" },
    { kicker: "The global pyramid", headline: "Half the world splits about 1% of it" },
    { kicker: "Same dots, different lens", headline: "Now weight the very same dots by wealth" },
    { kicker: "Where you'd rank", headline: "Three numbers that place anyone, anywhere" },
  ];

  // BarChart persists across steps 0–1, DotWaffle across steps 2–3.
  const barActive = $derived(currentStep === 0 || currentStep === 1);
  const waffleActive = $derived(currentStep === 2 || currentStep === 3);
  const barHighlight = $derived(currentStep === 1 ? MOST_HUMANS : RICHEST);
  const waffleMode = $derived(currentStep === 3 ? "wealth" : "adults");
</script>

<section class="act" aria-label="Act 4: Wealth between countries" style="--act-accent: var(--series-violet);">
  <div class="act-head">
    <p class="act-kicker">Act Four</p>
    <h2>Wealth between countries</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:480px; --stack-height-mobile:420px;">
        <div class="frame" class:is-active={barActive}>
          <BarChart
            data={countryBars}
            valueFormatter={moneyFmt}
            title="Median wealth per adult, USD (approximate)"
            active={barActive}
            highlight={barHighlight}
          />
        </div>
        <div class="frame" class:is-active={waffleActive}>
          <DotWaffle
            {bands}
            mode={waffleMode}
            active={waffleActive}
            caption="Each dot ≈ 0.1% of the world's adults, colored by wealth band (UBS/Credit Suisse Global Wealth Report 2023)."
          />
        </div>
        <div class="frame" class:is-active={currentStep === 4}>
          <StatTiles tiles={thresholdTiles} active={currentStep === 4} />
        </div>
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
            But the richest countries aren't where most people live. Weight
            this same chart by population and the <strong>typical human
            being alive today</strong> is standing much further down the
            list — in China, India, Nigeria — not up near the top.
          </p>
          <p>
            The "average country" and the "average person" point to very
            different places on this chart. Most of humanity's lived
            experience of wealth is the dimmed half, not the highlighted
            one.
          </p>
        {:else if i === 2}
          <p>
            Zoom out to the whole planet and the picture gets sharper. Every
            dot here is roughly the same slice of the world's adults —
            about <strong>53%</strong> of them own less than $10,000, shown
            in the largest band below.
          </p>
          <p>
            Grouped this way, the bands are sized by <strong>how many
            people</strong> are in each one. It already looks lopsided. It's
            about to look more so.
          </p>
        {:else if i === 3}
          <p>
            Same 1,000 dots, same colors — now watch the bands resize to
            show <strong>how much wealth</strong> each one holds instead of
            how many people are in it.
          </p>
          <p>
            The band that held over half the dots shrinks to a sliver: those
            adults hold roughly <strong>1.2%</strong> of all household
            wealth on Earth. The smallest band — the dollar-millionaires,
            just <strong>1.1%</strong> of adults — swells to hold nearly
            <strong>46%</strong> of it.
          </p>
        {:else if i === 4}
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
