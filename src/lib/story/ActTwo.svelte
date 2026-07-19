<script>
  import Scrolly from "../components/Scrolly.svelte";
  import StackedBars from "../components/StackedBars.svelte";
  import BlockTower from "../components/BlockTower.svelte";
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

<section class="act" aria-label="Act 2: How is wealth created?" style="--act-accent: var(--ink-gold);">
  <div class="act-head">
    <p class="act-kicker">Act Two</p>
    <h2>How is wealth created?</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:500px; --stack-height-mobile:280px;">
        <div class="frame" class:is-active={currentStep === 0}>
          <StackedBars rows={savingRows} title="Where a typical paycheck goes" active={currentStep === 0} />
        </div>
        <div class="frame" class:is-active={currentStep === 1}>
          <BlockTower series={compoundingSeries} active={currentStep === 1} />
        </div>
        <div class="frame" class:is-active={currentStep === 2}>
          <StackedBars rows={ownershipRows} title="Illustrative composition of a large private fortune" active={currentStep === 2} />
        </div>
        <div class="frame" class:is-active={currentStep === 3}>
          <BarChart data={inheritanceBars} maxValue={100} title="Where private wealth in rich economies came from" active={currentStep === 3} />
        </div>
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
            The tower stacks the same <strong>$200 a month</strong>, saved
            for 40 years: contribution blocks first, then the blocks that
            come from a 7% average annual return, stacking on top of them.
          </p>
          <p>
            Watch which color the tower is mostly made of by the end. The
            gap between the two totals — roughly <strong>$429,000</strong> —
            isn't extra saving. It's the return compounding on itself,
            decade after decade.
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
