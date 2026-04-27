const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRecommendations,
  buildRotationPlan,
} = require("../services/cropPlanningService");

test("getRecommendations returns ranked crops for a matching field profile", () => {
  const field = {
    soilType: "clay",
    irrigation: "canal",
    season: "kharif",
    district: "krishna",
    nitrogen: 90,
    phosphorus: 40,
    potassium: 45,
    ph: 6.2,
  };

  const recommendations = getRecommendations(field, "millets");

  assert.equal(Array.isArray(recommendations), true);
  assert.equal(recommendations.length > 0, true);
  assert.equal(recommendations[0].crop, "Paddy");
  assert.ok(recommendations[0].score >= recommendations[1].score);
  assert.ok(recommendations[0].reasons.length > 0);
});

test("buildRotationPlan avoids repeating the current crop and suggests alternates", () => {
  const field = {
    cropName: "paddy",
    district: "krishna",
    village: "test village",
  };

  const plan = buildRotationPlan(field, "paddy");

  assert.equal(plan.currentCrop, "Paddy");
  assert.equal(plan.lastCrop, "Paddy");
  assert.equal(Array.isArray(plan.nextCropOptions), true);
  assert.ok(plan.nextCropOptions.length > 0);
  assert.ok(plan.notes.some((note) => note.includes("legume")));
});
