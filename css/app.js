(() => {
  const root = document.documentElement;

  /* Theme */
  const themeBtn = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const moon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const applyTheme = () => {
    root.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'dark' ? sun : moon;
  };
  applyTheme();
  themeBtn.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(); });

  /* Mobile TOC */
  const toc = document.getElementById('toc');
  const tocBtn = document.getElementById('tocToggle');
  tocBtn.addEventListener('click', () => {
    const open = toc.classList.toggle('open');
    tocBtn.setAttribute('aria-expanded', open);
  });
  toc.addEventListener('click', e => { if (e.target.closest('a')) { toc.classList.remove('open'); tocBtn.setAttribute('aria-expanded', 'false'); } });

  /* Highlighter */
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function hlCSS(src) {
    let out = '', depth = 0, m;
    const re = /(\/\*[\s\S]*?\*\/)|(@[\w-]+)|([{}])|([^{}@\/]+|[\/@])/g;
    const sel = t => t.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, a, b, c) => b ? `${a}<span class="tok-sel">${esc(b)}</span>${c}` : esc(t));
    const decl = t => t.replace(/([\w-]+)(\s*:\s*)([^;]*)(;?)/g, (_, p, c, v, s2) => `<span class="tok-prop">${esc(p)}</span>${esc(c)}<span class="tok-val">${esc(v)}</span>${s2}`);
    while ((m = re.exec(src))) {
      if (m[1]) out += `<span class="tok-com">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="tok-at">${esc(m[2])}</span>`;
      else if (m[3]) { depth += m[3] === '{' ? 1 : -1; out += `<span class="tok-punc">${m[3]}</span>`; }
      else {
        const t = m[4];
        const rest = src.slice(re.lastIndex);
        const nb = rest.search(/[{}]/);
        const nextIsOpen = nb !== -1 && rest[nb] === '{' && !/\/\*/.test(rest.slice(0, nb).replace(/\/\*[\s\S]*?\*\//g, '')) ;
        if (nextIsOpen) {
          const k = t.lastIndexOf(';');
          if (k !== -1) out += decl(t.slice(0, k + 1)) + sel(t.slice(k + 1));
          else out += depth > 0 && /:\s*[^:]*;/.test(t) ? decl(t) : sel(t);
        } else if (depth > 0 || /[\w-]+\s*:[^;]*;/.test(t)) out += decl(t);
        else out += sel(t);
      }
    }
    return out;
  }
  function hlHTML(src) {
    return esc(src)
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-com">$1</span>')
      .replace(/(&lt;\/?)([\w!]+)([^&]*?)(\/?&gt;)/g, (all, a, tag, attrs, b) => {
        if (all.includes('tok-com')) return all;
        const at = attrs.replace(/([\w-]+)=("[^"]*")/g, '<span class="tok-attr">$1</span>=<span class="tok-str">$2</span>');
        return `<span class="tok-punc">${a}</span><span class="tok-tag">${tag}</span>${at}<span class="tok-punc">${b}</span>`;
      });
  }
  document.querySelectorAll('.code').forEach(block => {
    const code = block.querySelector('code');
    const raw = code.textContent;
    code.innerHTML = block.dataset.lang === 'html' ? hlHTML(raw) : hlCSS(raw);
    block.querySelector('.copy-btn').addEventListener('click', async e => {
      try { await navigator.clipboard.writeText(raw); e.target.textContent = 'Kopirano ✓'; }
      catch { e.target.textContent = 'Označi i kopiraj'; }
      setTimeout(() => (e.target.textContent = 'Kopiraj'), 1600);
    });
  });

  /* Playgrounds */
  document.querySelectorAll('.playground').forEach(pg => {
    const html = pg.querySelector('.pg-html').innerHTML;
    const ta = pg.querySelector('textarea');
    const initial = ta.value;
    const head = document.createElement('div');
    head.className = 'pg-head';
    head.innerHTML = '<span class="pg-title"><span class="dot"></span>Isprobaj sam — uređuj CSS</span><button class="pg-reset" type="button">Vrati izvorno</button>';
    const body = document.createElement('div');
    body.className = 'pg-body';
    const ed = document.createElement('div'); ed.className = 'pg-editor';
    const pv = document.createElement('div'); pv.className = 'pg-preview';
    pv.innerHTML = '<span class="pg-label">rezultat</span>';
    const frame = document.createElement('iframe');
    frame.title = 'Rezultat primjera';
    pv.appendChild(frame);
    ed.appendChild(ta);
    body.append(ed, pv);
    const hint = document.createElement('div');
    hint.className = 'pg-hint';
    hint.textContent = 'Savjet: promijeni broj, boju ili dodaj novo svojstvo. Tab umeće razmak.';
    pg.prepend(head); pg.append(body, hint);
    let t;
    const render = () => { frame.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:12px}${ta.value}</style></head><body>${html}</body></html>`; };
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 150); });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText('  ', s, ta.selectionEnd, 'end');
        render();
      }
    });
    ta.spellcheck = false; ta.setAttribute('wrap', 'off');
    head.querySelector('.pg-reset').addEventListener('click', () => { ta.value = initial; render(); });
    render();
  });

  /* Box model tool */
  const $ = id => document.getElementById(id);
  const bm = () => {
    const w = +$('bmW').value, p = +$('bmP').value, b = +$('bmB').value, m = +$('bmM').value, s = $('bmS').value;
    $('bmWv').textContent = w + 'px'; $('bmPv').textContent = p + 'px'; $('bmBv').textContent = b + 'px'; $('bmMv').textContent = m + 'px';
    const contentW = s === 'border-box' ? Math.max(0, w - 2 * p - 2 * b) : w;
    const visible = s === 'border-box' ? w : w + 2 * p + 2 * b;
    $('bmMargin').style.padding = Math.max(m, 16) + 'px';
    $('bmBorder').style.padding = Math.max(b, 0) + 'px';
    $('bmPadding').style.padding = Math.max(p, 0) + 'px';
    $('bmContent').style.width = contentW + 'px';
    $('bmContent').textContent = contentW + 'px';
    $('bmTotal').innerHTML = `Vidljiva širina elementa: <b>${visible}px</b>` + (s === 'content-box' ? ` (${w} + 2×${p} + 2×${b})` : ' (točno koliko si zadao)');
    $('bmCode').innerHTML = hlCSS(`.kutija {\n  box-sizing: ${s};\n  width: ${w}px;\n  padding: ${p}px;\n  border: ${b}px solid #333;\n  margin: ${m}px;\n}`);
  };
  ['bmW', 'bmP', 'bmB', 'bmM', 'bmS'].forEach(id => $(id).addEventListener('input', bm));
  bm();

  /* Flex tool */
  const stage = $('flexStage');
  const selects = document.querySelectorAll('#flexTool select');
  const flex = () => {
    let css = '.kontejner {\n  display: flex;\n';
    selects.forEach(s => { stage.style[s.dataset.prop] = s.value; css += `  ${s.dataset.css}: ${s.value};\n`; });
    css += '  gap: 10px;\n}';
    $('flexCode').innerHTML = hlCSS(css);
  };
  selects.forEach(s => s.addEventListener('input', flex));
  let count = 3;
  $('flexAdd').addEventListener('click', () => {
    if (count >= 10) { stage.querySelectorAll('.flex-item').forEach((el, i) => i > 2 && el.remove()); count = 3; $('flexAdd').textContent = '+ dodaj element'; return; }
    const d = document.createElement('div'); d.className = 'flex-item'; d.textContent = ++count; stage.appendChild(d);
    if (count >= 10) $('flexAdd').textContent = 'vrati na 3';
  });
  flex();

  /* Responsive demo */
  const rwd = $('rwd'), rwdFrame = $('rwdFrame'), rwdOut = $('rwdOut');
  rwdFrame.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:14px;font-family:sans-serif;background:#fafbfc}
    .info{font:12px monospace;color:#555;margin-bottom:10px}
    .kartice{display:grid;grid-template-columns:1fr;gap:10px}
    .k{background:#2450d8;color:#fff;border-radius:8px;padding:18px;font-weight:600}
    .m::after{content:"mobitel: 1 stupac"} 
    @media (min-width:600px){.kartice{grid-template-columns:1fr 1fr}.k{background:#1f9d6b}.m::after{content:"tablet: 2 stupca (min-width: 600px)"}}
    @media (min-width:800px){.kartice{grid-template-columns:repeat(3,1fr)}.k{background:#d9572b}.m::after{content:"desktop: 3 stupca (min-width: 800px)"}}
  </style></head><body><div class="info m"></div><div class="kartice"><div class="k">Kartica 1</div><div class="k">Kartica 2</div><div class="k">Kartica 3</div><div class="k">Kartica 4</div><div class="k">Kartica 5</div><div class="k">Kartica 6</div></div></body></html>`;
  const fitRwd = () => {
    const avail = rwdFrame.parentElement.clientWidth - 40;
    rwd.max = Math.max(320, Math.min(1000, avail));
    if (+rwd.value > +rwd.max) rwd.value = rwd.max;
    rwdFrame.style.width = rwd.value + 'px';
    rwdOut.textContent = rwd.value + 'px';
  };
  rwd.addEventListener('input', fitRwd);
  addEventListener('resize', fitRwd);
  fitRwd();

  /* Hero demo typing */
  // const demoSteps = [
  //   ['.kartica {', ''],
  //   ['  border-radius: 12px;', 'borderRadius', '12px'],
  //   ['  background: #2450d8;', 'background', '#2450d8'],
  //   ['  color: white;', 'color', '#fff'],
  //   ['  padding: 22px 34px;', 'padding', '22px 34px'],
  //   ['  box-shadow: 0 12px 30px #2450d855;', 'boxShadow', '0 12px 30px #2450d855'],
  //   ['  transform: rotate(-3deg);', 'transform', 'rotate(-3deg)'],
  //   ['}', '']
  // ];
  const demoSteps = [
    ['.kartica {', ''],
    ['  border-radius: 12px;', 'borderRadius', '12px'],
    ['  background: #663399;', 'background', '#663399'],
    ['  color: white;', 'color', '#fff'],
    ['  padding: 22px 34px;', 'padding', '22px 34px'],
    ['  box-shadow: 0 12px 30px #66339955;', 'boxShadow', '0 12px 30px #66339955'],
    ['  transform: rotate(-3deg);', 'transform', 'rotate(-3deg)'],
    ['}', '']
  ];
  const demoCode = $('demoCode'), demoCard = $('demoCard');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lines = [];
  const showDemo = () => { demoCode.innerHTML = hlCSS(lines.join('\n')); };
  if (reduced) {
    lines = demoSteps.map(s => s[0]); showDemo();
    demoSteps.forEach(s => s[1] && (demoCard.style[s[1]] = s[2]));
  } else {
    let step = 0;
    const tick = () => {
      if (step < demoSteps.length) {
        const s = demoSteps[step++];
        lines.push(s[0]); showDemo();
        if (s[1]) demoCard.style[s[1]] = s[2];
        setTimeout(tick, 750);
      } else {
        setTimeout(() => { lines = []; step = 0; demoCard.removeAttribute('style'); showDemo(); setTimeout(tick, 600); }, 3500);
      }
    };
    tick();
  }

  /* Quiz */
  const Q = [
    { q: 'Koji selektor bira sve elemente s <code>class="gumb"</code>?', o: ['<code>#gumb</code>', '<code>.gumb</code>', '<code>gumb</code>', '<code>*gumb</code>'], a: 1, e: 'Točka označava klasu, a ljestve (#) ID.' },
    { q: 'Koji je preporučeni način dodavanja CSS-a u veći projekt?', o: ['Inline atributom style', 'Unutar &lt;style&gt; u svakoj stranici', 'Vanjskom .css datotekom preko &lt;link&gt;', 'Kroz JavaScript'], a: 2, e: 'Jedna vanjska datoteka znači da promjenu napraviš na jednom mjestu za cijeli web.' },
    { q: 'Element ima <code>width: 200px; padding: 20px; border: 5px</code> i zadani box-sizing. Kolika je vidljiva širina?', o: ['200px', '225px', '250px', '240px'], a: 2, e: 'content-box: 200 + 2×20 + 2×5 = 250px. Uz border-box bilo bi točno 200px.' },
    { q: 'Što radi <code>justify-content: center</code> u flex kontejneru s <code>flex-direction: row</code>?', o: ['Centrira okomito', 'Centrira vodoravno', 'Centrira tekst unutar elemenata', 'Ništa, treba position'], a: 1, e: 'justify-content radi po glavnoj osi, a kod row je to vodoravna os.' },
    { q: 'Koje pravilo pobjeđuje za isti element: <code>p {}</code>, <code>.tekst {}</code> ili <code>#glavni {}</code>?', o: ['<code>p</code>', '<code>.tekst</code>', '<code>#glavni</code>', 'Uvijek ono zadnje napisano'], a: 2, e: 'ID ima veću specifičnost od klase, a klasa veću od elementa.' },
    { q: 'Kako se čita CSS varijabla <code>--boja</code>?', o: ['<code>$boja</code>', '<code>var(--boja)</code>', '<code>@boja</code>', '<code>--boja()</code>'], a: 1, e: 'Varijable se definiraju s -- i čitaju funkcijom var().' },
    { q: 'Što znači <code>1fr</code> u CSS Gridu?', o: ['1 piksel', '1% širine', 'Jedan dio slobodnog prostora', 'Jedan red'], a: 2, e: 'fr (fraction) dijeli preostali prostor u omjerima: 1fr 3fr = četvrtina i tri četvrtine.' },
    { q: 'Što znači <code>@media (min-width: 768px) { ... }</code>?', o: ['Pravila vrijede samo za zaslone uže od 768px', 'Pravila vrijede za zaslone od 768px i šire', 'Postavlja minimalnu širinu stranice', 'Pravila vrijede samo pri ispisu'], a: 1, e: 'min-width znači "barem ovoliko široko". To je osnova mobile-first pristupa.' }
  ];
  const quizEl = $('quiz');
  let score = 0, answered = 0;
  const buildQuiz = () => {
    score = 0; answered = 0; $('scoreNum').textContent = `0 / ${Q.length}`;
    quizEl.innerHTML = '';
    Q.forEach((item, qi) => {
      const box = document.createElement('div');
      box.className = 'q';
      box.innerHTML = `<div class="q-text">${qi + 1}. ${item.q}</div><div class="q-opts" role="group"></div><div class="q-explain">${item.e}</div>`;
      const opts = box.querySelector('.q-opts');
      item.o.forEach((o, oi) => {
        const b = document.createElement('button');
        b.className = 'q-opt'; b.type = 'button'; b.innerHTML = o;
        b.addEventListener('click', () => {
          box.classList.add('answered');
          opts.querySelectorAll('button').forEach((x, xi) => { x.disabled = true; if (xi === item.a) x.classList.add('correct'); });
          if (oi === item.a) score++; else b.classList.add('wrong');
          answered++;
          $('scoreNum').textContent = `${score} / ${Q.length}` + (answered === Q.length ? (score === Q.length ? ' — savršeno' : score >= 6 ? ' — odlično' : ' — ponovi lekcije') : '');
        });
        opts.appendChild(b);
      });
      quizEl.appendChild(box);
    });
  };
  $('quizReset').addEventListener('click', buildQuiz);
  buildQuiz();

  /* Scroll progress + active TOC */
  const prog = $('progress');
  const links = [...document.querySelectorAll('.toc a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const seen = new Set();
  const onScroll = () => {
    const h = document.documentElement;
    prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
    let idx = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < 140) idx = i; });
    links.forEach((a, i) => {
      a.classList.toggle('active', i === idx);
      if (i < idx) seen.add(i);
      a.classList.toggle('done', seen.has(i) && i !== idx);
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
