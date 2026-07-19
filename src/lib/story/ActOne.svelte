<script>
  import { fade } from "svelte/transition";
  import Scrolly from "../components/Scrolly.svelte";
  import NetWorthDiagram from "../components/NetWorthDiagram.svelte";
  import PersonCompare from "../components/PersonCompare.svelte";
  import StackedBars from "../components/StackedBars.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const ex = $derived(data.netWorth.example);
  const people = $derived(data.netWorth.stockFlow);

  const compositionRows = $derived([
    {
      label: "What you own",
      parts: [
        { key: "Financial assets (cash, deposits, stocks, pensions)", value: 16.7, color: "var(--series-blue)" },
        { key: "Real assets (mainly housing)", value: 83.3, color: "var(--series-aqua)" },
      ],
    },
    {
      label: "After paying off what you owe",
      parts: [
        { key: "Net worth", value: Math.round((ex.netWorth / ex.assets) * 1000) / 10, color: "var(--hero-gold)", light: true },
        { key: "Debt", value: Math.round((ex.debts / ex.assets) * 1000) / 10, color: "var(--series-red)" },
      ],
    },
  ]);

  const steps = [
    { kicker: "The basics", headline: "What you own, minus what you owe" },
    { kicker: "A stock, not a flow", headline: "Income pays the bills. Wealth is the reservoir." },
    { kicker: "What counts", headline: "Cash, houses, pensions — and debt" },
  ];
</script>

<section class="act" aria-label="Act 1: What is wealth?">
  <div class="act-head">
    <p class="act-kicker">Act One</p>
    <h2>What is wealth?</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-stack">
        {#key currentStep}
          <div class="visual-frame" in:fade={{ duration: 250 }}>
            {#if currentStep === 0}
              <NetWorthDiagram assets={ex.assets} debts={ex.debts} netWorth={ex.netWorth} />
            {:else if currentStep === 1}
              <PersonCompare {people} />
            {:else if currentStep === 2}
              <StackedBars rows={compositionRows} title="An illustrative household's balance sheet" />
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
            <strong>Net worth</strong> is the simplest definition of wealth:
            everything you own — cash, a house, a retirement account, shares
            in a company — minus everything you owe, like a mortgage,
            student loan or credit card balance.
          </p>
          <p>
            Two people can earn the exact same salary and end up with wildly
            different net worth, because wealth is about what's left over,
            not what comes in.
          </p>
        {:else if i === 1}
          <p>
            Economists separate <strong>income</strong>, a flow measured per
            month or year, from <strong>wealth</strong>, a stock measured at
            a single point in time. A flow can be large while the stock next
            to it is nearly empty — or the reverse.
          </p>
          <p>
            A young surgeon can out-earn a retired shopkeeper many times
            over and still have far less net worth, because wealth is what
            accumulates after the bills, the debt payments and the years go
            by.
          </p>
        {:else if i === 2}
          <p>
            Wealth researchers count two broad kinds of assets:
            <strong>financial assets</strong> — cash, bank deposits, stocks,
            bonds, pension funds — and <strong>real assets</strong>, which
            for most households means the home they live in.
          </p>
          <p>
            For a typical homeowning household, housing dominates the asset
            side. But a mortgage sits right alongside it: subtract the debt,
            and what's left is the actual net worth — usually a much smaller
            number than the price tag on the house.
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
    padding: 90px 24px 40px;
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
    color: var(--ink-blue);
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
    border-left: 6px solid var(--series-blue);
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
    color: var(--ink-blue);
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
