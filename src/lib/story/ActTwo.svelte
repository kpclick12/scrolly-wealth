<script>
  import { fade } from "svelte/transition";
  import Scrolly from "../components/Scrolly.svelte";
  import StackedBars from "../components/StackedBars.svelte";
  import LineChart from "../components/LineChart.svelte";
  import BarChart from "../components/BarChart.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const savingRows = [
    {
      label: "A monthly paycheck",
      parts: [
        { key: "Spent on living costs", value: 92, color: "var(--series-blue)" },
        { key: "Saved", value: 8, color: "var(--hero-gold)", light: true },
      ],
    },
  ];

  const compoundingSeries = $derived(data.compounding.series);
  const moneyFmt = (v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);

  const ownershipRows = $derived([
    { label: "Composition of a large fortune", parts: data.wealthCreation.topWealthComposition },
  ]);

  const inheritanceBars = $derived(
    data.wealthCreation.inheritanceShare.map((d) => ({
      label: d.key,
      value: d.value,
      color: d.color,
    }))
  );

  const steps = [
    { kicker: "The slow way", headline: "Saving is a sliver of the income flow" },
    { kicker: "The accelerator", headline: "Compounding returns do the heavy lifting" },
    { kicker: "The fast way", headline: "Most big fortunes are ownership, not salary" },
    { kicker: "The head start", headline: "A lot of wealth was never earned by its holder" },
  ];
</script>

<section class="act" aria-label="Act 2: How is wealth created?">
  <div class="act-head">
    <p class="act-kicker">Act Two</p>
    <h2>How is wealth created?</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-stack">
        {#key currentStep}
          <div class="visual-frame" in:fade={{ duration: 250 }}>
            {#if currentStep === 0}
              <StackedBars rows={savingRows} title="Where a typical paycheck goes" />
            {:else if currentStep === 1}
              <LineChart
                series={compoundingSeries}
                unit=""
                valueFormatter={moneyFmt}
                labelAll={false}
                title="$200 saved every month, for 40 years"
                note="Illustrative example: 7% average annual return, compounded monthly. Not investment advice."
              />
            {:else if currentStep === 2}
              <StackedBars rows={ownershipRows} title="Illustrative composition of a large private fortune" />
            {:else if currentStep === 3}
              <BarChart data={inheritanceBars} maxValue={100} title="Where private wealth in rich economies came from" />
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
            The most familiar way to build wealth is simply to <strong>spend
            less than you earn</strong> and set the rest aside. It works, but
            it is slow: most households save a small slice of each
            paycheck, so the reservoir fills a little at a time.
          </p>
          <p>
            Saved money that just sits still still grows the stock — but at
            the pace of the paycheck, not much faster.
          </p>
        {:else if i === 1}
          <p>
            Put that saved money to work and something different happens.
            The chart compares the same <strong>$200 a month</strong>, saved
            for 40 years: once as cash under the mattress, once invested at
            a 7% average annual return.
          </p>
          <p>
            Both lines start from the identical habit. The gap between them
            — roughly <strong>$429,000</strong> — isn't extra saving. It's
            the return compounding on itself, decade after decade.
          </p>
        {:else if i === 2}
          <p>
            Salaries build wealth one paycheck at a time. Large fortunes
            rarely do. Most of the world's biggest personal fortunes are
            concentrated in a single asset: <strong>ownership</strong> —
            equity in a business that keeps growing whether or not its owner
            is drawing a salary.
          </p>
          <p>
            For most households the closest equivalent is a home bought with
            a mortgage: a leveraged bet on an asset's value rising over
            time, rather than income saved directly.
          </p>
        {:else if i === 3}
          <p>
            Not all wealth was built. In several rich economies, researchers
            estimate that roughly <strong>half of all private wealth</strong>
            was <em>received</em> — through inheritance or large gifts —
            rather than accumulated from a lifetime of saving and investing.
          </p>
          <p>
            That share has been rising for decades in some countries as
            fortunes built up in the mid-20th century pass to a new
            generation. Where you land in that chain matters as much as
            what you do with your own paycheck.
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
    color: var(--ink-gold);
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
    border-left: 6px solid var(--series-yellow);
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
    color: var(--ink-gold);
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
