/**
 * Mastery Engine
 * Transparent, evidence-weighted incremental heuristic.
 * Enforces gradual mastery changes and caps sudden jumps.
 */

const MAX_POSITIVE_DELTA = 12.0; // Maximum percentage gain allowed in a single question
const MAX_NEGATIVE_DELTA = 10.0; // Maximum percentage drop allowed in a single question
const BASE_DELTA = 7.0;

function computeMasteryUpdate({
  currentMastery = 0,
  evidenceEvaluation,
  masteryVersion = 1,
}) {
  const previousMastery = Number(currentMastery) || 0;
  const { correct, evidenceWeight, evidenceQuality } = evidenceEvaluation;

  let rawDelta = 0;

  if (correct) {
    // Diminishing returns scaling as mastery approaches 100
    const headroomFactor = Math.max(0.3, (100 - previousMastery) / 100);
    rawDelta = BASE_DELTA * evidenceWeight * headroomFactor;
    rawDelta = Math.min(MAX_POSITIVE_DELTA, rawDelta);
  } else {
    // Floor protection scaling
    const floorFactor = Math.max(0.35, previousMastery / 100);
    rawDelta = -1 * (BASE_DELTA * evidenceWeight * 0.85 * floorFactor);
    rawDelta = Math.max(-MAX_NEGATIVE_DELTA, rawDelta);
  }

  const masteryDelta = Math.round(rawDelta);
  const newMastery = Math.max(0, Math.min(100, previousMastery + masteryDelta));

  return {
    previousMastery,
    newMastery,
    masteryDelta,
    evidenceContribution: {
      quality: evidenceQuality,
      weight: evidenceWeight,
      appliedDelta: masteryDelta,
    },
    masteryVersion: masteryVersion + 1,
  };
}

module.exports = { computeMasteryUpdate };
