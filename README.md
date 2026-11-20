# Portfolio — Zakir Siddiqui

The portfolio of **Zakir Siddiqui**, data analyst and ML engineer: data analysis, data science,
ML systems, backend pipelines and web front ends, with the real numbers from each project.

**Live:** https://zzzzzzzzak.github.io/portfolio/

## What is in it

| Section | What it shows |
|---|---|
| Hero | A live 3D city (Three.js): drag to orbit, hover or click a building to inspect it, switch City / Data model; it also morphs into a 3D bar chart as you scroll |
| Numbers | Six counters from real results: 4.5M records a day, 82.1% recall, 7.47x compression |
| Story | A blueprint house that draws itself, gets dimensioned, then turns into a data chart: civil engineering to data |
| Work | Data analysis, data science and ML, backend pipelines, web development, each with a live visual |
| Lab | Switch between the three churn models and watch 374 churners light up; run the churn-by-contract query and click the bars |
| Agents | Agentic AI with LLMs: tool use, planning loops, RAG, evals and guardrails, plus a live agent that plans, calls real tools (SQL over career.db, a calculator, search over the page) and checks its answer, animated on a diagram |
| Projects | Seven repositories in a horizontal scroll, each with its test results as an animated chart |
| Experience | Eight roles since 2017 on a drawn timeline, with four before-and-after bars |
| Skills | Marquee, a draggable physics graph of tools by discipline, skill levels and education |
| Terminal | A SQL prompt over the career: projects, roles, skills, education (WHERE, LIKE, ORDER BY, COUNT) |

## How it was built

- **Three.js** (r170): one instanced box drawn 576 times; the blueprint edges, lit windows and the
  city-to-chart morph are all in custom shaders, with an Unreal bloom pass on larger screens.
- **GSAP + ScrollTrigger**: pinned scroll scenes (hero morph, blueprint drawing, horizontal projects),
  word-by-word heading reveals, counters, magnetic buttons and tilt cards.
- **Lenis**: smooth scrolling.
- **[awesome-design-md](https://github.com/VoltAgent/awesome-design-md)**: the format of [`DESIGN.md`](DESIGN.md).
- **[impeccable](https://github.com/pbakaus/impeccable)**: its audit dimensions became the test suite.
- **[Playwright](https://github.com/microsoft/playwright)**: runs those tests on desktop and phone
  viewports, with axe-core for WCAG 2.2 AA.

All libraries are vendored in `assets/vendor/` (MIT licensed), so there is no build step and no CDN at runtime.
With `prefers-reduced-motion`, nothing is pinned or animated and every section shows its finished state.

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
