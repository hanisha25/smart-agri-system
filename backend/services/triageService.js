function deriveSeverity(spread, weather) {
  if (spread === "Whole Field") return "High";
  if (spread === "Half Field") return weather === "High Humidity" ? "High" : "Medium";
  if (weather === "Heavy Rain" || weather === "High Humidity") return "Medium";
  return "Low";
}

function buildTriage(problem, symptomLocation, spread, weather) {
  const severity = deriveSeverity(spread, weather);

  const mapping = {
    "Yellow Leaves": {
      probableDisease: "Nutrient deficiency or early fungal stress",
      recommendation: "Inspect irrigation balance, check nitrogen status, and isolate rapidly yellowing patches for closer review.",
    },
    "Brown Spots": {
      probableDisease: "Leaf spot or fungal infection",
      recommendation: "Remove heavily affected leaves, reduce standing moisture, and inspect for fungus spread after rain.",
    },
    "White Powder": {
      probableDisease: "Powdery mildew risk",
      recommendation: "Improve airflow, avoid overhead watering, and prioritize quick field inspection in humid zones.",
    },
    "Leaf Holes": {
      probableDisease: "Insect or pest attack",
      recommendation: "Scout for chewing pests, inspect underside of leaves, and document pest density before treatment.",
    },
    "Plant Drying": {
      probableDisease: "Heat, wilt, or root stress",
      recommendation: "Check root zone moisture, look for wilt progression, and compare healthy vs affected plant rows.",
    },
  };

  const base = mapping[problem] || {
    probableDisease: "General crop stress",
    recommendation: "Review field conditions and gather more visual evidence for diagnosis.",
  };

  const confidence =
    severity === "High" ? 0.88 :
    severity === "Medium" ? 0.76 :
    0.64;

  const triageNotes = `Primary symptom on ${symptomLocation.toLowerCase()} with ${spread.toLowerCase()} spread under ${weather.toLowerCase()} conditions.`;

  return {
    severity,
    probableDisease: base.probableDisease,
    recommendation: base.recommendation,
    confidenceScore: confidence,
    triageNotes,
  };
}

module.exports = { buildTriage };
