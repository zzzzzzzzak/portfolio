---
version: beta
name: Zakir-Siddiqui-portfolio
description: A one-page portfolio for a civil engineer turned data scientist. Near-black canvas, blueprint blue for the engineering past, mint for data, amber for highlights. The page moves from a 3D city to a data model, and from a drawn house to a chart.

colors:
  canvas: "#05070a"
  surface: "#0a0e13"
  raised: "#10161d"
  ink: "#eef1f4"
  muted: "#8d97a3"
  accent: "#4cf0c8"     # data, actions, focus
  blue: "#5b8fff"       # blueprint lines, "before" values
  amber: "#ffb84d"      # civil engineering, dimensions, highlights
  blueprint: "#0b2547"

typography:
  display: { fontFamily: Inter Tight, fontWeight: 600-700, letterSpacing: -0.035em to -0.055em }
  text: { fontFamily: Inter Tight, fontSize: 17px, lineHeight: 1.55 }
  mono: { fontFamily: JetBrains Mono, fontSize: 11-13px, use: labels, code, chart values }

radius: 999px buttons and tags; 14px inner panels; 22px cards
motion: GSAP expo.out for reveals (1-1.4s), scrub 1 for pinned scenes, Lenis lerp 0.085
---

## Overview
The page tells one story: **blueprint → model**. Everything from the engineering years is blue and
amber line work; everything from the data years is mint. Every claim sits next to a real number.

## Scenes, in order
1. **Loader**: counts to 100 over a blueprint grid, then wipes up.
2. **Hero**: Three.js city (24 x 24 instanced buildings, edge-lit with fwidth, lit windows, street
   traffic). Pinned for 160% of the viewport: the text lifts away and the buildings fly into a 3D
   bar chart while "I used to design buildings. Now I design models." plays.
3. **Numbers**: six counters.
4. **Story**: pinned for 320%. An SVG house elevation draws in four phases (structure, openings and
   roof, grid and dimensions, data model) beside four steps from 2016 to now.
5. **Work**: four tilt cards with live visuals (animated bars and trend line, a canvas neural net,
   a pipeline with moving packets, a typing editor).
6. **Projects**: horizontal pinned scroll of seven cards; bars and the ROC ring animate on entry.
7. **Experience**: sticky before-and-after bars, a timeline whose line draws with scroll.
8. **Skills**: two marquee rows in opposite directions, level meters, education.
9. **Contact**: one large question, the **Email Zakir** button (magnetic), footer word.

## Components
- `.btn--primary`: mint pill, dark label, always "Email Zakir". `.btn--ghost`: glass pill.
- `.link`: text with an arrow; underline draws on hover.
- `.card`, `.proj`: dark raised panels with a cursor-following mint spotlight and border.
- `.chart`: rows of label, bar and value built from `data-chart` JSON. Highlight row in mint.

## Rules
- Real numbers only, from the resume or the repository READMEs.
- One accent per meaning: mint = data/action, amber = civil/dimension, blue = blueprint/before.
- No phone number on the page.
- Reduced motion: no pinning, no smooth scroll, every scene shown finished.
- Bloom only on screens 760px and wider; the 3D loop pauses when the hero is off screen.
