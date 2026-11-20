# zzzzzzzzak.github.io

The portfolio of **Zakir Siddiqui**, data analyst and ML engineer: data analysis, data science,
ML systems, backend pipelines and web front ends, with the real numbers from each project.

**Live:** https://zzzzzzzzak.github.io

## What is in it

| Section | What it shows |
|---|---|
| Hero | A notebook querying 7,043 customer records, churn by contract type |
| Data analysis and data science | SQL window functions, a walk-forward backtest, AI output rating |
| ML, backend and web engineering | INT4/INT8 quantization, a scheduled GitHub Actions pipeline, a Streamlit app |
| Projects | Six repositories with their test results, as tabs |
| Roles | Eight roles since 2017, with four before-and-after results |
| About | Civil engineering to data, and education |
| Skills | 14 tools and skill levels |

## How it was built

- **[taste-skill](https://github.com/Leonxlnx/taste-skill)**: the layout system, motion and the
  finish gate. Its dealers picked the centred hero, the green-black palette, Instrument Sans and DM
  Mono, the nav, the footer and the two moments (liquid type, marquee row). Only the 25 kit files the
  page loads are in `assets/` (MIT, see `assets/LICENSE-taste-skill`).
- **[awesome-design-md](https://github.com/VoltAgent/awesome-design-md)**: the format of
  [`DESIGN.md`](DESIGN.md), which documents this site's tokens and components for people and AI agents.
- **[impeccable](https://github.com/pbakaus/impeccable)**: its audit dimensions (accessibility,
  responsive layout, touch targets, motion, implementation integrity) became the test suite.
- **[Playwright](https://github.com/microsoft/playwright)**: runs those tests on desktop and phone
  viewports on every push, with axe-core for WCAG 2.2 AA.

Plain HTML and CSS, no build step.

## Run it locally

```bash
npm install
npm run serve        # http://localhost:4173
npm test             # Playwright checks (uses Microsoft Edge locally, Chromium in CI)
```

## Deploy

`.github/workflows/pages.yml` runs the tests, then publishes the site to GitHub Pages. In the
repository settings, set **Pages > Source** to **GitHub Actions** once.

## Adding a photograph

The About section has a slot for a portrait (see the comment in `index.html`): save a 4:5 photo, at
least 1200px tall, as `assets/zakir.jpg`.
