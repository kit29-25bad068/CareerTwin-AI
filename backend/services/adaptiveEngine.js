/**
 * Adaptive Decision Engine
 * The central intelligence of CareerTwin AI.
 * Chooses among ADVANCE, PRACTICE, REVIEW, REMEDIATE_PREREQUISITE,
 * CHALLENGE, and TEACHER_INTERVENTION based on persistent learner state,
 * recursive prerequisites, decay, evidence, and teacher overrides.
 */

const Concept = require('../models/Concept');
const LearnerState = require('../models/LearnerState');
const Decision = require('../models/Decision');
const LearningPath = require('../models/LearningPath');
const AdaptiveConfig = require('../models/AdaptiveConfig');
const Attempt = require('../models/Attempt');

const { evaluatePrerequisites } = require('./prerequisiteEngine');
const { evaluateConceptDecay } = require('./decayEngine');
const { generateExplanation } = require('./explainabilityEngine');
const { selectOptimalQuestion } = require('./questionSelector');

async function getNextLearningAction(learnerId, targetConceptId = null) {
  // 1. Load Active Adaptive Configuration
  let config = await AdaptiveConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
  if (!config) {
    config = {
      practiceThreshold: 60,
      advanceThreshold: 75,
      challengeThreshold: 85,
      uncertaintyThreshold: 40,
      prerequisiteThreshold: 70,
      decayWindowDays: 14,
      configurationVersion: '1.0',
    };
  }

  // 2. Load all 12 Concepts in curriculum order
  const concepts = await Concept.find({ active: true }).sort({ order: 1 });
  const conceptMap = new Map();
  concepts.forEach((c) => conceptMap.set(c._id.toString(), c));

  // 3. Load all Learner States
  const states = await LearnerState.find({ learnerId });
  const stateMap = new Map();
  states.forEach((s) => stateMap.set(s.conceptId.toString(), s));

  // 4. Fetch recent attempts for global failure analysis
  const recentAttempts = await Attempt.find({ learnerId }).sort({ timestamp: -1 }).limit(6);
  const consecutiveFailures = [];
  for (const a of recentAttempts) {
    if (!a.correct) consecutiveFailures.push(a);
    else break;
  }

  let activeConcept = null;
  let action = 'PRACTICE';
  let prerequisiteAnalysis = { isBlocked: false, rootBlockingConcept: null, blockingPrerequisites: [] };
  let interventionTrigger = null;

  // 5. Check Global Rule: Autonomous Remediation on consecutive failures (3+ failures)
  if (consecutiveFailures.length >= 3) {
    action = 'REMEDIATE_PREREQUISITE';
    interventionTrigger = 'CONSECUTIVE_FAILURES';
    const failedConceptId = consecutiveFailures[0].conceptId;
    activeConcept = conceptMap.get(failedConceptId.toString()) || concepts[0];
  }

  // 6. Check Global Rule: Spaced Review for Stale Concepts (Knowledge Decay)
  if (action !== 'REMEDIATE_PREREQUISITE') {
    for (const c of concepts) {
      const state = stateMap.get(c._id.toString());
      if (state) {
        const decay = evaluateConceptDecay(state, config.decayWindowDays);
        if (decay.isStale || state.isStale) {
          activeConcept = c;
          action = 'REVIEW';
          break;
        }
      }
    }
  }

  // 8. Find Active Concept if not set by Intervention or Review
  if (!activeConcept) {
    if (targetConceptId) {
      activeConcept = conceptMap.get(targetConceptId.toString());
    } else {
      // Find the first concept not yet fully mastered
      for (const c of concepts) {
        const state = stateMap.get(c._id.toString());
        const mastery = state ? state.mastery : 0;
        const uncertainty = state ? state.uncertainty : 100;
        if (mastery < config.advanceThreshold || uncertainty > config.uncertaintyThreshold) {
          activeConcept = c;
          break;
        }
      }
    }
  }

  if (!activeConcept) {
    // If all concepts mastered, focus on final synthesis
    activeConcept = concepts[concepts.length - 1];
  }

  // 9. Evaluate Recursive Prerequisites for the Active Concept
  if (action !== 'TEACHER_INTERVENTION' && action !== 'REVIEW') {
    prerequisiteAnalysis = await evaluatePrerequisites(activeConcept._id, learnerId, config.prerequisiteThreshold);

    if (prerequisiteAnalysis.isBlocked) {
      action = 'REMEDIATE_PREREQUISITE';
      // Switch active target to the foundational root blocking prerequisite
      const rootConcept = conceptMap.get(prerequisiteAnalysis.rootBlockingConcept.conceptId.toString());
      if (rootConcept) {
        activeConcept = rootConcept;
      }
    } else {
      // Prerequisites are satisfied. Now evaluate active concept mastery & uncertainty
      const state = stateMap.get(activeConcept._id.toString());
      const mastery = state ? state.mastery : 0;
      const uncertainty = state ? state.uncertainty : 100;

      if (mastery >= config.advanceThreshold) {
        if (uncertainty > config.uncertaintyThreshold) {
          action = 'CHALLENGE'; // High mastery with uncertainty -> Challenge
        } else {
          action = 'ADVANCE'; // High mastery with high certainty -> Advance
        }
      } else if (mastery < config.practiceThreshold) {
        action = 'PRACTICE';
      } else {
        action = 'PRACTICE';
      }
    }
  }


  // 10. Generate Machine + Human Explanation
  const activeState = stateMap.get(activeConcept._id.toString()) || { mastery: 0, uncertainty: 100 };
  const conceptAttempts = recentAttempts.filter((a) => a.conceptId.toString() === activeConcept._id.toString());

  const explanation = generateExplanation({
    action,
    targetConcept: activeConcept,
    learnerState: activeState,
    prerequisiteAnalysis,
    recentAttempts: conceptAttempts,
    config,
    interventionTrigger,
  });

  // 11. Persist Decision Record
  const decision = await Decision.create({
    learnerId,
    conceptId: activeConcept._id,
    action,
    reason: explanation.reason,
    decisionFactors: explanation.decisionFactors,
    previousState: {
      mastery: activeState.mastery || 0,
      uncertainty: activeState.uncertainty || 100,
    },
    resultingState: {
      mastery: activeState.mastery || 0,
      uncertainty: activeState.uncertainty || 100,
    },
    configurationVersion: config.configurationVersion || '1.0',
    timestamp: new Date(),
  });

  // 12. Update LearningPath Pipeline for all 12 Concepts
  for (const c of concepts) {
    const cState = stateMap.get(c._id.toString());
    const cMastery = cState ? cState.mastery : 0;
    const cUncertainty = cState ? cState.uncertainty : 100;
    const cStale = cState ? cState.isStale : false;

    let pathStatus = 'locked';
    let pathAction = 'PRACTICE';

    if (c._id.toString() === activeConcept._id.toString()) {
      pathStatus = 'in_progress';
      pathAction = action;
    } else if (cMastery >= config.advanceThreshold && cUncertainty <= config.uncertaintyThreshold) {
      pathStatus = 'completed';
      pathAction = 'ADVANCE';
    } else if (cStale) {
      pathStatus = 'review_needed';
      pathAction = 'REVIEW';
    } else {
      // Check if this concept's prerequisites are met
      const pCheck = await evaluatePrerequisites(c._id, learnerId, config.prerequisiteThreshold);
      pathStatus = pCheck.isBlocked ? 'locked' : 'ready';
      pathAction = pCheck.isBlocked ? 'REMEDIATE_PREREQUISITE' : 'PRACTICE';
    }

    await LearningPath.findOneAndUpdate(
      { learnerId, conceptId: c._id },
      {
        learnerId,
        conceptId: c._id,
        status: pathStatus,
        recommendedAction: pathAction,
        position: c.order,
        reason: c._id.toString() === activeConcept._id.toString() ? explanation.reason : '',
        decisionFactors: c._id.toString() === activeConcept._id.toString() ? explanation.decisionFactors : {},
        createdFromDecisionId: c._id.toString() === activeConcept._id.toString() ? decision._id : null,
      },
      { upsert: true, new: true }
    );
  }

  // 13. Select Optimal Next Question
  const nextQuestion = await selectOptimalQuestion({
    learnerId,
    conceptId: activeConcept._id,
    action,
  });

  return {
    decision,
    activeConcept,
    action,
    reason: explanation.reason,
    decisionFactors: explanation.decisionFactors,
    nextQuestion,
  };
}

module.exports = { getNextLearningAction };
