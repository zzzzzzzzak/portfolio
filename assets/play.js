// Interactive pieces: the churn lab, the SQL terminal over the career, the skills graph.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = window.__reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function shuffle(n, seed) { const r = rng(seed), a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function press(group, btn) { $$('[aria-pressed]', group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn))); }
function tweenText(el, to, f) {
  const from = parseFloat(el.dataset.cur ?? to); el.dataset.cur = to;
  if (!gsap || reduced) { el.textContent = f(to); return; }
  const o = { v: from };
  gsap.to(o, { v: to, duration: 0.9, ease: 'expo.out', onUpdate: () => { el.textContent = f(o.v); } });
}

/* ---------------- churn lab ---------------- */
export function initLab() {
  const box = $('.lab'); if (!box) return;
  const TOTAL = 374;
  const models = [
    { recall: 78.1, f1: 0.801, net: 182400, perm: 2 },
    { recall: 72.2, f1: 0.844, net: 234720, perm: 1 },
    { recall: 82.1, f1: 0.796, net: 257880, perm: 1 },
  ];
  const perms = { 1: shuffle(TOTAL, 7043), 2: shuffle(TOTAL, 1409) };
  const ranks = {}; for (const k in perms) { ranks[k] = []; perms[k].forEach((d, i) => { ranks[k][d] = i; }); }
  const grid = $('.dots', box);
  const delays = shuffle(TOTAL, 99);
  grid.innerHTML = Array.from({ length: TOTAL }, (_, i) => `<i style="--d:${(delays[i] / TOTAL * 0.6).toFixed(3)}s"></i>`).join('');
  const dots = $$('i', grid);
  const els = { caught: $('.m-caught', box), recall: $('.m-recall', box), f1: $('.m-f1', box), net: $('.m-net', box) };
  function show(m) {
    const md = models[m], caught = Math.round(md.recall / 100 * TOTAL), rk = ranks[md.perm];
    dots.forEach((d, i) => d.classList.toggle('on', rk[i] < caught));
    tweenText(els.caught, caught, (v) => Math.round(v));
    tweenText(els.recall, md.recall, (v) => v.toFixed(1) + '%');
    tweenText(els.f1, md.f1, (v) => v.toFixed(3));
    tweenText(els.net, md.net, (v) => '$' + Math.round(v).toLocaleString('en-US'));
  }
  const seg = $('.lab__model .seg', box);
  seg.addEventListener('click', (e) => { const b = e.target.closest('[data-model]'); if (!b) return; press(seg, b); show(+b.dataset.model); });
  show(2);

  // the SQL panel: run the query, then poke the bars
  const bars = $$('.cbar', box), status = $('.lab__status', box), run = $('.lab__run', box);
  const notes = {
    0: 'Month-to-month customers churn about 15× more than two-year contracts (42.7% vs 2.8%).',
    1: 'One-year contracts churn about 4× more than two-year contracts (11.3% vs 2.8%).',
    2: 'Two-year contracts are the stickiest: 2.8% churn.',
  };
  const empty = () => { bars.forEach((b) => { b.classList.add('is-empty'); b.classList.remove('is-hi'); $('b', b).textContent = '—'; }); status.textContent = 'Press Run query to execute it on 7,043 customers.'; };
  let running = false;
  function execute() {
    if (running) return; running = true;
    empty(); status.textContent = 'running…'; run.disabled = true;
    const t0 = performance.now();
    setTimeout(() => {
      bars.forEach((b, i) => setTimeout(() => {
        b.classList.remove('is-empty');
        const v = $('b', b); tweenText(v, +v.dataset.v, (x) => x.toFixed(1) + '%');
      }, i * 140));
      status.textContent = `3 rows · ${(0.03 + (performance.now() - t0) / 20000).toFixed(2)} s · 7,043 customers · click a bar`;
      run.disabled = false; running = false;
    }, reduced ? 0 : 650);
  }
  run.addEventListener('click', execute);
  bars.forEach((b, i) => {
    b.tabIndex = 0; b.setAttribute('role', 'button');
    const pick = () => { if (b.classList.contains('is-empty')) return; bars.forEach((x) => x.classList.toggle('is-hi', x === b)); status.textContent = notes[i]; };
    b.addEventListener('click', pick);
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  if (!reduced) {
    empty();
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setTimeout(execute, 500); } }, { threshold: 0.5 });
    io.observe($('.lab__sql', box));
  }
}

/* ---------------- SQL terminal ---------------- */
export const DB = {
  projects: {
    cols: ['name', 'stack', 'metric', 'value', 'repo'],
    rows: [
      ['ab-testing-platform', 'Python, statistics', 'sample saved by CUPED', '40.0%', 'ab-testing-experimentation-platform'],
      ['marketing-mix-model', 'Python, SciPy', 'R squared', '0.9643', 'causal-marketing-mix-modeling'],
      ['saas-clv', 'Python, BG/NBD, survival', 'mean 12-month CLV', '$13,418', 'saas-clv-retention-dynamics'],
      ['inventory-optimizer', 'Python, operations research', 'working capital saved a year', '$117,185', 'supply-chain-inventory-optimizer'],
      ['surge-pricing', 'Python, simulation', 'GMV lift vs static', '44.6%', 'marketplace-liquidity-pricing-engine'],
      ['customer-churn', 'Python, scikit-learn', 'recall', '82.1%', 'customer-churn-retention-analysis'],
      ['equity-forecasting', 'Python, SQLite, Parquet', 'sharpe, window 9', '3.10', 'equity-forecasting-pipeline'],
      ['sales-bi', 'SQL, DAX, Power BI', 'KPIs', '12', 'enterprise-sales-bi-analytics'],
      ['llm-agent-eval', 'Python, statistics', 'pass rate', '95.0%', 'llm-agent-eval-harness'],
      ['quant-ops-engine', 'PyTorch', 'compression', '7.47x', 'quant-ops-engine'],
      ['video-rag', 'PyTorch', 'recall@3', '75.0%', 'multimodal-temporal-video-rag'],
      ['deepfake-detector', 'PyTorch, FFT', 'ROC-AUC', '0.954', 'spatial-frequency-deepfake-detector'],
      ['oss-contributor-radar', 'Python, GitHub Actions', 'schedule', 'daily 08:00 UTC', 'oss-contributor-radar'],
    ],
  },
  roles: {
    cols: ['year', 'role', 'company', 'area', 'result'],
    rows: [
      ['2026', 'AI training contributor', 'Outlier', 'ai', 'Hindi and English audio, TTS and agent replies'],
      ['2026', 'AI data specialist', 'micro1', 'ai', 'video annotation, rated senior'],
      ['2025', 'Data analyst and ML specialist', 'Deccan Holdings', 'data', '4.5M records a day; 6 h report to 45 min'],
      ['2023', 'Healthcare data analyst', 'eHealth Technologies', 'data', '12 US client networks, HIPAA audits'],
      ['2022', 'Operations data analyst', 'Webonise Labs', 'data', '450,000 frames checked'],
      ['2019', 'BI and MIS analyst', 'Deccan Infrastructure', 'data', 'INR 38 lakh recovered from billing'],
      ['2018', 'Project operations', 'Teemage Builders', 'civil', 'precast tracking about 20% faster'],
      ['2017', 'Civil engineering intern', 'CBRE', 'civil', 'site checks against BBS and drawings'],
    ],
  },
  skills: {
    cols: ['skill', 'level', 'area'],
    rows: [
      ['Python', 'Advanced', 'data'], ['SQL', 'Advanced', 'data'], ['Machine learning', 'Advanced', 'ml'],
      ['Power BI and Excel', 'Advanced', 'data'], ['AI rating and annotation', 'Advanced', 'ai'],
      ['AutoCAD', 'Advanced', 'civil'], ['STAAD Pro', 'Advanced', 'civil'], ['ETABS', 'Advanced', 'civil'], ['Revit', 'Advanced', 'civil'],
      ['Primavera P6', 'Advanced', 'civil'], ['MS Project', 'Advanced', 'civil'],
      ['Git and GitHub', 'Intermediate', 'backend'], ['HTML and CSS', 'Intermediate', 'web'], ['React', 'Beginner', 'web'], ['Java', 'Beginner', 'backend'],
      ['Hindi', 'Native', 'language'], ['English', 'C1', 'language'], ['Urdu', 'Fluent', 'language'], ['Marathi', 'Fluent', 'language'],
    ],
  },
  education: {
    cols: ['year', 'degree', 'school'],
    rows: [
      ['2016', 'B.E. in civil engineering', "MGM's Jawaharlal Nehru Engineering College"],
      ['2018', 'PG diploma in construction management', 'NICMAR'],
      ['2025', 'Certificate in data science and analytics', 'Coding Ninjas'],
    ],
  },
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : null; };

export function runSQL(q) {
  const m = q.match(/^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(\w+)\s*(=|!=|<>|>=|<=|>|<|like)\s*(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/i);
  if (!m) return { err: 'Syntax: SELECT cols FROM table [WHERE col = value] [ORDER BY col [DESC]] [LIMIT n]' };
  const [, colsRaw, tName, wc, op, wvRaw, oc, dir, lim] = m;
  const t = DB[tName.toLowerCase()];
  if (!t) return { err: `no such table: ${tName}. Tables: ${Object.keys(DB).join(', ')}` };
  const idx = (c) => t.cols.indexOf(c.toLowerCase());
  let rows = t.rows.slice();
  if (wc) {
    const ci = idx(wc); if (ci < 0) return { err: `no such column: ${wc}. Columns: ${t.cols.join(', ')}` };
    const wv = wvRaw.trim().replace(/^['"]|['"]$/g, '');
    rows = rows.filter((r) => {
      const a = r[ci], an = num(a), bn = num(wv), s = String(a).toLowerCase(), w = wv.toLowerCase();
      switch (op.toLowerCase()) {
        case '=': return s === w;
        case '!=': case '<>': return s !== w;
        case 'like': return new RegExp('^' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$').test(s);
        default: if (an === null || bn === null) return false;
          return op === '>' ? an > bn : op === '<' ? an < bn : op === '>=' ? an >= bn : an <= bn;
      }
    });
  }
  if (oc) {
    const ci = idx(oc); if (ci < 0) return { err: `no such column: ${oc}` };
    rows.sort((a, b) => { const x = num(a[ci]), y = num(b[ci]); const c = x !== null && y !== null ? x - y : String(a[ci]).localeCompare(String(b[ci])); return dir && dir.toLowerCase() === 'desc' ? -c : c; });
  }
  if (lim) rows = rows.slice(0, +lim);
  const c = colsRaw.trim();
  if (/^count\(\*\)$/i.test(c)) return { cols: ['count(*)'], rows: [[rows.length]] };
  const cols = c === '*' ? t.cols : c.split(',').map((x) => x.trim().toLowerCase());
  for (const col of cols) if (idx(col) < 0) return { err: `no such column: ${col}. Columns: ${t.cols.join(', ')}` };
  return { cols, rows: rows.map((r) => cols.map((col) => r[idx(col)])) };
}

export function initTerminal() {
  const out = $('.tty__out'), form = $('.tty__in'), input = $('#tty-q');
  if (!out) return;
  const hist = []; let hi = 0;
  const print = (html, cls = '') => { const d = document.createElement('div'); d.className = 'tl-' + (cls || 'txt'); d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; };
  const table = (r) => `<table><thead><tr>${r.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${r.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="tl-meta">${r.rows.length} row${r.rows.length === 1 ? '' : 's'} in set</p>`;
  const HELP = `<b>Commands</b>
  help                 this list
  tables               list the tables
  describe &lt;table&gt;     columns of a table
  SELECT …             e.g. SELECT * FROM roles WHERE area = 'civil'
                       supports WHERE (=, !=, &gt;, &lt;, LIKE), ORDER BY … DESC, LIMIT, COUNT(*)
  open &lt;project&gt;       open a repository on GitHub
  whoami · contact · clear`;
  function exec(raw) {
    const q = raw.trim().replace(/;\s*$/, '');
    if (!q) return;
    hist.push(raw.trim()); hi = hist.length;
    print(`<span class="p">sql&gt;</span> ${esc(raw.trim())}`, 'cmd');
    const [cmd, ...rest] = q.split(/\s+/); const arg = rest.join(' ');
    switch (cmd.toLowerCase()) {
      case 'help': case '\\?': return print(HELP, 'pre');
      case 'clear': out.innerHTML = ''; return;
      case 'tables': case '\\dt': case 'ls': return print(Object.entries(DB).map(([k, v]) => `<b>${k}</b> <span class="dim">(${v.rows.length} rows)</span>`).join('   '));
      case 'describe': case 'desc': {
        const t = DB[arg.toLowerCase()]; return t ? print(`<b>${esc(arg)}</b>: ${t.cols.join(', ')}`) : print(`no such table: ${esc(arg)}`, 'err');
      }
      case 'whoami': return print('Zakir Siddiqui. Civil engineer (B.E. 2016, NICMAR 2018) turned data analyst and ML engineer.\nPython, SQL, Power BI, scikit-learn, PyTorch, agentic AI with LLMs. Maharashtra, India; remote.', 'pre');
      case 'contact': return print('email   <a href="mailto:zak.siddiqui16@gmail.com">zak.siddiqui16@gmail.com</a>\ngithub  <a href="https://github.com/zzzzzzzzak">github.com/zzzzzzzzak</a>\nlinkedin <a href="https://www.linkedin.com/in/zakir-siddiqui-ml-data-analyst">zakir-siddiqui-ml-data-analyst</a>', 'pre');
      case 'open': {
        const r = DB.projects.rows.find((p) => p[0].includes(arg.toLowerCase()) || p[4].includes(arg.toLowerCase()));
        if (!r || !arg) return print(`no project matches "${esc(arg)}". Try: ${DB.projects.rows.map((p) => p[0]).join(', ')}`, 'err');
        const url = 'https://github.com/zzzzzzzzak/' + r[4];
        print(`opening <a href="${url}">${url}</a>`); window.open(url, '_blank', 'noopener'); return;
      }
      case 'sudo': return print(/hire/i.test(arg) ? 'Permission granted. <a href="mailto:zak.siddiqui16@gmail.com?subject=Let%27s%20work%20together">Email Zakir</a> to finish the transaction.' : 'nice try.', 'ok');
      case 'select': {
        const r = runSQL(q);
        return r.err ? print(esc(r.err), 'err') : print(table(r), 'table');
      }
      default: return print(`unknown command: ${esc(cmd)}. Type <b>help</b>.`, 'err');
    }
  }
  print(`career.db, 4 tables: <b>projects</b>, <b>roles</b>, <b>skills</b>, <b>education</b>. Type <b>help</b>, or tap a query below.`, 'dim');
  form.addEventListener('submit', (e) => { e.preventDefault(); exec(input.value); input.value = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && hi > 0) { e.preventDefault(); input.value = hist[--hi]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
    else if (e.key === 'Tab' && input.value) {
      const words = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'LIMIT', 'DESC', ...Object.keys(DB), ...new Set(Object.values(DB).flatMap((t) => t.cols))];
      const m = input.value.match(/(\w+)$/); if (!m) return;
      const hit = words.find((w) => w.toLowerCase().startsWith(m[1].toLowerCase()) && w.toLowerCase() !== m[1].toLowerCase());
      if (hit) { e.preventDefault(); input.value = input.value.slice(0, -m[1].length) + hit + ' '; }
    }
  });
  let typing = false;
  $$('.tty__chips [data-q]').forEach((b) => b.addEventListener('click', () => {
    if (typing) return;
    const q = b.dataset.q;
    if (reduced) { exec(q); return; }
    typing = true; input.value = ''; let i = 0;
    const step = () => { input.value = q.slice(0, ++i); if (i < q.length) setTimeout(step, 14 + Math.random() * 22); else setTimeout(() => { exec(q); input.value = ''; typing = false; }, 180); };
    step();
  }));
  out.addEventListener('click', () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });
}

/* ---------------- skills graph ---------------- */
export function initGraph() {
  const cv = $('.graph__cv'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const HUBS = { da: ['Data analysis', '#5b8fff'], ds: ['Data science', '#4cf0c8'], be: ['Backend', '#c7f464'], web: ['Web', '#ff7ab6'], civ: ['Civil engineering', '#ffb84d'], ai: ['Agentic AI', '#7fd4ff'] };
  const SK = [
    ['Python', 'da ds be ai'], ['SQL', 'da be'], ['Pandas', 'da ds'], ['Excel', 'da'], ['Power BI', 'da'], ['DAX', 'da'],
    ['scikit-learn', 'ds'], ['XGBoost', 'ds'], ['PyTorch', 'ds'], ['spaCy', 'ds'], ['Streamlit', 'ds web'],
    ['Flask', 'be web'], ['GitHub Actions', 'be'], ['SQLite', 'be da'], ['Parquet', 'be'],
    ['HTML and CSS', 'web'], ['React', 'web'], ['Three.js', 'web'],
    ['AutoCAD', 'civ'], ['STAAD Pro', 'civ'], ['ETABS', 'civ'], ['Revit', 'civ'], ['Primavera P6', 'civ'], ['BOQ', 'civ da'],
    ['LLMs', 'ai ds'], ['Tool calling', 'ai be'], ['RAG', 'ai ds'], ['Agent evals', 'ai ds'], ['Prompt design', 'ai'],
  ];
  const r = rng(42);
  let W = 0, H = 0, RES = 0;
  const nodes = [], links = [];
  Object.entries(HUBS).forEach(([id, [label, color]], i) => nodes.push({ id, label, color, hub: true, i, x: 0, y: 0, vx: 0, vy: 0, r: 9 }));
  SK.forEach(([label, hs]) => {
    const h = hs.split(' ');
    const n = { id: label, label, color: HUBS[h[0]][1], hub: false, hubs: h, x: 0, y: 0, vx: 0, vy: 0, r: 4.5 + h.length * 1.2 };
    nodes.push(n); h.forEach((id) => links.push([nodes.find((x) => x.id === id), n]));
  });
  const anchors = () => nodes.filter((n) => n.hub).forEach((n) => {
    const a = -Math.PI / 2 + n.i * (Math.PI * 2 / Object.keys(HUBS).length), R = Math.min(W, (H - RES) * 1.6) * 0.3;
    n.ax = W / 2 + Math.cos(a) * R * 1.25; n.ay = (H - RES) / 2 + 10 + Math.sin(a) * R * 0.78;
  });
  function size() {
    const b = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    const first = !W;
    W = b.width; H = b.height; RES = (cv.parentElement.querySelector('.graph__ui')?.offsetHeight || 0) + 20; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    anchors();
    if (first) nodes.forEach((n) => { const hub = n.hub ? n : nodes.find((x) => x.id === n.hubs[0]); n.x = hub.ax + (r() - 0.5) * 120; n.y = hub.ay + (r() - 0.5) * 120; });
  }
  let sel = '', hover = null, drag = null, energy = 1;
  function tick() {
    const k = Math.min(W, 900) / 900;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]; let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy + 0.01;
      if (d2 > 40000) continue;
      const f = 900 * k / d2, d = Math.sqrt(d2); dx /= d; dy /= d;
      a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
    }
    const rest = 70 * Math.max(0.7, k);
    for (const [a, b] of links) {
      let dx = b.x - a.x, dy = b.y - a.y; const d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - rest) * 0.012;
      dx /= d; dy /= d; a.vx += dx * f * 0.3; a.vy += dy * f * 0.3; b.vx -= dx * f; b.vy -= dy * f;
    }
    let e = 0;
    for (const n of nodes) {
      if (n.hub) { n.vx += (n.ax - n.x) * 0.02; n.vy += (n.ay - n.y) * 0.02; }
      n.vx += (W / 2 - n.x) * 0.0006; n.vy += ((H - RES) / 2 - n.y) * 0.0012;
      if (n === drag) { n.vx = n.vy = 0; continue; }
      n.vx *= 0.82; n.vy *= 0.82; n.x += n.vx; n.y += n.vy;
      n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x)); n.y = Math.max(n.r + 4, Math.min(H - RES - n.r, n.y));
      e += Math.abs(n.vx) + Math.abs(n.vy);
    }
    energy = e;
  }
  const lit = (n) => {
    if (hover) return n === hover || links.some(([a, b]) => (a === hover && b === n) || (b === hover && a === n));
    if (!sel) return true;
    return n.id === sel || (n.hubs && n.hubs.includes(sel));
  };
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const [a, b] of links) {
      const on = lit(a) && lit(b);
      ctx.strokeStyle = on ? hexA(a.color, sel || hover ? 0.6 : 0.28) : 'rgba(255,255,255,.04)';
      ctx.lineWidth = on && (sel || hover) ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.textBaseline = 'middle';
    for (const n of nodes) {
      const on = lit(n);
      ctx.globalAlpha = on ? 1 : 0.18;
      if (n.hub) {
        ctx.fillStyle = hexA(n.color, 0.15); ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 8, 0, 7); ctx.fill();
      }
      ctx.fillStyle = n.hub ? n.color : '#070a0e'; ctx.strokeStyle = n.color; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(n.x, n.y, n === hover ? n.r + 2 : n.r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.font = n.hub ? '600 14px "Inter Tight", sans-serif' : '12px "JetBrains Mono", monospace';
      ctx.fillStyle = n.hub ? '#eef1f4' : '#c6cdd5';
      const tw = ctx.measureText(n.label).width, left = n.x + n.r + 8 + tw > W - 4;
      ctx.textAlign = left ? 'right' : 'left';
      ctx.fillText(n.label, left ? n.x - n.r - 8 : n.x + n.r + 8, n.y);
    }
    ctx.globalAlpha = 1;
  }
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  let on = false, raf = 0;
  function loop() { tick(); draw(); if (on && (energy > 0.05 || drag)) raf = requestAnimationFrame(loop); else raf = 0; }
  const kick = () => { if (!raf && on) raf = requestAnimationFrame(loop); else if (!on) draw(); };
  size();
  if (reduced) { for (let i = 0; i < 400; i++) tick(); draw(); }
  new IntersectionObserver(([e]) => { on = e.isIntersecting && !reduced; if (on) { energy = 1; kick(); } }).observe(cv);
  window.addEventListener('resize', () => { size(); energy = 1; reduced ? draw() : kick(); });

  const at = (e) => { const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; return nodes.find((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < (n.r + 9) ** 2); };
  cv.addEventListener('pointermove', (e) => {
    if (drag) { const b = cv.getBoundingClientRect(); drag.x = e.clientX - b.left; drag.y = e.clientY - b.top; if (drag.hub) { drag.ax = drag.x; drag.ay = drag.y; } energy = 1; kick(); return; }
    const n = at(e); if (n !== hover) { hover = n || null; cv.style.cursor = n ? 'grab' : ''; if (reduced) draw(); else { energy = Math.max(energy, 0.06); kick(); } }
  });
  cv.addEventListener('pointerleave', () => { if (!drag) { hover = null; reduced ? draw() : kick(); } });
  cv.addEventListener('pointerdown', (e) => {
    const n = at(e); if (!n) return;
    if (e.pointerType === 'touch') { hover = hover === n ? null : n; energy = 1; reduced ? draw() : kick(); return; }
    drag = n; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
  });
  const up = () => { if (drag) { drag = null; cv.style.cursor = ''; energy = 1; kick(); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  const seg = $('.graph .seg');
  seg.addEventListener('click', (e) => { const b = e.target.closest('[data-hub]'); if (!b) return; press(seg, b); sel = b.dataset.hub; hover = null; energy = 1; reduced ? draw() : kick(); });
}

/* ---------------- agent loop demo ---------------- */
// A small agent with real tools over this page's data: sql (career.db), a calculator and a
// keyword retriever over the page's own text. The planner is rule-based so every step is visible.
export function initAgent() {
  const box = $('.agent'); if (!box) return;
  const svg = $('.agent__graph', box), pkt = $('.ag-pkt', svg), trace = $('.agent__trace', box), answer = $('.agent__answer', box);
  const node = (n) => $(`[data-n="${n}"]`, svg), edge = (e) => $(`[data-e="${e}"]`, svg);
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

  // documents for retrieval: the page's own project, story and role text
  const docs = [];
  $$('.proj').forEach((el) => docs.push({ src: 'project · ' + $('h3', el).textContent, text: $('p', el).textContent }));
  $$('.step').forEach((el) => docs.push({ src: 'story · ' + $('h3', el).textContent, text: $('p', el).textContent }));
  $$('.tl__item').forEach((el) => docs.push({ src: 'role · ' + $('h3', el).textContent, text: $('.tl__y', el).textContent + ': ' + $('p', el).textContent }));
  $$('.caps li').forEach((el) => docs.push({ src: 'agents · ' + $('h3', el).textContent, text: $('p', el).textContent }));
  const STOP = new Set('the a an and or of to in on for with is are was what which how many much did does do it its his zakir s about me tell show give from by at as this that'.split(' '));
  const terms = (t) => t.toLowerCase().replace(/[^a-z0-9.%\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  const df = new Map(); docs.forEach((d) => { d.t = terms(d.text + ' ' + d.src); new Set(d.t).forEach((w) => df.set(w, (df.get(w) || 0) + 1)); });
  function search(q, k = 1) {
    const qt = terms(q);
    return docs.map((d) => ({ d, s: qt.reduce((a, w) => a + (d.t.includes(w) ? Math.log(1 + docs.length / (df.get(w) || 1)) : 0), 0) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k);
  }

  let busy = false;
  function light(n) { $$('[data-n]', svg).forEach((g) => g.classList.toggle('is-on', g.dataset.n === n)); }
  async function travel(e, back = false) {
    const p = edge(e); if (!p) return;
    p.classList.add('is-hot');
    const L = p.getTotalLength(), t0 = performance.now(), dur = reduced ? 0 : 420;
    await new Promise((res) => {
      const f = (now) => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1, pt = p.getPointAtLength((back ? 1 - k : k) * L);
        pkt.setAttribute('cx', pt.x); pkt.setAttribute('cy', pt.y);
        if (k < 1) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    });
    p.classList.remove('is-hot');
  }
  function log(kind, html) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="tr__k tr__k--${kind.toLowerCase()}">${kind}</span><span class="tr__v">${html}</span>`;
    trace.appendChild(li); trace.scrollTop = trace.scrollHeight;
  }
  async function tool(name, input, fn) {
    await travel('plan-' + name); light(name);
    log('ACT', `<code>${name}(${esc(input)})</code>`);
    await wait(380);
    const out = fn();
    await travel('plan-' + name, true); light('plan');
    log('OBSERVE', esc(typeof out === 'string' ? out : JSON.stringify(out)));
    await wait(260);
    return out;
  }
  const sql = (q) => tool('sql', q, () => { const r = runSQL(q.replace(/;$/, '')); return r.err ? 'error: ' + r.err : r.rows.map((x) => x.join(' | ')).join(' ; ') || '0 rows'; });
  const sqlRows = (q) => runSQL(q.replace(/;$/, '')).rows || [];
  const calc = (expr, fn) => tool('calc', expr, () => String(fn()));
  const find = (q) => tool('docs', q, () => { const h = search(q)[0]; return h ? `${h.d.src}: "${h.d.text.slice(0, 140)}${h.d.text.length > 140 ? '…' : ''}"` : 'no passage found'; });

  const TASKS = {
    async recall() {
      log('PLAN', 'Find the project with the highest recall, turn recall into customers, then check it against the source.');
      await sql("SELECT name, metric, value FROM projects WHERE metric LIKE '%recall%' ORDER BY value DESC LIMIT 1");
      const [name, , value] = sqlRows("SELECT name, metric, value FROM projects WHERE metric LIKE '%recall%' ORDER BY value DESC LIMIT 1")[0];
      const r = parseFloat(value) / 100;
      await calc(`${r} × 374`, () => (r * 374).toFixed(2));
      const caught = Math.round(r * 374);
      const src = search('churners test set cutoff 307 374')[0];
      return { claim: `${caught} of 374`, check: src && src.d.text.includes(`${caught} of 374`), src,
        text: `<b>${name}</b> has the best recall at <b>${value}</b>. On the 374 churners in the test set that is about <b>${caught}</b> caught in time.` };
    },
    async ship() {
      log('PLAN', 'Read the eval result, test whether the improvement is significant at 0.05, then decide.');
      await sql("SELECT name, metric, value FROM projects WHERE name = 'llm-agent-eval'");
      const h = await find('McNemar baseline candidate gate');
      const p = 0.0039;
      await calc(`${p} < 0.05`, () => p < 0.05);
      const src = search('McNemar CI gate weaker release')[0];
      return { claim: 'gate', check: !!src, src,
        text: `<b>Ship it.</b> Pass rate rose from <b>80.0%</b> to <b>95.0%</b>, and McNemar's test gives <b>p = 0.0039</b>, well under 0.05. The CI gate reports PASS.` };
    },
    async civil() {
      log('PLAN', 'Pull civil roles and civil education from the database, then summarise.');
      await sql("SELECT year, role, company FROM roles WHERE area = 'civil'");
      await sql("SELECT year, degree FROM education WHERE degree LIKE '%civil%'");
      await sql("SELECT year, degree FROM education WHERE degree LIKE '%construction%'");
      const roles = sqlRows("SELECT year, role, company, result FROM roles WHERE area = 'civil'");
      const src = search('civil engineering structural design estimation surveying')[0];
      return { claim: 'civil', check: roles.length === 2, src,
        text: `A <b>B.E. in civil engineering (2016)</b> and a <b>NICMAR diploma in construction management (2018)</b>, then site work: ${roles.reverse().map((r) => `<b>${r[1]}</b> at ${r[2]} (${r[0]}, ${r[3]})`).join(', and ')}. From 2019 the work moved into data.` };
    },
    async free(q) {
      log('PLAN', `No fixed recipe for this goal. Retrieve the most relevant passages from the site and answer from them.`);
      await find(q);
      const hits = search(q, 2);
      if (!hits.length) return { claim: '', check: false, text: `I could not find that in this site's documents. Try one of the suggested goals, or ask about projects, roles, skills or the civil years.` };
      return { claim: '', check: true, src: hits[0], text: hits.map((h) => `<b>${esc(h.d.src)}</b>: ${esc(h.d.text)}`).join('<br>') };
    },
  };
  const route = (q) => /recall|churn/i.test(q) ? 'recall' : /ship|release|gate|eval|candidate/i.test(q) ? 'ship' : /civil|construction|site work|nicmar|building/i.test(q) ? 'civil' : 'free';

  async function run(goal, key) {
    if (busy) return; busy = true;
    $$('.agent__tasks button, .agent__ask button', box).forEach((b) => { b.disabled = true; });
    trace.innerHTML = ''; answer.hidden = true;
    light('goal'); log('GOAL', esc(goal));
    await wait(300);
    await travel('goal-plan'); light('plan');
    await wait(250);
    const res = await TASKS[key](goal);
    await travel('plan-eval'); light('eval');
    log('CHECK', res.check ? `Grounded in <i>${esc(res.src?.d.src || 'career.db')}</i> ✓` : 'Could not ground the answer in a source. Answer is marked as uncertain.');
    await wait(420);
    await travel('eval-ans'); light('ans');
    answer.innerHTML = res.text + (res.check ? '' : ' <em class="unsure">(uncertain)</em>');
    answer.hidden = false;
    log('DONE', `${trace.children.length} steps`);
    $$('.agent__tasks button, .agent__ask button', box).forEach((b) => { b.disabled = false; });
    busy = false;
  }
  $$('.agent__tasks [data-task]', box).forEach((b) => b.addEventListener('click', () => run(b.textContent, b.dataset.task)));
  const form = $('.agent__ask', box), input = $('#agent-q');
  form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value.trim(); if (!q) return; run(q, route(q)); input.value = ''; });
  light('');
}
