/**
 * Uncertainty Engine
 * Tracks epistemic certainty in the learner model (0 - 100%).
 * Decreases with consistent, diverse evidence; increases with conflict, transfer failure, and decay.
 */

function computeUncertaintyUpdate({
  currentUncertainty = 100,
  evidenceEvaluation,
  recentAttemptsOnConcept = [],
  distinctTypesPassed = new Set(),
  isStale = false,
}) {
  let u = Number(currentUncertainty);
  if (isNaN(u)) u = 100;

  const { correct, evidenceQuality, evidenceWeight, gamingAnalysis } = evidenceEvaluation;
  const questionType = evidenceEvaluation.factors?.questionType;

  let delta = 0;

  // 1. Evidence Quality Impact
  if (evidenceQuality === 'STRONG') {
    delta -= 8.0 * (evidenceWeight / 1.5);
  } else if (evidenceQuality === 'MODERATE') {
    delta -= 4.5 * (evidenceWeight / 1.0);
  } else if (evidenceQuality === 'WEAK') {
    // Weak evidence barely reduces uncertainty; rapid guessing can increase it
    if (gamingAnalysis?.flags?.length > 0) {
      delta += 3.0; // Suspicious or gamed signal introduces noise
    } else {
      delta -= 1.5;
    }
  }

  // 2. Transfer Task Performance
  if (evidenceEvaluation.factors?.typeMultiplier >= 1.5) {
    if (correct) {
      delta -= 6.0; // Successful transfer confirms deep conceptual generalization
    } else {
      delta += 9.0; // Failure on transfer task reveals brittle rote knowledge
    }
  }

  // 3. Question Diversity Bonus
  if (distinctTypesPassed.size >= 3) {
    delta -= 3.0;
  }

  // 4. Performance Inconsistency / Fluctuation Penalty
  if (recentAttemptsOnConcept.length >= 2) {
    const prior1 = recentAttemptsOnConcept[0]?.correct;
    const prior2 = recentAttemptsOnConcept[1]?.correct;
    if (prior1 !== undefined && prior1 !== correct) {
      delta += 5.0; // Evidence contradiction increases uncertainty
    }
    if (prior2 !== undefined && prior1 !== undefined && prior1 !== prior2) {
      delta += 4.0; // Fluctuating performance
    }
  }

  // 5. Stale Evidence / Time Gap Impact
  if (isStale) {
    delta += 15.0;
  }

  const uncertaintyDelta = Math.round(delta);
  // Keep uncertainty in range [5, 100] (never 0% to reflect authentic epistemic humility)
  const newUncertainty = Math.max(5, Math.min(100, Math.round(u + uncertaintyDelta)));

  return {
    previousUncertainty: u,
    newUncertainty,
    uncertaintyDelta,
    factors: {
      evidenceQuality,
      diversityBonus: distinctTypesPassed.size >= 3,
      contradictionDetected: delta > 0,
    },
  };
}

module.exports = { computeUncertaintyUpdate };
