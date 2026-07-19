<script>
  import Scrolly from "../components/Scrolly.svelte";
  import BarChart from "../components/BarChart.svelte";
  import LinkedPyramid from "../components/LinkedPyramid.svelte";

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

  // Both pyramid steps share one LinkedPyramid instance — bands come
  // straight from pyramid.json (key, color, adults%, wealth%).
  const bands = $derived(data.pyramid.tiers);

  const steps = [
    { kicker: "Different islands, different rules", headline: "Line up the islands, and the range is staggering" },
    { kicker: "Where most people live", headline: "The richest islands aren't where most people live" },
    { kicker: "The global pyramid", headline: "Zoom out to every islander on Earth" },
    { kicker: "Two sides of one pyramid", headline: "A sliver of people, nearly half the wealth" },
  ];

  // BarChart persists across steps 0–1, LinkedPyramid across steps 2–3.
  const barActive = $derived(currentStep === 0 || currentStep === 1);
  const pyramidActive = $derived(currentStep === 2 || currentStep === 3);
  const barHighlight = $derived(currentStep === 1 ? MOST_HUMANS : RICHEST);
  const pyramidHighlight = $derived(currentStep === 3 ? "top" : "bottom");
</script>

<section class="act" aria-label="Act 3: Between countries" style="--act-accent: var(--series-violet);">
  <div class="act-head">
    <p class="act-kicker">Act Three</p>
    <h2>Between countries</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:480px; --stack-height-mobile:500px;">
        <div class="frame" class:is-active={barActive}>
          <BarChart
            data={countryBars}
            valueFormatter={moneyFmt}
            title="Median wealth per adult, USD (approximate)"
            active={barActive}
            highlight={barHighlight}
          />
        </div>
        <div class="frame" class:is-active={pyramidActive}>
          <LinkedPyramid
            {bands}
            highlight={pyramidHighlight}
            caption="Left: each wealth band's share of global wealth. Right: the same band's share of the world's 100 adults. UBS/Credit Suisse Global Wealth Report 2023."
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
            Line up countries — islands with entirely different histories,
            rules and head starts — by <strong>median wealth per adult</strong>,
            the net worth of the person exactly in the middle, and the range
            is staggering. A median adult in Belgium holds around
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
            Zoom out to the whole planet. On the right, 100 dots stand in
            for every adult on Earth, grouped into the same four wealth
            bands. Look at the bottom band: about <strong>53%</strong> of
            adults — more than half the grid — own less than $10,000.
          </p>
          <p>
            Now look left, at that same band's sliver on the wealth bar.
            Same people, same color, barely any bar. Watch the gold line:
            it's about to connect to a very different picture.
          </p>
        {:else if i === 3}
          <p>
            Same bands, same dots — now follow the gold line to the top.
            The <strong>dollar-millionaires</strong>, just over
            <strong>1%</strong> of adults, are almost invisible on the
            people grid. On the wealth bar, that same sliver of people fills
            nearly <strong>half the bar</strong>.
          </p>
          <p>
            About 1.1% of adults hold nearly half of all wealth. About 53%
            share barely more than 1%. A handful of thresholds place anyone
            on this pyramid, from the poorest islander to the richest — find
            yours further down the page.
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
