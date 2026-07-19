<script>
  import Scrolly from "../components/Scrolly.svelte";
  import NetWorthDiagram from "../components/NetWorthDiagram.svelte";
  import PersonCompare from "../components/PersonCompare.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const ex = $derived(data.netWorth.example);
  const people = $derived(data.netWorth.stockFlow);

  const steps = [
    { kicker: "The basics", headline: "What you own, minus what you owe" },
    { kicker: "A stock, not a flow", headline: "Income pays the bills. Wealth is the reservoir." },
  ];
</script>

<section class="act" aria-label="Act 1: What is wealth?" style="--act-accent: var(--ink-blue);">
  <div class="act-head">
    <p class="act-kicker">Act One</p>
    <h2>What is wealth?</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:460px; --stack-height-mobile:380px;">
        <div class="frame" class:is-active={currentStep === 0}>
          <NetWorthDiagram assets={ex.assets} debts={ex.debts} netWorth={ex.netWorth} active={currentStep === 0} />
        </div>
        <div class="frame" class:is-active={currentStep === 1}>
          <PersonCompare {people} active={currentStep === 1} />
        </div>
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
