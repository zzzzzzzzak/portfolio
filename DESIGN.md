---
version: alpha
name: Zakir-Siddiqui-portfolio
description: The design system of zzzzzzzzak.github.io, a one-page portfolio for a data analyst and ML engineer. A green-black canvas with bone text and one muted sage accent; the work itself (SQL, notebooks, metrics tables, CI config) is drawn as live HTML panes and carries the page.

colors:
  canvas: "#161c1a"
  surface: "#1f2725"
  pane: "#111614"
  ink: "#e3e2da"
  muted: "#8e948d"
  accent: "#9fc7b8"
  on-accent: "#161c1a"
  code-keyword: "#9fc7b8"
  code-string: "#e0c48c"
  code-comment: "#7d857f"
  bar-before: "#4a5450"
  inverse-canvas: "#e3e2da"
  inverse-ink: "#161c1a"

typography:
  display:
    fontFamily: Instrument Sans, system-ui, sans-serif
    fontWeight: 500
    letterSpacing: -0.028em (hero -0.036em)
    fontStretch: 96%
  text:
    fontFamily: Instrument Sans, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: DM Mono, ui-monospace, monospace
    fontSize: 13px
    lineHeight: 22px
  label:
    fontSize: 13px
    fontWeight: 500

radius: sharp (4 / 6 / 8 px controls and cards; 10 to 12 px drawn windows and panes)
spacing: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
---

## Overview

A portfolio that reads like the tools the work happens in. The page is near-black with a green cast,
like a terminal at night; every claim on it sits next to the artefact that proves it: the SQL that
built a report, the backtest table, the CI cron line, the before-and-after bars. Built on the
taste-skill kit (`assets/`), whose deal produced the hero, nav, footer, palette and type pairing.

- **Mode:** Experience and Persuade. The work leads; the one action is **Email Zakir**.
- **One section per screen** at 1440x900; on a phone a section is one or two screens.
- **Equal edges:** everything starts on the container's left line (80px at 1440, 24px at 390) or on
  the 12-column split line.

## Colors

### Brand and accent
- `accent #9fc7b8` (sage): the primary button, the selected tab, focus rings, bars that show the
  "after" value, highlighted numbers in panes. Under 3% of any screen.

### Surface
- `canvas #161c1a` is the page. `surface #1f2725` lifts secondary buttons and cards.
- Drawn panes and windows sit on `pane #111614`, one step darker than the canvas, with a 1px
  `rgb(227 226 218 / .09)` hairline and a long soft shadow.
- Panels behind panes use the lit `sage` ground (light green-grey) or a radial green glow
  (`#2c4a41` to `#161c1a`).
- The footer flips to the inverse dark band (`footer--dark`).

### Text
- `ink #e3e2da` for all reading text (7:1 or more on the canvas).
- `muted #8e948d` only for labels, dates and the grey second half of a heading.

### Never
- Violet or lavender anywhere. No gradients on buttons, no coloured text highlights.

## Typography

- **Instrument Sans** for headings and text, **DM Mono** for code, file names and pane titles.
- Hero h1: about 75px at 1440, 42px at 390, two lines, centred.
- Section h2: a noun phrase with a number or a named thing ("Eight roles since 2017"); an optional
  grey second sentence in `muted`.
- Sentence case everywhere. No all-caps labels, no exclamation marks.

## Layout

### Grid and container
- `.wrap` is 1280px wide (80px gutters at 1440, 24px at 390). `.grid` is 12 columns, 24px gap.
- Splits: text on `span-5`, the visual or list on `span-6 start-7`.

### Sections, in order
1. **Hero** (`hero--centred`): pill, h1, lead, two buttons, then a notebook window rising out of a
   lit frame with the `aurora-curtains` effect (sage palette). The query, the run line and the
   result arrive in steps.
2. **Data analysis and data science** and 3. **ML, backend and web engineering**: three open cards
   each, a title, one or two sentences, and a pane of real code or real numbers.
4. **Projects**: tabs tour, six tabs, one fixed frame showing each project's results table.
5. **Roles**: before-and-after bars beside eight rows (role, one result, years).
6. **About**: the statement "Civil engineer turned data engineer" set at h1 size with the
   `liquid-type` moment, then education in three columns.
7. **Skills**: the `marquee-row` moment of 14 tools above two columns of skill levels.
8. **Close and footer**: the main action and the surname set across the page.

### Breakpoints
- 1280+: everything shown. 1024 to 1279: the hero window drops its run line and tags; panes show
  7 code lines and 4 metric rows. 640 to 1023: cards put text left and the pane right; panes show
  3 lines. Under 640: one column, full-width buttons, panes show 5 lines and 3 rows.

### Touch targets
- Buttons 44px; tabs 44px; every link or control outside running text at least 24px (tested).

## Elevation and depth
- Flat page. Depth only inside visuals: a pane floats over its panel with
  `0 20px 40px -20px rgb(0 0 0 / .7)`. The nav is opaque with a 1px hairline, never blurred.

## Shapes
- `data-radius="sharp"`: 4 / 6 / 8px. Windows 12px, panes 10px, pill tags 99px.

## Components

### Buttons
- `.btn--primary`: sage fill, dark label, "Email Zakir" and nothing else. One per view, plus the nav.
- `.btn--secondary`: `#2b3532` fill, ink label ("See the projects").
- `.link`: ink text, underline that draws on hover, arrow after.

### Panes (`.z-pane`, `data-ui`)
- A mono title (`h4`), then either `pre` with one `.ln` block per line (keywords sage, strings
  sand), a `.z-kv` list of label and value rows, or a `.z-table`.
- Marked `data-ui` (a drawn product mock) and hidden from assistive tech; the card's text says the
  same thing in words.

### Window (`.z-win`)
- Title bar with three dots, a repository list on the left (hidden under 1024), a notebook column on
  the right with a code cell, a run line, horizontal result bars and two tags.

### Tabs
- `button.tab[role=tab]` with `aria-controls` naming its text panel and its screen. Selected tab in
  the sage fill. Click or arrow keys, never timed.

## Do's and Don'ts

### Do
- Put a real number from the resume or a repository README next to every claim.
- Show the artefact (query, table, config) instead of describing it.
- Keep every section to its screen; check with the taste-skill gate and `npm test`.

### Don't
- Invent clients, quotes, reviews or figures.
- Add a second button style, a second accent or a fade-in on scroll.
- Print the phone number; the resume PDF holds it, the site does not.
