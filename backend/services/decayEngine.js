/**
 * Knowledge Decay & Spaced Review Engine
 * Identifies inactive concepts, tracks evidence age, increases uncertainty,
 * and schedules spaced review without erasing earned historical knowledge.
 */

const LearnerState = require('../models/LearnerState');

function evaluateConceptDecay(learnerState, decayWindowDays = 14) {
  if (!learnerState || !learnerState.lastAttemptAt) {
    return {
      isStale: false,
      daysElapsed: 0,
      decayAdjustmentApplied: false,
    };
  }

  const now = Date.now();
  const lastInteraction = new Date(learnerState.lastAttemptAt).getTime();
  const daysElapsed = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));

  if (daysElapsed >= decayWindowDays && learnerState.mastery >= 40) {
    // Increase uncertainty proportional to elapsed time (capped at +25%)
    const additionalUncertainty = Math.min(25, Math.max(10, Math.round(daysElapsed * 1.2)));
    const decayedUncertainty = Math.min(95, learnerState.uncertainty + additionalUncertainty);

    // Modest natural memory decay (max 8% drop, never reset to 0)
    const decayDrop = Math.min(8, Math.round(daysElapsed * 0.4));
    const decayedMastery = Math.max(30, learnerState.mastery - decayDrop);

    return {
      isStale: true,
      daysElapsed,
      decayAdjustmentApplied: true,
      previousMastery: learnerState.mastery,
      decayedMastery,
      previousUncertainty: learnerState.uncertainty,
      decayedUncertainty,
      reason: `Concept has had no interaction for ${daysElapsed} days (exceeds ${decayWindowDays}-day threshold). Increased uncertainty for spaced review.`,
    };
  }

  return {
    isStale: false,
    daysElapsed,
    decayAdjustmentApplied: false,
  };
}

async function checkAndApplyDecay(learnerId, decayWindowDays = 14) {
  const states = await LearnerState.find({ learnerId }).populate('conceptId');
  const staleResults = [];

  for (const state of states) {
    const decay = evaluateConceptDecay(state, decayWindowDays);
    if (decay.isStale && !state.isStale) {
      state.isStale = true;
      state.mastery = decay.decayedMastery;
      state.uncertainty = decay.decayedUncertainty;
      await state.save();

      staleResults.push({
        conceptId: state.conceptId._id,
        conceptName: state.conceptId.name,
        slug: state.conceptId.slug,
        decay,
      });
    }
  }

  return staleResults;
}

module.exports = { evaluateConceptDecay, checkAndApplyDecay };
