/**
 * Evidence Engine
 * Evaluates correctness, difficulty, confidence, response times, question types,
 * hints, and anti-gaming signals to produce objective Evidence Quality and Evidence Weight.
 */

const { analyzeGamingPatterns } = require('./antiGamingEngine');

const TYPE_MULTIPLIERS = {
  Transfer: 1.5,
  Coding: 1.4,
  Debugging: 1.3,
  Scenario: 1.2,
  'Code Output': 1.1,
  MCQ: 1.0,
};

const DIFFICULTY_BASE_WEIGHTS = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.3,
  5: 1.6,
};

function evaluateEvidence({
  question,
  correct,
  responseTime,
  confidence = 3,
  hintsUsed = 0,
  priorAttemptsOnQuestion = [],
  priorAttemptsOnConcept = [],
  config = {},
}) {
  // 1. Run Anti-Gaming Analysis
  const gaming = analyzeGamingPatterns({
    question,
    responseTime,
    hintsUsed,
    priorAttemptsOnQuestion,
    priorAttemptsOnConcept,
  });

  // 2. Base Weight by Difficulty
  const difficulty = question.difficulty || 3;
  const baseWeight = DIFFICULTY_BASE_WEIGHTS[difficulty] || 1.0;

  // 3. Question Type Multiplier
  const transferMultiplier = config.transferWeight || TYPE_MULTIPLIERS[question.type] || 1.0;
  const typeMultiplier = question.type === 'Transfer' ? transferMultiplier : (TYPE_MULTIPLIERS[question.type] || 1.0);

  // 4. Confidence & Misconception Calibration
  let confidenceFactor = 1.0;
  if (correct) {
    if (confidence >= 4) {
      confidenceFactor = 1.15; // High confidence mastery confirmation
    } else if (confidence <= 2) {
      confidenceFactor = 0.85; // Low confidence lucky guess calibration
    }
  } else {
    if (confidence >= 4) {
      // High confidence mistake = Strong misconception signal
      confidenceFactor = 1.25;
    } else if (confidence <= 2) {
      // Acknowledged uncertainty = Mild negative signal
      confidenceFactor = 0.85;
    }
  }

  // 5. Compute Final Evidence Weight
  let rawWeight = baseWeight * typeMultiplier * confidenceFactor * gaming.penaltyMultiplier;
  const evidenceWeight = Math.round(Math.max(0.2, Math.min(2.5, rawWeight)) * 100) / 100;

  // 6. Evidence Classification
  let evidenceQuality = 'MODERATE';
  let description = '';

  if (correct) {
    if (evidenceWeight >= 1.35 && hintsUsed === 0 && !gaming.isRapidRetry) {
      evidenceQuality = 'STRONG';
      description = `Strong positive evidence on ${question.type} (Difficulty ${difficulty}) with high confidence.`;
    } else if (gaming.flags.length > 0 || hintsUsed > 0 || evidenceWeight < 0.75) {
      evidenceQuality = 'WEAK';
      description = `Weak positive evidence. Correctness mitigated by: ${gaming.flags.join(', ') || 'hints used'}.`;
    } else {
      evidenceQuality = 'MODERATE';
      description = `Moderate positive evidence on ${question.type} (Difficulty ${difficulty}).`;
    }
  } else {
    if (question.type === 'Transfer' || difficulty >= 4) {
      evidenceQuality = 'NEGATIVE';
      description = `Significant negative evidence: Failed ${question.type} task at Difficulty ${difficulty}.`;
    } else {
      evidenceQuality = 'MODERATE';
      description = `Moderate negative evidence: Incorrect attempt at Difficulty ${difficulty}.`;
    }
  }

  return {
    correct,
    evidenceQuality,
    evidenceWeight,
    description,
    gamingAnalysis: gaming,
    factors: {
      baseWeight,
      typeMultiplier,
      confidenceFactor,
      gamingPenaltyMultiplier: gaming.penaltyMultiplier,
      attemptNumber: gaming.attemptNumber,
    },
  };
}

module.exports = { evaluateEvidence };
