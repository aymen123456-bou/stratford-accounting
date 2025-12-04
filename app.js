const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1582719471370-1e27c72b0103?fit=crop&w=1400&q=80",
];

const form = document.getElementById("dimension-form");
const resultsSection = document.getElementById("results");
const inputSummary = document.getElementById("input-summary");
const outputSummary = document.getElementById("output-summary");
const newRequestBtn = document.getElementById("new-request");
const statusBadge = document.getElementById("result-status");

const carouselImage = document.getElementById("carousel-image");
const prevBtn = document.getElementById("prev-image");
const nextBtn = document.getElementById("next-image");
const dotContainer = document.getElementById("carousel-dots");
const exploreBtn = document.getElementById("explore-gallery");

let carouselIndex = 0;

function initCarousel() {
  HERO_IMAGES.forEach((_, idx) => {
    const dot = document.createElement("button");
    dot.addEventListener("click", () => updateCarousel(idx));
    dotContainer.appendChild(dot);
  });
  prevBtn.addEventListener("click", () => updateCarousel((carouselIndex - 1 + HERO_IMAGES.length) % HERO_IMAGES.length));
  nextBtn.addEventListener("click", () => updateCarousel((carouselIndex + 1) % HERO_IMAGES.length));
  exploreBtn.addEventListener("click", () => updateCarousel((carouselIndex + 1) % HERO_IMAGES.length));
  updateCarousel(0);
}

function updateCarousel(idx) {
  carouselIndex = idx;
  carouselImage.src = HERO_IMAGES[idx];
  dotContainer.querySelectorAll("button").forEach((button, buttonIdx) => {
    button.classList.toggle("active", buttonIdx === idx);
    button.setAttribute("aria-label", `Aller à l'image ${buttonIdx + 1}`);
  });
}

function formatNumber(value, digits = 2) {
  return Number.parseFloat(value).toFixed(digits);
}

function computeResults(data) {
  const g = 9.81;
  const pressurePa = data.pressionMax * 1e5;
  const qCalc = data.chargeUtile * data.coefficientSecurite;
  const fCharge = qCalc * g;
  const fVerin = fCharge / Math.max(1, data.nombreEtages);
  const sVerin = fVerin / pressurePa;
  const dVerin = Math.sqrt((4 * sVerin) / Math.PI);
  const cVerin = data.longueurBras * Math.sin((data.angleMinBras * Math.PI) / 180);
  const vVerin = sVerin * cVerin;
  const tMontee = data.hauteurMax / Math.max(data.vitesseMontee, 0.001);
  const qPompe = vVerin / Math.max(tMontee, 0.001);
  const pHyd = pressurePa * qPompe;
  const pMoteur = pHyd / Math.max(data.rendementHydraulique, 0.01);
  const mMax = fCharge * data.longueurBras;
  const wMin = sVerin * cVerin * 1.2;
  const mTotal = (data.masseVolumique * data.longueurBras * data.nombreEtages) / 10;

  return {
    qCalc,
    fCharge,
    fVerin,
    sVerin,
    dVerin,
    cVerin,
    vVerin,
    qPompe,
    tMontee,
    pHyd,
    pMoteur,
    pMoteurKw: pMoteur / 1000,
    mMax,
    wMin,
    mTotal,
  };
}

function renderSummary(container, entries) {
  container.innerHTML = "";
  entries.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    container.append(dt, dd);
  });
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const numericFields = [
    "hauteurMin",
    "hauteurMax",
    "chargeUtile",
    "coefficientSecurite",
    "longueurBras",
    "angleMinBras",
    "distancePivotAncrage",
    "nombreEtages",
    "contrainteAdmissible",
    "moduleYoung",
    "masseVolumique",
    "pressionMax",
    "vitesseMontee",
    "rendementHydraulique",
  ];

  numericFields.forEach((field) => {
    payload[field] = parseFloat(payload[field]);
  });

  const outputs = computeResults(payload);

  renderSummary(inputSummary, [
    ["Entreprise", payload.nomEntreprise || "—"],
    ["Contact", payload.nomContact || "—"],
    ["Email", payload.email || "—"],
    ["Téléphone", payload.telephone || "—"],
    ["H min", `${payload.hauteurMin} m`],
    ["H max", `${payload.hauteurMax} m`],
    ["Charge utile", `${payload.chargeUtile} kg`],
    ["Nb étages", payload.nombreEtages],
    ["Angle min", `${payload.angleMinBras} °`],
  ]);

  renderSummary(outputSummary, [
    ["Q calculée", `${formatNumber(outputs.qCalc, 1)} kg`],
    ["F charge", `${formatNumber(outputs.fCharge)} N`],
    ["F vérin", `${formatNumber(outputs.fVerin)} N`],
    ["Surface vérin", `${formatNumber(outputs.sVerin, 6)} m²`],
    ["Diamètre vérin", `${formatNumber(outputs.dVerin, 4)} m`],
    ["Course vérin", `${formatNumber(outputs.cVerin, 3)} m`],
    ["Volume vérin", `${formatNumber(outputs.vVerin, 5)} m³`],
    ["Débit pompe", `${formatNumber(outputs.qPompe, 6)} m³/s`],
    ["Temps montée", `${formatNumber(outputs.tMontee, 2)} s`],
    ["Puissance hyd.", `${formatNumber(outputs.pHyd)} W`],
    ["Puissance moteur", `${formatNumber(outputs.pMoteur)} W`],
    ["Puissance moteur", `${formatNumber(outputs.pMoteurKw, 2)} kW`],
    ["Moment max", `${formatNumber(outputs.mMax)} N·m`],
    ["Volume mini", `${formatNumber(outputs.wMin, 5)} m³`],
    ["Masse totale", `${formatNumber(outputs.mTotal, 2)} kg`],
  ]);

  statusBadge.textContent = "Calcul prêt à partager";
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth" });
});

newRequestBtn?.addEventListener("click", () => {
  form.reset();
  resultsSection.hidden = true;
  statusBadge.textContent = "Calcul enregistré";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

initCarousel();
