const mantras = [
  { 
    text: "Quiet ego. Sharp work.",
    image: "images/diamond.jpeg"
  },
  {
    text: "Stack small wins.",
    image: "images/stack.jpeg"
  },
  {
    text: "Slow is smooth. Smooth is fast.",
    image: "images/slow.png"
  },
  {
    text: "If you are going to be a bear, be a grizzly bear.",
    image: "images/grizzly.png"
  }
];

function generateMantra() {
  const randomIndex = Math.floor(Math.random() * mantras.length);
  const selected = mantras[randomIndex];

  const img = document.getElementById("mantraImage");

  document.getElementById("mantra").textContent = selected.text;
  img.src = selected.image;
  img.style.display = "block";
}

const rvuAssumptions = {
  // CLINIC
  // New visits: 70% 99204, 30% 99205, plus G2211
  newVisits: ((0.7 * 2.60) + (0.3 * 3.50)) + 0.33,

  // Follow-ups: 70% 99214, 30% 99215, plus G2211
  followUps: ((0.7 * 1.92) + (0.3 * 2.80)) + 0.33,

  // Cystoscopy: 52000 + 90% separately billable 99214
  // No G2211 when billed with modifier -25 E/M
  cystos: 1.49 + (0.9 * 1.92),

  // INPATIENT
  newConsults: 2.60,      // 99222
  followConsults: 1.59,   // 99232

  // OPERATING ROOM
  turbtSmall: 4.50,              // 52234
  turbtMedium: 5.30,             // 52235
  turbtLarge: 7.31,              // 52240
  radicalNeph: 24.43,            // 50545
  partialNeph: 26.72,            // 50543
  cystectomy: 40.29,             // 51595
  prostatectomy: 27.41,          // 55869
  nephroureterectomy: 24.73,     // 50548
  ureteroscopyLaser: 7.80,       // 52356
  pcnlSmall: 12.10,              // 50080
  pcnlLarge: 20.39,              // 50081
  laserEnucleation: 12.68        // 52649
};

function getNumber(id) {
  return Number(document.getElementById(id).value) || 0;
}

function calculateDailyRVUs() {
  const clinic =
    getNumber("newVisits") * rvuAssumptions.newVisits +
    getNumber("followUps") * rvuAssumptions.followUps +
    getNumber("cystos") * rvuAssumptions.cystos;

  const inpatient =
    getNumber("newConsults") * rvuAssumptions.newConsults +
    getNumber("followConsults") * rvuAssumptions.followConsults;

  const operatingRoom =
    getNumber("turbtSmall") * rvuAssumptions.turbtSmall +
    getNumber("turbtMedium") * rvuAssumptions.turbtMedium +
    getNumber("turbtLarge") * rvuAssumptions.turbtLarge +
    getNumber("radicalNeph") * rvuAssumptions.radicalNeph +
    getNumber("partialNeph") * rvuAssumptions.partialNeph +
    getNumber("cystectomy") * rvuAssumptions.cystectomy +
    getNumber("prostatectomy") * rvuAssumptions.prostatectomy +
    getNumber("nephroureterectomy") * rvuAssumptions.nephroureterectomy +
    getNumber("ureteroscopyLaser") * rvuAssumptions.ureteroscopyLaser +
    getNumber("pcnlSmall") * rvuAssumptions.pcnlSmall +
    getNumber("pcnlLarge") * rvuAssumptions.pcnlLarge +
    getNumber("laserEnucleation") * rvuAssumptions.laserEnucleation;

  const total = clinic + inpatient + operatingRoom;
  
  document.getElementById("dailyRVUResult").innerHTML = `
    <strong>Estimated Daily RVUs: ${total.toFixed(1)}</strong><br>
    Clinic: ${clinic.toFixed(1)}<br>
    Inpatient: ${inpatient.toFixed(1)}<br>
    Operating Room: ${operatingRoom.toFixed(1)}
  `;
}

const CITY_GAME_STORAGE_KEY = "cityFitGame.v1";

const cityDatabase = [
  {
    id: "new-york",
    name: "New York City",
    population: "8.3M",
    metroPopulation: "19.6M",
    medianHomePrice: "$760k",
    medianIncome: "$78k",
    walkScore: 88,
    transitScore: 89,
    density: "Very high",
    climate: "Four seasons, humid summers",
    vibe: "Dense, global, high-energy"
  },
  {
    id: "chicago",
    name: "Chicago",
    population: "2.7M",
    metroPopulation: "9.4M",
    medianHomePrice: "$330k",
    medianIncome: "$74k",
    walkScore: 77,
    transitScore: 65,
    density: "High",
    climate: "Cold winters, warm summers",
    vibe: "Urban, architectural, lakefront"
  },
  {
    id: "los-angeles",
    name: "Los Angeles",
    population: "3.8M",
    metroPopulation: "12.8M",
    medianHomePrice: "$950k",
    medianIncome: "$76k",
    walkScore: 69,
    transitScore: 53,
    density: "Medium-high",
    climate: "Mediterranean, sunny",
    vibe: "Creative, sprawling, glamorous"
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    population: "810k",
    metroPopulation: "4.6M",
    medianHomePrice: "$1.3M",
    medianIncome: "$136k",
    walkScore: 89,
    transitScore: 77,
    density: "Very high",
    climate: "Cool, foggy, mild",
    vibe: "Compact, tech-heavy, scenic"
  },
  {
    id: "washington-dc",
    name: "Washington DC",
    population: "680k",
    metroPopulation: "6.3M",
    medianHomePrice: "$640k",
    medianIncome: "$101k",
    walkScore: 77,
    transitScore: 69,
    density: "High",
    climate: "Humid subtropical, four seasons",
    vibe: "Educated, political, international"
  },
  {
    id: "boston",
    name: "Boston",
    population: "650k",
    metroPopulation: "4.9M",
    medianHomePrice: "$780k",
    medianIncome: "$89k",
    walkScore: 83,
    transitScore: 72,
    density: "High",
    climate: "Cold winters, mild summers",
    vibe: "Academic, historic, compact"
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    population: "1.6M",
    metroPopulation: "6.2M",
    medianHomePrice: "$270k",
    medianIncome: "$60k",
    walkScore: 75,
    transitScore: 67,
    density: "High",
    climate: "Four seasons",
    vibe: "Historic, gritty, affordable urbanism"
  },
  {
    id: "seattle",
    name: "Seattle",
    population: "750k",
    metroPopulation: "4.0M",
    medianHomePrice: "$850k",
    medianIncome: "$116k",
    walkScore: 74,
    transitScore: 60,
    density: "Medium-high",
    climate: "Mild, rainy, green",
    vibe: "Tech, outdoorsy, intellectual"
  },
  {
    id: "denver",
    name: "Denver",
    population: "710k",
    metroPopulation: "3.0M",
    medianHomePrice: "$590k",
    medianIncome: "$85k",
    walkScore: 61,
    transitScore: 45,
    density: "Medium",
    climate: "Dry, sunny, four seasons",
    vibe: "Outdoorsy, growing, casual"
  },
  {
    id: "columbus",
    name: "Columbus",
    population: "910k",
    metroPopulation: "2.2M",
    medianHomePrice: "$290k",
    medianIncome: "$67k",
    walkScore: 41,
    transitScore: 31,
    density: "Medium-low",
    climate: "Four seasons, Midwest",
    vibe: "University/state capital, growing, practical"
  },
  {
    id: "austin",
    name: "Austin",
    population: "980k",
    metroPopulation: "2.5M",
    medianHomePrice: "$540k",
    medianIncome: "$89k",
    walkScore: 42,
    transitScore: 35,
    density: "Medium-low",
    climate: "Hot, sunny, mild winters",
    vibe: "Tech, music, energetic growth"
  },
  {
    id: "miami",
    name: "Miami",
    population: "450k",
    metroPopulation: "6.1M",
    medianHomePrice: "$590k",
    medianIncome: "$60k",
    walkScore: 77,
    transitScore: 57,
    density: "High",
    climate: "Tropical, hot, humid",
    vibe: "International, coastal, flashy"
  }
];

let cityGameState = loadCityGameState();
let currentCityMatchup = null;

const cityAStats = document.getElementById("city-a-stats");
const cityBStats = document.getElementById("city-b-stats");
const chooseCityABtn = document.getElementById("choose-city-a-btn");
const chooseCityBBtn = document.getElementById("choose-city-b-btn");
const startCityMatchupBtn = document.getElementById("start-city-matchup-btn");
const showCityResultsBtn = document.getElementById("show-city-results-btn");
const cityGameStatus = document.getElementById("city-game-status");
const cityResults = document.getElementById("city-results");

if (startCityMatchupBtn) {
  startCityMatchupBtn.addEventListener("click", startCityMatchup);
}

if (chooseCityABtn) {
  chooseCityABtn.addEventListener("click", () => {
    chooseCityWinner("A");
  });
}

if (chooseCityBBtn) {
  chooseCityBBtn.addEventListener("click", () => {
    chooseCityWinner("B");
  });
}

if (showCityResultsBtn) {
  showCityResultsBtn.addEventListener("click", showCityResults);
}

function loadCityGameState() {
  const saved = localStorage.getItem(CITY_GAME_STORAGE_KEY);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return createDefaultCityGameState();
    }
  }

  return createDefaultCityGameState();
}

function createDefaultCityGameState() {
  return {
    scores: cityDatabase.reduce((scores, city) => {
      scores[city.id] = 1000;
      return scores;
    }, {}),
    matchupsCompleted: 0
  };
}

function saveCityGameState() {
  localStorage.setItem(CITY_GAME_STORAGE_KEY, JSON.stringify(cityGameState));
}

function startCityMatchup() {
  const cityA = getRandomCity();
  let cityB = getRandomCity();

  while (cityB.id === cityA.id) {
    cityB = getRandomCity();
  }

  currentCityMatchup = {
    cityA,
    cityB
  };

  renderCityStats(cityAStats, cityA);
  renderCityStats(cityBStats, cityB);

  chooseCityABtn.disabled = false;
  chooseCityBBtn.disabled = false;

  cityResults.classList.add("hidden");
  cityGameStatus.className = "empty-state";
  cityGameStatus.textContent = `${cityGameState.matchupsCompleted} matchups completed.`;
}

function getRandomCity() {
  const randomIndex = Math.floor(Math.random() * cityDatabase.length);
  return cityDatabase[randomIndex];
}

function renderCityStats(container, city) {
  container.innerHTML = `
    <div class="city-stat-row">
      <span class="city-stat-label">Population</span>
      <span>${escapeHtml(city.population)}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Metro population</span>
      <span>${escapeHtml(city.metroPopulation)}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Median home price</span>
      <span>${escapeHtml(city.medianHomePrice)}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Median income</span>
      <span>${escapeHtml(city.medianIncome)}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Walk score</span>
      <span>${city.walkScore}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Transit score</span>
      <span>${city.transitScore}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Density</span>
      <span>${escapeHtml(city.density)}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Climate</span>
      <span>${escapeHtml(city.climate)}</span>
    </div>

    <div class="city-stat-row">
      <span class="city-stat-label">Vibe</span>
      <span>${escapeHtml(city.vibe)}</span>
    </div>
  `;
}

function chooseCityWinner(choice) {
  if (!currentCityMatchup) {
    return;
  }

  const winner =
    choice === "A" ? currentCityMatchup.cityA : currentCityMatchup.cityB;

  const loser =
    choice === "A" ? currentCityMatchup.cityB : currentCityMatchup.cityA;

  cityGameState.scores[winner.id] += 20;
  cityGameState.scores[loser.id] -= 20;
  cityGameState.matchupsCompleted += 1;

  saveCityGameState();

  cityGameStatus.className = "empty-state";
  cityGameStatus.textContent = `${cityGameState.matchupsCompleted} matchups completed. Last choice saved.`;

  startCityMatchup();
}

function showCityResults() {
  const rankedCities = [...cityDatabase].sort((a, b) => {
    return cityGameState.scores[b.id] - cityGameState.scores[a.id];
  });

  cityResults.classList.remove("hidden");

  cityResults.innerHTML = rankedCities
    .map((city, index) => {
      return `
        <div class="city-result-row">
          <span>${index + 1}. ${escapeHtml(city.name)}</span>
          <span>${cityGameState.scores[city.id]}</span>
        </div>
      `;
    })
    .join("");

  cityGameStatus.className = "empty-state";
  cityGameStatus.textContent = `${cityGameState.matchupsCompleted} matchups completed. Rankings shown below.`;
}

render();