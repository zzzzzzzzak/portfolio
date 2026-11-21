// Motion for the portfolio: Lenis smooth scroll, GSAP ScrollTrigger scenes, a Three.js hero.
import { createCity } from './city.js';
import { initLab, initTerminal, initGraph, initAgent } from './play.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduced = window.__reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const { gsap, ScrollTrigger, Lenis } = window;
const motion = !reduced && !!gsap && !!ScrollTrigger;

if (!motion) root.classList.add('reduce');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* ---------- smooth scroll ---------- */
let lenis = null;
if (motion) {
  gsap.registerPlugin(ScrollTrigger);
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}
let navLockUntil = 0;   // the nav stays visible while the page scrolls itself to a section
const scrollToEl = (el) => {
  navLockUntil = performance.now() + 2200;
  document.querySelector('.nav')?.classList.remove('is-hidden');
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
};

/* ---------- hero scene ---------- */
const canvas = $('.hero__canvas');
let city = null;
try { city = createCity(canvas, { reduced: !motion }); } catch (e) { city = null; }
if (city) window.city = city;
if (!city) root.classList.add('no-webgl');

/* ---------- split headings into words ---------- */
function splitWords(el) {
  const text = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = text.map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
  return $$('.w > span', el);
}

/* ---------- static builders (run with or without motion) ---------- */
// project bar charts from data-chart JSON
const fmt = {
  usd: (v) => '$' + Math.round(v).toLocaleString('en-US'),
  pct: (v) => v.toFixed(1) + '%',
  mb: (v) => v.toFixed(2) + ' MB',
  2: (v) => v.toFixed(2),
  x: (v) => v.toFixed(2) + '×',
};
$$('.chart[data-chart]').forEach((el) => {
  const c = JSON.parse(el.dataset.chart);
  const max = c.max || Math.max(...c.items.map((i) => i[1]));
  const f = fmt[c.fmt] || fmt[2];
  el.innerHTML = `<p class="chart__t">${c.title}</p>` + c.items.map(([k, v], i) =>
    `<div class="chart__row${i === c.hi ? ' is-hi' : ''}"><span>${k}</span><span class="chart__bar"><i style="--v:${(v / max).toFixed(4)}"></i></span><b data-v="${v}">${f(v)}</b></div>`).join('');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', c.title + ': ' + c.items.map(([k, v]) => `${k} ${f(v)}`).join(', '));
  el._fmt = f;
});

// typing terminal
const codeEl = $('.term__code');
const CODE = [
  [['import', 'k'], [' streamlit '], ['as', 'k'], [' st']],
  [['from', 'k'], [' model '], ['import', 'k'], [' score']],
  [['']],
  [['cut = st.slider('], ['"Cutoff"', 's'], [', 0.0, 1.0, 0.38)']],
  [['res = score(cutoff=cut)']],
  [['st.metric('], ['"Recall"', 's'], [', res.recall)']],
  [['st.metric('], ['"Net"', 's'], [', res.net)']],
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function renderCode(n) {
  let left = n, out = '';
  for (const line of CODE) {
    for (const [t, cls] of line) {
      if (left <= 0) break;
      const part = t.slice(0, left); left -= part.length;
      out += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
    }
    if (left <= 0) break;
    out += '\n'; left -= 1;
  }
  return out;
}
const codeLen = CODE.reduce((a, l) => a + l.reduce((b, [t]) => b + t.length, 0) + 1, 0);
if (codeEl) codeEl.innerHTML = renderCode(codeLen);

/* ---------- neural network canvas ---------- */
function neuralNet(cv) {
  const ctx = cv.getContext('2d');
  const layers = [4, 7, 7, 3];
  let nodes = [], edges = [], pulses = [], W = 0, H = 0, on = false, raf = 0, last = 0, spawn = 0;
  const glow = new Map();
  function layout() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    nodes = layers.map((n, li) => Array.from({ length: n }, (_, i) => ({
      x: 34 + (li / (layers.length - 1)) * (W - 68), y: H / 2 + (i - (n - 1) / 2) * Math.min(24, (H - 40) / n), li,
    })));
    edges = [];
    for (let l = 0; l < layers.length - 1; l++) for (const a of nodes[l]) for (const b of nodes[l + 1]) edges.push([a, b]);
  }
  function draw(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (const [a, b] of edges) { ctx.strokeStyle = 'rgba(91,143,255,.12)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    spawn -= dt;
    if (spawn <= 0 && !reduced) {
      spawn = 0.07;
      const first = edges.filter(([a]) => a.li === 0);
      pulses.push({ e: first[Math.floor(Math.random() * first.length)], t: 0, s: 1.4 + Math.random() });
    }
    for (const p of pulses) {
      p.t += dt * p.s;
      if (p.t < 0) continue;
      const [a, b] = p.e;
      if (p.t >= 1) {
        glow.set(b, 1);
        if (b.li < layers.length - 1 && Math.random() < 0.75) {
          const nx = edges.filter(([x]) => x === b);
          pulses.push({ e: nx[Math.floor(Math.random() * nx.length)], t: 0, s: p.s });
        }
        p.dead = true; continue;
      }
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.strokeStyle = 'rgba(76,240,200,.55)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * Math.max(0, p.t - 0.25), a.y + (b.y - a.y) * Math.max(0, p.t - 0.25)); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#4cf0c8'; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill();
    }
    pulses = pulses.filter((p) => !p.dead).slice(-160);
    for (const layer of nodes) for (const n of layer) {
      const g = glow.get(n) || 0;
      if (g > 0) glow.set(n, Math.max(0, g - dt * 1.6));
      ctx.fillStyle = '#070a0e'; ctx.strokeStyle = g > 0 ? `rgba(76,240,200,${0.4 + g * 0.6})` : 'rgba(141,180,255,.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(n.x, n.y, 6 + g * 2, 0, 7); ctx.fill(); ctx.stroke();
      if (g > 0) { ctx.fillStyle = `rgba(76,240,200,${g * 0.8})`; ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, 7); ctx.fill(); }
    }
    if (on || pulses.length) raf = requestAnimationFrame(draw); else raf = 0;
  }
  layout();
  window.addEventListener('resize', layout);
  // click the card to fire a burst through the network
  cv.closest('.card')?.addEventListener('click', (ev) => {
    if (ev.target.closest('a')) return;
    const first = edges.filter(([a]) => a.li === 0);
    for (let i = 0; i < 26; i++) pulses.push({ e: first[Math.floor(Math.random() * first.length)], t: -Math.random() * 0.4, s: 1.6 + Math.random() * 1.4 });
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
  });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = !reduced; if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } }
    else if (!e.isIntersecting) { on = false; cancelAnimationFrame(raf); raf = 0; }
  }).observe(cv);
}
$$('canvas.nn').forEach(neuralNet);
$$('.viz-science').forEach((v) => v.closest('.card').classList.add('is-clickable'));

/* ---------- back to top, and the motion switch ---------- */
const toTop = $('.to-top');
const showTop = () => toTop.classList.toggle('is-on', window.scrollY > window.innerHeight * 1.2 && !root.classList.contains('is-exploring'));
window.addEventListener('scroll', showTop, { passive: true });
showTop();
function setMotion(v) { try { localStorage.setItem('zs-motion', v); } catch (e) { /* storage blocked */ } location.reload(); }
const motionBtn = $('.motion-toggle');
motionBtn.textContent = reduced ? 'Turn animations on' : 'Turn animations off';
motionBtn.addEventListener('click', () => setMotion(reduced ? 'on' : 'off'));
const note = $('.motion-note');
let noteDismissed = false;
try { noteDismissed = sessionStorage.getItem('zs-motion-note') === 'x'; } catch (e) { /* ignore */ }
if (window.__osReduced && !window.__motionPick && !noteDismissed) note.hidden = false;
$('[data-motion="on"]', note).addEventListener('click', () => setMotion('on'));
$('.motion-note__x', note).addEventListener('click', () => { note.hidden = true; try { sessionStorage.setItem('zs-motion-note', 'x'); } catch (e) { /* ignore */ } });

/* ---------- interactive sections ---------- */
initLab();
initTerminal();
initGraph();
initAgent();

/* ---------- hero: orbit, inspect, switch view ---------- */
(function heroInteraction() {
  if (!city) { $('.hero__ctrl')?.remove(); return; }
  const hero = $('.hero'), tip = $('.hero__tip'), cursor = $('.cursor'), clabel = $('.cursor__label');
  const seg = $('.hero__ctrl .seg');
  const setView = (v) => { $$('[data-view]', seg).forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.view === v))); };
  seg.addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (!b) return; setView(+b.dataset.view); city.setMorph(+b.dataset.view); });
  hero._setView = setView;
  const pad = (n) => String(n + 1).padStart(2, '0');
  const label = (p) => p.chart ? `<b>cell ${pad(p.i)} · ${pad(p.j)}</b><span>value ${p.value}</span>` : `<b>BLDG ${pad(p.i)}-${pad(p.j)}</b><span>${p.floors} floors · ${p.metres} m</span>`;
  const showTip = (p, x, y) => {
    const r = hero.getBoundingClientRect();
    tip.hidden = false; tip.innerHTML = label(p);
    const tx = Math.min(x - r.left + 18, r.width - 190), ty = Math.min(y - r.top + 18, r.height - 70);
    tip.style.transform = `translate(${tx}px, ${ty}px)`;
  };
  const skip = (e) => e.target.closest('a, button, input, .hero__ctrl, .hero__lead, .hero__role');
  let down = null, moved = 0, pending = 0, selected = null, tipTimer = 0;
  const exploring = () => root.classList.contains('is-exploring');
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || exploring()) return;
    if (down) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      moved += Math.abs(dx) + Math.abs(dy); city.drag(dx, dy); down = { x: e.clientX, y: e.clientY };
      tip.hidden = true; return;
    }
    if (skip(e)) { city.hover(null); tip.hidden = true; cursor.classList.remove('is-view'); return; }
    cursor.classList.add('is-view'); clabel.textContent = 'drag';
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      const p = city.pick(e.clientX, e.clientY);
      city.hover(p ? p.k : null);
      if (p) showTip(p, e.clientX, e.clientY); else tip.hidden = true;
    });
  });
  hero.addEventListener('pointerleave', () => { city.hover(null); tip.hidden = true; cursor.classList.remove('is-view'); });
  hero.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || skip(e) || exploring()) return;
    e.preventDefault();
    down = { x: e.clientX, y: e.clientY }; moved = 0; city.setDragging(true);
    hero.setPointerCapture(e.pointerId); hero.classList.add('is-dragging');
  });
  const release = (e) => {
    if (!down) return;
    down = null; city.setDragging(false); hero.classList.remove('is-dragging');
    if (moved < 6) {
      const p = city.pick(e.clientX, e.clientY);
      selected = p && (!selected || selected.k !== p.k) ? p : null;
      city.select(selected ? selected.k : null);
      if (selected) showTip(selected, e.clientX, e.clientY);
    }
  };
  hero.addEventListener('pointerup', release);
  hero.addEventListener('pointercancel', release);
  // touch: tap a building to inspect it
  hero.addEventListener('click', (e) => {
    if (skip(e) || exploring() || matchMedia('(pointer: fine)').matches) return;
    const p = city.pick(e.clientX, e.clientY);
    city.select(p ? p.k : null);
    if (p) { showTip(p, e.clientX, e.clientY); clearTimeout(tipTimer); tipTimer = setTimeout(() => { tip.hidden = true; city.select(null); }, 2600); }
  });
})();

/* ---------- mobile menu (works without GSAP) ---------- */
const menuBtn = $('.nav__menu-btn'), menu = $('#menu');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  if (lenis) open ? lenis.stop() : lenis.start();
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

// in-page links through the smooth scroller
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id === '#main') return;            // the skip link keeps native focus behaviour
  const t = id === '#top' ? document.body : $(id);
  if (!t) return;
  e.preventDefault();
  setMenu(false);
  scrollToEl(t);
  history.replaceState(null, '', id);
}));

/* ---------- survey mode: drive through the city to find the projects ---------- */
(function surveyMode() {
  const openBtn = $('.survey-open'), ui = $('.survey');
  if (!city || !openBtn) { openBtn?.remove(); return; }
  const SITES = [
    { t: 'Customer churn', s: 'Python · scikit-learn', d: 'Cutoff 0.38 catches 307 of 374 churners.', m: [['Recall', '82.1%'], ['ROC-AUC', '0.848'], ['Retained', '$257,880']], u: 'customer-churn-retention-analysis' },
    { t: 'Equity forecasting', s: 'Python · SQLite · Parquet', d: '120 tickers, a morning report in under 45 s.', m: [['Sharpe, w9', '3.10'], ['Windows', '10'], ['Tickers', '120']], u: 'equity-forecasting-pipeline' },
    { t: 'Enterprise sales BI', s: 'SQL · DAX · Power BI', d: 'A star schema with 40,000+ sales facts.', m: [['KPIs', '12'], ['Dimensions', '5'], ['Fact rows', '40,000+']], u: 'enterprise-sales-bi-analytics' },
    { t: 'LLM agent eval', s: 'Python · statistics', d: 'A CI gate that blocks a weaker release.', m: [['Pass rate', '95.0%'], ['McNemar p', '0.0039'], ['Gate', 'PASS']], u: 'llm-agent-eval-harness' },
    { t: 'Quant-ops engine', s: 'PyTorch', d: 'INT8 and INT4 quantization of a 12.86M model.', m: [['Compression', '7.47×'], ['Cosine', '0.9973'], ['INT4', '6.56 MB']], u: 'quant-ops-engine' },
    { t: 'Video moment search', s: 'PyTorch · retrieval', d: 'Finds the moment that matches a sentence.', m: [['Recall@3', '75.0%'], ['p50, CPU', '26 ms'], ['p95, CPU', '31 ms']], u: 'multimodal-temporal-video-rag' },
    { t: 'Deepfake detector', s: 'PyTorch · FFT', d: 'Image stream plus the 2D frequency spectrum.', m: [['ROC-AUC', '0.954'], ['EER', '10.0%'], ['p50, CPU', '19 ms']], u: 'spatial-frequency-deepfake-detector' },
  ];
  const labels = $('.survey__labels'), card = $('.survey__card'), count = $('.sv-n'), done = $('.survey__done'), clock = $('.survey__clock'), joy = $('.joy');
  labels.innerHTML = SITES.map((p, i) => `<span class="lm" data-i="${i}"><b>${String(i + 1).padStart(2, '0')}</b> ${p.t}<em></em></span>`).join('');
  const lms = $$('.lm', labels);
  let seen = new Set();
  try { seen = new Set(JSON.parse(localStorage.getItem('zs-surveyed') || '[]')); } catch (e) { /* storage blocked */ }
  const save = () => { try { localStorage.setItem('zs-surveyed', JSON.stringify([...seen])); } catch (e) { /* ignore */ } };
  const keys = new Set(), joyV = { x: 0, y: 0, on: false };
  let active = false, raf = 0, open = -1;

  function showCard(i) {
    if (i === open) return;
    open = i;
    if (i < 0) { card.hidden = true; return; }
    const p = SITES[i];
    card.innerHTML = `<span class="sc__n">site ${String(i + 1).padStart(2, '0')} · ${p.s}</span><h3>${p.t}</h3><p>${p.d}</p>
      <dl>${p.m.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <a class="link" href="https://github.com/zzzzzzzzak/${p.u}" target="_blank" rel="noopener">See the code</a>`;
    card.hidden = false;
    if (!seen.has(i)) {
      seen.add(i); save();
      lms[i].classList.add('is-seen');
      count.textContent = seen.size;
      if (seen.size === SITES.length) done.hidden = false;
    }
  }
  function tick() {
    if (!active) return;
    let th = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
    let st = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    if (joyV.on) { th = -joyV.y; st = joyV.x; }
    city.setInput(th, st);
    const dv = city.drive;
    let near = -1, nd = 1e9;
    const placed = [];                                        // labels already on screen this frame
    city.landmarks.forEach((l, i) => {
      const d = Math.hypot(l.x - dv.x, l.z - dv.z), s = city.toScreen(l.x, Math.min(l.h + 0.4, 1.9), l.z);
      const el = lms[i], W = ui.clientWidth, H = ui.clientHeight;
      let x = s.x, y = s.y;
      if (!s.on) { x = W - x; y = H; }                       // behind the rover: mirror to the bottom edge
      let cx = Math.min(W - 110, Math.max(110, x)), cy = Math.min(H - 70, Math.max(120, y));
      const edge = cx !== x || cy !== y;
      if (edge) {                                             // stack edge labels instead of piling them up
        const top = cy < H / 2;
        while (placed.some((p) => Math.abs(p.x - cx) < 200 && Math.abs(p.y - cy) < 28)) cy += top ? 30 : -30;
      }
      placed.push({ x: cx, y: cy });
      el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -100%)`;
      el.style.opacity = edge ? 0.55 : 1;
      el.classList.toggle('is-edge', edge);
      el.lastChild.textContent = ` · ${Math.round(d * 15)} m`;
      el.classList.toggle('is-near', d < 2.2);
      if (d < nd) { nd = d; near = i; }
    });
    showCard(nd < 2.2 ? near : -1);
    raf = requestAnimationFrame(tick);
  }
  function enter() {
    if (active) return;
    const go = () => {
      active = true;
      root.classList.add('is-exploring');
      lenis?.stop();
      ui.hidden = false;
      count.textContent = seen.size;
      seen.forEach((i) => lms[i]?.classList.add('is-seen'));
      done.hidden = seen.size < SITES.length;
      clock.textContent = 'lane assist on · let go of steering to straighten up';
      city.setExplore(true);
      $('.survey__exit').focus({ preventScroll: true });
      raf = requestAnimationFrame(tick);
    };
    if (window.scrollY > 2) { lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0); setTimeout(go, 60); } else go();
  }
  function leave() {
    if (!active) return;
    active = false; cancelAnimationFrame(raf);
    keys.clear(); city.setInput(0, 0); city.setExplore(false);
    root.classList.remove('is-exploring');
    ui.hidden = true; card.hidden = true; open = -1;
    lenis?.start();
    openBtn.focus({ preventScroll: true });
  }
  openBtn.addEventListener('click', enter);
  $('.survey__exit').addEventListener('click', leave);
  const DRIVE = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  window.addEventListener('keydown', (e) => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { leave(); return; }
    if (DRIVE.includes(k) && !e.target.closest('input, textarea')) { e.preventDefault(); keys.add(k); }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  const knob = $('i', joy);
  joy.addEventListener('pointerdown', (e) => { joyV.on = true; joy.setPointerCapture(e.pointerId); move(e); });
  const move = (e) => {
    if (!joyV.on) return;
    const r = joy.getBoundingClientRect(), R = r.width / 2;
    let x = e.clientX - r.left - R, y = e.clientY - r.top - R; const l = Math.hypot(x, y);
    if (l > R * 0.8) { x *= R * 0.8 / l; y *= R * 0.8 / l; }
    joyV.x = x / (R * 0.8); joyV.y = y / (R * 0.8);
    knob.style.transform = `translate(${x}px, ${y}px)`;
  };
  joy.addEventListener('pointermove', move);
  const up = () => { joyV.on = false; joyV.x = joyV.y = 0; knob.style.transform = ''; };
  joy.addEventListener('pointerup', up); joy.addEventListener('pointercancel', up);
})();

/* ---------- no motion: show the finished state and stop ---------- */
if (!motion) {
  $('.loader')?.remove();
  city?.setMorph(0);
  city?.start();
  $$('.ring-fg').forEach((r) => r.closest('.chart').style.setProperty('--p', r.closest('.chart').dataset.ring));
} else {
  runMotion();
}

function runMotion() {
  window.scrollTo(0, 0);
  lenis?.stop();

  /* counters: start at zero, count up on view */
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), o = { v: 0 };
    el.textContent = (0).toFixed(dec);
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } }),
    });
  });

  /* split headings */
  $$('[data-split]').forEach((h) => {
    const words = splitWords(h);
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045 }) });
  });

  /* loader, then the hero intro */
  const num = $('.loader__num'), cnt = { v: 0 };
  gsap.set('.hero__title .line__in', { yPercent: 110 });
  gsap.set(['.hero__eyebrow', '.hero__role', '.hero__lead', '.hero__cta', '.hud'], { opacity: 0, y: 24 });
  const fontsReady = (document.fonts?.ready || Promise.resolve()).catch(() => {});
  const minTime = new Promise((r) => setTimeout(r, 1500));
  gsap.to(cnt, { v: 92, duration: 1.4, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(cnt.v); } });
  gsap.to('.loader__bar i', { scaleX: .92, duration: 1.4, ease: 'power2.out' });
  Promise.all([fontsReady, minTime]).then(() => {
    const tl = gsap.timeline();
    tl.to(cnt, { v: 100, duration: .35, onUpdate: () => { num.textContent = Math.round(cnt.v); } })
      .to('.loader__bar i', { scaleX: 1, duration: .35 }, '<')
      .to('.loader__inner', { y: -40, opacity: 0, duration: .6, ease: 'power3.in' })
      .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut', onStart: () => city?.start() }, '-=.15')
      .set('.loader', { display: 'none' })
      .to('.hero__title .line__in', { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: .12 }, '-=.55')
      .to(['.hero__eyebrow', '.hero__role', '.hero__lead', '.hero__cta', '.hud'], { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .08 }, '-=1.1')
      .add(() => { lenis?.start(); ScrollTrigger.refresh(); });
  });

  /* role rotator */
  const items = $$('.rotator__list span');
  const rot = $('.rotator');
  const widest = Math.max(...items.map((s) => s.getBoundingClientRect().width));
  rot.style.width = Math.ceil(widest) + 'px';
  const rtl = gsap.timeline({ repeat: -1 });
  items.forEach((_, i) => { if (i) rtl.to('.rotator__list', { yPercent: -(100 / items.length) * i, duration: .8, ease: 'expo.inOut' }, '+=1.6'); });
  rtl.to('.rotator__list', { yPercent: 0, duration: .8, ease: 'expo.inOut' }, '+=1.6');

  /* hero: pin, fade the text, compile the city into a chart */
  const morph = { m: 0 };
  const hudMorph = $('.hud__morph'), hudMode = $('.hud__mode');
  const heroTl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=160%', pin: true, scrub: 1, anticipatePin: 1 },
  });
  heroTl
    .to('.hero__inner', { yPercent: -18, opacity: 0, ease: 'power2.in', duration: .3 }, 0)
    .to('.hud--tl', { opacity: 0, duration: .2 }, 0)
    .to(morph, { m: 1, ease: 'none', duration: .62, onUpdate: () => {
      city?.setMorph(morph.m);
      hudMorph.textContent = 'morph ' + morph.m.toFixed(2);
      hudMode.textContent = morph.m < .5 ? 'blueprint' : 'data model';
    } }, .18)
    .fromTo('.hero__caption-a', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: .18, ease: 'power3.out' }, .2)
    .fromTo('.hero__caption-b', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: .18, ease: 'power3.out' }, .55)
    .to('.hero__caption p', { opacity: 0, y: -40, duration: .14, ease: 'power2.in' }, .86)
    .to('.hud--br', { opacity: 0, duration: .1 }, .9);

  /* story: pin and draw the house, then turn it into data */
  const bp = $('.bp');
  const drawables = $$('.d:not(.axis)', bp);
  drawables.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  gsap.set($$('.axis', bp), { opacity: 0 });
  gsap.set($$('.t, .fill-hatch', bp), { opacity: 0 });
  gsap.set($$('.bars rect', bp), { scaleY: 0 });
  gsap.set($$('.nodes circle', bp), { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' });
  const steps = $$('.step'), phase = $('.bp__phase');
  const phases = ['phase 1/4 · structure', 'phase 2/4 · openings and roof', 'phase 3/4 · grid, dims, BBS', 'phase 4/4 · data model'];
  let cur = -1;
  const navBtns = $$('.story__nav button');
  const storyTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.story', start: 'top top', end: '+=320%', pin: true, scrub: 1, anticipatePin: 1,
      onUpdate: (st) => {
        const i = Math.min(3, Math.floor(st.progress * 4 * 0.999));
        if (i !== cur) { cur = i; steps.forEach((s, k) => s.classList.toggle('is-active', k === i)); phase.textContent = phases[i]; navBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); }
      },
    },
  });
  storyTl
    .to($$('.ph1 .d', bp), { strokeDashoffset: 0, duration: 1, stagger: .12 }, 0)
    .to($$('.ph1 .fill-hatch', bp), { opacity: 1, duration: .4 }, .7)
    .to($$('.ph2 .d', bp), { strokeDashoffset: 0, duration: .8, stagger: .05 }, 1.2)
    .to($$('.ph3 .d:not(.axis)', bp), { strokeDashoffset: 0, duration: .6, stagger: .04 }, 2.3)
    .to($$('.ph3 .axis', bp), { opacity: .5, duration: .5, stagger: .1 }, 2.3)
    .to($$('.ph3 .t', bp), { opacity: 1, duration: .5 }, 2.6)
    .to(bp, { color: '#3a5a8a', duration: .6 }, 3.3)
    .to($$('.ph3', bp), { opacity: .35, duration: .6 }, 3.3)
    .to($$('.bars rect', bp), { scaleY: 1, duration: .5, stagger: .05, ease: 'power2.out' }, 3.4)
    .to($$('.ph4 .d', bp), { strokeDashoffset: 0, duration: .6 }, 3.6)
    .to($$('.nodes circle', bp), { scale: 1, duration: .2, stagger: .08, ease: 'back.out(3)' }, 3.9)
    .to($$('.ph4 .t', bp), { opacity: 1, duration: .3 }, 4.1)
    .to({}, { duration: .3 });

  navBtns.forEach((b, i) => b.addEventListener('click', () => {
    const st = storyTl.scrollTrigger;
    const y = st.start + (st.end - st.start) * [0.2, 0.42, 0.66, 0.97][i];
    lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  /* hero view buttons follow the scroll */
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: '+=160%', onUpdate: (s) => $('.hero')._setView?.(s.progress > 0.5 ? 1 : 0) });

  /* projects: horizontal scroll */
  const track = $('.projects__track');
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const hTween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: '.projects', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  $$('.proj').forEach((card) => {
    const bars = $$('.chart__bar i', card), vals = $$('.chart__row b', card), ring = $('.chart--ring', card);
    if (bars.length) gsap.set(bars, { scaleX: 0 });
    if (ring) ring.style.setProperty('--p', 0);
    ScrollTrigger.create({
      trigger: card, containerAnimation: hTween, start: 'left 88%', once: true,
      onEnter: () => {
        if (bars.length) gsap.to(bars, { scaleX: 1, duration: 1.3, ease: 'expo.out', stagger: .12 });
        vals.forEach((b) => {
          const end = +b.dataset.v, o = { v: 0 }, f = b.closest('.chart')._fmt;
          gsap.to(o, { v: end, duration: 1.3, ease: 'expo.out', onUpdate: () => { b.textContent = f(o.v); } });
        });
        if (ring) gsap.to(ring, { '--p': +ring.dataset.ring, duration: 1.6, ease: 'expo.out' });
      },
    });
    gsap.from(card, { y: 60, rotate: 2, opacity: .3, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left 100%', end: 'left 60%', scrub: true } });
  });

  /* experience */
  gsap.set('.ba__b', { scaleX: 0 });
  ScrollTrigger.create({ trigger: '.ba', start: 'top 80%', once: true, onEnter: () => gsap.to('.ba__b', { scaleX: 1, duration: 1.4, ease: 'expo.out', stagger: .09 }) });
  gsap.fromTo('.tl__line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 70%', end: 'bottom 70%', scrub: true } });
  $$('.tl__item').forEach((it) => gsap.from(it, { opacity: 0, y: 30, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: it, start: 'top 85%', once: true } }));

  /* skills */
  $$('.lv__m').forEach((m) => m.style.setProperty('--s', 0));
  ScrollTrigger.create({ trigger: '.lv', start: 'top 85%', once: true, onEnter: () => $$('.lv__m').forEach((m, i) => setTimeout(() => m.style.setProperty('--s', 1), i * 60)) });
  gsap.to('.marquee', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.skills', start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('.edu > div, .card, .stats__grid li').forEach((el) => gsap.from(el, { opacity: 0, y: 50, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));

  /* footer word rises */
  gsap.from('.foot__big span', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* typing terminal loop */
  if (codeEl) {
    const typ = { n: 0 };
    const caret = '<span class="caret"></span>';
    const tt = gsap.timeline({ repeat: -1, paused: true });
    tt.fromTo(typ, { n: 0 }, { n: codeLen, duration: 6, ease: 'none', onUpdate: () => { codeEl.innerHTML = renderCode(Math.round(typ.n)) + caret; } }).to({}, { duration: 2.5 });
    ScrollTrigger.create({ trigger: codeEl, start: 'top bottom', end: 'bottom top', onToggle: (s) => s.isActive ? tt.play() : tt.pause() });
  }

  /* nav: background, hide on scroll down, current section */
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const y = s.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      if (performance.now() > navLockUntil) nav.classList.toggle('is-hidden', s.direction === 1 && y > window.innerHeight * 0.8 && menu.hidden);
      gsap.set('.progress i', { scaleX: s.progress });
    },
  });
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-current', s.isActive) });
  });

  /* pointer niceties */
  if (fine) {
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
    const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { cur.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => cur.classList.toggle('is-link', !!e.target.closest('a, button')));

    $$('.magnetic').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .4); });
      el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }); });
    });

    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        gsap.to(el, { rotationY: (px - .5) * 7, rotationX: (.5 - py) * 7, transformPerspective: 1100, duration: .6, ease: 'power3' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotationX: 0, rotationY: 0, duration: 1, ease: 'elastic.out(1, .5)' }));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
