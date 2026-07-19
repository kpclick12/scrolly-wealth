# The Birth Lottery

A scrollytelling visual essay on wealth: how much of it is created, why it
piles up so unevenly between countries and within them, and how much of any
one person's share was decided the day they were born. It opens with a
five-person island parable, walks through real-world data on wealth between
and within countries, and closes with two interactive pieces — a spin-the-
wheel game weighted by real shares of world births, and a "where do you
stand" wealth explorer.

Live: https://kpclick12.github.io/scrolly-wealth/

## Tech stack

- **[Svelte 5](https://svelte.dev)** (runes: `$state`, `$derived`, `$props`,
  `$effect`) + **[Vite](https://vite.dev)** for the build
- **[d3](https://d3js.org)** (`d3-scale`) for scales — charts themselves are
  hand-built SVG, not a d3-rendered chart library, so every mark can be
  styled and animated with ordinary CSS/Svelte transitions
- **[GSAP](https://gsap.com)** for the wheel-spin animation
- No UI framework, no CSS framework — one shared stylesheet
  (`src/app.css`) holds all design tokens (color, type, the shared
  `.scrolly-step` card and `.visual-frame-stack` sticky-panel pattern) so
  every act stays visually consistent
- Self-hosted variable-weight Playfair Display (`public/fonts/`) — no
  third-party font requests

## Project structure

```
src/
  App.svelte              hero, act order, methodology/sources, footer
  app.css                 design tokens: color, type, shared step-card styles
  data/                   one JSON file per dataset (see Data sources below)
  lib/
    components/           charts + interactive pieces (BarChart, Heatmap,
                           LinkedPyramid, WheelGame, StandExplorer, …)
    story/                one Svelte component per narrative act
                           (IslandAct, ActReal, ActBetween, ActWithin, ActPile)
    data/load.js           imports and re-exports every data/*.json file
```

Each act follows the same pattern: a `Scrolly.svelte` wrapper pairs a
sticky visual panel with a column of step cards; scrolling past a step's
midpoint marks it active and drives which chart, highlight or mode the
sticky panel shows. Acts never remount their visual between steps — a
single chart instance persists and only its highlight/mode/data changes,
so the chart visibly "does something" as you scroll instead of being
swapped out.

## npm scripts

```
npm install       install dependencies
npm run dev       start the Vite dev server
npm run build     production build to dist/
npm run preview   serve the production build locally (respects the
                   GitHub Pages /scrolly-wealth/ base path)
```

## Data sources

Every figure on the page is an **approximation, rounded for readability**.
Full sourcing detail lives in the "Methodology & sources" section at the
bottom of the page itself; in short:

- **Global wealth pyramid, wealth levels, millionaire counts** —
  UBS/Credit Suisse, *Global Wealth Report 2023* (data year 2022)
- **Within-country wealth shares** (top 10%, top 1%, bottom 50%) — World
  Inequality Database (WID), approximate figures for around 2022
- **World GDP per capita over the long run** — Maddison Project Database
- **Country wealth growth over time** — UBS/Credit Suisse Global Wealth
  Report / Databook
- **Shares of world births** (used to size the spin-the-wheel game) —
  United Nations, World Population Prospects
- The island parable (Act One), the household balance-sheet example, the
  compounding chart, and the inheritance split are **illustrative
  examples**, not measured statistics — each is called out as such where
  it appears.

## Deploy

Deployed to GitHub Pages via `.github/workflows/deploy.yml`, which builds
with `npm run build` and publishes `dist/` on every push to `main`. The
Vite base path (`/scrolly-wealth/`) is set in `vite.config.js` for both
the production build and `vite preview`, so a local preview matches the
hosted path.
