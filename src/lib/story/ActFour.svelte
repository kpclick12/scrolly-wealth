<script>
  import { fade } from "svelte/transition";
  import Scrolly from "../components/Scrolly.svelte";
  import StackedBars from "../components/StackedBars.svelte";
  import BarChart from "../components/BarChart.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const countries = $derived(data.concentration.countries);

  const shareRows = $derived(
    countries.map((c) => {
      const middle40 = 100 - c.top10 - c.bottom50;
      const next9 = c.top10 - c.top1;
      return {
        label: c.name,
        note: c.bottom50 < 0 ? `Bottom 50% hold net negative wealth (${c.bottom50}% — more debt than assets)` : undefined,
        parts: [
          { key: "Bottom 50%", value: c.bottom50, color: "var(--series-red)" },
          { key: "Middle 40%", value: middle40, color: "var(--series-blue)" },
          { key: "Next 9% (90th–99th percentile)", value: next9, color: "var(--series-aqua)" },
          { key: "Top 1%", value: c.top1, color: "var(--hero-gold)", light: true },
        ],
      };
    })
  );
  const shareLegend = [
    { key: "Bottom 50%", color: "var(--series-red)" },
    { key: "Middle 40%", color: "var(--series-blue)" },
    { key: "Next 9%", color: "var(--series-aqua)" },
    { key: "Top 1%", color: "var(--hero-gold)" },
  ];

  const bottomHalfBars = $derived(
    countries.map((c) => ({
      label: c.name,
      value: Math.abs(c.bottom50),
      color: c.bottom50 < 0 ? "var(--series-red)" : "var(--series-blue)",
    }))
  );
  const bottomHalfFmt = (v, i) => {
    const c = countries[i];
    return c.bottom50 < 0 ? `−${v.toFixed(1)}%` : `${v.toFixed(1)}%`;
  };

  const steps = [
    { kicker: "Inside every country", headline: "Wealth concentrates more than income, everywhere" },
    { kicker: "The bottom half", headline: "In some places, owning nothing is optimistic" },
    { kicker: "Two forces at once", headline: "Your country sets the baseline. Your slice decides the rest." },
  ];
</script>

<section class="act" aria-label="Act 4: Wealth within countries">
  <div class="act-head">
    <p class="act-kicker">Act Four</p>
    <h2>Wealth within countries</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-stack">
        {#key currentStep}
          <div class="visual-frame" in:fade={{ duration: 250 }}>
            {#if currentStep === 0}
              <StackedBars rows={shareRows} legend={shareLegend} title="Share of personal wealth by group, approximate (~2022)" />
            {:else if currentStep === 1}
              <BarChart
                data={bottomHalfBars}
                maxValue={8}
                valueFormatter={(v, i) => bottomHalfFmt(v, i)}
                title="Bottom 50%'s share of national wealth"
              />
            {:else if currentStep === 2}
              <StackedBars
                rows={[shareRows[0]]}
                legend={shareLegend}
                title="Same shape, different countries — position within it still matters"
              />
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
            Income is unequal almost everywhere. Wealth is <strong>always
            more unequal than income</strong>, in every country on this
            list. In the United States, the top 10% hold about
            <strong>70%</strong> of household wealth; in South Africa, about
            <strong>86%</strong>.
          </p>
          <p>
            Even the top 1% alone, on their own, typically holds more than
            the entire bottom half of the population combined.
          </p>
        {:else if i === 1}
          <p>
            Look at just the bottom half of each country and the number is
            small everywhere — a few percent of national wealth at best.
          </p>
          <p>
            In Brazil and South Africa it goes <strong>negative</strong>:
            on average, the bottom half owes more than it owns. Being born
            into the bottom half there doesn't just mean starting with
            nothing — it can mean starting in the hole.
          </p>
        {:else if i === 2}
          <p>
            Two forces stack on top of each other. <strong>Which
            country</strong> you're born into sets the overall scale — a
            median adult in one country can hold 100 times what a median
            adult holds in another. <strong>Where you land within that
            country</strong> then decides your slice of an already unequal
            pie.
          </p>
          <p>
            You don't get to choose either one. So — where does the birth
            lottery send you? Scroll down and spin the wheel.
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
    padding: 40px 24px 100px;
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
    color: var(--ink-red);
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
    border-left: 6px solid var(--series-red);
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
    color: var(--ink-red);
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
