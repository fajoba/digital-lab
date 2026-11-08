/* City Eliminator — Digital Lab
 * Each slider applies against the original 100 metros, not the surviving subset.
 * Filters are independent; a metro is eliminated if it fails ANY active filter.
 * Population (Census Vintage 2025) and 2026 sports-team presence are real bundled data.
 * Census growth can be added by loading the Census 2025 public CSV.
 * Other metrics only unlock when their full 100-metro data are imported.
 */

const METRICS = [
  { key: 'good_weather_days', label: 'Good weather days', short: 'Weather', detail: '60–85°F high · no rain · some sunshine; historical dataset needed', format: n => `${Math.round(n)} days`, higherBetter: true },
  { key: 'walk_score', label: 'Walkability', short: 'Walkability', detail: 'Principal-city Walk Score proxy; not a metro-wide Walk Score', format: n => Number(n).toFixed(1), higherBetter: true },
  { key: 'annual_growth_pct', label: 'Population growth', short: 'Growth', detail: 'July 2024–July 2025 change, Census Vintage 2025', format: n => `${Number(n).toFixed(2)}%`, higherBetter: true },
  { key: 'median_household_income', label: 'Median household income', short: 'Income', detail: '2024 ACS 1-year median household income (metro)', format: n => `$${Math.round(n).toLocaleString()}`, higherBetter: true },
  { key: 'transit_commute_share_pct', label: 'Public transit commuting', short: 'Transit', detail: '2024 ACS: percentage of commuters using public transit', format: n => `${Number(n).toFixed(1)}%`, higherBetter: true },
  { key: 'arts_vibrancy_rank', label: 'Arts vibrancy', short: 'Arts', detail: 'SMU 2025 Arts Vibrancy ranking — lower rank is better', format: n => `Rank ${Math.round(n)}`, higherBetter: false },
  { key: 'population_2025', label: 'Metro population', short: 'Population', detail: '2025 Census MSA estimate — an extra optional filter', format: n => Math.round(n).toLocaleString(), higherBetter: true }
];
const BINARY = [
  { key: 'has_major_sports', label: 'Require major-league sports', short: 'No major-league team', detail: '2026 clubs playing home games in metro · NFL / NBA / MLB / NHL / MLS / WNBA' },
  { key: 'has_top_100_university', label: 'Require a top-100 university', short: 'No top-100 university', detail: '2027 U.S. News National Universities, metro campus' }
];
const BASE_METROS = window.CITY_METROS;
if (!Array.isArray(BASE_METROS) || BASE_METROS.length !== 100) {
  throw new Error('Expected 100 metropolitan areas in metros.js');
}

const NUMERIC_KEYS = METRICS.map(m => m.key).filter(k => k !== 'population_2025');
const BOOLEAN_KEYS = BINARY.map(b => b.key);
const ALL_EXTRA_KEYS = [...NUMERIC_KEYS, ...BOOLEAN_KEYS];
const STORE_KEY = 'digital-lab.city-eliminator.v2';

const state = {
  percentages: Object.fromEntries(METRICS.map(m => [m.key, 0])),
  required: Object.fromEntries(BINARY.map(b => [b.key, false])),
  view: 'survivors',
  query: '',
  sort: 'rank',
  imported: null,
  growthSource: null
};

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      percentages: state.percentages,
      required: state.required,
      imported: state.imported,
      growthSource: state.growthSource
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
    if (saved.imported && typeof saved.imported === 'object') state.imported = saved.imported;
    if (['census-2025','custom-csv'].includes(saved.growthSource)) state.growthSource = saved.growthSource;
  } catch (_) { /* A broken old setting should not break the page. */ }
}

const $ = id => document.getElementById(id);
const html = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function getMetros() {
  return BASE_METROS.map(metro => ({
    ...metro,
    ...(state.imported?.[metro.rank] || {}),
    has_major_sports: window.METRO_SPORTS_RANKS.has(metro.rank)
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

  const growthCount = getCoverage(metros, 'annual_growth_pct');
  const officialGrowth = growthCount === 100 && state.growthSource === 'census-2025';
  const customGrowth = growthCount === 100 && !officialGrowth;
  $('data-mode-label').textContent = officialGrowth
    ? 'Census 2025 growth + population; 2026 sports'
    : customGrowth ? 'User-imported growth; official population + sports' : 'Official population + 2026 sports';
  $('mode-title').textContent = officialGrowth
    ? 'Official Census growth data loaded'
    : customGrowth ? 'Custom growth scores loaded — verify source' : 'Real-data mode — population and major sports ready';
  $('mode-description').textContent = officialGrowth
    ? 'Growth and population: U.S. Census Vintage 2025. Sports: 2026 major-league venues. Other criteria unlock only after complete data are imported.'
    : customGrowth
      ? 'The growth column came from an uploaded metrics file, not the verified Census importer. Its origin has not been checked; import the official Census CSV to replace it.'
      : 'Population and major-league sports use real data. To enable population growth, import the official Census 2025 CSV below, or add it to your website project. No simulated scores are used.';
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
// Accepts the raw CSV published by the U.S. Census Bureau, NOT a hand-filled template.
// Match metro records by their verified 2025 populations, which remain identical
// in metros.js. County, metropolitan-division and micropolitan rows are excluded.
function parseCensusGrowth(text) {
  const rows = parseCSV(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('The Census CSV is empty');
  const headers = rows[0].map(s => s.trim().toUpperCase());
  const fields = ['LSAD', 'NAME', 'POPESTIMATE2024', 'POPESTIMATE2025'];
  for (const field of fields) if (!headers.includes(field)) {
    throw new Error(`This is not the Census CBSA-EST2025-ALLDATA file (missing ${field})`);
  }
  const col = Object.fromEntries(fields.map(f => [f, headers.indexOf(f)]));
  const byPop = new Map(BASE_METROS.map(m => [m.population_2025, m]));
  const byRank = {};
  const matched = new Map();
  for (const cells of rows.slice(1)) {
    const lsad = (cells[col.LSAD] || '').trim().toLowerCase();
    // Official field uses 'Metropolitan Statistical Area'; reject county/division rows.
    if (!lsad.includes('metropolitan statistical area') || lsad.includes('micropolitan')) continue;
    const p24 = Number((cells[col.POPESTIMATE2024] || '').replace(/,/g, ''));
    const p25 = Number((cells[col.POPESTIMATE2025] || '').replace(/,/g, ''));
    if (!Number.isSafeInteger(p25) || !Number.isSafeInteger(p24) || p24 <= 0) continue;
    const base = byPop.get(p25);
    if (!base) continue;
    // Cross-check that the metro name begins with the correct principal city.
    const baseCity = base.metro.split('-')[0].split(',')[0].toLowerCase();
    const censusName = (cells[col.NAME] || '').trim().toLowerCase();
    if (!censusName.startsWith(baseCity)) continue;
    if (matched.has(base.rank)) throw new Error(`Duplicate Census row for ${base.metro}`);
    matched.set(base.rank, censusName);
    byRank[base.rank] = { annual_growth_pct: Number((((p25 - p24) / p24) * 100).toFixed(5)) };
  }
  if (Object.keys(byRank).length !== BASE_METROS.length) {
    const missing = BASE_METROS.filter(m => !byRank[m.rank]).map(m => m.metro);
    throw new Error(`Matched ${Object.keys(byRank).length}/100 metros. Missing: ${missing.slice(0, 5).join('; ')}${missing.length > 5 ? '…' : ''}. Check that you downloaded the official Vintage 2025 file.`);
  }
  return byRank;
}
// Merge new data rather than erasing a previous import (e.g. ACS later).
function mergeMetrics(a, b) {
  const result = { ...(a || {}) };
  for (const [rank, values] of Object.entries(b)) {
    result[rank] = { ...(result[rank] || {}), ...values };
  }
  return result;
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
      state.imported=mergeMetrics(state.imported, imported);
      if (Object.values(imported).some(values => Number.isFinite(values.annual_growth_pct))) state.growthSource = 'custom-csv';
      render();
      const complete=ALL_EXTRA_KEYS.filter(k => getCoverage(getMetros(),k)===100);
      window.alert(`Imported ${Object.keys(imported).length} metro rows. Fully populated criteria: ${complete.length} of ${ALL_EXTRA_KEYS.length}.`);
    } catch (error) { window.alert(`CSV import failed: ${error.message}`); }
    e.target.value='';
  });
  $('census-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const growth = parseCensusGrowth(await file.text());
      state.imported = mergeMetrics(state.imported, growth);
      state.growthSource = 'census-2025';
      render();
      window.alert('Success! Loaded official 2024–2025 population growth for all 100 metros. The growth slider is now active.');
    } catch (error) {
      window.alert('Census import failed: ' + error.message);
    }
    event.target.value = '';
  });
  // Deployers can place Census file in project root once; all site visitors get it.
  // Using a local path also avoids cross-origin browser restrictions.
  fetch('census-metro-2025.csv', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('No bundled Census CSV');
      return response.text();
    })
    .then(text => {
      state.imported = mergeMetrics(state.imported, parseCensusGrowth(text));
      state.growthSource = 'census-2025';
      render();
    })
    .catch(() => { /* Still works with just population/sports or manual file upload. */ });
  render();
}
main();
