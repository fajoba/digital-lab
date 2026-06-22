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
  cystoscopyUreteralStent: 4.74, // 52332
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
    getNumber("cystoscopyUreteralStent") * rvuAssumptions.cystoscopyUreteralStent +
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
const resetCityGameBtn = document.getElementById("reset-city-game-btn");
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

if (resetCityGameBtn) {
  resetCityGameBtn.addEventListener("click", resetCityGame);
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

function resetCityGame() {
  const shouldReset = confirm("Reset all city rankings and matchup history?");

  if (!shouldReset) {
    return;
  }

  cityGameState = createDefaultCityGameState();
  currentCityMatchup = null;
  saveCityGameState();

  cityAStats.textContent = "Click “Start Matchup” to begin.";
  cityBStats.textContent = "Click “Start Matchup” to begin.";

  chooseCityABtn.disabled = true;
  chooseCityBBtn.disabled = true;

  cityResults.classList.add("hidden");
  cityResults.innerHTML = "";

  cityGameStatus.className = "empty-state";
  cityGameStatus.textContent = "Rankings reset. No matchups completed yet.";
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// BrainSpace 

const BRAINSPACE_STORAGE_KEY = "brainspace.v1";

let brainspaceItems = loadBrainspaceItems();

const brainspaceNameInput = document.getElementById("brainspace-name");
const brainspacePercentInput = document.getElementById("brainspace-percent");
const addBrainspaceItemBtn = document.getElementById("add-brainspace-item-btn");
const brainspaceTotal = document.getElementById("brainspace-total");
const brainspaceList = document.getElementById("brainspace-list");

if (addBrainspaceItemBtn) {
  addBrainspaceItemBtn.addEventListener("click", addBrainspaceItem);
  renderBrainspace();
}

if (brainspaceList) {
  brainspaceList.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const itemId = button.dataset.brainspaceId;
    const action = button.dataset.brainspaceAction;

    if (!itemId || !action) {
      return;
    }

    if (action === "remove") {
      removeBrainspaceItem(itemId);
    }

    if (action === "increase") {
      changeBrainspacePercent(itemId, 5);
    }

    if (action === "decrease") {
      changeBrainspacePercent(itemId, -5);
    }
  });
}

function loadBrainspaceItems() {
  const saved = localStorage.getItem(BRAINSPACE_STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveBrainspaceItems() {
  localStorage.setItem(BRAINSPACE_STORAGE_KEY, JSON.stringify(brainspaceItems));
}

function addBrainspaceItem() {
  const name = brainspaceNameInput.value.trim();
  const percent = Number(brainspacePercentInput.value) || 0;
  const currentTotal = getBrainspaceTotal();

  if (!name) {
    alert("Add something that is taking up brainspace.");
    return;
  }

  if (percent <= 0) {
    alert("Brainspace percent must be greater than 0.");
    return;
  }

  if (currentTotal + percent > 100) {
    alert(`You only have ${100 - currentTotal}% brainspace remaining. Reduce something else first.`);
    return;
  }

  brainspaceItems.push({
    id: `brainspace-${Date.now()}`,
    name,
    percent
  });

  saveBrainspaceItems();

  brainspaceNameInput.value = "";
  brainspacePercentInput.value = 10;

  renderBrainspace();
}

function getBrainspaceTotal() {
  return brainspaceItems.reduce((sum, item) => sum + item.percent, 0);
}

function renderBrainspace() {
  if (!brainspaceTotal || !brainspaceList) {
    return;
  }

  const total = getBrainspaceTotal();
  const remaining = 100 - total;

  brainspaceTotal.textContent = `${total}% allocated · ${remaining}% remaining`;

  if (total === 100) {
    brainspaceTotal.textContent = "100% allocated. Your current mental bandwidth is fully mapped.";
  }

brainspaceList.innerHTML = brainspaceItems
  .map((item) => {
    return `
      <div class="brainspace-item">
        <div class="brainspace-item-topline">
          <span>${escapeHtml(item.name)}</span>
          <span>${item.percent}%</span>
        </div>

        <div class="brainspace-bar-track">
          <div class="brainspace-bar-fill" style="width: ${item.percent}%"></div>
        </div>

       <div class="brainspace-actions">
        <button
          class="small-button"
          type="button"
          data-brainspace-action="decrease"
          data-brainspace-id="${item.id}"
        >
          -5
        </button>

        <button
          class="small-button"
          type="button"
          data-brainspace-action="increase"
          data-brainspace-id="${item.id}"
        >
          +5
        </button>

         <button
          class="small-button danger-button"
          type="button"
          data-brainspace-action="remove"
          data-brainspace-id="${item.id}"
        >
          Remove
        </button>
        </div>
      </div>
    `;
  })
  .join("");
}

function removeBrainspaceItem(itemId) {
  brainspaceItems = brainspaceItems.filter((item) => item.id !== itemId);
  saveBrainspaceItems();
  renderBrainspace();
}

function changeBrainspacePercent(itemId, amount) {
  const item = brainspaceItems.find((brainspaceItem) => {
    return brainspaceItem.id === itemId;
  });

  if (!item) {
    return;
  }

  const currentTotal = getBrainspaceTotal();
  const newItemPercent = item.percent + amount;
  const newTotal = currentTotal + amount;

  if (newItemPercent < 0) {
    return;
  }

  if (newTotal > 100) {
    alert("You do not have enough remaining brainspace.");
    return;
  }

  item.percent = newItemPercent;

  if (item.percent === 0) {
    brainspaceItems = brainspaceItems.filter((brainspaceItem) => {
      return brainspaceItem.id !== itemId;
    });
  }

  saveBrainspaceItems();
  renderBrainspace();
}

const SURGEONSTATS_STORAGE_KEY = "surgeonStats.v1";

let surgeonStatsCases = loadSurgeonStatsCases();

const surgeonStatsDateInput = document.getElementById("surgeonstats-date");
const surgeonStatsCaseTypeInput = document.getElementById("surgeonstats-case-type");
const surgeonStatsOpTimeInput = document.getElementById("surgeonstats-op-time");
const surgeonStatsMarginStatusInput = document.getElementById("surgeonstats-margin-status");
const addSurgeonStatsCaseBtn = document.getElementById("add-surgeonstats-case-btn");
const surgeonStatsSummary = document.getElementById("surgeonstats-summary");
const surgeonStatsList = document.getElementById("surgeonstats-list");

if (addSurgeonStatsCaseBtn) {
  addSurgeonStatsCaseBtn.addEventListener("click", addSurgeonStatsCase);
  renderSurgeonStats();
}

if (surgeonStatsList) {
  surgeonStatsList.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const caseId = button.dataset.surgeonstatsId;

    if (!caseId) {
      return;
    }

    removeSurgeonStatsCase(caseId);
  });
}

function loadSurgeonStatsCases() {
  const saved = localStorage.getItem(SURGEONSTATS_STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveSurgeonStatsCases() {
  localStorage.setItem(SURGEONSTATS_STORAGE_KEY, JSON.stringify(surgeonStatsCases));
}

function addSurgeonStatsCase() {
  const date = surgeonStatsDateInput.value;
  const caseType = surgeonStatsCaseTypeInput.value;
  const operativeTime = Number(surgeonStatsOpTimeInput.value) || 0;
  const marginStatus = surgeonStatsMarginStatusInput.value;

  if (!date) {
    alert("Add a case date.");
    return;
  }

  if (!caseType) {
    alert("Choose a case type.");
    return;
  }

  if (operativeTime <= 0) {
    alert("Add an operative time greater than 0 minutes.");
    return;
  }

  if (!marginStatus) {
    alert("Choose a margin status.");
    return;
  }

  function removeSurgeonStatsCase(caseId) {
  const shouldRemove = confirm("Remove this case from SurgeonStats?");

  if (!shouldRemove) {
    return;
  }

  surgeonStatsCases = surgeonStatsCases.filter((item) => item.id !== caseId);
  saveSurgeonStatsCases();
  renderSurgeonStats();
}

  surgeonStatsCases.unshift({
    id: `surgeonstats-${Date.now()}`,
    date,
    caseType,
    operativeTime,
    marginStatus
  });

  saveSurgeonStatsCases();

  surgeonStatsDateInput.value = "";
  surgeonStatsCaseTypeInput.value = "";
  surgeonStatsOpTimeInput.value = 0;
  surgeonStatsMarginStatusInput.value = "";

  renderSurgeonStats();
}

function renderSurgeonStats() {
  if (!surgeonStatsSummary || !surgeonStatsList) {
    return;
  }

  if (!surgeonStatsCases.length) {
    surgeonStatsSummary.className = "empty-state";
    surgeonStatsSummary.textContent = "No cases logged yet.";
    surgeonStatsList.innerHTML = "";
    return;
  }

  const totalCases = surgeonStatsCases.length;
  const averageOpTime = surgeonStatsCases.reduce((sum, item) => {
    return sum + item.operativeTime;
  }, 0) / totalCases;

  const marginStatsByCaseType = {};

  surgeonStatsCases.forEach((item) => {
    if (!marginStatsByCaseType[item.caseType]) {
      marginStatsByCaseType[item.caseType] = {
        positive: 0,
        eligible: 0
      };
    }

    if (item.marginStatus === "Positive" || item.marginStatus === "Negative") {
      marginStatsByCaseType[item.caseType].eligible += 1;
    }

    if (item.marginStatus === "Positive") {
      marginStatsByCaseType[item.caseType].positive += 1;
    }
  });

  const opTimeStatsByCaseType = {};

  surgeonStatsCases.forEach((item) => {
    if (!opTimeStatsByCaseType[item.caseType]) {
      opTimeStatsByCaseType[item.caseType] = {
        totalOpTime: 0,
        count: 0
      };
    }

    opTimeStatsByCaseType[item.caseType].totalOpTime += item.operativeTime;
    opTimeStatsByCaseType[item.caseType].count += 1;
  });

const marginRateHtml = Object.entries(marginStatsByCaseType)
  .map(([caseType, stats]) => {
    if (stats.eligible === 0) {
      return `<li>${escapeHtml(caseType)}: no final margin data yet</li>`;
    }

    const rate = Math.round((stats.positive / stats.eligible) * 100);

    return `<li>${escapeHtml(caseType)}: ${stats.positive}/${stats.eligible} positive (${rate}%)</li>`;
  })
  .join("");

const opTimeHtml = Object.entries(opTimeStatsByCaseType)
  .map(([caseType, stats]) => {
    const averageOpTimeForCaseType = stats.totalOpTime / stats.count;

    return `<li>${escapeHtml(caseType)}: ${averageOpTimeForCaseType.toFixed(0)} min average</li>`;
  })
  .join("");

surgeonStatsSummary.className = "result-box";
surgeonStatsSummary.innerHTML = `
  <p>
    <strong>${totalCases}</strong> cases logged ·
    <strong>Overall average op time:</strong> ${averageOpTime.toFixed(0)} min
  </p>

  <p><strong>Average op time by case type:</strong></p>
  <ul>${opTimeHtml}</ul>

  <p><strong>Positive margin rate by case type:</strong></p>
  <ul>${marginRateHtml}</ul>
`;

  surgeonStatsList.innerHTML = surgeonStatsCases
  .map((item) => {
    return `
      <div class="surgeonstats-case">
        <div class="surgeonstats-case-topline">
          <span>${escapeHtml(item.caseType)}</span>
          <span>${formatSimpleDate(item.date)}</span>
        </div>

        <div class="surgeonstats-case-meta">
          Op time: ${item.operativeTime} min · Margin: ${escapeHtml(item.marginStatus)}
        </div>

        <button
          class="small-button danger-button"
          type="button"
          data-surgeonstats-id="${item.id}"
        >
          Remove
        </button>
      </div>
    `;
  })
  .join("");
}

function formatSimpleDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// render();