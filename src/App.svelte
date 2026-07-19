<script>
  import { appData as data } from "./lib/data/load.js";
  import ActOne from "./lib/story/ActOne.svelte";
  import ActTwo from "./lib/story/ActTwo.svelte";
  import ActThree from "./lib/story/ActThree.svelte";
  import ActFour from "./lib/story/ActFour.svelte";
  import WheelGame from "./lib/components/WheelGame.svelte";

  // A quiet backdrop motif for the hero: coins scattered unevenly, a visual
  // echo of the essay's point before a single word of it is read.
  const MOTIF_N = 46;
  const motif = (() => {
    let seed = 271828;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: MOTIF_N }, (_, i) => ({
      x: 30 + rand() * 940,
      y: 30 + rand() * 580,
      r: 5 + rand() * rand() * 34,
      i,
    }));
  })();
</script>

<header class="hero">
  <svg class="hero-motif" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {#each motif as c}
      <circle cx={c.x} cy={c.y} r={c.r} class="motif-coin" />
      <circle cx={c.x} cy={c.y} r={c.r * 0.62} class="motif-coin-inner" />
    {/each}
  </svg>
  <div class="hero-inner">
    <p class="eyebrow">A visual essay on wealth</p>
    <h1>The Birth Lottery</h1>
    <p class="subtitle">
      What is wealth, who has it, and how much of it was decided the day you
      were born? This is a walk through how money accumulates, why it piles
      up so unevenly between countries and within them — and an interactive
      spin of the odds you were actually dealt.
    </p>
    <p class="data-note">
      Figures throughout are approximate, sourced and rounded for clarity —
      see the methodology note at the end.
    </p>
    <p class="scroll-hint">Scroll<span class="scroll-tick">|</span></p>
  </div>
</header>

<main>
  <ActOne {data} />
  <ActTwo {data} />
  <ActThree {data} />
  <ActFour {data} />
</main>

<WheelGame data={data.wheel} />

<section class="sources" aria-label="Methodology and sources">
  <div class="sources-inner">
    <h2>Methodology &amp; sources</h2>
    <p class="sources-intro">
      Every figure on this page is an <strong>approximation, rounded for
      readability</strong>. This is a work of explanation, not a primary
      research product — treat every number as "roughly," not "exactly."
    </p>
    <ul>
      <li>
        <strong>Wealth levels, the global pyramid, and millionaire
        counts</strong> — UBS/Credit Suisse, <em>Global Wealth Report
        2023</em> (data year 2022).
      </li>
      <li>
        <strong>Within-country wealth shares</strong> (top 10%, top 1%,
        bottom 50%) — World Inequality Database (WID), approximate figures
        for around 2022.
      </li>
      <li>
        <strong>Shares of world births</strong>, used to size the wheel —
        United Nations, World Population Prospects, approximate recent
        estimates. This measures a share of babies born today, not a share
        of total population.
      </li>
      <li>
        Wealth is measured in <strong>US dollars at market exchange
        rates</strong>, as in the source reports. Purchasing power differs
        by country, so a given dollar figure buys more in a lower-cost
        country than the raw number suggests.
      </li>
      <li>
        The household balance-sheet example in Act One, the compounding
        chart in Act Two, and the composition/inheritance figures in Act
        Two are <strong>illustrative examples</strong> built to demonstrate
        a mechanism, not measured statistics for any single country — see
        each chart's caption for its basis.
      </li>
      <li>
        Regional "rest of…" buckets in the wheel game are rough regional
        averages, a visibly weaker approximation than the named countries
        — they exist so the odds sum to a full 100% of world births.
      </li>
    </ul>
  </div>
</section>

<footer>
  <p>
    Built to explain a mechanism, not to rank people or places. If one
    number here matters more than the rest, it's this: almost none of it
    was up to you.
  </p>
</footer>

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
  }
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    background: radial-gradient(120% 90% at 80% 10%, var(--hero-ink) 0%, var(--hero-ink-deep) 100%);
    color: #ffffff;
    overflow: hidden;
  }
  .hero-motif {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    -webkit-mask-image: radial-gradient(ellipse 75% 65% at 44% 46%, transparent 0%, transparent 34%, #000 78%);
    mask-image: radial-gradient(ellipse 75% 65% at 44% 46%, transparent 0%, transparent 34%, #000 78%);
  }
  .motif-coin {
    fill: none;
    stroke: rgba(217, 169, 74, 0.22);
    stroke-width: 1.4;
  }
  .motif-coin-inner {
    fill: none;
    stroke: rgba(217, 169, 74, 0.14);
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }
  .hero-inner {
    position: relative;
    max-width: 700px;
    margin: 0 auto;
    padding: 48px 32px;
    width: 100%;
  }
  .eyebrow {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--hero-gold);
    font-weight: 600;
    margin: 0 0 28px;
  }
  h1 {
    font-family: var(--serif);
    font-weight: 700;
    font-size: clamp(52px, 10vw, 104px);
    line-height: 1.02;
    margin: 0 0 32px;
    letter-spacing: -0.01em;
    color: #ffffff;
  }
  .subtitle {
    font-size: 19px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.92);
    max-width: 580px;
    margin: 0 0 20px;
  }
  .data-note {
    font-size: 14px;
    color: var(--hero-gold);
    margin: 0 0 64px;
  }
  .scroll-hint {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    color: rgba(255, 255, 255, 0.55);
    text-align: center;
    margin: 0;
  }
  .scroll-tick {
    display: block;
    margin-top: 6px;
    animation: bob 2s ease-in-out infinite;
  }
  @keyframes bob {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(6px); opacity: 1; }
  }

  .sources {
    background: var(--surface-1);
    border-top: 1px solid var(--border);
  }
  .sources-inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 64px 24px;
  }
  .sources h2 {
    font-family: var(--serif);
    font-size: 22px;
    margin: 0 0 16px;
    color: var(--text-primary);
  }
  .sources-intro {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0 0 20px;
  }
  .sources ul {
    margin: 0;
    padding-left: 20px;
  }
  .sources li {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .sources li:last-child {
    margin-bottom: 0;
  }
  footer {
    padding: 40px 24px 80px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
    border-top: 1px solid var(--border);
    margin-top: 0;
    background: var(--page-plane);
  }
  footer p {
    max-width: 480px;
    margin: 0 auto;
  }
</style>
