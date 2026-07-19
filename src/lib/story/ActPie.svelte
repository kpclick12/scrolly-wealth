<script>
  import Scrolly from "../components/Scrolly.svelte";
  import LineChart from "../components/LineChart.svelte";
  import BarChart from "../components/BarChart.svelte";
  import StatTiles from "../components/StatTiles.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const gdpSeries = $derived(data.pie.worldGdp.series);
  const gdpFmt = (v) => `$${v.toLocaleString("en-US")}`;

  const nominalBars = $derived(data.pie.wealthGrowth.nominal);
  const realBars = $derived(data.pie.wealthGrowth.real);
  const trillionFmt = (v) => `$${v}T`;
  const indexFmt = (v) => `${v}`;

  const moneyTiles = $derived(data.pie.moneyIllusion.tiles);

  const countrySeries = $derived(data.pie.countryGrowth.series);
  const wealthFmt = (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`);

  const steps = [
    { kicker: "The pie grows", headline: "Wealth isn't one fixed pot being divided" },
    { kicker: "Two different things", headline: "Inflation makes the numbers bigger. Growth makes the pie bigger." },
    { kicker: "Money isn't wealth", headline: "You can print money. You can't print wealth." },
    { kicker: "Not zero-sum", headline: "So why doesn't every country just create it?" },
  ];
</script>

<section class="act" aria-label="Act 3: Is wealth a fixed pie?" style="--act-accent: var(--ink-green);">
  <div class="act-head">
    <p class="act-kicker">Act Three</p>
    <h2>Is wealth a fixed pie?</h2>
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
          <div class="paired-bars">
            <BarChart
              data={nominalBars}
              maxValue={480}
              title="Global household wealth, nominal (trillion USD)"
              valueFormatter={trillionFmt}
              active={currentStep === 1}
            />
            <BarChart
              data={realBars}
              maxValue={220}
              title="Real wealth per adult, inflation-adjusted (index, 2000 = 100)"
              valueFormatter={indexFmt}
              active={currentStep === 1}
            />
          </div>
        </div>
        <div class="frame" class:is-active={currentStep === 2}>
          <StatTiles tiles={moneyTiles} active={currentStep === 2} />
        </div>
        <div class="frame" class:is-active={currentStep === 3}>
          <LineChart
            series={countrySeries}
            title="Median wealth per adult, USD (approximate)"
            valueFormatter={wealthFmt}
            note="Source: UBS/Credit Suisse Global Wealth Report/Databook. Approximate historical estimates for 2000 and 2022."
            active={currentStep === 3}
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
            So far, this has been about how one pile — a person's, a
            family's — grows or doesn't. Zoom out, and a bigger question
            sits underneath all of it: is the world's wealth a fixed pot
            that one person's gain means another's loss? Mostly, no.
          </p>
          <p>
            For most of human history, average output per person barely
            moved — around <strong>$470</strong> a year in the year 1,
            still under <strong>$700</strong> in 1820. Then, in roughly the
            last two centuries, it went nearly vertical: over
            <strong>$15,000</strong> by 2020. The pie itself got enormously
            bigger.
          </p>
        {:else if i === 1}
          <p>
            Global household wealth went from about <strong>$117
            trillion</strong> in 2000 to roughly <strong>$454
            trillion</strong> in 2022. Some of that jump is just
            <strong>inflation</strong> — the same stuff, described in
            smaller dollars from twenty years ago.
          </p>
          <p>
            But strip inflation out and there's still real growth left over:
            real wealth per adult, after adjusting for prices, roughly
            <strong>doubled</strong> over those two decades. Bigger numbers
            and a bigger pie are different facts, and it's worth keeping
            them straight.
          </p>
        {:else if i === 2}
          <p>
            Here's the part that trips people up: a government can print
            more money, but it can't print more wealth. If the money supply
            doubles while the goods and services people actually make stay
            the same, prices simply double to match. Historical
            hyperinflations made everyone a "billionaire" in the local
            currency — and made no one richer.
          </p>
          <p>
            Real wealth is created a slower way: someone builds a house,
            grows a business, learns a skill that makes them more
            productive, or lays a road that lets goods move faster. Each of
            those makes the pie a little bigger. Printing currency doesn't.
          </p>
        {:else if i === 3}
          <p>
            If the pie can grow, why doesn't every country just grow it?
            Some have: <strong>South Korea</strong> was poorer than Ghana in
            1960 and is now among the world's richest countries.
            <strong>China's</strong> median adult wealth went from roughly
            <strong>$3,000</strong> in 2000 to about <strong>$27,000</strong>
            in 2022 — and the United States got richer too, not poorer, over
            that same stretch. One country's growth didn't require another
            country's loss.
          </p>
          <p>
            But growth like that compounds slowly, over decades, and it
            needs sustained investment, education, infrastructure and
            stable institutions to take hold — none of which any person
            chooses at birth. Which is exactly why where you're born still
            sets such different odds, and why the wheel you're about to
            spin still matters.
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
  .paired-bars {
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 100%;
    max-width: 520px;
  }
</style>
