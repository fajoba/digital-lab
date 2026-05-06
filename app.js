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