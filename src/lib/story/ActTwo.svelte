<script>
  import Scrolly from "../components/Scrolly.svelte";
  import BlockTower from "../components/BlockTower.svelte";
  import BarChart from "../components/BarChart.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const compoundingSeries = $derived(data.compounding.series);

  // Of the two visuals that used to cover ownership and inheritance
  // separately, this one — the inheritance split — is the stronger fit
  // for a story about birthplace, since "who your family is" is itself
  // part of the birth lottery. The ownership-composition chart is folded
  // into this step's prose instead of getting its own visual.
  const inheritanceBars = $derived(
    data.wealthCreation.inheritanceShare.map((d) => ({
      label: d.key,
      value: d.value,
      color: d.color,
    }))
  );

  const steps = [
    { kicker: "The accelerator", headline: "Saving is slow. Compounding does the heavy lifting." },
    { kicker: "The head start", headline: "Large fortunes are usually owned, not earned — and often inherited" },
  ];
</script>

<section class="act" aria-label="Act 2: How is wealth created?" style="--act-accent: var(--ink-gold);">
  <div class="act-head">
    <p class="act-kicker">Act Two</p>
    <h2>How is wealth created?</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:460px; --stack-height-mobile:300px;">
        <div class="frame" class:is-active={currentStep === 0}>
          <BlockTower series={compoundingSeries} active={currentStep === 0} />
        </div>
        <div class="frame" class:is-active={currentStep === 1}>
          <BarChart data={inheritanceBars} maxValue={100} title="Where private wealth in rich economies came from" active={currentStep === 1} />
        </div>
      </div>
    {/snippet}

    {#each steps as step, i}
      <section class="scrolly-step" data-index={i}>
        <p class="kicker">{step.kicker}</p>
        <h3>{step.headline}</h3>
        {#if i === 0}
          <p>
            The most familiar way to build wealth is to <strong>spend less
            than you earn</strong> and set the rest aside. It works, but
            it's slow — most households save a small slice of each
            paycheck, so left alone, the reservoir fills at the pace of the
            paycheck and not much faster.
          </p>
          <p>
            Put that saved money to work and something different happens.
            The tower stacks the same <strong>$200 a month</strong>, saved
            for 40 years: contribution blocks first, then the blocks that
            come from a 7% average annual return, stacking on top of them.
            Watch which color the tower is mostly made of by the end — the
            gap between the two totals, roughly <strong>$429,000</strong>,
            isn't extra saving. It's the return compounding on itself,
            decade after decade.
          </p>
        {:else if i === 1}
          <p>
            Salaries build wealth one paycheck at a time. The biggest
            fortunes rarely do. Most of the world's largest personal
            fortunes sit almost entirely in one asset: <strong>ownership</strong>
            — equity in a business that keeps compounding whether or not
            its owner draws a salary.
          </p>
          <p>
            And a lot of that ownership was never earned by the person
            holding it. In several rich economies, researchers estimate
            that roughly <strong>half of all private wealth</strong> was
            <em>received</em> — through inheritance or large gifts — rather
            than built from a lifetime of saving. Where you land in that
            chain can matter as much as anything you do yourself.
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
