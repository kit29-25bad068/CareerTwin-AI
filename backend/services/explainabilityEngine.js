/**
 * Explainability Engine
 * Translates underlying mathematical decision factors, recursive prerequisite trees,
 * and historical attempt evidence into transparent, auditable rationales.
 */

function generateExplanation({
  action,
  targetConcept,
  learnerState = {},
  prerequisiteAnalysis = {},
  recentAttempts = [],
  config = {},
  interventionTrigger = null,
}) {
  const mastery = learnerState.mastery || 0;
  const uncertainty = learnerState.uncertainty !== undefined ? learnerState.uncertainty : 100;
  const isBlocked = prerequisiteAnalysis.isBlocked || false;
  const rootPrereq = prerequisiteAnalysis.rootBlockingConcept || null;

  const recentFailures = recentAttempts.filter((a) => !a.correct).length;
  const transferAttempts = recentAttempts.filter((a) => a.questionType === 'Transfer');
  const transferPassed = transferAttempts.filter((a) => a.correct).length;
  const transferPerformance = transferAttempts.length > 0 ? Math.round((transferPassed / transferAttempts.length) * 100) : null;

  // Average evidence quality score
  const qualityScores = { STRONG: 1.0, MODERATE: 0.65, WEAK: 0.35, NEGATIVE: 0.1 };
  const avgQuality = recentAttempts.length > 0
    ? Math.round(
        (recentAttempts.reduce((acc, a) => acc + (qualityScores[a.evidenceQuality] || 0.5), 0) /
          recentAttempts.length) *
          100
      ) / 100
    : 0.5;

  const decisionFactors = {
    mastery,
    uncertainty,
    prerequisiteBlocked: isBlocked,
    blockedPrerequisites: (prerequisiteAnalysis.blockingPrerequisites || []).map((p) => p.conceptId),
    staleEvidence: learnerState.isStale || false,
    recentFailures,
    transferPerformance,
    evidenceQuality: avgQuality,
    thresholdsApplied: {
      practiceThreshold: config.practiceThreshold || 60,
      advanceThreshold: config.advanceThreshold || 75,
      challengeThreshold: config.challengeThreshold || 85,
      uncertaintyThreshold: config.uncertaintyThreshold || 40,
      prerequisiteThreshold: config.prerequisiteThreshold || 70,
    },
  };

  let reason = '';

  switch (action) {
    case 'REMEDIATE_PREREQUISITE':
      if (rootPrereq) {
        reason = `Remediate ${rootPrereq.name} before advancing to ${targetConcept.name}. ${rootPrereq.name} mastery is ${rootPrereq.mastery}%, which is below the required prerequisite threshold (${rootPrereq.requiredMastery}%).`;
      } else {
        reason = `Remediate foundational dependencies for ${targetConcept.name} to ensure prerequisite mastery exceeds ${config.prerequisiteThreshold || 70}%.`;
      }
      break;

    case 'REVIEW':
      reason = `Review ${targetConcept.name} due to suspected knowledge decay. The concept has been inactive, raising epistemic uncertainty to ${uncertainty}%. Spaced review is required before advancing.`;
      break;

    case 'PRACTICE':
      if (recentFailures > 0) {
        reason = `Practice ${targetConcept.name}. Current mastery is ${mastery}% with ${recentFailures} recent failed attempt(s). Additional guided problem-solving will reinforce core mechanics.`;
      } else {
        reason = `Practice ${targetConcept.name} to build baseline competency. Current mastery is ${mastery}%, below the proficiency threshold of ${config.practiceThreshold || 60}%.`;
      }
      break;

    case 'CHALLENGE':
      reason = `Challenge ${targetConcept.name} with advanced transfer questions. Current mastery is strong at ${mastery}%, but uncertainty remains elevated at ${uncertainty}%. Verification required to certify deep generalization.`;
      break;

    case 'ADVANCE':
      reason = `Advance to the next concept. Mastery in ${targetConcept.name} has reached ${mastery}% with high certainty (uncertainty: ${uncertainty}%), and all prerequisite dependencies are validated.`;
      break;

    case 'TEACHER_INTERVENTION':
      if (interventionTrigger === 'CONSECUTIVE_FAILURES' || recentFailures >= 3) {
        reason = `Teacher intervention recommended for ${targetConcept.name}. Learner has encountered ${recentFailures} consecutive failed attempts, indicating a conceptual roadblock requiring educator guidance.`;
      } else if (interventionTrigger === 'PREREQUISITE_STALL') {
        reason = `Teacher intervention recommended. Learner is experiencing repeated prerequisite remediation stalls on ${rootPrereq ? rootPrereq.name : 'foundational concepts'}.`;
      } else {
        reason = `Teacher intervention recommended for ${targetConcept.name} due to persistently conflicting evidence and high uncertainty.`;
      }
      break;

    default:
      reason = `Continue practicing ${targetConcept.name} to reinforce active concept competency.`;
  }

  return {
    reason,
    decisionFactors,
  };
}

module.exports = { generateExplanation };
