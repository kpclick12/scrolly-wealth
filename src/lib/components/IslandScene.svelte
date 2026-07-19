<script>
  // A single persistent island scene that evolves across all seven steps of
  // the opening parable, rather than swapping between separate illustrations.
  // Figures fade/scale in as they "arrive" (gated by their arrival step) and
  // never leave; only their carried icon, the arrows between them, and the
  // pile of blocks at their feet change. Reduced-motion users get the same
  // end state instantly — Svelte's `in:` transitions aren't covered by the
  // CSS-level reduced-motion override in app.css, so they're gated here too.
  // figures: island.json's `figures` — [{ id, arrival, icon, color, label, pile:[7] }]
  import { fly } from "svelte/transition";

  let { figures = [], step = 0, fifthState = "takes" } = $props();

  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flyIn = reduced ? { duration: 0 } : { y: 16, duration: 480 };

  const W = 640;
  const H = 380;
  const GROUND_Y = 272;
  const PILE_ROW_Y = 344; // separate row, below the figures' feet — piles must
  // never visually merge with the body they belong to, so they get their own
  // strip of sand near the bottom of the island instead of growing upward
  // from the same spot the figure stands on.
  const SLOT_X = [140, 250, 320, 400, 500];
  const BLOCK_W = 16;
  const BLOCK_H = 4;
  const BLOCK_STEP = 5.4;

  const present = $derived(figures.filter((f) => step >= f.arrival));
  const isFire = $derived(step === 4);
  const isRebuilt = $derived(step >= 5);
  const hasFarmland = $derived(step >= 2);
  const showTradeArrows = $derived(step === 1);
  const showFifthArrows = $derived(step === 3);
  const showEnergy = $derived(step >= 5);
</script>

<figure class="island-fig">
  <svg
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    aria-label="An illustrated island whose population, trade and total wealth grow through the story"
  >
    <defs>
      <marker id="island-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 Z" fill="currentColor" />
      </marker>
    </defs>

    <!-- Sky / water -->
    <rect class="water" x="0" y="0" width={W} height={H} />
    <g class="sun" class:bright={showEnergy}>
      <circle class="sun-halo" cx="560" cy="58" r={showEnergy ? 40 : 26} />
      <circle class="sun-core" cx="560" cy="58" r="20" />
      {#each Array.from({ length: 8 }) as _, i}
        {@const a = (i / 8) * Math.PI * 2}
        <line
          class="sun-ray"
          x1={560 + Math.cos(a) * 26}
          y1={58 + Math.sin(a) * 26}
          x2={560 + Math.cos(a) * (showEnergy ? 40 : 33)}
          y2={58 + Math.sin(a) * (showEnergy ? 40 : 33)}
        />
      {/each}
    </g>

    <!-- Island landmass -->
    <ellipse class="island-land" cx="320" cy="300" rx="270" ry="66" />
    <ellipse class="island-grass" cx="320" cy="284" rx="240" ry="46" />

    <!-- Farmland plot, arrives step 2, scorched step 4, rebuilt step 5+ -->
    {#if hasFarmland}
      <g class="farmland" class:scorched={isFire} class:rebuilt={isRebuilt} transform="translate(430,258)">
        <rect class="plot" x="-38" y="-10" width="76" height="24" rx="3" />
        {#each [-24, -6, 12, 30] as rowX}
          <line class="row" x1={rowX} y1="-6" x2={rowX} y2="10" />
        {/each}
      </g>
    {/if}

    {#if isFire}
      <g class="flame" transform="translate(430,232)" in:fly={flyIn}>
        <path class="flame-outer" d="M0,-26 C10,-14 12,-2 4,6 C8,0 6,-8 0,-14 C-6,-8 -8,0 -4,6 C-12,-2 -10,-14 0,-26 Z" />
        <path class="flame-inner" d="M0,-14 C5,-7 6,-1 2,4 C4,-2 2,-8 0,-14 Z" />
      </g>
    {/if}

    {#if showEnergy}
      <g class="spark" transform="translate(320,150)" in:fly={flyIn}>
        <path class="bolt" d="M-4,-16 L4,-16 L-2,-2 L4,-2 L-6,18 L-1,0 L-6,0 Z" />
      </g>
    {/if}

    <!-- Trade arrows: first↔second, step 1 only -->
    {#if showTradeArrows}
      <g class="trade" in:fly={flyIn}>
        <path class="arrow fish-arrow" d="M160,196 C185,186 205,186 228,196" marker-end="url(#island-arrow)" />
        <path class="arrow rabbit-arrow" d="M228,208 C205,218 185,218 160,208" marker-end="url(#island-arrow)" />
      </g>
    {/if}

    <!-- Fifth-islander arrows, step 3 only, shape depends on the toggle -->
    {#if showFifthArrows}
      <g class="fifth-arrows" class:takes={fifthState === "takes"} class:contributes={fifthState === "contributes"} in:fly={flyIn}>
        {#if fifthState === "takes"}
          {#each SLOT_X.slice(0, 4) as sx}
            <path class="arrow extract" d="M{sx},210 Q{(sx + 500) / 2},170 495,205" marker-end="url(#island-arrow)" />
          {/each}
        {:else}
          {#each SLOT_X.slice(0, 4) as sx}
            <path class="arrow reciprocal" d="M{sx},210 Q{(sx + 500) / 2},175 495,205" marker-end="url(#island-arrow)" />
            <path class="arrow reciprocal back" d="M495,214 Q{(sx + 500) / 2},185 {sx},220" marker-end="url(#island-arrow)" />
          {/each}
        {/if}
      </g>
    {/if}

    <!-- Islanders: head + body, an icon badge above -->
    {#each present as f, i (f.id)}
      {@const sx = SLOT_X[i]}
      <g class="figure" transform="translate({sx},220)" in:fly={flyIn}>
        <rect class="body" x="-14" y="4" width="28" height="34" rx="13" fill={f.color} />
        <circle class="head" cy="-8" r="12" fill={f.color} />

        <g class="icon" transform="translate(0,-34)">
          {#if f.icon === "fish"}
            <path class="icon-fish" d="M-11,0 C-6,-7 6,-7 11,0 C6,7 -6,7 -11,0 Z M9,0 L15,-4 L15,4 Z" />
          {:else if f.icon === "rabbit"}
            <ellipse class="icon-rabbit-body" cx="0" cy="3" rx="8" ry="5.5" />
            <ellipse class="icon-rabbit-ear" cx="-4" cy="-6" rx="2.4" ry="7" transform="rotate(-12 -4 -6)" />
            <ellipse class="icon-rabbit-ear" cx="4" cy="-6" rx="2.4" ry="7" transform="rotate(12 4 -6)" />
          {:else if f.icon === "wheat"}
            <line class="icon-wheat-stem" x1="0" y1="8" x2="0" y2="-9" />
            {#each [-6, -2, 2, 6] as dy}
              <circle class="icon-wheat-grain" cx="-3.5" cy={dy} r="1.6" />
              <circle class="icon-wheat-grain" cx="3.5" cy={dy} r="1.6" />
            {/each}
          {/if}
        </g>
      </g>
    {/each}

    <line class="ground-line" x1="60" y1={GROUND_Y} x2="580" y2={GROUND_Y} />

    <!-- Each islander's pile: a short stack of blocks in its own sandy row,
         well below the figures' feet, so growth and inequality both show up
         as separate, comparable stacks instead of blending into the body. -->
    <line class="pile-baseline" x1="60" y1={PILE_ROW_Y + 6} x2="580" y2={PILE_ROW_Y + 6} />
    {#each present as f, i (f.id)}
      {@const sx = SLOT_X[i]}
      {@const blockCount = Math.max(0, Math.round((f.pile[step] ?? 0) / 3))}
      <g class="pile">
        {#each Array.from({ length: blockCount }) as _, bi (bi)}
          <rect
            class="pile-block"
            x={sx - BLOCK_W / 2}
            y={PILE_ROW_Y - (bi + 1) * BLOCK_STEP}
            width={BLOCK_W}
            height={BLOCK_H}
            rx="1"
            fill={f.color}
            in:fly={{ y: reduced ? 0 : 8, duration: reduced ? 0 : 260, delay: reduced ? 0 : bi * 26 }}
          />
        {/each}
      </g>
    {/each}
  </svg>
</figure>

<style>
  .island-fig {
    margin: 0;
    width: 100%;
    max-width: 620px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  @media (max-width: 860px) {
    /* The scene should read at the same full column width as the meter
       above it, not shrink into a small centered box. Give it an explicit
       CSS aspect-ratio (matching the viewBox) so width:100% and a
       height cap can coexist without the browser back-solving a narrower
       width to preserve the intrinsic SVG ratio — that back-solve is what
       previously turned a height cap into a shrunk, centered box. On the
       narrow mobile sticky panel the step cards also slide up and cover
       the lower part of this visual, so a height cap still matters on
       short phones: it's capped in svh so the meter underneath (the one
       element that must stay visible at every step) always has room. The
       `slice` preserveAspectRatio above crops sky/water at top and bottom
       when the cap binds, instead of letterboxing the full width down to
       a smaller, empty-sky-heavy box. */
    svg {
      aspect-ratio: 640 / 380;
      height: auto;
      max-height: clamp(150px, 30svh, 230px);
      margin: 0;
    }
  }
  .water {
    fill: color-mix(in srgb, var(--series-blue) 14%, var(--page-plane));
  }
  .sun-halo {
    fill: var(--hero-gold);
    opacity: 0.16;
    transition: r 0.8s ease, opacity 0.8s ease;
  }
  .sun.bright .sun-halo {
    opacity: 0.3;
  }
  .sun-core {
    fill: var(--hero-gold);
  }
  .sun-ray {
    stroke: var(--hero-gold);
    stroke-width: 2;
    stroke-linecap: round;
    transition: x2 0.8s ease, y2 0.8s ease;
  }
  .island-land {
    fill: color-mix(in srgb, var(--hero-gold) 30%, var(--gridline));
    stroke: var(--baseline);
    stroke-width: 1.5;
  }
  .island-grass {
    fill: color-mix(in srgb, var(--ink-green) 22%, transparent);
  }
  .ground-line {
    stroke: var(--baseline);
    stroke-width: 1;
    stroke-dasharray: 2 4;
  }

  .farmland .plot {
    fill: color-mix(in srgb, var(--series-yellow) 55%, var(--gridline));
    stroke: var(--baseline);
    stroke-width: 1;
    transition: fill 0.6s ease;
  }
  .farmland .row {
    stroke: color-mix(in srgb, var(--text-primary) 35%, transparent);
    stroke-width: 1.4;
    transition: opacity 0.6s ease;
  }
  .farmland.scorched .plot {
    fill: color-mix(in srgb, var(--text-muted) 55%, var(--gridline));
  }
  .farmland.scorched .row {
    opacity: 0.25;
  }
  .farmland.rebuilt .plot {
    fill: color-mix(in srgb, var(--series-yellow) 70%, var(--gridline));
  }

  .flame-outer {
    fill: var(--series-orange);
  }
  .flame-inner {
    fill: var(--series-yellow);
  }

  .spark .bolt {
    fill: var(--hero-gold);
  }

  .trade .arrow {
    fill: none;
    stroke-width: 2.4;
    color: var(--series-blue);
  }
  .trade .fish-arrow {
    stroke: var(--series-blue);
  }
  .trade .rabbit-arrow {
    stroke: var(--series-orange);
    color: var(--series-orange);
  }

  .fifth-arrows .arrow {
    fill: none;
    stroke-width: 2.6;
  }
  .fifth-arrows.takes .extract {
    stroke: var(--series-red);
    color: var(--series-red);
  }
  .fifth-arrows.contributes .reciprocal {
    stroke: var(--ink-green);
    color: var(--ink-green);
    stroke-width: 2;
  }
  .fifth-arrows.contributes .reciprocal.back {
    opacity: 0.7;
  }

  .body,
  .head {
    transition: fill 0.5s ease;
  }
  .icon-fish {
    fill: var(--surface-1);
    stroke: var(--text-primary);
    stroke-width: 0.6;
  }
  .icon-rabbit-body,
  .icon-rabbit-ear {
    fill: var(--surface-1);
    stroke: var(--text-primary);
    stroke-width: 0.6;
  }
  .icon-wheat-stem {
    stroke: color-mix(in srgb, var(--ink-green) 70%, var(--text-primary));
    stroke-width: 1.4;
  }
  .icon-wheat-grain {
    fill: var(--series-yellow);
  }

  .pile-baseline {
    stroke: var(--baseline);
    stroke-width: 1;
    stroke-dasharray: 2 4;
    opacity: 0.6;
  }
  .pile-block {
    stroke: var(--border);
    stroke-width: 0.6;
  }
</style>
