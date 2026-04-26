const soilRuleMap = {
  "clay": ["paddy", "sugarcane", "jute"],
  "loam": ["paddy", "groundnut", "cotton", "maize", "vegetables", "chickpea", "lentil", "coffee"],
  "sandy": ["groundnut", "millets", "watermelon", "cowpea"],
  "black": ["cotton", "chilli", "pigeonpea", "sunflower", "maize"],
  "red": ["groundnut", "millets", "cotton", "maize", "chickpea"],
  "alluvial": ["paddy", "sugarcane", "jute", "maize", "vegetables"],
  "laterite": ["coffee", "coconut", "millets"],
};

const cropProfiles = {
  paddy: {
    label: "Paddy",
    preferredSoils: ["clay", "loam", "alluvial"],
    waterNeed: "high",
    rotationAvoid: ["paddy"],
    rotationPreferred: ["pulses", "groundnut", "millets"],
    npk: { nMin: 60, nMax: 120, pMin: 30, pMax: 60, kMin: 30, kMax: 60 },
    phRange: { min: 5.5, max: 6.5 },
  },
  cotton: {
    label: "Cotton",
    preferredSoils: ["black", "red", "loam"],
    waterNeed: "medium",
    rotationAvoid: ["cotton", "chilli"],
    rotationPreferred: ["pulses", "groundnut", "maize"],
    npk: { nMin: 80, nMax: 160, pMin: 40, pMax: 80, kMin: 40, kMax: 80 },
    phRange: { min: 6.0, max: 7.5 },
  },
  groundnut: {
    label: "Groundnut",
    preferredSoils: ["sandy", "red", "loam"],
    waterNeed: "medium",
    rotationAvoid: ["groundnut", "cotton"],
    rotationPreferred: ["paddy", "millets", "maize"],
    npk: { nMin: 15, nMax: 40, pMin: 30, pMax: 60, kMin: 30, kMax: 60 },
    phRange: { min: 6.0, max: 7.0 },
  },
  maize: {
    label: "Maize",
    preferredSoils: ["loam", "red", "black", "alluvial"],
    waterNeed: "medium",
    rotationAvoid: ["maize"],
    rotationPreferred: ["pulses", "groundnut", "millets"],
    npk: { nMin: 80, nMax: 140, pMin: 40, pMax: 70, kMin: 30, kMax: 60 },
    phRange: { min: 5.8, max: 7.0 },
  },
  millets: {
    label: "Millets",
    preferredSoils: ["sandy", "red", "black", "loam", "laterite"],
    waterNeed: "low",
    rotationAvoid: ["millets"],
    rotationPreferred: ["pulses", "groundnut", "cotton"],
    npk: { nMin: 40, nMax: 90, pMin: 20, pMax: 50, kMin: 20, kMax: 40 },
    phRange: { min: 6.0, max: 7.5 },
  },
  pulses: {
    label: "Pulses",
    preferredSoils: ["loam", "red", "black"],
    waterNeed: "low",
    rotationAvoid: ["pulses"],
    rotationPreferred: ["paddy", "maize", "cotton"],
    npk: { nMin: 10, nMax: 30, pMin: 40, pMax: 80, kMin: 20, kMax: 40 },
    phRange: { min: 6.0, max: 7.5 },
  },
  vegetables: {
    label: "Vegetables",
    preferredSoils: ["loam", "red", "alluvial"],
    waterNeed: "medium",
    rotationAvoid: ["vegetables"],
    rotationPreferred: ["pulses", "millets"],
    npk: { nMin: 80, nMax: 150, pMin: 50, pMax: 100, kMin: 50, kMax: 100 },
    phRange: { min: 6.0, max: 7.0 },
  },
  sugarcane: {
    label: "Sugarcane",
    preferredSoils: ["clay", "loam", "alluvial"],
    waterNeed: "high",
    rotationAvoid: ["sugarcane"],
    rotationPreferred: ["pulses", "groundnut"],
    npk: { nMin: 100, nMax: 180, pMin: 50, pMax: 90, kMin: 50, kMax: 100 },
    phRange: { min: 6.0, max: 7.5 },
  },
  chilli: {
    label: "Chilli",
    preferredSoils: ["black", "loam", "red"],
    waterNeed: "medium",
    rotationAvoid: ["chilli", "cotton"],
    rotationPreferred: ["pulses", "groundnut", "maize"],
    npk: { nMin: 80, nMax: 140, pMin: 40, pMax: 80, kMin: 40, kMax: 80 },
    phRange: { min: 6.0, max: 7.0 },
  },
  sunflower: {
    label: "Sunflower",
    preferredSoils: ["black", "loam", "red"],
    waterNeed: "medium",
    rotationAvoid: ["sunflower"],
    rotationPreferred: ["pulses", "maize", "millets"],
    npk: { nMin: 60, nMax: 120, pMin: 40, pMax: 80, kMin: 40, kMax: 80 },
    phRange: { min: 6.0, max: 7.5 },
  },
  pigeonpea: {
    label: "Pigeon Pea",
    preferredSoils: ["black", "loam", "red"],
    waterNeed: "low",
    rotationAvoid: ["pigeonpea"],
    rotationPreferred: ["paddy", "maize", "millets"],
    npk: { nMin: 15, nMax: 40, pMin: 30, pMax: 60, kMin: 20, kMax: 40 },
    phRange: { min: 6.0, max: 7.5 },
  },
  watermelon: {
    label: "Watermelon",
    preferredSoils: ["sandy", "loam"],
    waterNeed: "medium",
    rotationAvoid: ["watermelon"],
    rotationPreferred: ["pulses", "millets"],
    npk: { nMin: 50, nMax: 100, pMin: 40, pMax: 80, kMin: 60, kMax: 120 },
    phRange: { min: 6.0, max: 7.0 },
  },
  cowpea: {
    label: "Cowpea",
    preferredSoils: ["sandy", "loam", "red"],
    waterNeed: "low",
    rotationAvoid: ["cowpea"],
    rotationPreferred: ["paddy", "maize", "millets"],
    npk: { nMin: 10, nMax: 30, pMin: 30, pMax: 60, kMin: 20, kMax: 40 },
    phRange: { min: 6.0, max: 7.0 },
  },
  jute: {
    label: "Jute",
    preferredSoils: ["clay", "loam", "alluvial"],
    waterNeed: "high",
    rotationAvoid: ["jute"],
    rotationPreferred: ["pulses", "paddy"],
    npk: { nMin: 60, nMax: 120, pMin: 30, pMax: 60, kMin: 30, kMax: 60 },
    phRange: { min: 6.0, max: 7.0 },
  },
  coffee: {
    label: "Coffee",
    preferredSoils: ["loam", "laterite"],
    waterNeed: "medium",
    rotationAvoid: ["coffee"],
    rotationPreferred: ["pulses", "millets"],
    npk: { nMin: 60, nMax: 120, pMin: 30, pMax: 60, kMin: 30, kMax: 60 },
    phRange: { min: 5.5, max: 6.5 },
  },
  coconut: {
    label: "Coconut",
    preferredSoils: ["sandy", "loam", "laterite"],
    waterNeed: "medium",
    rotationAvoid: ["coconut"],
    rotationPreferred: ["pulses", "vegetables"],
    npk: { nMin: 50, nMax: 100, pMin: 30, pMax: 60, kMin: 80, kMax: 160 },
    phRange: { min: 5.5, max: 7.5 },
  },
};

function normalize(value) {
  return (value || "").trim().toLowerCase();
}

function scoreCrop(field, cropKey, recentCropKey) {
  const profile = cropProfiles[cropKey];
  if (!profile) return null;

  let score = 50;
  const notes = [];
  const soil = normalize(field.soilType);
  const irrigation = normalize(field.irrigation);
  const season = normalize(field.season);
  const district = normalize(field.district);

  if (profile.preferredSoils.includes(soil)) {
    score += 20;
    notes.push(`Matches ${soil || "your"} soil`);
  } else if (soil) {
    score -= 10;
  }

  if (profile.waterNeed === "high" && (irrigation.includes("drip") || irrigation.includes("canal") || irrigation.includes("regular"))) {
    score += 10;
  }

  if (profile.waterNeed === "low" && irrigation.includes("rain")) {
    score += 8;
  }

  if (season.includes("kharif") && ["paddy", "cotton", "groundnut", "maize"].includes(cropKey)) {
    score += 10;
  }
  if (season.includes("rabi") && ["pulses", "millets", "vegetables"].includes(cropKey)) {
    score += 8;
  }

  if (recentCropKey && profile.rotationAvoid.includes(recentCropKey)) {
    score -= 25;
    notes.push(`Avoid repeating ${recentCropKey} after the last season`);
  }

  if (district && (district.includes("godavari") || district.includes("guntur") || district.includes("krishna"))) {
    if (["paddy", "cotton", "groundnut"].includes(cropKey)) score += 5;
  }

  // NPK scoring — only applied when values are present (graceful degradation)
  const { npk, phRange } = profile;
  const n = field.nitrogen;
  const p = field.phosphorus;
  const k = field.potassium;
  const ph = field.ph;
  let npkUsed = false;

  if (typeof n === "number" && npk) {
    if (n >= npk.nMin && n <= npk.nMax) {
      score += 8;
      notes.push(`Nitrogen level (${n}) suits ${profile.label}`);
    } else {
      score -= 8;
    }
    npkUsed = true;
  }

  if (typeof p === "number" && npk) {
    if (p >= npk.pMin && p <= npk.pMax) {
      score += 8;
      notes.push(`Phosphorus level (${p}) suits ${profile.label}`);
    } else {
      score -= 8;
    }
    npkUsed = true;
  }

  if (typeof k === "number" && npk) {
    if (k >= npk.kMin && k <= npk.kMax) {
      score += 8;
      notes.push(`Potassium level (${k}) suits ${profile.label}`);
    } else {
      score -= 8;
    }
    npkUsed = true;
  }

  if (typeof ph === "number" && phRange) {
    if (ph >= phRange.min && ph <= phRange.max) {
      score += 10;
      notes.push(`Soil pH (${ph}) is ideal for ${profile.label}`);
    } else if (ph < phRange.min) {
      score -= 10;
      notes.push(`pH too acidic for ${profile.label}`);
    } else {
      score -= 10;
      notes.push(`pH too alkaline for ${profile.label}`);
    }
    npkUsed = true;
  }

  if (!npkUsed) {
    notes.push("Add soil test data (N, P, K, pH) for a more precise score");
  }

  return {
    crop: profile.label,
    cropKey,
    score: Math.max(0, Math.min(score, 100)),
    notes,
  };
}

function getRecommendations(field, recentCropKey) {
  const candidates = Object.keys(cropProfiles)
    .map((cropKey) => scoreCrop(field, cropKey, recentCropKey))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const best = candidates.slice(0, 3).map((item) => ({
    crop: item.crop,
    score: item.score,
    reasons: item.notes.length ? item.notes : ["Fits the available field profile"],
  }));

  return best;
}

function buildRotationPlan(field, lastCropKey) {
  const currentCrop = normalize(field.cropName);
  const lastCrop = lastCropKey || currentCrop;
  const profile = cropProfiles[currentCrop] || cropProfiles[lastCrop];

  const nextOptions = profile?.rotationPreferred || ["pulses", "millets", "groundnut"];
  const immediateNext = nextOptions
    .filter((cropKey) => cropKey !== currentCrop && cropKey !== lastCrop)
    .slice(0, 3)
    .map((cropKey) => cropProfiles[cropKey]?.label || cropKey);

  const rotationNotes = [];
  if (profile?.rotationAvoid?.includes(lastCrop)) {
    rotationNotes.push(`Avoid planting ${profile.label} after ${cropProfiles[lastCrop]?.label || lastCrop}`);
  }
  rotationNotes.push("Insert a pulse or legume crop to restore soil nitrogen.");

  return {
    currentCrop: profile?.label || field.cropName || "Unknown",
    lastCrop: cropProfiles[lastCrop]?.label || field.cropName || "Unknown",
    nextCropOptions: immediateNext.length ? immediateNext : ["Pulses", "Millets"],
    notes: rotationNotes,
  };
}

module.exports = {
  getRecommendations,
  buildRotationPlan,
  cropProfiles,
};
