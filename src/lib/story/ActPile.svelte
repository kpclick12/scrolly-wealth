<script>
  import Scrolly from "../components/Scrolly.svelte";
  import NetWorthDiagram from "../components/NetWorthDiagram.svelte";
  import BlockTower from "../components/BlockTower.svelte";
  import BarChart from "../components/BarChart.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const ex = $derived(data.netWorth.example);
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
    { kicker: "Your own island", headline: "What you own, minus what you owe" },
    { kicker: "The accelerator", headline: "Saving is slow. Compounding does the heavy lifting." },
    { kicker: "The head start", headline: "Large fortunes are usually owned, not earned — and often inherited" },
  ];
</script>

<section class="act" aria-label="Act 5: Building your own pile" style="--act-accent: var(--ink-gold);">
  <div class="act-head">
    <p class="act-kicker">Act Five</p>
    <h2>Building your own pile</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:460px; --stack-height-mobile:380px;">
        <div class="frame" class:is-active={currentStep === 0}>
          <NetWorthDiagram assets={ex.assets} debts={ex.debts} netWorth={ex.netWorth} active={currentStep === 0} />
        </div>
        <div class="frame" class:is-active={currentStep === 1}>
          <BlockTower series={compoundingSeries} active={currentStep === 1} />
        </div>
        <div class="frame" class:is-active={currentStep === 2}>
          <BarChart data={inheritanceBars} maxValue={100} title="Where private wealth in rich economies came from" active={currentStep === 2} />
        </div>
      </div>
    {/snippet}

    {#each steps as step, i}
      <section class="scrolly-step" data-index={i}>
        <p class="kicker">{step.kicker}</p>
        <h3>{step.headline}</h3>
        {#if i === 0}
          <p>
            Zoom all the way in — to the island that's actually yours.
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
            The most familiar way to build wealth is to <strong>spend less
            than you earn</strong> and set the rest aside. It works, but
            it's slow — left alone, the reservoir fills at the pace of the
            paycheck and not much faster.
          </p>
          <p>
            Put that saved money to work, and it's the island's third beat
            again: a better technique, applied to your own pile — same
            hours, more output. The tower stacks the same <strong>$200 a
            month</strong>, saved for 40 years: contribution blocks first,
            then the blocks from a 7% average annual return, stacking on
            top. Watch which color the tower is mostly made of by the end —
            the gap, roughly <strong>$429,000</strong>, isn't extra saving.
            It's the return compounding on itself, decade after decade.
          </p>
        {:else if i === 2}
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
            than built from a lifetime of saving. Which island, which
            family, which fifth islander got the field: none of that was up
            to you. Scroll down, and spin the wheel to find out where you
            actually landed.
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
