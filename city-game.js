/* Digital Lab — City Eliminator
 * Reads one published data file: city-data-master.csv
 * Sliders rank the original scored metros. Filters combine by intersection.
 * Data preparation and source attribution live outside this browser script.
 */

const METRICS = [
  {
    key: 'good_weather_days_per_year', label: 'Estimated good-weather days', short: 'Weather',
    detail: 'Modeled days/year · highs 60–85°F, nearly dry, ≥2 hours sunshine · representative airport, not observed daily counts',
    format: n => `${Math.round(n)} estimated days`, higherBetter: true
  },
  {
    key: 'walkability_score', label: 'Downtown walkability', short: 'Walkability',
    detail: 'CityViking downtown index · removes the bottom percentage of scored metros; unscored metros are retained',
    allowPartial: true,
    format: n => Number(n).toFixed(1), higherBetter: true
  },
  {
    key: 'population_growth_pct_2024_2025', label: 'Population growth', short: 'Growth',
    detail: 'Metro population change from July 2024 to July 2025 · U.S. Census Bureau',
    format: n => `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`, higherBetter: true
  },
  {
    key: 'median_household_income', label: 'Median household income', short: 'Income',
    detail: 'To be sourced: ACS metro median household income',
    format: n => `$${Math.round(n).toLocaleString()}`, higherBetter: true
  },
  {
    key: 'transit_commute_pct', label: 'Public transit commuting', short: 'Transit',
    detail: 'To be sourced: ACS metro commute share',
    format: n => `${Number(n).toFixed(1)}%`, higherBetter: true
  },
  {
    key: 'arts_vibrancy_score', label: 'Arts vibrancy', short: 'Arts',
    detail: 'To be sourced: a consistent score where higher means better',
    format: n => Number(n).toFixed(1), higherBetter: true
  },
  {
    key: 'population_2025', label: 'Metro population', short: 'Population',
    detail: '2025 U.S. Census metropolitan population estimate',
    format: n => Math.round(n).toLocaleString(), higherBetter: true
  }
];

const BINARY = [
  {
    key: 'has_major_sports_team', label: 'Pro sports teams', slider: true,
    short: 'No major-league team',
    detail: '2026 home-venue snapshot: NFL / NBA / MLB / NHL / MLS / WNBA'
  },
  {
    key: 'has_top_100_university', label: 'Require a top-100 university',
    short: 'No top-100 university',
    detail: 'Not yet sourced; disabled until the full list is verified'
  }
];

const STORE_KEY = 'digital-lab.city-eliminator.master.v1';
const state = {
  metros: [],
  percentages: Object.fromEntries(METRICS.map(m => [m.key, 0])),
  required: Object.fromEntries(BINARY.map(b => [b.key, false])),
  view: 'survivors',
  query: '',
  sort: 'rank'
};
const $ = id => document.getElementById(id);
const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!saved) return;
    for (const metric of METRICS) {
      const value = Number(saved.percentages?.[metric.key]);
      if (Number.isFinite(value)) state.percentages[metric.key] = Math.max(0, Math.min(100, Math.round(value / 5) * 5));
    }
    for (const binary of BINARY) state.required[binary.key] = saved.required?.[binary.key] === true;
  } catch (_) { /* A corrupt or unavailable preference store doesn't break the app. */ }
}
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({percentages: state.percentages, required: state.required}));
  } catch (_) { /* Local preferences are optional. */ }
}

// A small CSV parser that supports commas and escaped quotes inside quoted fields.
function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.trim())) rows.push(row);
      row = [];
    } else { field += char; }
  }
  if (quoted) throw new Error('There is an unclosed quote in the master CSV.');
  row.push(field);
  if (row.some(v => v.trim())) rows.push(row);
  return rows;
}
function numberOrNull(text, column, name) {
  const value = String(text ?? '').trim();
  if (value === '') return null;
  const result = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(result)) throw new Error(`Invalid ${column} value for ${name}`);
  return result;
}
function boolOrNull(text, column, name) {
  const value = String(text ?? '').trim().toLowerCase();
  if (value === '') return null;
  if (['true', 'yes', '1'].includes(value)) return true;
  if (['false', 'no', '0'].includes(value)) return false;
  throw new Error(`Invalid ${column} value for ${name}; use TRUE or FALSE.`);
}
function parseMasterCSV(text) {
  const raw = parseCSV(text);
  if (raw.length < 2) throw new Error('The master CSV is empty.');
  const columns = raw[0].map(s => s.trim());
  const required = ['cbsa_code', 'metro_name', 'population_rank_2025', 'population_2025'];
  for (const col of required) if (!columns.includes(col)) throw new Error(`Missing CSV column: ${col}`);
  const rankSet = new Set(), codeSet = new Set();
  const metros = raw.slice(1).map(cells => {
    const source = Object.fromEntries(columns.map((col, i) => [col, (cells[i] ?? '').trim()]));
    const rank = numberOrNull(source.population_rank_2025, 'population_rank_2025', source.metro_name);
    const population = numberOrNull(source.population_2025, 'population_2025', source.metro_name);
    const cbsa = source.cbsa_code;
    if (!Number.isInteger(rank) || rank < 1 || rank > 100) throw new Error(`Invalid population rank for ${source.metro_name}`);
    if (!Number.isSafeInteger(population) || population <= 0) throw new Error(`Invalid population for ${source.metro_name}`);
    if (!cbsa || rankSet.has(rank) || codeSet.has(cbsa)) throw new Error(`Duplicate or missing rank/CBSA: ${source.metro_name}`);
    rankSet.add(rank); codeSet.add(cbsa);
    const metro = {rank, metro: source.metro_name, cbsa_code: cbsa, population_2025: population};
    for (const metric of METRICS) {
      if (metric.key === 'population_2025') continue;
      metro[metric.key] = numberOrNull(source[metric.key], metric.key, metro.metro);
    }
    for (const binary of BINARY) metro[binary.key] = boolOrNull(source[binary.key], binary.key, metro.metro);
    return metro;
  });
  if (metros.length !== 100 || rankSet.size !== 100) {
    throw new Error(`The master CSV must have exactly 100 unique metros (found ${metros.length}).`);
  }
  return metros.sort((a, b) => a.rank - b.rank);
}

function createControls() {
  $('numeric-filters').innerHTML = METRICS.map(metric => `
    <div class="filter" data-filter="${metric.key}">
      <div class="filter-title-row">
        <label for="slider-${metric.key}">${escapeHtml(metric.label)}</label>
        <output class="filter-output" id="value-${metric.key}" for="slider-${metric.key}">0%</output>
      </div>
      <p class="filter-detail">${escapeHtml(metric.detail)}</p>
      <input id="slider-${metric.key}" type="range" min="0" max="100" step="5" value="0"
             aria-label="Eliminate bottom percentage by ${escapeHtml(metric.label)}" />
      <div class="scale-ends"><span>Keep all</span><span>Remove bottom 100%</span></div>
      <span class="filter-lock" id="lock-${metric.key}" hidden>Loading data…</span>
    </div>
  `).join('');
  $('numeric-filters').insertAdjacentHTML('beforeend', BINARY.filter(binary => binary.slider).map(binary => `
    <div class="filter" data-filter="${binary.key}">
      <div class="filter-title-row">
        <label for="toggle-${binary.key}">${escapeHtml(binary.label)}</label>
        <output class="filter-output" id="value-${binary.key}" for="toggle-${binary.key}">Any metro</output>
      </div>
      <p class="filter-detail">${escapeHtml(binary.detail)} · require at least one team</p>
      <input id="toggle-${binary.key}" type="range" min="0" max="1" step="1" value="0"
             aria-label="Minimum pro sports teams" aria-valuetext="Any metro" />
      <div class="scale-ends"><span>Any metro</span><span>At least one team</span></div>
      <span class="filter-lock" id="lock-${binary.key}" hidden>Loading data…</span>
    </div>
  `).join(''));
  $('binary-filters').innerHTML = BINARY.filter(binary => !binary.slider).map(binary => `
    <div class="binary-toggle">
      <div>
        <label for="toggle-${binary.key}">${escapeHtml(binary.label)}</label>
        <small>${escapeHtml(binary.detail)}</small>
        <span class="filter-lock" id="lock-${binary.key}" hidden>Missing data</span>
      </div>
      <input id="toggle-${binary.key}" type="checkbox" />
    </div>
  `).join('');
  for (const metric of METRICS) {
    $(`slider-${metric.key}`).addEventListener('input', event => {
      state.percentages[metric.key] = Number(event.target.value);
      saveState(); render();
    });
  }
  for (const binary of BINARY) {
    $(`toggle-${binary.key}`).addEventListener(binary.slider ? 'input' : 'change', event => {
      state.required[binary.key] = binary.slider ? Number(event.target.value) === 1 : event.target.checked;
      saveState(); render();
    });
  }
}

function isValid(metro, key) {
  return BINARY.some(b => b.key === key) ? typeof metro[key] === 'boolean' :
    typeof metro[key] === 'number' && Number.isFinite(metro[key]);
}
function coverage(metros, key) { return metros.filter(metro => isValid(metro, key)).length; }
function metricEnabled(metric, count) {
  return count === 100 || (metric.allowPartial === true && count > 0);
}

// Each metric removes its bottom X% of the original scored field, not the current survivors.
function getEliminations(metros) {
  const reasons = new Map(metros.map(metro => [metro.rank, []]));
  for (const metric of METRICS) {
    const percent = state.percentages[metric.key];
    const scored = metros.filter(m => isValid(m, metric.key));
    if (!percent || !metricEnabled(metric, scored.length)) continue;
    const sortedWorstFirst = [...scored].sort((a, b) => {
      const difference = metric.higherBetter ? a[metric.key] - b[metric.key] : b[metric.key] - a[metric.key];
      return difference || a.rank - b.rank;
    });
    const removeCount = Math.floor(sortedWorstFirst.length * percent / 100);
    for (const metro of sortedWorstFirst.slice(0, removeCount)) {
      reasons.get(metro.rank).push(`${metric.short} · bottom ${percent}%`);
    }
  }
  for (const binary of BINARY) {
    if (!state.required[binary.key] || coverage(metros, binary.key) !== 100) continue;
    for (const metro of metros) {
      if (metro[binary.key] === false) reasons.get(metro.rank).push(binary.short);
    }
  }
  return reasons;
}

function render() {
  const metros = state.metros;
  if (!metros.length) return;
  for (const metric of METRICS) {
    const count = coverage(metros, metric.key);
    const enabled = metricEnabled(metric, count);
    const slider = $(`slider-${metric.key}`);
    slider.disabled = !enabled;
    if (!enabled) state.percentages[metric.key] = 0;
    slider.value = state.percentages[metric.key];
    $(`value-${metric.key}`).textContent = `${state.percentages[metric.key]}%`;
    const lock = $(`lock-${metric.key}`);
    lock.hidden = enabled && count === 100;
    if (enabled && count < 100) lock.textContent = `${count}/100 metros scored · unscored metros retained`;
    if (!enabled) lock.textContent = `Incomplete data: ${count}/100 metros scored`;
  }
  for (const binary of BINARY) {
    const count = coverage(metros, binary.key);
    const enabled = count === 100;
    const toggle = $(`toggle-${binary.key}`);
    toggle.disabled = !enabled;
    if (!enabled) state.required[binary.key] = false;
    if (binary.slider) {
      toggle.value = state.required[binary.key] ? '1' : '0';
      const label = state.required[binary.key] ? 'At least one team' : 'Any metro';
      $(`value-${binary.key}`).textContent = label;
      toggle.setAttribute('aria-valuetext', label);
    } else {
      toggle.checked = state.required[binary.key];
    }
    const lock = $(`lock-${binary.key}`);
    lock.hidden = enabled;
    if (!enabled) lock.textContent = `Incomplete data: ${count}/100 metros scored`;
  }
  const availableMetrics = METRICS.filter(m => metricEnabled(m, coverage(metros, m.key)));
  const availableBinary = BINARY.filter(b => coverage(metros, b.key) === 100);
  $('data-mode-label').textContent = 'Master CSV · 100 metros';
  $('mode-title').textContent = 'Master dataset loaded';
  $('mode-description').textContent = `Ready: ${[...availableMetrics.map(m => m.short), ...availableBinary.map(b => b.label.replace('Require ', ''))].join(', ')}. Other incomplete criteria remain disabled. Weather is modeled; walkability filters scored downtowns and retains unscored metros.`;

  const reasons = getEliminations(metros);
  const survivors = metros.filter(metro => !reasons.get(metro.rank).length);
  const eliminated = metros.filter(metro => reasons.get(metro.rank).length);
  const active = METRICS.filter(m => state.percentages[m.key] > 0).length + BINARY.filter(b => state.required[b.key]).length;
  $('initial-count').textContent = metros.length;
  $('survivor-count').textContent = survivors.length;
  $('eliminated-count').textContent = eliminated.length;
  $('active-count').textContent = active;
  $('survivor-percent').textContent = `${survivors.length}% of starting field`;
  $('survival-fill').style.width = `${survivors.length}%`;
  $('survivors-tab-count').textContent = survivors.length;
  $('eliminated-tab-count').textContent = eliminated.length;
  $('results-title').textContent = state.view === 'survivors' ? 'Remaining metros' : 'Eliminated metros';
  for (const tab of document.querySelectorAll('[data-view]')) {
    const selected = tab.dataset.view === state.view;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-pressed', String(selected));
  }
  const filtered = [...(state.view === 'survivors' ? survivors : eliminated)]
    .filter(m => m.metro.toLowerCase().includes(state.query.toLowerCase()))
    .sort((a, b) => state.sort === 'name' ? a.metro.localeCompare(b.metro) : a.rank - b.rank);
  $('metro-results').innerHTML = filtered.map(metro => `
    <li class="metro-row">
      <div class="metro-primary"><span class="metro-rank">#${metro.rank}</span><div>
        <div class="metro-name">${escapeHtml(metro.metro)}</div>
        ${state.view === 'eliminated' ? `<div class="metro-reason">${reasons.get(metro.rank).map(reason => `<span class="reason-pill">${escapeHtml(reason)}</span>`).join('')}</div>` : ''}
      </div></div>
      <span class="metro-pop">${metro.population_2025.toLocaleString()}</span>
    </li>
  `).join('');
  $('no-results').hidden = filtered.length !== 0;
  $('showing-count').textContent = `Showing ${filtered.length} of ${state.view === 'survivors' ? survivors.length : eliminated.length} metros`;
  saveState();
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function exportSurvivors() {
  if (!state.metros.length) return;
  const reasons = getEliminations(state.metros);
  const survivors = state.metros.filter(metro => !reasons.get(metro.rank).length);
  const columns = ['cbsa_code','metro','rank','population_2025',...METRICS.filter(m => m.key !== 'population_2025').map(m => m.key),...BINARY.map(b => b.key)];
  const lines = [columns.join(','), ...survivors.map(metro => columns.map(key => csvEscape(metro[key])).join(','))];
  const blob = new Blob([lines.join('\r\n')], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'city-eliminator-survivors.csv';
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

async function loadMasterData() {
  try {
    const response = await fetch('city-data-master.csv', {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status} — city-data-master.csv not found`);
    state.metros = parseMasterCSV(await response.text());
    render();
  } catch (error) {
    console.error('City Eliminator dataset error:', error);
    $('data-mode-label').textContent = 'Master CSV unavailable';
    $('mode-title').textContent = 'Could not load city-data-master.csv';
    $('mode-description').textContent = `${error.message}. Check that the CSV is beside city-game.html and test through Netlify or a local development server (not by opening file:// directly).`;
    $('metro-results').innerHTML = '';
    $('showing-count').textContent = 'No city data loaded';
    for (const metric of METRICS) $(`slider-${metric.key}`).disabled = true;
    for (const binary of BINARY) $(`toggle-${binary.key}`).disabled = true;
  }
}
function main() {
  restoreState();
  createControls();
  for (const metric of METRICS) $(`slider-${metric.key}`).disabled = true;
  for (const binary of BINARY) $(`toggle-${binary.key}`).disabled = true;
  $('reset-button').addEventListener('click', () => {
    for (const metric of METRICS) state.percentages[metric.key] = 0;
    for (const binary of BINARY) state.required[binary.key] = false;
    state.query = ''; $('city-search').value = '';
    state.view = 'survivors';
    render();
  });
  $('export-button').addEventListener('click', exportSurvivors);
  $('city-search').addEventListener('input', event => {state.query = event.target.value; render();});
  $('sort-metros').addEventListener('change', event => {state.sort = event.target.value; render();});
  for (const tab of document.querySelectorAll('[data-view]')) {
    tab.addEventListener('click', () => {state.view = tab.dataset.view; render();});
  }
  loadMasterData();
}
main();
