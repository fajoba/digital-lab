/*
 * City Eliminator real-data CSV generator.
 * Population-weighted EPA 2021 National Walkability Index by metro CBSA.
 * Open-Meteo ERA5-Land daily 2015–2024 model weather at representative city.
 * All externally sourced values are downloaded in the visitor's own browser.
 */
const METROS = window.CITY_METROS;
const LOCATIONS = new Map(window.CITY_LOCATIONS.map(loc => [loc.rank, loc]));
const WEATHER_STORE = 'digital-lab.weather-generation.2015-2024.v1';
const START_DATE = '2015-01-01', END_DATE = '2024-12-31', N_YEARS = 10;
const GOOD_MIN_F = 60, GOOD_MAX_F = 85, MAX_PRECIP_MM = 0.254, MIN_SUNSHINE_SECONDS = 7200;
const STATES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};
const $ = id => document.getElementById(id);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const clean = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function escapeCsv(v) { const s=String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
function saveCsv(filename, headers, objects) {
  const text = '\uFEFF' + [headers.join(','), ...objects.map(obj => headers.map(h=>escapeCsv(obj[h])).join(','))].join('\r\n') + '\r\n';
  const url=URL.createObjectURL(new Blob([text], {type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}
function log(msg,type='') {
  const line=document.createElement('div'); line.className = type;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  $('log').prepend(line);
}
async function jsonGet(url) {
  let error;
  for(let n=0;n<4;n++) {
    try {
      const r=await fetch(url);
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const result=await r.json();
      if(result.error) throw new Error(result.reason || 'Remote API error');
      return result;
    } catch(e) { error=e; if(n<3) await wait(850*Math.pow(2,n)); }
  }
  throw error;
}
function readSavedWeather() {
  try {
    const obj=JSON.parse(localStorage.getItem(WEATHER_STORE)||'{}');
    return (obj && typeof obj==='object') ? obj : {};
  } catch { return {}; }
}
function storeWeather(obj) {
  try { localStorage.setItem(WEATHER_STORE, JSON.stringify(obj)); } catch {}
}
async function geocode(loc) {
  const variants=[loc.city];
  if(loc.city==='St. Louis') variants.push('Saint Louis','St Louis');
  if(loc.city==='Winston-Salem') variants.push('Winston Salem');
  if(loc.city==='North Port') variants.push('North Port Florida');
  let options=[];
  for(const name of variants) {
    const url='https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({name,count:'25',countryCode:'US',language:'en',format:'json'});
    const data=await jsonGet(url);
    options=data.results || [];
    const wantedState=clean(STATES[loc.state]);
    const stateMatches=options.filter(r=>clean(r.admin1)===wantedState);
    const exact=stateMatches.find(r=>clean(r.name)===clean(loc.city));
    const choice=exact||stateMatches[0];
    if(choice) return choice;
  }
  throw new Error(`No geocoding match for ${loc.city}, ${loc.state} (refusing to pick a different state)`);
}
async function weatherFor(metro) {
  const loc=LOCATIONS.get(metro.rank);
  const place=await geocode(loc);
  const params=new URLSearchParams({
    latitude:String(place.latitude),longitude:String(place.longitude),
    start_date:START_DATE,end_date:END_DATE,
    daily:'temperature_2m_max,precipitation_sum,sunshine_duration',
    temperature_unit:'fahrenheit',timezone:'auto',models:'era5_land'
  });
  const url='https://archive-api.open-meteo.com/v1/archive?'+params;
  const result=await jsonGet(url);
  const daily=result.daily;
  if(!daily?.time || !daily.temperature_2m_max || !daily.precipitation_sum || !daily.sunshine_duration) throw new Error('Missing daily values');
  let good=0, valid=0;
  for(let i=0;i<daily.time.length;i++) {
    const temp=daily.temperature_2m_max[i], rain=daily.precipitation_sum[i],sun=daily.sunshine_duration[i];
    if(!Number.isFinite(temp)||!Number.isFinite(rain)||!Number.isFinite(sun)) continue;
    valid++;
    if(temp>=GOOD_MIN_F && temp<=GOOD_MAX_F && rain<MAX_PRECIP_MM && sun>=MIN_SUNSHINE_SECONDS) good++;
  }
  if(valid<3600) throw new Error(`Insufficient historical coverage (${valid} days)`);
  return {
    rank:metro.rank, metro:metro.metro,
    good_weather_days:Number((good/N_YEARS).toFixed(1)),
    representative_city:`${place.name}, ${loc.state}`,
    latitude:place.latitude,longitude:place.longitude,
    years:'2015–2024',observed_days:valid,
    definition:'High 60–85 F; precip <0.254 mm; sunshine >=2 hours',
    source:'Open-Meteo ERA5-Land historical reanalysis',
    source_url:'https://open-meteo.com/en/docs/historical-weather-api'
  };
}
function renderWeatherStatus(results) {
  const n=METROS.filter(m=>results[m.rank]?.good_weather_days!==undefined).length;
  $('weather-progress').value=n;
  $('weather-status').textContent=`${n}/100 metro weather records ready`;
  $('weather-download').disabled=n!==100;
}
let weatherCache = readSavedWeather();
let weatherBusy=false;
async function generateWeather() {
  if(weatherBusy)return; weatherBusy=true; $('weather-run').disabled=true;
  const results=weatherCache; const pending=METROS.filter(m=>!Number.isFinite(results[m.rank]?.good_weather_days));
  log(`Starting historical weather: ${pending.length} metros remaining. The process can be resumed.`);
  const errors=[];let cursor=0;
  async function worker(){
    while(cursor<pending.length){
      const metro=pending[cursor++];
      try{
        const record=await weatherFor(metro);
        results[metro.rank]=record;storeWeather(results);renderWeatherStatus(results);
        log(`#${metro.rank} ${metro.metro}: ${record.good_weather_days} days/year`);
      }catch(error){errors.push(`${metro.metro}: ${error.message}`); log(`Could not calculate ${metro.metro}: ${error.message}`,'error');}
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  weatherBusy=false;$('weather-run').disabled=false;
  renderWeatherStatus(results);
  if(errors.length)log(`${errors.length} requests failed. Click Generate again to retry missing metros.`, 'error');
  else log('All weather records complete. Download city-good-weather-days.csv!', 'success');
}
function downloadWeather() {
  const data=weatherCache;
  if(METROS.some(m=>!Number.isFinite(data[m.rank]?.good_weather_days)))return alert('Finish the 100 weather records first.');
  const columns=['rank','metro','good_weather_days','representative_city','latitude','longitude','years','observed_days','definition','source','source_url'];
  saveCsv('city-good-weather-days.csv',columns,METROS.map(m=>data[m.rank]));
}
// Fast, line-by-line CSV reader for the full (large) EPA source, without external dependencies.
function parseCsvRow(line) {
  const cells=[];let field='',quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){if(quoted&&line[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(ch===','&&!quoted){cells.push(field);field='';}
    else field+=ch;
  }
  cells.push(field);return cells;
}
const EPA_ALIASES = {57:['Urban Honolulu','Honolulu'],74:['Boise City','Boise'],84:['Kiryas Joel','Poughkeepsie','Newburgh'],85:['Winston-Salem'],43:['Louisville','Louisville/Jefferson County']};
function metroAliases(m) {
  if(EPA_ALIASES[m.rank])return EPA_ALIASES[m.rank];
  return [LOCATIONS.get(m.rank).city];
}
function chooseCbsa(metro,groups) {
  const {state}=LOCATIONS.get(metro.rank);
  const stateName=STATES[state];
  const wanted=metroAliases(metro).map(clean);
  const matches=groups.filter(g=>{
    const label=String(g.name||'');
    const text=clean(label.split(',')[0]);
    const suffix=label.includes(',')?label.slice(label.lastIndexOf(',')+1):'';
    // Identify the metro by its principal city + state, not just an arbitrary name substring.
    const stateCodes=(suffix.match(/\b[A-Z]{2}\b/g)||[]);
    if(!stateCodes.includes(state)) return false;
    return wanted.some(w=>text===w||text.startsWith(w+' '));
  });
  if(matches.length===1)return matches[0];
  if(matches.length>1) throw new Error(`Ambiguous EPA match for ${metro.metro}: ${matches.map(g=>g.name).join(' | ')}`);
  throw new Error(`No EPA CBSA match for ${metro.metro} (expected ${stateName}; check legacy CBSA names)`);
}
let walkabilityRows=null;
async function aggregateWalkability(file) {
  const reader=file.stream().getReader(),decoder=new TextDecoder('utf-8');
  let pending='',head=null,index={},groups=new Map(),rowCount=0,used=0;
  function processLine(line){
    if(!line.trim())return;
    const cols=parseCsvRow(line.replace(/\r$/,''));
    if(!head){head=cols.map(x=>x.replace(/^\uFEFF/,'').trim().toUpperCase());
      for(const field of ['CBSA','CBSA_NAME','TOTPOP','NATWALKIND']) {
        const ix=head.indexOf(field);if(ix<0)throw new Error(`EPA CSV missing required column ${field}. Upload the official 2021 Smart Location Database CSV.`);
        index[field]=ix;
      }return;
    }
    rowCount++;
    const cbsa=cols[index.CBSA]?.trim();if(!cbsa)return;
    const population=Number(cols[index.TOTPOP]);const score=Number(cols[index.NATWALKIND]);
    if(!(population>0 && score>=1 && score<=20))return;
    used++;
    let r=groups.get(cbsa);
    if(!r){r={cbsa,name:cols[index.CBSA_NAME]?.trim()||'',weighted:0,population:0,groups:0};groups.set(cbsa,r);}
    r.weighted+=population*score;r.population+=population;r.groups++;
  }
  while(true){
    const {value,done}=await reader.read();if(done)break;
    pending+=decoder.decode(value,{stream:true});
    let p;
    while((p=pending.indexOf('\n'))!==-1){processLine(pending.slice(0,p));pending=pending.slice(p+1);}
    if(rowCount && rowCount%30000===0) $('epa-status').textContent=`Reading EPA file: ${rowCount.toLocaleString()} block groups…`;
  }
  pending+=decoder.decode();if(pending.trim())processLine(pending);
  const collection=[...groups.values()].filter(g=>g.population>0);
  const rows=[];const misses=[];
  for(const metro of METROS){
    try{
      const group=chooseCbsa(metro,collection);
      rows.push({rank:metro.rank,metro:metro.metro,walk_score:Number((group.weighted/group.population).toFixed(3)),
        epa_cbsa:group.cbsa,epa_cbsa_name:group.name,population_weight:group.population,
        data_year:'EPA 2021; 2018 population weights',definition:'Population-weighted EPA National Walkability Index (1–20; NOT Walk Score)',
        source:'U.S. Environmental Protection Agency National Walkability Index',
        source_url:'https://www.epa.gov/smartgrowth/smart-location-mapping'});
    }catch(e){misses.push(e.message);}
  }
  return {rows,misses,rowCount,used,cbsaCount:groups.size};
}
async function processEpa(){
  const file=$('epa-file').files?.[0];
  if(!file){alert('Download the EPA Smart Location Database CSV and select that file first.');return;}
  $('epa-run').disabled=true;walkabilityRows=null;$('walk-download').disabled=true;
  $('epa-status').textContent='Reading EPA census block group CSV…';
  try{
    const r=await aggregateWalkability(file);
    log(`EPA: read ${r.rowCount.toLocaleString()} block groups (${r.used.toLocaleString()} scored), ${r.cbsaCount} CBSAs; matched ${r.rows.length}/100 metros.`);
    for(const msg of r.misses)log(msg,'error');
    if(r.rows.length===100){walkabilityRows=r.rows; $('walk-download').disabled=false;$('epa-status').textContent='100/100 metros matched! Download city-walkability.csv.';log('All EPA walkability records are ready.','success');}
    else{$('epa-status').textContent=`${r.rows.length}/100 matched. See errors below. No incomplete CSV will be produced.`;}
  }catch(e){$('epa-status').textContent=`Error: ${e.message}`;log(e.message,'error');}
  $('epa-run').disabled=false;
}
function downloadWalkability(){
  if(!walkabilityRows||walkabilityRows.length!==100)return;
  const cols=['rank','metro','walk_score','epa_cbsa','epa_cbsa_name','population_weight','data_year','definition','source','source_url'];
  saveCsv('city-walkability.csv',cols,walkabilityRows);
}
$('weather-run').addEventListener('click',generateWeather);
$('weather-download').addEventListener('click',downloadWeather);
$('epa-run').addEventListener('click',processEpa);
$('walk-download').addEventListener('click',downloadWalkability);
$('weather-reset').addEventListener('click',()=>{
  if(confirm('Clear all completed weather records?')){weatherCache={};try{localStorage.removeItem(WEATHER_STORE);}catch{}renderWeatherStatus(weatherCache);}
});
renderWeatherStatus(weatherCache);
