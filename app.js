const store = {
  get: (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch(e){ return fallback; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

(function initTheme(){
  const saved = store.get('theme', 'dark');
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    store.set('theme', next);
  });
})();

const tabs = document.querySelectorAll('#tabs button');
const sections = document.querySelectorAll('main .tab');
tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(b => b.classList.remove('active'));
  sections.forEach(s => s.classList.add('hidden'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.remove('hidden');
  updateDashboard();
}));
tabs[0].click();

const toast = (msg) => {
  const el = document.getElementById('toast');
  el.textContent = msg;
  setTimeout(()=> el.textContent = '', 2500);
}

const clampPct = (val) => {
  let v = Number(val);
  if (isNaN(v)) v = 0;
  if (v < 0) v = 0;
  if (v > 100) v = 100;
  return v;
};
const fmtYMD = (d) => d.toISOString().slice(0,10);

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}
function weekRangeFrom(date){
  const mon = startOfWeek(date);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return fmtYMD(mon) + ' → ' + fmtYMD(sun);
}

// DAILY
const dEls = {
  date: document.getElementById('d-date'),
  b1: document.getElementById('d-b1'),
  b1c: document.getElementById('d-b1c'),
  b2: document.getElementById('d-b2'),
  b2c: document.getElementById('d-b2c'),
  b3: document.getElementById('d-b3'),
  b3c: document.getElementById('d-b3c'),
  min: document.getElementById('d-min'),
  notes: document.getElementById('d-notes'),
  save: document.getElementById('d-save'),
};
dEls.date.valueAsDate = new Date();

dEls.save.addEventListener('click', () => {
  const days = store.get('days', {});
  const date = dEls.date.value || fmtYMD(new Date());
  days[date] = {
    b1: dEls.b1.value, b1c: dEls.b1c.checked,
    b2: dEls.b2.value, b2c: dEls.b2c.checked,
    b3: dEls.b3.value, b3c: dEls.b3c.checked,
    min: dEls.min.value, notes: dEls.notes.value
  };
  store.set('days', days);
  toast('Записано ✓');
  updateDashboard();
});

// WEEKLY
const wEls = {
  week: document.getElementById('w-week'),
  date: document.getElementById('w-date'),
  this: document.getElementById('w-this'),
  fromDate: document.getElementById('w-from-date'),
  autoscore: document.getElementById('w-autoscore'),
  dup: document.getElementById('w-dup'),
  biz: document.getElementById('w-biz'),
  health: document.getElementById('w-health'),
  social: document.getElementById('w-social'),
  intim: document.getElementById('w-intim'),
  b1: document.getElementById('w-b1'),
  b2: document.getElementById('w-b2'),
  b3: document.getElementById('w-b3'),
  score: document.getElementById('w-score'),
  retro: document.getElementById('w-retro'),
  save: document.getElementById('w-save'),
};

function refreshMeta(){
  const meta = store.get('meta', {});
  document.getElementById('meta-dominant').textContent = meta.dominant || '—';
  document.getElementById('meta-reward').textContent = meta.reward || '—';
}
refreshMeta();

wEls.this.addEventListener('click', () => {
  const now = new Date();
  wEls.week.value = weekRangeFrom(now);
  wEls.date.valueAsDate = startOfWeek(now);
  toast('Зададена е текущата седмица ✓');
});

wEls.fromDate.addEventListener('click', () => {
  const v = wEls.date.valueAsDate || new Date();
  wEls.week.value = weekRangeFrom(v);
  toast('Седмицата е изчислена от датата ✓');
});

wEls.autoscore.addEventListener('click', () => {
  const id = wEls.week.value;
  if (!id || !id.includes('→')) { toast('Моля, въведи диапазон за седмицата'); return; }
  const [from, to] = id.split('→').map(s => s.trim());
  const days = store.get('days', {});
  let done = 0, total = 0;
  const fromD = new Date(from+'T00:00:00');
  const toD = new Date(to+'T23:59:59');
  Object.entries(days).forEach(([date, d]) => {
    const cur = new Date(date+'T12:00:00');
    if (cur >= fromD && cur <= toD) {
      if (d.b1) { total++; if (d.b1c) done++; }
      if (d.b2) { total++; if (d.b2c) done++; }
      if (d.b3) { total++; if (d.b3c) done++; }
    }
  });
  const pct = total === 0 ? 0 : Math.round((done/total)*100);
  wEls.score.value = pct;
  toast('Автоматично изчислен %: '+pct+'%');
});

wEls.dup.addEventListener('click', () => {
  const weeks = store.get('weeks', {});
  const ids = Object.keys(weeks);
  if (ids.length === 0) { toast('Няма предходна седмица'); return; }
  const last = weeks[ids[0]] || weeks[ids.length-1];
  wEls.biz.value = last.biz || '';
  wEls.health.value = last.health || '';
  wEls.social.value = last.social || '';
  wEls.intim.value = last.intim || '';
  wEls.b1.value = last.b1 || '';
  wEls.b2.value = last.b2 || '';
  wEls.b3.value = last.b3 || '';
  wEls.score.value = last.score || 0;
  wEls.retro.value = last.retro || '';
  toast('Дублирана е последната седмица ✓');
});

wEls.score.addEventListener('blur', () => {
  const v = clampPct(wEls.score.value);
  if (String(v) !== String(wEls.score.value)) toast('Коригиран % (0–100)');
  wEls.score.value = v;
});

wEls.save.addEventListener('click', () => {
  const weeks = store.get('weeks', {});
  const id = wEls.week.value || 'Текуща седмица';
  const v = clampPct(wEls.score.value);
  weeks[id] = {
    biz: wEls.biz.value, health: wEls.health.value,
    social: wEls.social.value, intim: wEls.intim.value,
    b1: wEls.b1.value, b2: wEls.b2.value, b3: wEls.b3.value,
    score: v, retro: wEls.retro.value
  };
  store.set('weeks', weeks);
  toast('Седмицата е записана ✓');
  updateDashboard();
});

// MONTHLY
const mEls = {
  month: document.getElementById('m-month'),
  focus: document.getElementById('m-focus'),
  tasks: document.getElementById('m-tasks'),
  notes: document.getElementById('m-notes'),
  score: document.getElementById('m-score'),
  save: document.getElementById('m-save'),
};
mEls.score.addEventListener('blur', () => {
  const v = clampPct(mEls.score.value);
  if (String(v) !== String(mEls.score.value)) toast('Коригиран % (0–100)');
  mEls.score.value = v;
});
mEls.save.addEventListener('click', () => {
  const months = store.get('months', {});
  const id = mEls.month.value || 'Текущ месец';
  months[id] = {
    focus: mEls.focus.value, tasks: mEls.tasks.value,
    notes: mEls.notes.value, score: clampPct(mEls.score.value)
  };
  store.set('months', months);
  toast('Месецът е записан ✓');
  updateDashboard();
});

// OKRs & META
const oEls = {
  v2050: document.getElementById('v-2050'),
  v2030: document.getElementById('v-2030'),
  v2026: document.getElementById('v-2026'),
  o1: document.getElementById('okr-1'),
  o2: document.getElementById('okr-2'),
  o3: document.getElementById('okr-3'),
  o4: document.getElementById('okr-4'),
  p1: document.getElementById('okr-1p'),
  p2: document.getElementById('okr-2p'),
  p3: document.getElementById('okr-3p'),
  p4: document.getElementById('okr-4p'),
  dominant: document.getElementById('meta-dominant-inp'),
  reward: document.getElementById('meta-reward-inp'),
  save: document.getElementById('okrs-save'),
};

function loadOKRState(){
  const vision = store.get('vision', {});
  oEls.v2050.value = vision.v2050 || '';
  oEls.v2030.value = vision.v2030 || '';
  oEls.v2026.value = vision.v2026 || '';

  const okrs = store.get('okrs', {});
  oEls.o1.value = okrs.o1 || '';
  oEls.o2.value = okrs.o2 || '';
  oEls.o3.value = okrs.o3 || '';
  oEls.o4.value = okrs.o4 || '';

  const prog = store.get('okrProg', {});
  oEls.p1.value = prog.o1 ?? 0;
  oEls.p2.value = prog.o2 ?? 0;
  oEls.p3.value = prog.o3 ?? 0;
  oEls.p4.value = prog.o4 ?? 0;

  const meta = store.get('meta', {});
  oEls.dominant.value = meta.dominant || '';
  oEls.reward.value = meta.reward || '';
}
loadOKRState();

[oEls.p1,oEls.p2,oEls.p3,oEls.p4].forEach(inp=>inp.addEventListener('blur',()=>inp.value=clampPct(inp.value)));

oEls.save.addEventListener('click', () => {
  store.set('vision', {
    v2050: oEls.v2050.value, v2030: oEls.v2030.value, v2026: oEls.v2026.value
  });
  store.set('okrs', {
    o1: oEls.o1.value, o2: oEls.o2.value, o3: oEls.o3.value, o4: oEls.o4.value
  });
  store.set('okrProg', {
    o1: clampPct(oEls.p1.value), o2: clampPct(oEls.p2.value),
    o3: clampPct(oEls.p3.value), o4: clampPct(oEls.p4.value)
  });
  store.set('meta', { dominant: oEls.dominant.value, reward: oEls.reward.value });
  toast('OKRs/Визия/Шаблони записани ✓');
  refreshMeta();
  updateDashboard();
});

// Reset
const rEls = {
  q1: document.getElementById('r-1'),
  q2: document.getElementById('r-2'),
  q3: document.getElementById('r-3'),
  q4: document.getElementById('r-4'),
  commit: document.getElementById('r-commit'),
  history: document.getElementById('r-history'),
};
rEls.commit.addEventListener('click', () => {
  const resets = store.get('resets', []);
  resets.unshift({
    ts: new Date().toISOString(),
    a1: rEls.q1.value, a2: rEls.q2.value, a3: rEls.q3.value, a4: rEls.q4.value
  });
  store.set('resets', resets);
  rEls.q1.value = rEls.q2.value = rEls.q3.value = rEls.q4.value = '';
  toast('Нов старт ✓');
  renderResets();
  updateDashboard();
});
function renderResets(){
  const resets = store.get('resets', []);
  rEls.history.innerHTML = resets.map(r => `
    <div class="reset-item">
      <strong>${new Date(r.ts).toLocaleString()}</strong>
      <ul>
        <li>Пропуснах: ${r.a1||'-'}</li>
        <li>Научих: ${r.a2||'-'}</li>
        <li>Следваща стъпка: ${r.a3||'-'}</li>
        <li>Ангажимент: ${r.a4||'-'}</li>
      </ul>
    </div>
  `).join('');
}

// Dashboard
function updateDashboard(){
  const days = store.get('days', {});
  const weeks = store.get('weeks', {});
  const months = store.get('months', {});
  const resets = store.get('resets', []);
  document.getElementById('stat-days').textContent = Object.keys(days).length;
  document.getElementById('stat-weeks').textContent = Object.keys(weeks).length;
  document.getElementById('stat-months').textContent = Object.keys(months).length;
  document.getElementById('stat-resets').textContent = resets.length;

  const prog = store.get('okrProg', {o1:0,o2:0,o3:0,o4:0});
  [['bar-o1','pct-o1','o1'], ['bar-o2','pct-o2','o2'], ['bar-o3','pct-o3','o3'], ['bar-o4','pct-o4','o4']]
    .forEach(([barId, pctId, key]) => {
      const v = clampPct(prog[key] ?? 0);
      const bar = document.getElementById(barId);
      const pct = document.getElementById(pctId);
      if (bar) bar.style.width = v + '%';
      if (pct) pct.textContent = v + '%';
    });
}
renderResets(); updateDashboard();

// Export / Import
document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({
    theme: document.documentElement.getAttribute('data-theme'),
    vision: store.get('vision', {}),
    okrs: store.get('okrs', {}),
    okrProg: store.get('okrProg', {}),
    meta: store.get('meta', {}),
    months: store.get('months', {}),
    weeks: store.get('weeks', {}),
    days: store.get('days', {}),
    resets: store.get('resets', []),
  }, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'act2-data-backup.json'; a.click();
  URL.revokeObjectURL(url);
  toast('Експорт готов ✓');
});

document.getElementById('import').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.entries(data).forEach(([k,v]) => store.set(k, v));
      const t = data.theme || store.get('theme', 'dark');
      document.documentElement.setAttribute('data-theme', t);
      toast('Импорт завършен ✓');
      renderResets(); updateDashboard(); loadOKRState(); refreshMeta();
    } catch(err){
      toast('Невалиден файл');
    }
  };
  reader.readAsText(file);
});
