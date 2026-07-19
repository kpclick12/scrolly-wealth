<script>
  import { untrack } from "svelte";
  import { scaleLog } from "d3-scale";

  // countries: [{ name, median }] from src/data/countries.json
  // percentiles: { anchors: [{ netWorth, percentile }], source, note } from
  // src/data/globalPercentiles.json
  let { countries = [], percentiles = { anchors: [] } } = $props();

  const sortedCountries = $derived(
    [...countries].sort((a, b) => a.name.localeCompare(b.name))
  );

  function medianFor(name) {
    return countries.find((c) => c.name === name)?.median ?? 0;
  }

  // Read once, untracked — this only seeds the initial state below and
  // deliberately never re-runs when the (static, bundled) countries prop
  // is re-referenced elsewhere.
  const DEFAULT_COUNTRY = untrack(() =>
    countries.some((c) => c.name === "United States") ? "United States" : (countries[0]?.name ?? "")
  );

  let selectedCountry = $state(DEFAULT_COUNTRY);
  let wealth = $state(untrack(() => medianFor(DEFAULT_COUNTRY)));
  let touched = $state(false);

  // The wealth field defaults to the selected country's median, and keeps
  // tracking it as the country changes — right up until the reader actually
  // touches the wealth control themselves. After that, their number sticks,
  // which is the whole point of the "typical adult moves, you don't" trick.
  $effect(() => {
    if (!touched) {
      wealth = medianFor(selectedCountry);
    }
  });

  const countryMedian = $derived(medianFor(selectedCountry));

  // ---- Log-scale slider <-> dollar mapping -------------------------------
  // Slider position 0 is a dedicated "≤ $0" stop (debt or exactly zero).
  // Positions 1..SLIDER_MAX_POS map log-uniformly across $100 .. $10,000,000
  // — the same domain as the centerpiece axis below, so slider and axis
  // always agree on where a dollar figure sits.
  const AXIS_MIN = 100;
  const AXIS_MAX = 10_000_000;
  const SLIDER_MAX_POS = 1000;
  const LOG_MIN = Math.log10(AXIS_MIN);
  const LOG_MAX = Math.log10(AXIS_MAX);
  const WEALTH_INPUT_MIN = -1_000_000;
  const WEALTH_INPUT_MAX = 100_000_000;

  function wealthToSliderPos(w) {
    if (w == null || w <= 0) return 0;
    const clamped = Math.min(Math.max(w, AXIS_MIN), AXIS_MAX);
    const t = (Math.log10(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return Math.round(1 + t * (SLIDER_MAX_POS - 1));
  }
  function sliderPosToWealth(pos) {
    if (pos <= 0) return 0;
    const t = (pos - 1) / (SLIDER_MAX_POS - 1);
    return Math.round(10 ** (LOG_MIN + t * (LOG_MAX - LOG_MIN)));
  }

  const sliderPos = $derived(wealthToSliderPos(wealth));

  const SLIDER_TICK_VALUES = [
    { label: "≤$0", value: 0 },
    { label: "$1k", value: 1000 },
    { label: "$10k", value: 10000 },
    { label: "$100k", value: 100000 },
    { label: "$1M", value: 1000000 },
    { label: "$10M", value: 10000000 },
  ];
  const sliderTicks = SLIDER_TICK_VALUES.map((t) => ({
    ...t,
    pct: t.value === 0 ? 0 : (wealthToSliderPos(t.value) / SLIDER_MAX_POS) * 100,
  }));

  function handleSliderInput(e) {
    touched = true;
    wealth = sliderPosToWealth(Number(e.currentTarget.value));
  }
  function handleNumberInput(e) {
    touched = true;
    const raw = e.currentTarget.value;
    if (raw === "" || raw === "-") {
      wealth = 0;
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    wealth = Math.max(WEALTH_INPUT_MIN, Math.min(WEALTH_INPUT_MAX, n));
  }

  // ---- Formatting ----------------------------------------------------------
  function trimNum(n) {
    return Number(n.toFixed(2)).toString();
  }
  function fmtMoney(v) {
    const sign = v < 0 ? "-" : "";
    const av = Math.abs(v);
    if (av >= 1_000_000) {
      const m = av / 1_000_000;
      const s = m >= 100 ? Math.round(m) : Math.round(m * 100) / 100;
      return `${sign}$${trimNum(s)}M`;
    }
    if (av >= 1000) {
      const k = av / 1000;
      const s = k >= 100 ? Math.round(k) : Math.round(k * 10) / 10;
      return `${sign}$${trimNum(s)}k`;
    }
    return `${sign}$${Math.round(av).toLocaleString("en-US")}`;
  }
  function wealthReadout(w) {
    if (w > 0) return fmtMoney(w);
    if (w === 0) return "$0";
    return `${fmtMoney(Math.abs(w))} in debt`;
  }

  // ---- Global percentile: log-linear interpolation between GWR anchors ----
  // Anchors approximate a global adult wealth distribution. Below the first
  // positive anchor there's no log to interpolate against (log(0) is
  // undefined), so ≤$0 is a flat floor rather than a curve; above the last
  // anchor, position is clamped and reported as "top 0.1%" rather than
  // extrapolated further.
  function computePercentile(w, anchors) {
    if (!anchors || !anchors.length) return { percentile: 50, clampedLow: false, clampedHigh: false };
    const floor = anchors[0];
    const top = anchors[anchors.length - 1];
    if (w <= 0) return { percentile: floor.percentile, clampedLow: true, clampedHigh: false };
    if (w >= top.netWorth) return { percentile: top.percentile, clampedLow: false, clampedHigh: true };
    // Treat the floor anchor as sitting at $1 (not $0) purely for the log
    // interpolation math between it and the first positive anchor.
    const pts = anchors.map((a, i) => (i === 0 ? { netWorth: 1, percentile: a.percentile } : a));
    for (let i = 1; i < pts.length; i++) {
      if (w <= pts[i].netWorth) {
        const lo = pts[i - 1];
        const hi = pts[i];
        const t = (Math.log10(w) - Math.log10(lo.netWorth)) / (Math.log10(hi.netWorth) - Math.log10(lo.netWorth));
        const p = lo.percentile + t * (hi.percentile - lo.percentile);
        return { percentile: Math.max(floor.percentile, Math.min(top.percentile, p)), clampedLow: false, clampedHigh: false };
      }
    }
    return { percentile: top.percentile, clampedLow: false, clampedHigh: true };
  }
  function formatPercentile(p) {
    if (p.clampedHigh) return "top 0.1%";
    if (p.percentile >= 99) return `about ${p.percentile.toFixed(1)}%`;
    return `about ${Math.round(p.percentile)}%`;
  }

  const pct = $derived(computePercentile(wealth, percentiles.anchors));

  // ---- Within-country multiple ---------------------------------------------
  function formatMultiple(ratio) {
    const n = ratio < 10 ? Math.round(ratio * 10) / 10 : Math.round(ratio);
    return n.toLocaleString("en-US");
  }
  const FRACTION_WORDS = [
    [2, "half"], [3, "a third"], [4, "a quarter"], [5, "a fifth"],
    [6, "a sixth"], [8, "an eighth"], [10, "a tenth"], [20, "a twentieth"],
    [50, "a fiftieth"], [100, "a hundredth"],
  ];
  function formatFractionClause(ratio) {
    const frac = 1 / ratio;
    for (const [f, word] of FRACTION_WORDS) {
      if (Math.abs(frac - f) / f < 0.1) return `about ${word} of`;
    }
    return `about ${Math.round(ratio * 100) / 100}×`;
  }
  function withinCountryPhrase(w, median, country) {
    if (!country || median <= 0) return "";
    if (w < 0) {
      return `You currently owe more than you own — about ${fmtMoney(Math.abs(w))} underwater. For reference, a typical adult in ${country} holds about ${fmtMoney(median)}.`;
    }
    if (w === 0) {
      return `You're right at zero net wealth. For reference, a typical adult in ${country} holds about ${fmtMoney(median)}.`;
    }
    const ratio = w / median;
    if (ratio >= 0.96 && ratio <= 1.04) {
      return `That's about the same as the typical adult in ${country}.`;
    }
    if (ratio > 1) {
      return `That's about ${formatMultiple(ratio)}× the typical adult in ${country}.`;
    }
    return `That's ${formatFractionClause(ratio)} the typical adult in ${country}.`;
  }

  const countryPhrase = $derived(withinCountryPhrase(wealth, countryMedian, selectedCountry));

  // ---- Centerpiece axis: $100 .. $10M, log scale ---------------------------
  const axisScale = scaleLog().domain([AXIS_MIN, AXIS_MAX]).range([0, 100]).clamp(true);
  const AXIS_TICK_VALUES = [100, 1000, 10000, 100000, 1000000, 10000000];
  const axisTicks = AXIS_TICK_VALUES.map((v) => ({ label: fmtTickLabel(v), pct: axisScale(v) }));
  function fmtTickLabel(v) {
    if (v >= 1_000_000) return `$${v / 1_000_000}M`;
    if (v >= 1000) return `$${v / 1000}k`;
    return `$${v}`;
  }

  const globalMedianValue = $derived(percentiles.anchors?.find((a) => a.percentile === 50)?.netWorth ?? 8700);
  const globalTop10Value = $derived(percentiles.anchors?.find((a) => a.percentile === 90)?.netWorth ?? 140000);
  const globalTop1Value = $derived(percentiles.anchors?.find((a) => a.percentile === 99)?.netWorth ?? 1080000);

  // Priority order matters: YOU and the country's typical adult get first
  // pick of the least-crowded lanes, since their juxtaposition is the point
  // of this whole visual. The three fixed global reference points fill in
  // around them.
  const markers = $derived([
    { id: "you", role: "you", label: "YOU", value: wealth, color: "var(--hero-gold)" },
    { id: "country", role: "country", label: `Typical adult, ${selectedCountry}`, value: countryMedian, color: "var(--series-aqua)" },
    { id: "gmedian", role: "global", label: "Global median adult", value: globalMedianValue, color: "rgba(255,255,255,0.6)" },
    { id: "gtop10", role: "global", label: "Global top 10%", value: globalTop10Value, color: "rgba(255,255,255,0.6)" },
    { id: "gtop1", role: "global", label: "Global top 1%", value: globalTop1Value, color: "rgba(255,255,255,0.6)" },
  ]);

  const LANES = [
    { side: "up", tier: 1 }, { side: "down", tier: 1 },
    { side: "up", tier: 2 }, { side: "down", tier: 2 },
    { side: "up", tier: 3 }, { side: "down", tier: 3 },
  ];
  let axisPxWidth = $state(0);

  // A single flat gap can't be right for every pair: "YOU" is three
  // characters, "Typical adult, United States" is thirty. The required
  // separation between two markers sharing a lane is the sum of their own
  // label half-widths (estimated from character count) plus a fixed
  // padding — converted from real pixels into a percentage of the axis's
  // actual measured width, so the same label doesn't fit fine on a wide
  // desktop axis and then collide once the axis narrows on a phone.
  function estimateHalfWidthPx(label, valueText) {
    const longest = Math.max(label.length, valueText.length);
    return Math.max(28, longest * 3.3) + 6;
  }
  const GAP_PAD_PX = 8;

  const laidOut = $derived.by(() => {
    const occupied = LANES.map(() => []); // [{ pct, halfWidthPct }]
    const out = [];
    for (const m of markers) {
      const raw = m.value;
      const clampedValue = Math.min(Math.max(raw <= 0 ? AXIS_MIN : raw, AXIS_MIN), AXIS_MAX);
      const p = axisScale(clampedValue);
      const halfWidthPx = estimateHalfWidthPx(m.label, fmtMoney(m.value));
      const halfWidthPct = axisPxWidth > 0 ? (halfWidthPx / axisPxWidth) * 100 : 12;
      const padPct = axisPxWidth > 0 ? (GAP_PAD_PX / axisPxWidth) * 100 : 2;
      let laneIndex = LANES.length - 1;
      for (let i = 0; i < LANES.length; i++) {
        const collides = occupied[i].some(
          (seen) => Math.abs(seen.pct - p) < seen.halfWidthPct + halfWidthPct + padPct
        );
        if (!collides) {
          laneIndex = i;
          break;
        }
      }
      occupied[laneIndex].push({ pct: p, halfWidthPct });
      out.push({
        ...m,
        pct: p,
        lane: LANES[laneIndex],
        offScaleLow: raw < AXIS_MIN,
        offScaleHigh: raw > AXIS_MAX,
      });
    }
    return out;
  });

  const axisAriaLabel = $derived(
    `Wealth ladder from $100 to $10 million, log scale. You are at ${wealthReadout(wealth)}. ` +
      `Global median adult: ${fmtMoney(globalMedianValue)}. Global top 10%: ${fmtMoney(globalTop10Value)}. ` +
      `Global top 1%: ${fmtMoney(globalTop1Value)}. Typical adult in ${selectedCountry}: ${fmtMoney(countryMedian)}.`
  );
</script>

<section class="stand-explorer" id="explore" aria-label="Explore where you stand">
  <div class="explorer-inner">
    <div class="explorer-intro">
      <p class="kicker">Now check your hand</p>
      <h2>Explore: where do you stand?</h2>
      <p>
        The wheel above dealt you a random birth. This part is not random —
        tell us where you actually live and roughly what you're worth, and
        we'll place you on the same ladder as the rest of the world.
      </p>
    </div>

    <div class="controls">
      <div class="control">
        <label for="stand-country">Where do you live?</label>
        <select id="stand-country" bind:value={selectedCountry}>
          {#each sortedCountries as c (c.name)}
            <option value={c.name}>{c.name}</option>
          {/each}
        </select>
      </div>

      <div class="control control-wealth">
        <label for="stand-wealth-number">
          Your net wealth — everything you own minus everything you owe
        </label>
        <div class="wealth-inputs">
          <input
            id="stand-wealth-range"
            class="wealth-range"
            type="range"
            min="0"
            max={SLIDER_MAX_POS}
            step="1"
            value={sliderPos}
            oninput={handleSliderInput}
            aria-label="Net wealth, log-scale slider, dollars"
            aria-describedby="stand-wealth-readout"
          />
          <div class="wealth-number">
            <span class="currency" aria-hidden="true">$</span>
            <input
              id="stand-wealth-number"
              type="number"
              inputmode="numeric"
              step="100"
              value={wealth}
              oninput={handleNumberInput}
            />
          </div>
        </div>
        <div class="slider-ticks" aria-hidden="true">
          {#each sliderTicks as t}
            <span class="tick" style="left:{t.pct}%">{t.label}</span>
          {/each}
        </div>
        <p class="wealth-readout" id="stand-wealth-readout">
          Your net wealth: <strong>{wealthReadout(wealth)}</strong>
        </p>
      </div>
    </div>

    <div class="result-card">
      <p class="result-line percentile-line">
        {#if pct.clampedHigh}
          You're in the world's <strong>top 0.1%</strong> by net wealth.
        {:else}
          You're richer than <strong>{formatPercentile(pct)}</strong> of the world's adults.
        {/if}
      </p>
      <p class="result-line country-line">{countryPhrase}</p>

      <div class="axis-visual">
        <div class="markers-zone" role="img" aria-label={axisAriaLabel} bind:clientWidth={axisPxWidth}>
          <div class="backbone" aria-hidden="true"></div>
          {#each laidOut as m (m.id)}
            <div
              class="marker marker-{m.role}"
              class:edge-start={m.pct < 8}
              class:edge-end={m.pct > 92}
              data-side={m.lane.side}
              style="left:{m.pct}%; --tier:{m.lane.tier}; --dot-color:{m.color};"
              aria-hidden="true"
            >
              <span class="stem"></span>
              <span class="dot"></span>
              <span class="label">
                <span class="label-name">{m.label}</span>
                <span class="label-value"
                  >{m.offScaleLow ? "◂ " : ""}{fmtMoney(m.value)}{m.offScaleHigh ? " ▸" : ""}</span
                >
              </span>
            </div>
          {/each}
        </div>
        <div class="axis-ticks" aria-hidden="true">
          {#each axisTicks as t}
            <span class="axis-tick" style="left:{t.pct}%">{t.label}</span>
          {/each}
        </div>
      </div>

      <p class="closing-line">
        Spin the wheel above again — the exact same net worth you just typed
        in would land on a completely different rung of this ladder,
        depending only on where the wheel happened to stop.
      </p>
    </div>
  </div>
</section>

<style>
  .stand-explorer {
    background: var(--hero-ink);
    padding: 90px 24px 100px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .explorer-inner {
    max-width: 900px;
    margin: 0 auto;
  }
  .explorer-intro {
    max-width: 640px;
    margin: 0 auto 44px;
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
  .explorer-intro h2 {
    font-family: var(--serif);
    font-size: clamp(28px, 4.4vw, 42px);
    color: #ffffff;
    margin: 0 0 18px;
  }
  .explorer-intro p {
    color: rgba(255, 255, 255, 0.82);
    font-size: 16px;
    line-height: 1.6;
  }

  .controls {
    display: grid;
    grid-template-columns: minmax(180px, 280px) 1fr;
    gap: 28px;
    align-items: start;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px 26px;
    margin-bottom: 32px;
  }
  .control {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .control label {
    font-size: 12.5px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.4;
  }
  select#stand-country {
    font: inherit;
    font-size: 15px;
    color: #ffffff;
    background: var(--hero-ink-deep);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
  }
  select#stand-country:focus-visible {
    outline: 2px solid var(--hero-gold);
    outline-offset: 2px;
  }

  .wealth-inputs {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  input.wealth-range {
    flex: 1;
    min-width: 0;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    background: linear-gradient(
      to right,
      rgba(217, 169, 74, 0.25),
      rgba(217, 169, 74, 0.7)
    );
    border-radius: 999px;
    outline-offset: 4px;
  }
  input.wealth-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--hero-gold);
    border: 3px solid var(--hero-ink-deep);
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  }
  input.wealth-range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--hero-gold);
    border: 3px solid var(--hero-ink-deep);
    cursor: pointer;
  }
  input.wealth-range:focus-visible {
    outline: 2px solid var(--hero-gold);
  }

  .wealth-number {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    background: var(--hero-ink-deep);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    padding: 0 10px;
  }
  .wealth-number .currency {
    color: rgba(255, 255, 255, 0.55);
    font-size: 15px;
  }
  .wealth-number input[type="number"] {
    font: inherit;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    color: #ffffff;
    background: transparent;
    border: none;
    width: 118px;
    padding: 10px 6px;
  }
  .wealth-number input[type="number"]:focus-visible {
    outline: 2px solid var(--hero-gold);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .slider-ticks {
    position: relative;
    height: 16px;
    margin-top: -4px;
  }
  .slider-ticks .tick {
    position: absolute;
    transform: translateX(-50%);
    font-size: 10.5px;
    color: rgba(255, 255, 255, 0.45);
    white-space: nowrap;
  }
  .slider-ticks .tick:first-child {
    transform: translateX(0);
  }
  .slider-ticks .tick:last-child {
    transform: translateX(-100%);
  }

  .wealth-readout {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin: 2px 0 0;
  }
  .wealth-readout strong {
    color: var(--hero-gold);
    font-variant-numeric: tabular-nums;
  }

  .result-card {
    background: var(--hero-ink-deep);
    border: 1px solid rgba(217, 169, 74, 0.35);
    border-radius: 12px;
    padding: 30px 30px 26px;
  }
  .result-line {
    font-family: var(--serif);
    font-size: 21px;
    line-height: 1.4;
    color: #ffffff;
    margin: 0 0 8px;
  }
  .result-line strong {
    color: var(--hero-gold);
  }
  .country-line {
    font-family: var(--sans);
    font-size: 15px;
    color: rgba(255, 255, 255, 0.82);
    margin: 0 0 34px;
  }

  /* ---- Axis visual ---- */
  .axis-visual {
    margin-bottom: 26px;
  }
  .markers-zone {
    position: relative;
    height: 360px;
    /* Must be >= the rendered height of a two-line marker label (name +
       value), or successive tiers overlap instead of stacking cleanly. */
    --tier-px: 36px;
  }
  .backbone {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.18);
  }
  .marker {
    position: absolute;
    top: 50%;
    width: 0;
  }
  .marker .dot {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--dot-color);
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 3px rgba(20, 17, 12, 0.6);
    transition: left 0.5s ease;
  }
  .marker.marker-you .dot {
    width: 15px;
    height: 15px;
    box-shadow: 0 0 0 4px rgba(217, 169, 74, 0.25);
  }
  .marker .stem {
    position: absolute;
    left: 0;
    width: 2px;
    background: var(--dot-color);
    opacity: 0.5;
    transform: translateX(-50%);
  }
  .marker[data-side="up"] .stem {
    bottom: 6px;
    height: calc(var(--tier) * var(--tier-px, 26px));
  }
  .marker[data-side="down"] .stem {
    top: 6px;
    height: calc(var(--tier) * var(--tier-px, 26px));
  }
  .marker .label {
    position: absolute;
    left: 0;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    white-space: nowrap;
    line-height: 1.3;
  }
  .marker.edge-start .label {
    transform: translateX(0);
    align-items: flex-start;
  }
  .marker.edge-end .label {
    transform: translateX(-100%);
    align-items: flex-end;
  }
  .marker[data-side="up"] .label {
    bottom: calc(6px + (var(--tier) * var(--tier-px, 26px)) + 8px);
  }
  .marker[data-side="down"] .label {
    top: calc(6px + (var(--tier) * var(--tier-px, 26px)) + 8px);
  }
  .label-name {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
  }
  .marker-you .label-name {
    color: var(--hero-gold);
    font-size: 13px;
  }
  .marker-country .label-name {
    color: var(--series-aqua);
  }
  .label-value {
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    color: rgba(255, 255, 255, 0.6);
  }

  .axis-ticks {
    position: relative;
    height: 18px;
    margin-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .axis-tick {
    position: absolute;
    top: 6px;
    transform: translateX(-50%);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
  }
  .axis-tick:first-child {
    transform: translateX(0);
  }
  .axis-tick:last-child {
    transform: translateX(-100%);
  }

  .closing-line {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.75);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 16px;
    margin: 0;
  }

  @media (max-width: 860px) {
    .stand-explorer {
      padding: 60px 16px 70px;
    }
    .controls {
      grid-template-columns: 1fr;
      padding: 18px 18px;
      gap: 22px;
    }
    .result-card {
      padding: 22px 18px 20px;
    }
    .result-line {
      font-size: 18px;
    }
    .markers-zone {
      height: 330px;
      --tier-px: 34px;
    }
    .label-name {
      font-size: 11px;
    }
    .label-value {
      font-size: 10.5px;
    }
    .wealth-inputs {
      flex-wrap: wrap;
    }
    input.wealth-range {
      flex: 1 1 100%;
    }
  }
</style>
