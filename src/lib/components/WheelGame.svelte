<script>
  import { onMount } from "svelte";
  import { gsap } from "gsap";

  // wheel.json: { globalThresholds, entries: [{ id, name, type, birthShare, median, mean, millionairesPer100 }] }
  let { data } = $props();

  const entries = $derived(data.entries);
  const thresholds = $derived(data.globalThresholds);

  // Short codes for narrower slices — a full country name doesn't fit the
  // arc length available at this wheel's size, and a clipped/overlapping
  // label is worse than a compact one (see marks-and-anatomy: measure
  // first, never let text overflow its own mark).
  const SHORT_CODE = {
    india: "India",
    china: "China",
    nigeria: "NG",
    pakistan: "PK",
    drc: "DRC",
    indonesia: "ID",
    ethiopia: "ET",
    us: "US",
    bangladesh: "BD",
    brazil: "BR",
    philippines: "PH",
    egypt: "EG",
    mexico: "MX",
    japan: "JP",
  };

  // Fixed categorical hue order (dataviz palette) cycled across segments.
  // This is a spinner motif, not a magnitude comparison, so every segment
  // also carries a direct text label — identity never rests on hue alone.
  const HUES = [
    "var(--series-blue)",
    "var(--series-green)",
    "var(--series-magenta)",
    "var(--series-yellow)",
    "var(--series-aqua)",
    "var(--series-orange)",
    "var(--series-violet)",
    "var(--series-red)",
  ];

  const total = $derived(entries.reduce((a, e) => a + e.birthShare, 0));

  // Precompute each segment's angular span in degrees. 0deg = 12 o'clock,
  // increasing clockwise — matches the fixed pointer at the top.
  const segments = $derived.by(() => {
    let acc = 0;
    return entries.map((e, i) => {
      const start = (acc / total) * 360;
      acc += e.birthShare;
      const end = (acc / total) * 360;
      return { ...e, start, end, mid: (start + end) / 2, color: HUES[i % HUES.length] };
    });
  });

  const R = 160;
  const CX = 180;
  const CY = 180;

  function polar(angleDeg, r) {
    const rad = ((angleDeg - 0) * Math.PI) / 180;
    return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
  }

  function slicePath(seg) {
    const p1 = polar(seg.start, R);
    const p2 = polar(seg.end, R);
    const large = seg.end - seg.start > 180 ? 1 : 0;
    return `M ${CX},${CY} L ${p1.x},${p1.y} A ${R},${R} 0 ${large} 1 ${p2.x},${p2.y} Z`;
  }

  function labelTransform(seg) {
    const p = polar(seg.mid, R * 0.66);
    let rot = seg.mid;
    if (rot > 90 && rot < 270) rot += 180;
    return `translate(${p.x},${p.y}) rotate(${rot})`;
  }

  const fmtMoney = (v) =>
    v >= 1000000
      ? `$${(v / 1000000).toFixed(1)}M`
      : v >= 1000
        ? `$${Math.round(v / 1000)}k`
        : `$${Math.round(v)}`;

  let wheelEl;
  let rotation = $state(0);
  let spinning = $state(false);
  let resultEntry = $state(null);
  let history = $state([]);
  let reducedMotion = false;

  onMount(() => {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  function pickWeighted() {
    const r = Math.random() * total;
    let cum = 0;
    for (let i = 0; i < entries.length; i++) {
      cum += entries[i].birthShare;
      if (r <= cum) return i;
    }
    return entries.length - 1;
  }

  function spin() {
    if (spinning) return;
    spinning = true;
    resultEntry = null;

    // The result comes FIRST, drawn from the true birth-share distribution —
    // the animation only visualizes an outcome already decided, it never
    // determines it.
    const chosenIndex = pickWeighted();
    const seg = segments[chosenIndex];
    const width = seg.end - seg.start;
    const jitter = (Math.random() - 0.5) * width * 0.7;
    const targetMid = seg.mid + jitter;

    const currentMod = ((rotation % 360) + 360) % 360;
    const desiredMod = (360 - targetMid + 360) % 360;
    const extraSpins = 5;
    const delta = extraSpins * 360 + ((desiredMod - currentMod + 360) % 360);
    const newRotation = rotation + delta;

    if (reducedMotion) {
      rotation = newRotation;
      if (wheelEl) wheelEl.style.transform = `rotate(${newRotation}deg)`;
      resultEntry = entries[chosenIndex];
      history = [...history, entries[chosenIndex]];
      spinning = false;
      return;
    }

    gsap.to(wheelEl, {
      rotation: newRotation,
      duration: 3.4,
      ease: "power3.out",
      onComplete: () => {
        rotation = newRotation;
        resultEntry = entries[chosenIndex];
        history = [...history, entries[chosenIndex]];
        spinning = false;
      },
    });
  }

  function positionLabel(entry) {
    const m = entry.median;
    if (m >= thresholds.top1) return "in the world's top 1%";
    if (m >= thresholds.top10) return "in the world's top 10%";
    if (m >= thresholds.richerHalf) return "in the richer half of the world";
    return "in the poorer half of the world";
  }

  function millionaireOdds(entry) {
    if (entry.millionairesPer100 <= 0) return "essentially none";
    const oneIn = Math.round(100 / entry.millionairesPer100);
    return `about 1 in ${oneIn.toLocaleString("en-US")}`;
  }
</script>

<section class="wheel-game" id="game" aria-label="Spin the wheel of birth">
  <div class="wheel-game-inner">
    <div class="game-intro">
      <p class="kicker">The game</p>
      <h2>Spin the wheel of birth</h2>
      <p>
        Every segment below is sized by that country or region's share of
        this year's <strong>world births</strong> — not its population, its
        share of babies born today. Spin the wheel and see where you land.
        Then look at what that birthplace means for a typical adult's wealth.
      </p>
    </div>

    <div class="game-board">
      <div class="wheel-wrap">
        <div class="pointer" aria-hidden="true"></div>
        <svg
          bind:this={wheelEl}
          class="wheel"
          viewBox="0 0 360 360"
          role="img"
          aria-label="Wheel of birth, segments sized by share of world births"
        >
          {#each segments as seg}
            <path d={slicePath(seg)} fill={seg.color} class="slice" stroke="var(--page-plane)" stroke-width="1.5">
              <title>{seg.name}: {seg.birthShare}% of world births</title>
            </path>
            {#if seg.end - seg.start > 15}
              <text transform={labelTransform(seg)} class="slice-label" text-anchor="middle">
                {SHORT_CODE[seg.id] ?? (seg.name.length > 12 ? seg.name.split(" ")[0] : seg.name)}
              </text>
            {/if}
          {/each}
          <circle cx={CX} cy={CY} r="26" class="hub" />
        </svg>
      </div>

      <div class="game-side">
        <button
          class="spin-btn"
          onclick={spin}
          disabled={spinning}
          aria-label={spinning ? "Spinning the wheel of birth" : history.length ? "Spin the wheel of birth again" : "Spin the wheel of birth"}
        >
          {spinning ? "Spinning…" : history.length ? "Spin again" : "Spin the wheel"}
        </button>

        {#if resultEntry}
          {@const e = resultEntry}
          <div class="result-card" role="status" aria-live="polite">
            <p class="result-kicker">You were born in</p>
            <h3 class="result-name">{e.name}{e.type === "region" ? " (regional average)" : ""}</h3>
            <p class="result-share">{e.birthShare}% of the world's babies are born here</p>
            <dl class="result-stats">
              <div>
                <dt>Median wealth per adult</dt>
                <dd>{fmtMoney(e.median)}</dd>
              </div>
              <div>
                <dt>Mean wealth per adult</dt>
                <dd>{fmtMoney(e.mean)}</dd>
              </div>
              <div>
                <dt>Odds of being a dollar-millionaire</dt>
                <dd>{millionaireOdds(e)}</dd>
              </div>
            </dl>
            <p class="result-sentence">
              A typical adult here holds about <strong>{fmtMoney(e.median)}</strong>
              in net worth — that's {positionLabel(e)}, globally.
            </p>
          </div>
        {:else}
          <div class="result-placeholder">
            <p>Spin to find out where the birth lottery sends you.</p>
          </div>
        {/if}

        {#if history.length}
          <div class="tally">
            <p class="tally-label">
              You've been born {history.length} time{history.length === 1 ? "" : "s"}:
            </p>
            <p class="tally-list">
              {history.map((h) => h.name).join(", ")}
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .wheel-game {
    background: var(--hero-ink);
    padding: 90px 24px;
  }
  .wheel-game-inner {
    max-width: 1000px;
    margin: 0 auto;
  }
  .game-intro {
    max-width: 640px;
    margin: 0 auto 48px;
    text-align: center;
  }
  .kicker {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--hero-gold);
    font-weight: 700;
    margin: 0 0 12px;
  }
  .game-intro h2 {
    font-family: var(--serif);
    font-size: clamp(28px, 4.4vw, 42px);
    color: #ffffff;
    margin: 0 0 18px;
  }
  .game-intro p {
    color: rgba(255, 255, 255, 0.82);
    font-size: 16px;
    line-height: 1.6;
  }
  .game-board {
    display: grid;
    /* Bare 1fr is minmax(auto, 1fr) — content in .game-side (e.g. the
       result card's stats) could otherwise force this track, and the page,
       wider than the viewport at a large font size. */
    grid-template-columns: 380px minmax(0, 1fr);
    gap: 48px;
    align-items: start;
  }
  .wheel-wrap {
    position: relative;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
  }
  .wheel {
    width: 100%;
    height: auto;
    display: block;
    filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.4));
  }
  .slice {
    cursor: default;
  }
  .slice-label {
    font-size: 9px;
    font-weight: 700;
    fill: #ffffff;
    paint-order: stroke;
    stroke: rgba(0, 0, 0, 0.35);
    stroke-width: 2px;
    pointer-events: none;
  }
  .hub {
    fill: var(--hero-ink);
    stroke: var(--hero-gold);
    stroke-width: 3;
  }
  .pointer {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-top: 22px solid var(--hero-gold);
    z-index: 2;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }
  .game-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .spin-btn {
    align-self: flex-start;
    font: inherit;
    font-weight: 700;
    font-size: 15px;
    color: #201a12;
    background: var(--hero-gold);
    border: none;
    border-radius: 999px;
    padding: 14px 30px;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .spin-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .spin-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .spin-btn:focus-visible {
    outline: 2px solid var(--hero-gold);
    outline-offset: 3px;
  }
  .result-placeholder {
    background: rgba(255, 255, 255, 0.06);
    border: 1px dashed rgba(255, 255, 255, 0.25);
    border-radius: 10px;
    padding: 28px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
  }
  .result-card {
    background: var(--hero-ink-deep);
    border: 1px solid rgba(217, 169, 74, 0.35);
    border-radius: 12px;
    padding: 24px 26px;
    color: #ffffff;
  }
  .result-kicker {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.55);
    margin: 0 0 6px;
  }
  .result-name {
    font-family: var(--serif);
    font-size: 28px;
    margin: 0 0 6px;
    color: var(--hero-gold);
  }
  .result-share {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 18px;
  }
  .result-stats {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
    margin: 0 0 16px;
  }
  .result-stats > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .result-stats dt {
    font-size: 11.5px;
    color: rgba(255, 255, 255, 0.55);
  }
  .result-stats dd {
    margin: 0;
    font-family: var(--serif);
    font-size: 19px;
    font-weight: 700;
    color: #ffffff;
    font-variant-numeric: tabular-nums;
  }
  .result-sentence {
    font-size: 14.5px;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.9);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 14px;
    margin: 0;
  }
  .tally {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
  .tally-label {
    font-weight: 700;
    margin: 0 0 4px;
    color: rgba(255, 255, 255, 0.8);
  }
  .tally-list {
    margin: 0;
    line-height: 1.6;
  }
  @media (max-width: 860px) {
    .wheel-game {
      padding: 60px 18px;
    }
    .game-board {
      grid-template-columns: minmax(0, 1fr);
      gap: 32px;
    }
    .result-stats {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
