---
name: scrollytelling
description: Conventions and hard-won fixes for building data-driven scrollytelling pieces (scroll-driven visual essays with a sticky visual and step cards) in Svelte + Vite/SvelteKit. Use this whenever the user wants to build, extend, restructure, or debug a scrolly piece, an interactive visual essay, or a scroll-driven data story — including when they only describe a symptom ("the chart jumps when I scroll", "the text box is cut off on my phone", "the cards are different sizes"), when they want to add an interactive widget to a story, or when they ask about sourcing and citing the figures in one. Also use it when preparing such a piece for publication or sharing it on social platforms.
---

# Scrollytelling pieces

This skill encodes lessons from shipping real pieces, most of them learned by
getting something wrong first and having a reader point at it. The bugs listed
here are not hypothetical — each one shipped to a live site at least once.

The house style is: warm paper background, deep ink text, one accent colour,
serif display type for headlines, a sticky visual on one side and step cards
that scroll past it. Adapt the palette per piece, keep the mechanics.

## Structure of a piece

A piece is a sequence of **acts**. Each act is one `Scrolly` instance: a sticky
visual panel plus a column of step cards. A step card is a kicker, a headline,
and one or two short paragraphs — 40–70 words. Longer than that and the card
grows taller than the screen on a phone, which breaks the whole illusion.

Order acts so the reader gets a mental model before any numbers. An analogy or
parable act first (concrete, human-scale, no data) earns you the right to show
charts afterwards, and later acts can call back to it in one line. Then move
from the widest frame inward — global, then between groups, then within groups,
then the individual — and put any interactive widget last, so the reader meets
it already knowing what the numbers mean.

End with a closing thought. A piece that stops at its last widget feels like it
ran out of budget. Two or three short paragraphs that land the idea are enough.

## Copy belongs in data, not in components

Hardcoding prose inside `.svelte` files means every wording change is a code
edit and a rebuild, and it puts the writing where a non-coder can't reach it.
Keep step copy in a data file (JSON, or ArchieML from a Google Doc if the
project can justify the setup) and let the component render it.

The Pudding's `svelte-starter` (MIT licensed, worth reading) does this with
ArchieML + Google Docs and `npm run gdoc`. Even a plain `steps.json` gets you
most of the benefit: the story becomes editable without touching code.

## Mobile is the primary target

Most readers arrive on a phone, in a browser whose chrome eats 150–200px of
height, on a viewport that may be 360px wide rather than the 390px your test
window defaults to. Design for that first and the desktop follows.

**Budget height against the small viewport, never in fixed pixels.** A visual
panel hardcoded to `360px` plus a card of unknown height overflows a short
screen. Cap panels with `clamp(floor, Nsvh, ceiling)` so they shrink on short
screens but never collapse below their content. `svh` accounts for browser
chrome; `vh` does not.

**Keep step cards a uniform height within an act.** Card height otherwise
follows paragraph length, so steps silently differ and the piece feels
sloppy as you scroll. Trim copy to match, and add a `min-height` floor so a
future width or font change can't reintroduce the drift.

**Go full-bleed on mobile.** Inset cards waste ~20% of the line width on a
360px screen. Run cards edge to edge (`width: calc(100% + 2 * var(--pad))` with
a negative `margin-inline`), square off the corners at the screen edge (rounded
corners against a hard edge read as a bug), and keep ~20px internal padding so
text never touches the glass. Preserve the card as a distinct surface with a
hairline border or shadow rather than a side gap.

## The overflow class of bug

Horizontal overflow is the most common mobile defect and it hides from a
default-size test window. The mechanism: grid tracks and flex items default to
`min-width: auto`, so any child with intrinsic width — a `nowrap` number label,
a fixed-size SVG, an unbreakable file path or URL — holds its track open wider
than the viewport.

Prevention, applied at every level rather than at the one place you noticed it:

- `grid-template-columns: minmax(0, 1fr)` instead of bare `1fr`
- `min-width: 0` on flex/grid children that contain nowrap or fixed-size content
- `max-width: 100%; height: auto` on every SVG
- `overflow-wrap: anywhere` on long unbreakable strings
- `overflow-x: clip` on `html, body` as a backstop only — never as the fix

**Verify by sweeping widths programmatically**, not by eye:
`document.documentElement.scrollWidth <= window.innerWidth` at 320, 360, 375,
390 and 412px. Then walk the DOM and log every element whose
`getBoundingClientRect().right` exceeds the viewport — that names the offender
directly instead of leaving you guessing.

**SVG aspect-ratio trap:** an SVG with `width: 100%` and a `max-height` cap will
back-solve a *narrower* width to preserve its viewBox ratio, silently shrinking
your illustration into a small centred box. Set an explicit CSS `aspect-ratio`
matching the viewBox so width stays authoritative, and use
`preserveAspectRatio="xMidYMid slice"` if the height cap might bind.

## The sticky visual should morph, not remount

Swapping a different component in per step (`{#key currentStep}` with a fade)
makes the panel jump, because each chart has a different natural height. It also
throws away animation state.

Prefer one persistent visual that takes a `step` or `highlight` prop and
transitions — the same dots regrouping, the same chart shifting emphasis, the
same scene gaining elements. It reads as one continuous idea rather than a
slideshow, which is the whole point of the format.

Where a genuine swap is needed, stack the frames absolutely inside a
fixed-height container and crossfade opacity, so nothing reflows.

## Shared CSS, per-act accent

Declaring the same `:global(.act .scrolly-step)` rules inside several act
components means every rule applies to every act and the last one mounted wins.
Symptom: an act shows another act's accent colour.

Put shared step-card styles in the global stylesheet exactly once, and let each
act set a custom property (`--act-accent`) on its wrapper that the border,
kicker and any highlights all read from.

## Dark sections need their own text colours

A global `p { color: var(--text-secondary) }` tuned for a paper background beats
inheritance from a dark wrapper, because an element-level rule wins over an
inherited value regardless of specificity. Text tuned for paper renders at
roughly 1.5:1 on a dark surface — effectively invisible.

Any permanently-dark section must set colours on its own text elements. After
any theme change, screenshot every dark section rather than assuming tokens
propagated.

## Charts

Prefer a shared chart scaffold (LayerCake, or your own) that owns scales,
margins and responsive sizing. Hand-rolling each chart means re-solving margins
and clipping every time, and that is where fixed heights, clipped axis labels
and overflowing legends come from.

**Validate the palette, don't eyeball it.** Load the `dataviz` skill and run its
validator for adjacent-colour separation, colour-vision-deficiency safety, and
contrast against *both* the light and dark surfaces the chart will sit on.

Two specifics that bite: check the **dimmed** state, because sequential ramps
collapse into indistinguishable pastels once de-emphasised — measure it rather
than trusting the swatches. And when categories are ordered ends of a scale
(poorest to richest), a **diverging** palette separates them far better than a
sequential one.

Never encode meaning by colour alone. Direct labels on marks are the mitigation
that makes a palette warning acceptable, and they also survive being screenshotted.

## Data integrity

This is what separates a piece that survives scrutiny from one that gets picked
apart in a comment thread, and it is worth more effort than any visual polish.

Give every data file a `source` field naming the publication, edition and data
year. When you can compute a figure from primary counts, do that and say so —
"computed from UN birth counts" is a stronger claim than "approximate".

**Trace figures to primary documents.** Search-result summaries are AI-generated
and contradict each other: the same query returned two different values for one
country's median wealth, and a plausible-looking currency conversion that was
simply wrong. A PDF from the issuing body settles it; a snippet does not.

**Never mix editions inside one chart or comparison.** Different vintages across
different charts is acceptable if each is labelled; two years inside one
comparison is not.

**Say on screen which year a number is from.** Prose citing a 2025 figure beside
a widget showing a 2022 one reads as a bug even when both are correct.

**Check that your source actually covers your subject.** A report may cover 56
markets while your visual names fourteen countries, seven of which are outside
it. Figures you cannot attribute should be flagged as unverified estimates in
the UI, or left out — not quietly attributed to a document that never contained
them.

If a figure cannot be verified, say so and stop, rather than shipping a
half-updated dataset. A consistent older dataset with honest labels beats a
mixture nobody can audit.

## Verification ritual

Screenshots are the only reliable check, and they must actually be looked at.

- Every step of every act, at desktop (1280×900) **and** phone (360×740)
- Both colour schemes for anything whose surface changed
- Device emulation, plus one deliberately short viewport, because a bare
  390×844 window is taller than a real phone's usable area
- A scroll-through in increments through at least one act, to catch panel jumps
- Any interactive widget in each of its states, including empty and extreme
  inputs (zero, negative, very large) and adjacent-label collisions
- The width sweep for horizontal overflow

Assemble same-size screenshots into a strip when checking uniformity — drift is
obvious side by side and invisible one at a time.

## Accessibility and motion

Honour `prefers-reduced-motion` by jumping to the resting end state rather than
merely shortening the animation, and set each keyframe's 0%/100% frame to that
resting state so a single iteration looks deliberate. Consider a visible motion
toggle too; not everyone has the OS setting.

Give live result regions `role="status"` and `aria-live="polite"`, label form
controls properly, use real `<select>` and `<input type="range">` styled rather
than reinvented, mark decorative SVGs `aria-hidden` and meaningful ones
`role="img"` with a label, and check focus rings are visible on dark surfaces.

## Publishing

Put the methodology and sources inside the piece. It's where a careful reader
looks, and it means you don't depend on a platform comment to be credible.

Add real `<title>`, meta description and OpenGraph/Twitter tags with a 1200×630
share image. A piece built to be shared that unfurls as a bare link wastes its
best distribution.

**On social platforms, a chart image outperforms a link by an order of
magnitude.** Feed-based communities consume images in place; a link asks for a
click and converts around 0.2% where images run 1–3%. If a community requires
the post itself to *be* the visualization, build a standalone PNG: ~2000×1500,
light background, title and subtitle and source line baked in, large type that
survives being scaled to thumbnail width, direct labels rather than a legend.
Put the interactive link in the first comment as a bonus, not as the ask.

Generate that PNG from the same data files with a committed script, so it is
reproducible and can't drift from the piece. Have the script assert the claim
in the title is still true of the data before it renders — a title is a claim,
and claims should be tested like code.
