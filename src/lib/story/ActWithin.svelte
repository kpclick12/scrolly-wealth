<script>
  import Scrolly from "../components/Scrolly.svelte";
  import Heatmap from "../components/Heatmap.svelte";

  let { data } = $props();
  let currentStep = $state(0);

  const countries = $derived(data.concentration.countries);
  const rowNames = $derived(countries.map((c) => c.name));
  const cols = ["Bottom 50%", "Middle 40%", "Next 9%", "Top 1%"];

  // One heatmap, one dataset, three stories — the persistent visual this
  // act needed. Cells never change; only which row/column is highlighted
  // (and everything else dimmed) does, per step.
  const cells = $derived(
    countries.flatMap((c) => {
      const middle40 = 100 - c.top10 - c.bottom50;
      const next9 = c.top10 - c.top1;
      return [
        { row: c.name, col: "Bottom 50%", value: c.bottom50 },
        { row: c.name, col: "Middle 40%", value: middle40 },
        { row: c.name, col: "Next 9%", value: next9 },
        { row: c.name, col: "Top 1%", value: c.top1 },
      ];
    })
  );

  const HIGHLIGHT_COL = { 0: "Top 1%", 1: "Bottom 50%", 2: null };
  const HIGHLIGHT_ROW = { 0: null, 1: null, 2: "South Africa" };
  const highlightCol = $derived(HIGHLIGHT_COL[currentStep] ?? null);
  const highlightRow = $derived(HIGHLIGHT_ROW[currentStep] ?? null);

  const steps = [
    { kicker: "Inside every country", headline: "Wealth concentrates more than income, everywhere" },
    { kicker: "The bottom half", headline: "In some places, owning nothing is optimistic" },
    { kicker: "Two forces at once", headline: "Your country sets the baseline. Your slice decides the rest." },
  ];
</script>

<section class="act" aria-label="Act 4: Within countries" style="--act-accent: var(--ink-red);">
  <div class="act-head">
    <p class="act-kicker">Act Four</p>
    <h2>Within countries</h2>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="visual-frame-stack" style="--stack-height:480px; --stack-height-mobile:clamp(460px, 40svh, 480px);">
        <div class="frame is-active">
          <Heatmap
            rows={rowNames}
            {cols}
            data={cells}
            title="Share of national wealth held by each group, approximate (~2022)"
            rowTitle="Country"
            colTitle="Wealth group"
            lowLabel="Small share"
            highLabel="Large share"
            {highlightRow}
            {highlightCol}
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
            Income is unequal almost everywhere. Wealth is <strong>always
            more unequal than income</strong>, in every country on this
            list. Look at the <strong>Top 1%</strong> column: in the United
            States it holds about <strong>35%</strong> of household wealth;
            in South Africa, about <strong>55%</strong>.
          </p>
          <p>
            Even that top 1% alone typically holds more than the entire
            bottom half combined — the fifth islander's lesson, replayed at
            national scale. Even on a rich island, who owns the land and the
            tools decides who keeps the harvest.
          </p>
        {:else if i === 1}
          <p>
            Now look at the <strong>Bottom 50%</strong> column instead. The
            number is small everywhere — a few percent of national wealth
            at best, for half the adult population.
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
            adult holds in another (Act Three). <strong>Where you land
            within that country</strong>, highlighted here in
            <strong>South Africa's row</strong> — the most extreme case on
            this map — then decides your slice of an already unequal pie.
          </p>
          <p>
            You don't get to choose either one. What you can do something
            about is what happens next: your own pile, and how it grows.
            Scroll on.
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
