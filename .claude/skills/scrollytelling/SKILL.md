---
name: scrollytelling
description: Build a scrollytelling visual essay — a scroll-driven data story with a sticky visual panel, narrative acts, hand-built SVG charts, and an optional 3D hero. Use when asked for a scrollytelling piece, a visual essay, a scroll-driven data story, "a scrolly", or when working in any scrolly-* repo. Also use it when debugging one from a symptom alone ("the chart jumps when I scroll", "the text is cut off on my phone", "the cards are different sizes"), when sourcing or citing the figures in one, and when preparing a piece for publication or sharing it on a social platform.
---

# Scrollytelling

The house style for my scrollytelling essays. Three built so far, all the same
skeleton, all deployed to GitHub Pages:

| Repo | Subject | Notable |
|---|---|---|
| [`scrolly-wealth`](https://github.com/kpclick12/scrolly-wealth) | global wealth inequality | interactive wheel game + "where do you stand" explorer, GSAP, linked bar/pictogram pyramid, standalone share-chart generator, per-figure provenance flags |
| [`scrolly-butterflyeffect`](https://github.com/kpclick12/scrolly-butterflyeffect) | chaos theory → European extreme weather | Three.js meadow→storm hero with a custom grass shader |
| [`scrolly-monopoly`](https://github.com/kpclick12/scrolly-monopoly) | Swedish housing market, in Swedish | Three.js Monopoly board that extrudes into a price skyline |

**Read the actual source before building.** These files are the reference
implementation, not this document. `scrolly-monopoly` is the newest and the
cleanest starting point for structure; `scrolly-wealth` is the reference for
full-bleed mobile cards, palette validation and sourcing discipline.

## Using this alongside a brand or house-style skill

This skill owns **structure and mechanics**. A brand skill, a tone-of-voice
skill or a plain-language standard (klarspråk / myndighetssvenska) owns
**surface**. When both are loaded, the other skill wins on:

- palette and color tokens
- typography — typefaces, display/body pairing, scale
- voice, tone, reading level, terminology, CTAs
- logo, footer, legal and accessibility boilerplate
- deploy target and hosting

…and this skill still governs: the scroll mechanic, never remounting the
visual, the act/step-card structure, hand-built SVG charts, the sourcing
discipline, the mobile layout rules, and the 3D hero recipe.

Where a rule below is marked **default**, it is my taste and the other skill
overrides it — but the *reason* attached to it usually still applies, so carry
the reason across rather than dropping it. Rules marked **structural** hold
regardless of brand; if a brand rule genuinely contradicts one, say so instead
of quietly breaking the format.

## Stack

**Default:** Svelte 5 (runes) + Vite, `d3-scale` only, `three` for a 3D hero,
nothing else. A house stack (React/Next, an internal design system) overrides
this — but everything below the framework line still holds.

- **No chart library** (structural). Charts are hand-written SVG so every mark
  can be styled and animated with ordinary CSS and component transitions. A
  chart library takes that away and gives back nothing this format needs — this
  holds whatever the framework is. A design system's chart components are
  usually the wrong tool here for the same reason.
- **No `d3` umbrella package** unless you actually need more than scales
  (`scrolly-wealth` pulls full `d3` + `gsap`; the other two don't and are
  better for it).
- **Fonts are self-hosted** (structural) — no third-party font requests, ever.
  That is a GDPR constraint, not a preference, and it survives any brand
  typeface: take the brand's faces and serve them from `public/fonts/`.
  **Default** for the faces themselves: variable-weight Playfair Display for
  display type, `system-ui` stack for everything else.

Scaffold: `npm create vite@latest . -- --template svelte`, then copy
`vite.config.js`, `src/app.css`, `src/lib/components/Scrolly.svelte`,
`src/lib/data/load.js` and `.github/workflows/deploy.yml` from
`scrolly-monopoly` and adapt.

Worth knowing about, not adopting wholesale: The Pudding's
[`svelte-starter`](https://github.com/the-pudding/svelte-starter) is MIT
licensed and reading it is instructive. Their genuinely better ideas are
SSR-static builds (the story exists in the HTML before JS runs, which this
stack's client-only mount does not), reusable Svelte actions for
`inView`/`resize`/`checkOverlap` instead of re-solving those per component, and
copy managed as content rather than markup (see the note under *Writing the
story*). Their branding and fonts are theirs — don't reproduce those.

## Project shape

```
index.html                 lang, description, canonical, OG + Twitter cards
src/
  main.js                  svelte 5 mount()
  App.svelte               hero, act order, closing, methodology/sources, footer
  app.css                  ALL design tokens + every shared class
  data/*.json              one file per dataset, each with a "note"/"source" key
  lib/
    components/            Scrolly.svelte, StatTiles.svelte, one file per chart
    story/Act*.svelte      one file per act
    data/load.js           static imports, re-exported as one `appData` object
scripts/                   share-image generator, any data prep
```

`load.js` imports JSON statically so it bundles with the app — code and data
stay atomically consistent and there is never a loading state. `App.svelte`
passes the whole `data` object down; each act picks what it needs.

## The scroll mechanic — this part is fixed

`Scrolly.svelte` is **byte-identical across all three repos**. Copy it; do not
rewrite it. It exists as-is for reasons that are easy to re-break:

- **Nearest-midpoint-to-viewport-center wins**, computed on a rAF-throttled
  scroll listener. Not an IntersectionObserver — a thin IO slice creates dead
  zones between widely-spaced cards where no step is active.
- `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)` — bare `1fr` means
  `minmax(auto, 1fr)`, and one unbreakable child (a nowrap number, a fixed SVG)
  will then blow the whole page wider than the viewport.
- `.scrolly-steps { pointer-events: none }` with `> * { pointer-events: auto }`
  — the step column sits over the sticky panel, so without this the gaps
  between cards eat every click on tabs and chart nodes.
- Steps are spaced `gap: 60svh`, `padding-top: 30svh`. That pacing is tuned;
  changing it changes how the whole essay reads.
- Single breakpoint at **860px**, where the grid collapses to one column and
  the sticky panel hugs its content (`height: auto; max-height: 92svh`).

Usage:

```svelte
<Scrolly onStepChange={(i) => (currentStep = i)}>
  {#snippet visual()}…{/snippet}
  <section class="scrolly-step">…</section>
</Scrolly>
```

### Never remount the visual between steps

The single most important rule in this format. One chart instance persists
across the whole act; only its `step`/`mode`/`highlight` prop changes, so the
chart visibly *does something* as you scroll instead of being swapped out.

When an act genuinely needs different visuals, keep them **all mounted** and
crossfade with `.visual-frame-stack` — a fixed-height box whose `.frame`
children are absolutely positioned and toggle `opacity`/`visibility`:

```svelte
<div class="visual-frame-stack" style="--stack-height: 520px; --stack-height-mobile: 430px;">
  <div class="frame" class:is-active={currentStep <= 2}>
    <PriceJourney data={data.journey} step={currentStep} />
  </div>
  <div class="frame" class:is-active={currentStep >= 3}>
    <EquityRace data={data.journey} step={currentStep - 3} />
  </div>
</div>
```

Set the height explicitly per act. A stack that resizes on swap shifts layout
mid-scroll, which is worse than any amount of empty panel. On mobile the frames
top-anchor instead of centering — the sticky panel is pinned at the top while
cards slide up over it, so top-anchored content is the least likely to end up
underneath an incoming card.

Prefer `clamp(floor, Nsvh, ceiling)` over a flat pixel value for
`--stack-height-mobile`: a fixed 380–480px panel plus a card of unknown height
overflows a short screen, and a phone browser's chrome can eat 200px of it. The
floor keeps the chart from clipping; the `svh` term makes it shrink where it
must. Measure the floor from the chart's actual content height rather than
guessing.

## app.css owns everything shared

Every design token and every shared class lives in `app.css`, declared once:
`--surface-1`, `--page-plane`, `--text-primary/secondary/muted`, `--gridline`,
`--baseline`, `--border`, `--serif`, `--sans`, the `--series-*` categorical
palette, and the `--ink-*` text-safe darker steps.

Each act sets **one** variable on its own wrapper:

```svelte
<section class="act" aria-label="Akt 2: Bostadskarriären" style="--act-accent: var(--ink-blue);">
```

`.scrolly-step`'s left border, `.kicker` and `.callout-num` all read
`--act-accent`, so an act can never end up with a mismatched border/kicker
pair. **Do not let an act redeclare `.act .scrolly-step` in its own `<style>`**
— those selectors are global, and the last act mounted wins for every act on
the page. That bug has been fixed once already; don't reintroduce it.

Shared classes to reuse rather than re-invent: `.scrolly-step`, `.kicker`,
`.callout` / `.callout-num` / `.callout-label`, `.act-head` / `.act-kicker` /
`.act-dek`, `.badge` + `.badge-*`, `.visual-frame-stack` / `.frame`.

### Always-dark sections need their own text colors

A global `p { color: var(--text-secondary) }` tuned for paper **beats
inheritance** from a dark wrapper, because an element-level rule wins over an
inherited value regardless of specificity. The symptom is text rendering at
about 1.5:1 on the dark surface — effectively invisible, and easy to miss
because it looks fine in the light sections either side of it.

Every hero, game, explorer and closing band therefore sets color on its own
text elements (`rgba(255,255,255,0.6)` for small print is the working value).
After any theme change, screenshot every dark section rather than assuming the
tokens propagated.

### Small things that matter

- **Step cards go full-bleed on mobile.** No left/right margin — the card
  spans edge to edge. Every `.act` pads with `var(--act-pad-x)`, and the card
  cancels exactly that under 860px, so the value only exists in one place:

  ```css
  width: calc(100% + 2 * var(--act-pad-x));
  margin-inline: calc(-1 * var(--act-pad-x));
  ```

  With it: `border-radius: 0` (rounded corners flush against the viewport edge
  read as a bug), a hairline `border-top`/`border-bottom` plus deeper shadow to
  replace the "surface sitting on the page" cue the side gaps used to give, and
  generous inner padding (20px) so text still clears the accent bar and the
  screen edge. On a 360px screen this recovers roughly 50px of line width —
  about a fifth. See `scrolly-wealth/src/app.css` — the other two repos predate
  this and are the worse version.
- **Keep step cards a uniform height within an act.** Card height otherwise
  follows paragraph length, so steps silently differ by 50–250px and the column
  reads as sloppy as you scroll. Trim copy to match, then add a `min-height`
  floor so a later width or font change can't reintroduce the drift — trimming
  alone is fragile, because going full-bleed reflows every card. An interactive
  step that carries a control plus its feedback is legitimately taller; that one
  can be the exception.
- **Inactive step cards sit at `opacity: 0.35`**, active at `1`, 0.3s ease. On
  `.scrolly-step > *`, not the card itself — the card's background and accent
  bar stay solid so the column still reads as a stack of cards.
- **`svh`, never `vh`**, for anything full-height. Mobile browser chrome
  otherwise makes the sticky panel jump as the URL bar hides.
- **`--stack-height` is set per act**, with a separate `--stack-height-mobile`.
  Never let the visual box size itself.
- The `<h3>` in a step card is `var(--serif)`; body copy is `var(--sans)`.
  Display type serif, everything else system sans — that contrast is the whole
  typographic idea.
- **A widget's control and its feedback belong in the same box.** A toggle in
  the step card whose result renders in the sticky panel breaks on mobile, where
  the card slides over the panel and hides the thing the toggle just changed.
  Render the feedback inline in the card under 860px.

### Color

**Default:** give each essay its own identity — a light paper surface, a
matching always-dark surface for the hero and closing (which never go light),
and a `@media (prefers-color-scheme: dark)` block. Wealth is warm cream +
ink-navy + brass; butterfly is cool paper; monopoly is game-night paper +
felt green + Monopoly red. **A brand palette replaces all of this**; map it
onto the same token names so nothing downstream changes.

Structural regardless of where the palette comes from:

- **Run the `dataviz` skill's validator on the categorical palette against both
  surfaces.** Every palette in these repos was validated, and the comments in
  `app.css` record which pairs landed in the sub-3:1 WARN band. Run it on a
  brand palette too — a brand deck is not a contrast audit.
- **Validate the dimmed state too.** Where a chart de-emphasises non-highlighted
  marks, adjacent colors that pass at full opacity can collapse to a ΔE around
  2 once dimmed — indistinguishable. Measure the flattened, alpha-composited
  colors rather than trusting the swatches, and if they're too close, raise the
  dim opacity (0.48 works where 0.32 failed) as well as separating the hues.
- **For categories that are ordered ends of a scale** — poorest to richest,
  worst to best — a **diverging** palette separates far better than a
  sequential ramp. A four-step sequential ramp reads as three indistinguishable
  pastels plus one dark end, which is exactly the middle of the distribution
  the reader most needs to see.
- **If a brand palette fails, don't silently re-tint it.** Record the failing
  pairs in an `app.css` comment, add the secondary encoding (direct labels,
  surface gaps between marks, pattern), and tell whoever owns the brand.
- **Dark mode is re-stepped, not flipped.** Validate the dark palette
  separately against the dark surface. If the brand has no dark mode, deriving
  one is a decision to raise, not to make quietly.
- Chart-mark colors often fail 4.5:1 as *text* on light paper. That's what the
  `--ink-*` tokens are for — use them for labels, tooltips and end-labels.
- Where contrast sits in the WARN band, **always-on direct labels are the
  documented relief.** Say so in a comment next to the token.
- Color is never the only carrier of meaning.

## Charts

One Svelte component per chart in `lib/components/`. Read
`scrolly-butterflyeffect/src/lib/components/WarmingChart.svelte` — it is the
canonical example of the idiom:

```js
let { data, step = 0 } = $props();
const W = 560, H = 400;
const M = { top: 24, right: 96, bottom: 40, left: 48 };
const x = $derived(scalePoint(...)); const y = $derived(scaleLinear(...));
const showEurope = $derived(step >= 1);   // step gates progressive reveal
```

- Fixed `viewBox`, `width: 100%; height: auto` — SVG scales, nothing reflows.
  Wrap in `<figure class="chart">` with `width: min(600px, 100%)` and a
  `<figcaption>` giving units.
- **Never cap an SVG's height without also setting its CSS `aspect-ratio`.** An
  SVG is a replaced element: with `width: 100%; height: auto` and a
  `max-height`, it back-solves a *narrower width* to preserve its viewBox ratio,
  silently shrinking the illustration into a small centred box. Set
  `aspect-ratio` to match the viewBox so width stays authoritative, and add
  `preserveAspectRatio="xMidYMid slice"` if the cap might bind. This cost a
  round trip in `scrolly-wealth` when the island scene shrank to a third of its
  column.
- `role="img"` + a **sentence-long** `aria-label` that states the actual shape
  and numbers, not "line chart of data". Make it `$derived` when the chart has
  modes.
- Direct end-labels beat legends. Keep a legend only as backup.
- `<title>` inside marks for native tooltips; a custom `<g class="tip">`
  when you need more.
- `font-variant-numeric: tabular-nums` on every number that animates or
  aligns in a column.
- **A single headline number is a stat tile, not a one-bar chart.** Use
  `StatTiles.svelte` (it exists in all three repos, in two variants — grid of
  cards, or a staggered vertical list).
- Progressive reveal is driven by the `step` prop, never by a timer.
- **Write label-collision logic once.** Two charts in `scrolly-wealth` solved
  overlapping marker labels independently, and both got it wrong on mobile
  first, because the gap was computed as a percentage rather than in measured
  pixels. Compute the minimum gap from the container's measured `clientWidth`,
  assign lanes in priority order so the marks that carry the point get the clear
  lane, and put it in one shared helper.

## Writing the story

Five acts. Four to six steps per act. Each act:

```svelte
<div class="act-head">
  <p class="act-kicker">Akt två</p>
  <h2>Bostadskarriären</h2>
  <p class="act-dek">One or two sentences framing what this act will show.</p>
</div>
```

Each step card: `.kicker` (2–4 words naming the beat) → `<h3>` (a claim, not a
label — "+789 procent", "Pengar blev gratis", not "Price development") →
one or two short paragraphs → optionally one `.callout` with a big number and
a line of interpretation. Bold the numbers inline. Use `.badge-*` to tint a
word that names a chart series, so the prose and the mark are visibly linked.

Keep step copy to **40–70 words**. Beyond that the card grows taller than a
phone screen, which breaks the format, and it forces the height-uniformity
problem above.

Write step cards as **literal markup**, not a `{#each}` over a steps array —
the prose carries inline `<strong>`, `<em>` and badges, and a data array
flattens all of that. (`scrolly-wealth` uses the array form; the later two
moved away from it.)

The cost of that choice is real, though: every wording change becomes a code
edit, and the writing lives where a non-coder can't reach it. If a piece has a
separate writer, or you find yourself editing prose through an agent one
sentence at a time, ArchieML-from-a-Google-Doc is the escape hatch that keeps
inline markup working — that is exactly why The Pudding uses it. Reach for it
when the copy churns, not by default.

Order the acts so the reader gets a mental model before any numbers. An analogy
act first — concrete, human-scale, no data — earns the right to show charts
afterwards, and every later act can call back to it in one line. Then move from
the widest frame inward, and put any interactive widget last, so the reader
meets it already knowing what the numbers mean. `scrolly-wealth`'s five-person
island is the worked example: the parable establishes that wealth is created,
redistributed and destroyed before a single chart appears.

End the last step of each act with a line that hands over to the next one.

### The tone

**Default — a voice or plain-language skill overrides all of this.** Explain a
mechanism; don't lecture and don't advise. Reach for a concrete parable and
stay inside it — the five-person island, the Monopoly board, one butterfly.
Close with the idea, not a summary: `App.svelte`'s closing section is a dark
full-bleed band with a single argument in it. A piece that stops at its last
widget reads as though it ran out of budget.

Under a klarspråk / myndighetssvenska standard, expect the voice to change and
let it: plainer sentences, no rhetorical build, terminology fixed by the
standard, and a closing section that states the point rather than landing an
argument. What does **not** change is the shape — a kicker, a claim as the
`<h3>`, one idea per step card, a handover line at the end of each act. That
structure is what makes the scroll readable, and it is compatible with plain
language rather than opposed to it. A CTA, if the brief wants one, goes in the
closing section or the footer — never inside a step card.

Match the language of the subject (structural). `scrolly-monopoly` is entirely
in Swedish because the subject is Swedish; `index.html` gets `lang="sv"` and
`og:locale="sv_SE"` to match. Set `lang` correctly whatever the language — it
is what screen readers use to pick a voice.

## Sourcing — non-negotiable

Every essay ends with a **"Methodology & sources"** section in `App.svelte`
that opens by stating every figure is *an approximation, rounded for
readability*, then lists each dataset with its publisher, edition and year.
Each `data/*.json` carries its own `"note"` or `"source"` key describing how
the numbers were derived (interpolation, anchoring, rounding).

Anything invented for illustration — a parable, a worked example, a
compounding chart — is **labelled as illustrative where it appears**, not just
in the sources list. Read the sources sections in all three repos before
writing one; they set the bar.

This one gets stricter under an institutional byline, not looser: a figure
published under an employer's or an authority's name needs a citation someone
can check, and modelled or interpolated numbers must say so on the page.

### Verifying figures, learned the hard way

A fact-check pass on `scrolly-wealth` found four wrong numbers in figures that
had already shipped. These are the rules that came out of it:

- **Compute from primary counts where you can, and say that you did.** "Computed
  from UN birth counts as a share of a 132,405,927 world total" is a far
  stronger claim than "approximate", and it is also *easier to defend* than a
  rounded estimate. Two birth shares were wrong by 0.5–0.8 points simply because
  nobody had divided the actual counts.
- **Trace to the issuing document, not to a search summary.** Search snippets
  are model-generated and contradicted each other on the same figure — one
  returned a country's median wealth as $68,998, another as $107,739 (different
  editions, presented identically), and a third produced a currency conversion
  that was plainly implausible. A PDF from the publisher settles it. If the
  network blocks the source, say so and stop rather than shipping the snippet.
- **One edition per comparison.** Different vintages across different charts is
  acceptable when each is labelled; two vintages inside a single comparison is
  not.
- **Put the vintage on screen, not only in the footer.** Prose citing a 2025
  figure beside a widget showing a 2022 one reads as a bug even when both are
  correct — and that exact mismatch shipped.
- **Check the source actually covers your subject.** A report may analyse 56
  markets while your wheel names fourteen countries, seven of which are outside
  it. Figures you cannot attribute get flagged as unverified estimates *in the
  UI* (`scrolly-wealth`'s `wealthUnverified` flag drives a line in the result
  card), or left out — never quietly attributed to a document that never
  contained them.
- **A half-updated dataset is worse than a consistent old one.** If a refresh
  can only cover some markets, either finish it or leave the old figures with
  honest labels. Say which you did.

## The 3D hero (optional)

`ButterflyStorm.svelte` and `MonopolyHero.svelte` are the two examples. Both
are one file, `onMount`, plain Three.js, no wrapper library.

Reach for it only when the subject has a *place* or an *object* in it. An
abstract mechanism is better served by a hand-built SVG scene driven by the
step prop — cheaper, sharper on any screen, and it matches the charts around
it. Three.js adds hundreds of kilobytes and a battery cost, so it should be
earning its place.

- **One eased scalar in `[0,1]` drives the entire scene.** Scroll maps to
  `targetX`; the frame loop eases `x += (targetX - x) * min(1, dt * 5)`.
  Scrubbing the scrollbar scrubs the scene. Document the phase bands in a
  comment block at the top of the file.
- **All geometry is procedural** — canvas textures for lettering, instanced
  meshes for anything numerous. No model files, no external assets.
- The hero section is `height: ~380svh` with a `position: sticky; height:
  100svh` child; progress is `-rect.top / (rect.height - innerHeight)`.
- HTML overlay cards and chips fade in over bands of the same scalar
  (`bandOpacity(p, [a, b])`), driven by direct style writes in the frame loop.
- **Budget before beauty.** Pick a quality tier from
  `navigator.hardwareConcurrency` / `deviceMemory` / viewport width and scale
  particle counts, `setPixelRatio`, antialias and a capped frame rate off it.
  Capping FPS is the single biggest battery win. See the comment at the top of
  `ButterflyStorm.svelte`.
- **Pause when off-screen**: `IntersectionObserver` + `document.hidden` guard
  in the frame loop.
- **`try/catch` the `WebGLRenderer` construction** and render a static
  `.hero-fallback` — headline and standfirst — when it throws.
- **Honor `prefers-reduced-motion`**: slow ambient time (`dt * 0.15`), drop
  the frame cap, damp wind/rain/particles. The scroll-driven progression stays.
- **Dispose everything** in the `onMount` cleanup: geometries, materials,
  material maps, renderer, and remove all listeners.

For SVG scenes, honour reduced motion by jumping to the resting end state
rather than merely shortening the animation, and set each keyframe's 0%/100%
frame *to* that resting state so a single iteration still looks deliberate.

## Deploy

**Default:** GitHub Pages project site, built and published from `main` by
`.github/workflows/deploy.yml` (identical in all three repos — copy it). A work
project deploys wherever the org deploys; the two gotchas below are the part
worth carrying across, because both fail silently.

`vite.config.js` must set the base path for `build` **and** `isPreview`:

```js
base: command === 'build' || isPreview ? '/scrolly-<name>/' : '/',
```

`vite preview` resolves with `command === 'serve'`, so without the `isPreview`
check the previewed build's baked-in absolute asset paths 404 against a preview
server rooted at `/`.

`og:image` **must be an absolute URL** — relative paths are silently ignored by
most link scrapers, and that is the usual reason a shared link shows no
picture. 1200×630 PNG in `public/`. Also set `og:image:alt`, `og:locale`,
`twitter:card=summary_large_image`, and a `<link rel="canonical">`.

## Sharing the piece

The distribution lesson is as valuable as any code here: on feed-based
platforms **a chart image outperforms a link by roughly an order of
magnitude**. A link post asking for a click converted around 0.2% on
r/dataisbeautiful; image posts in the same community run 1–3%. The same essay
posted as a link and as an image is a tenfold difference in reach, and a
well-known studio's excellent piece posted as a link did no better.

So build a standalone share chart per piece:

- ~2000×1500 PNG, light background, the piece's own palette and self-hosted
  display face, committed to `public/`.
- Title, subtitle and a source line **baked into the image**. It must stand
  alone with zero site context — in a feed it *is* the visualization.
- Large type and direct labels on every mark; check it at 400px wide, which is
  roughly how it appears in a feed. Nothing encoded by color alone.
- Generate it with a committed script (`scripts/make-*-chart.mjs`: render HTML
  and screenshot it with Playwright) reading the **same** `data/*.json` the
  essay uses, so it cannot drift from the piece.
- **Have the script assert the claim in the title is still true of the data
  before it renders.** A title is a claim, and claims deserve a test:
  `scrolly-wealth`'s generator refuses to draw unless the overlap between its
  two ranked lists is exactly `["United States"]`. It also caught a title that
  said "a third" when the real figure was 52%.
- Put the interactive link in the first comment as a bonus, not as the ask, and
  keep the sources in the piece so you never depend on that comment surviving.

Disclose AI assistance as a tool note inside the sources/tools line, framed
around what you did — the data work, the verification, the editorial calls —
rather than as an apology for what you didn't. The commit trailers in these
repos say `Co-Authored-By: Claude` and the repos are public, so silence isn't a
stable position: disclosure you choose beats disclosure someone else makes for
you.

## Before shipping

Screenshots are the only reliable check, and they have to actually be looked
at. Capture every step of every act at desktop (1280×900) **and** phone
(360×740), both color schemes for anything whose surface changed, plus one
deliberately short viewport — a bare 390×844 window is taller than a real
phone's usable area, which is how a whole class of mobile bug shipped twice.
Assemble same-size shots into a strip when checking uniformity; drift is
obvious side by side and invisible one at a time.

- **No horizontal scrollbar at any width.** Verify it programmatically rather
  than by eye: assert `document.documentElement.scrollWidth <=
  window.innerWidth` at 320, 360, 375, 390 and 412px, and when it fails, walk
  the DOM logging every element whose `getBoundingClientRect().right` exceeds
  the viewport — that names the offender instead of leaving you guessing. Many
  real phones report 360–384px CSS width, so 390 alone will pass while the
  device fails. `min-width: 0` on flex/grid children, `minmax(0, 1fr)` on
  tracks, `max-width: 100%` on SVGs, `overflow-wrap: anywhere` on unbreakable
  strings; `overflow-x: clip` on `html, body` is the last line of defense, not
  the fix.
- Every act reads correctly at 375px wide: panel hugs content, cards go
  full-bleed with no side margin, visuals top-anchor, nothing hides under an
  incoming card, and step cards are the same height.
- Scroll through at least one act in small increments and confirm the sticky
  panel never jumps.
- Exercise every interactive widget in its empty state and at its extremes —
  zero, negative, very large, and the case where two labels land on the same
  spot. `scrolly-wealth`'s explorer defaults to a value that puts two markers
  on top of each other, which is exactly where label collision shows up.
- Tab through it — `:focus-visible` rings are visible on both the light paper
  and the always-dark sections (the dark sections override to a light ring).
- Charts announce themselves usefully to a screen reader.
- Reduced motion set: nothing spins, nothing loops, the story still works.
- Dark mode: no surface goes brown/muddy; every palette re-validated; every
  always-dark section's own text colors checked, not assumed.
- Check the browser console is clean. A missing import threw on every page load
  in `scrolly-wealth` for several commits because nobody looked.
- Every number on the page traces to a line in the sources section, and every
  number's vintage is visible where the number is.
