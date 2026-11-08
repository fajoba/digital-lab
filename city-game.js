/* City Eliminator — Digital Lab
 * Each slider applies against the original 100 metros, not the surviving subset.
 * Filters are independent; a metro is eliminated if it fails ANY active filter.
 * Only 2025 population is bundled as real data. Other metrics require CSV import.
 */

const METRICS = [
  { key: 'good_weather_days', label: 'Good weather days', short: 'Weather', detail: '65–85°F high · <1 mm rain · dew point <65°F (prior game)', format: n => `${Math.round(n)} days`, higherBetter: true },
  { key: 'walk_score', label: 'Walkability', short: 'Walkability', detail: 'Principal-city Walk Score proxy; not a metro-wide Walk Score', format: n => Number(n).toFixed(1), higherBetter: true },
  { key: 'annual_growth_pct', label: 'Population growth', short: 'Growth', detail: '2024–2025 percentage change, Census Vintage 2025', format: n => `${Number(n).toFixed(2)}%`, higherBetter: true },
  { key: 'median_household_income', label: 'Median household income', short: 'Income', detail: '2024 ACS 1-year median household income (metro)', format: n => `$${Math.round(n).toLocaleString()}`, higherBetter: true },
  { key: 'transit_commute_share_pct', label: 'Public transit commuting', short: 'Transit', detail: '2024 ACS: percentage of commuters using public transit', format: n => `${Number(n).toFixed(1)}%`, higherBetter: true },
  { key: 'arts_vibrancy_rank', label: 'Arts vibrancy', short: 'Arts', detail: 'SMU 2025 Arts Vibrancy ranking — lower rank is better', format: n => `Rank ${Math.round(n)}`, higherBetter: false },
  { key: 'population_2025', label: 'Metro population', short: 'Population', detail: '2025 Census MSA estimate — an extra optional filter', format: n => Math.round(n).toLocaleString(), higherBetter: true }
];
const BINARY = [
  { key: 'has_major_sports', label: 'Require major-league sports', short: 'No major-league team', detail: 'NFL, NBA, MLB, NHL, MLS or WNBA in the metro' },
  { key: 'has_top_100_university', label: 'Require a top-100 university', short: 'No top-100 university', detail: '2027 U.S. News National Universities, metro campus' }
];
const BASE_METROS = window.CITY_METROS;
if (!Array.isArray(BASE_METROS) || BASE_METROS.length !== 100) {
  throw new Error('Expected 100 metropolitan areas in metros.js');
}

const NUMERIC_KEYS = METRICS.map(m => m.key).filter(k => k !== 'population_2025');
const BOOLEAN_KEYS = BINARY.map(b => b.key);
const ALL_EXTRA_KEYS = [...NUMERIC_KEYS, ...BOOLEAN_KEYS];
const STORE_KEY = 'digital-lab.city-eliminator.v1';

// A simple deterministic function to create reproducible PRACTICE scores.
// These numbers are invented. They are NOT measurements or rankings of real cities.
function practiceScore(name, salt) {
  let h = 2166136261;
  for (const ch of `${name}:${salt}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
function makePracticeMetrics(metro) {
  const p = key => practiceScore(metro.metro, key);
  return {
    good_weather_days: Math.round(65 + 115 * p('weather')),
    walk_score: Math.round((20 + 65 * p('walk')) * 10) / 10,
    annual_growth_pct: Math.round((-1.2 + 4.4 * p('growth')) * 100) / 100,
    median_household_income: Math.round(52000 + 105000 * p('income')),
    transit_commute_share_pct: Math.round((0.3 + 19 * p('transit')) * 10) / 10,
    arts_vibrancy_rank: 1 + Math.floor(99 * p('arts')),
    has_major_sports: p('sports') > 0.65,
    has_top_100_university: p('university') > 0.6
  };
}

const state = {
  percentages: Object.fromEntries(METRICS.map(m => [m.key, 0])),
  required: Object.fromEntries(BINARY.map(b => [b.key, false])),
  view: 'survivors',
  query: '',
  sort: 'rank',
  practice: false,
  imported: null
};

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      percentages: state.percentages,
      required: state.required,
      practice: state.practice,
      imported: state.imported
    }));
  } catch (_) { /* Works without browser storage (private mode / storage unavailable). */ }
}
function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!saved) return;
    for (const m of METRICS) {
      const v = Number(saved.percentages?.[m.key]);
      if (Number.isFinite(v)) state.percentages[m.key] = Math.min(100, Math.max(0, 5 * Math.round(v / 5)));
    }
    for (const b of BINARY) state.required[b.key] = saved.required?.[b.key] === true;
    state.practice = saved.practice === true;
    if (saved.imported && typeof saved.imported === 'object') state.imported = saved.imported;
  } catch (_) { /* A broken old setting should not break the page. */ }
}

const $ = id => document.getElementById(id);
const html = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function getMetros() {
  return BASE_METROS.map(metro => ({
    ...metro,
    ...(state.practice ? makePracticeMetrics(metro) : state.imported?.[metro.rank] || {})
  }));
}
function isValid(metro, key) {
  return (key === 'has_major_sports' || key === 'has_top_100_university')
    ? typeof metro[key] === 'boolean'
    : typeof metro[key] === 'number' && Number.isFinite(metro[key]);
}
function getCoverage(metros, key) {
  return metros.filter(m => isValid(m, key)).length;
}

function createControls() {
  $('numeric-filters').innerHTML = METRICS.map(m => `
    <div class="filter" data-filter="${m.key}">
      <div class="filter-title-row">
        <label for="slider-${m.key}">${html(m.label)}</label>
        <output class="filter-output" id="value-${m.key}" for="slider-${m.key}">0%</output>
      </div>
      <p class="filter-detail">${html(m.detail)}</p>
      <input id="slider-${m.key}" type="range" min="0" max="100" step="5" value="0"
             aria-label="Eliminate bottom percentage by ${html(m.label)}" />
      <div class="scale-ends"><span>Keep all</span><span>Remove bottom 100%</span></div>
      <span class="filter-lock" id="lock-${m.key}" hidden>Loading data…</span>
    </div>
  `).join('');
  $('binary-filters').innerHTML = BINARY.map(b => `
    <div class="binary-toggle">
      <div><label for="toggle-${b.key}">${html(b.label)}</label><small>${html(b.detail)}</small>
      <span class="filter-lock" id="lock-${b.key}" hidden>Missing data</span></div>
      <input id="toggle-${b.key}" type="checkbox" />
    </div>
  `).join('');
  for (const m of METRICS) {
    $(`slider-${m.key}`).addEventListener('input', e => {
      state.percentages[m.key] = Number(e.target.value);
      saveState(); render();
    });
  }
  for (const b of BINARY) {
    $(`toggle-${b.key}`).addEventListener('change', e => {
      state.required[b.key] = e.target.checked;
      saveState(); render();
    });
  }
}

// Important algorithm: rank each metric across the ORIGINAL 100, then
// eliminate the bottom floor(percentage × 100) for that metric.
function getEliminations(metros) {
  const byRank = new Map(metros.map(m => [m.rank, []]));
  for (const metric of METRICS) {
    const pct = state.percentages[metric.key];
    if (!pct || getCoverage(metros, metric.key) !== metros.length) continue;
    const sortedWorstFirst = [...metros].sort((a, b) => {
      const diff = metric.higherBetter ? a[metric.key] - b[metric.key] : b[metric.key] - a[metric.key];
      return diff || a.rank - b.rank; // deterministic tie-breaker
    });
    const count = Math.floor(metros.length * pct / 100);
    for (const metro of sortedWorstFirst.slice(0, count)) {
      byRank.get(metro.rank).push(`${metric.short} · bottom ${pct}%`);
    }
  }
  for (const binary of BINARY) {
    if (!state.required[binary.key] || getCoverage(metros, binary.key) !== metros.length) continue;
    for (const metro of metros) {
      if (metro[binary.key] === false) byRank.get(metro.rank).push(binary.short);
    }
  }
  return byRank;
}

function render() {
  const metros = getMetros();
  for (const metric of METRICS) {
    const coverage = getCoverage(metros, metric.key);
    const enabled = coverage === metros.length;
    const slider = $(`slider-${metric.key}`);
    slider.disabled = !enabled;
    if (!enabled) state.percentages[metric.key] = 0;
    slider.value = String(state.percentages[metric.key]);
    $(`value-${metric.key}`).textContent = `${state.percentages[metric.key]}%`;
    const lock = $(`lock-${metric.key}`);
    lock.hidden = enabled;
    if (!enabled) lock.textContent = `Data required: ${coverage}/100 scored`;
  }
  for (const binary of BINARY) {
    const coverage = getCoverage(metros, binary.key);
    const enabled = coverage === metros.length;
    const box = $(`toggle-${binary.key}`);
    box.disabled = !enabled;
    if (!enabled) state.required[binary.key] = false;
    box.checked = state.required[binary.key];
    const lock = $(`lock-${binary.key}`);
    lock.hidden = enabled;
    if (!enabled) lock.textContent = `Data required: ${coverage}/100 scored`;
  }

  $('mode-banner').classList.toggle('demo', state.practice);
  $('data-mode-label').textContent = state.practice ? 'SIMULATED practice scores' : state.imported ? 'Imported metrics + Census population' : 'Verified population data';
  $('mode-title').textContent = state.practice ? 'PRACTICE MODE · These scores are not real' : state.imported ? 'Imported dataset loaded' : 'Census-based starting list';
  $('mode-description').textContent = state.practice
    ? 'All non-population scores and yes/no flags are invented solely to test the interface. Do not draw conclusions about cities from these results.'
    : state.imported
      ? 'Sliders activate only when all 100 metros have valid values for that metric. Check the provenance of imported values before treating outcomes as factual.'
      : 'Population values are real. Other sliders unlock when you import complete data. Try practice mode to see the full interaction.';
  $('demo-button').textContent = state.practice ? 'Exit practice mode' : 'Try practice data';

  const eliminated = getEliminations(metros);
  const survivors = metros.filter(m => eliminated.get(m.rank).length === 0);
  const excluded = metros.filter(m => eliminated.get(m.rank).length !== 0);
  const active = METRICS.filter(m => state.percentages[m.key] > 0).length + BINARY.filter(b => state.required[b.key]).length;
  $('survivor-count').textContent = survivors.length;
  $('eliminated-count').textContent = excluded.length;
  $('active-count').textContent = active;
  $('survivor-percent').textContent = `${survivors.length}% of starting field`;
  $('survival-fill').style.width = `${survivors.length}%`;
  $('survivors-tab-count').textContent = survivors.length;
  $('eliminated-tab-count').textContent = excluded.length;
  $('results-title').textContent = state.view === 'survivors' ? 'Remaining metros' : 'Eliminated metros';
  for (const tab of document.querySelectorAll('[data-view]')) {
    const current = tab.dataset.view === state.view;
    tab.classList.toggle('active', current);
    tab.setAttribute('aria-pressed', String(current));
  }
  const sorted = [...(state.view === 'survivors' ? survivors : excluded)]
    .filter(m => m.metro.toLowerCase().includes(state.query.toLowerCase()))
    .sort((a,b) => state.sort === 'name' ? a.metro.localeCompare(b.metro) : a.rank - b.rank);
  $('metro-results').innerHTML = sorted.map(m => `
    <li class="metro-row">
      <div class="metro-primary"><span class="metro-rank">#${m.rank}</span><div>
        <div class="metro-name">${html(m.metro)}</div>
        ${state.view === 'eliminated' ? `<div class="metro-reason">${eliminated.get(m.rank).map(reason => `<span class="reason-pill">${html(reason)}</span>`).join('')}</div>` : ''}
      </div></div>
      <span class="metro-pop">${m.population_2025.toLocaleString()}</span>
    </li>
  `).join('');
  $('no-results').hidden = sorted.length > 0;
  $('showing-count').textContent = `Showing ${sorted.length} of ${state.view === 'survivors' ? survivors.length : excluded.length} metros`;
  saveState();
}

// Parses Excel-compatible CSV, including quoted cells containing commas.
function parseCSV(text) {
  const lines = []; let row = []; let field = ''; let quoted = false;
  for (let i=0; i<text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i+1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field=''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i+1] === '\n') i++;
      row.push(field); field='';
      if (row.some(c => c.trim())) lines.push(row);
      row=[];
    } else field += char;
  }
  if (quoted) throw new Error('Unclosed quotation mark in CSV');
  row.push(field); if (row.some(c => c.trim())) lines.push(row);
  return lines;
}
function parseImportedMetrics(text) {
  const rows = parseCSV(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV is empty');
  const headers = rows[0].map(x => x.trim());
  if (!headers.includes('rank') || !headers.includes('metro')) throw new Error('CSV needs rank and metro columns');
  const byRank = {};
  for (const cells of rows.slice(1)) {
    const obj = Object.fromEntries(headers.map((h,i) => [h, (cells[i] || '').trim()]));
    const rank = Number(obj.rank);
    const base = BASE_METROS.find(m => m.rank === rank);
    if (!base) throw new Error(`Invalid metro rank: ${obj.rank}`);
    if (base.metro !== obj.metro) throw new Error(`Metro name differs from rank #${rank}: ${obj.metro}`);
    if (byRank[rank]) throw new Error(`Duplicate metro rank: ${rank}`);
    const metrics = {};
    for (const key of NUMERIC_KEYS) {
      if (obj[key] === '' || obj[key] === undefined) continue;
      const numeric = Number(obj[key].replace(/[$,%]/g,''));
      if (!Number.isFinite(numeric)) throw new Error(`Invalid ${key} for rank #${rank}`);
      metrics[key] = numeric;
    }
    for (const key of BOOLEAN_KEYS) {
      const raw = (obj[key] || '').toLowerCase();
      if (!raw) continue;
      if (['1','yes','true'].includes(raw)) metrics[key] = true;
      else if (['0','no','false'].includes(raw)) metrics[key] = false;
      else throw new Error(`Invalid yes/no for ${key} at rank #${rank}`);
    }
    byRank[rank] = metrics;
  }
  return byRank;
}
function csvEscape(value) {
  const str=String(value ?? '');
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g,'""')}"` : str;
}
function exportSurvivors() {
  const metros=getMetros();
  const eliminated=getEliminations(metros);
  const survivors=metros.filter(m => eliminated.get(m.rank).length===0);
  const columns=['rank','metro','population_2025',...ALL_EXTRA_KEYS];
  const rows=[columns.join(','),...survivors.map(m => columns.map(k => csvEscape(m[k])).join(','))];
  const blob=new Blob([rows.join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='city-eliminator-survivors.csv'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url),100);
}

function main() {
  restoreState(); createControls();
  $('demo-button').addEventListener('click', () => { state.practice=!state.practice; render(); });
  $('reset-button').addEventListener('click', () => {
    for (const m of METRICS) state.percentages[m.key]=0;
    for (const b of BINARY) state.required[b.key]=false;
    state.query=''; $('city-search').value=''; state.view='survivors'; render();
  });
  $('export-button').addEventListener('click', exportSurvivors);
  $('city-search').addEventListener('input', e => { state.query=e.target.value; render(); });
  $('sort-metros').addEventListener('change', e => { state.sort=e.target.value; render(); });
  for (const tab of document.querySelectorAll('[data-view]')) {
    tab.addEventListener('click', () => { state.view=tab.dataset.view; render(); });
  }
  $('csv-file').addEventListener('change', async e => {
    const file=e.target.files?.[0]; if (!file) return;
    try {
      const imported=parseImportedMetrics(await file.text());
      state.imported=imported; state.practice=false;
      render();
      const complete=ALL_EXTRA_KEYS.filter(k => getCoverage(getMetros(),k)===100);
      window.alert(`Imported ${Object.keys(imported).length} metro rows. Fully populated criteria: ${complete.length} of ${ALL_EXTRA_KEYS.length}.`);
    } catch (error) { window.alert(`CSV import failed: ${error.message}`); }
    e.target.value='';
  });
  render();
}
main();
