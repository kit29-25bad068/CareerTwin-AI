/**
 * Anti-Gaming Engine
 * Detects rapid guessing, repeated same-question spamming, and hint overuse.
 * Adjusts evidence weight downward without permanently punishing the learner.
 */

function analyzeGamingPatterns({
  question,
  responseTime,
  hintsUsed = 0,
  priorAttemptsOnQuestion = [],
  priorAttemptsOnConcept = [],
}) {
  const flags = [];
  let penaltyMultiplier = 1.0; // 1.0 = no penalty, 0.2 = heavy reduction

  const attemptCount = priorAttemptsOnQuestion.length + 1;
  const isRepeatedQuestion = priorAttemptsOnQuestion.length > 0;

  // 1. Unusually Short Response Time (< 3 seconds for non-trivial questions)
  const isUnusuallyFast = responseTime < 3.0 && question.difficulty >= 2;
  if (isUnusuallyFast) {
    flags.push('UNUSUALLY_FAST_RESPONSE');
    penaltyMultiplier *= 0.65;
  }

  // 2. Rapid Retry Check (< 6 seconds after a previous attempt on the same question)
  let isRapidRetry = false;
  if (priorAttemptsOnQuestion.length > 0) {
    const lastAttempt = priorAttemptsOnQuestion[0];
    const timeSinceLastAttempt = (Date.now() - new Date(lastAttempt.timestamp).getTime()) / 1000;
    if (timeSinceLastAttempt < 8.0) {
      isRapidRetry = true;
      flags.push('RAPID_RETRY');
      penaltyMultiplier *= 0.55;
    }
  }

  // 3. Guess-Until-Correct Pattern (Multiple consecutive failures on the same question followed by correct)
  let isGuessUntilCorrect = false;
  if (priorAttemptsOnQuestion.length >= 2) {
    const allPriorFailed = priorAttemptsOnQuestion.every((a) => !a.correct);
    if (allPriorFailed) {
      isGuessUntilCorrect = true;
      flags.push('GUESS_UNTIL_CORRECT');
      penaltyMultiplier *= 0.6;
    }
  }

  // 4. Excessive Hints Used (> 1 hint on standard questions)
  if (hintsUsed >= 2) {
    flags.push('EXCESSIVE_HINTS');
    penaltyMultiplier *= Math.max(0.4, 1.0 - hintsUsed * 0.25);
  } else if (hintsUsed === 1) {
    flags.push('SINGLE_HINT_USED');
    penaltyMultiplier *= 0.8;
  }

  // 5. Repeated Attempts Penalty (evidence diminishes as learner repeats the same exact item)
  if (attemptCount > 1) {
    flags.push(`REPEATED_ATTEMPT_${attemptCount}`);
    const repeatDiscount = Math.max(0.35, 1.0 - (attemptCount - 1) * 0.25);
    penaltyMultiplier *= repeatDiscount;
  }

  return {
    isRapidRetry,
    isRepeatedQuestion,
    isGuessUntilCorrect,
    attemptNumber: attemptCount,
    penaltyMultiplier: Math.max(0.15, Math.min(1.0, penaltyMultiplier)),
    flags,
  };
}

module.exports = { analyzeGamingPatterns };
