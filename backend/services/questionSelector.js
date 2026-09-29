/**
 * Information-Gain Question Selector
 * Selects learning items that maximize informational yield and reduce uncertainty
 * based on the active decision action and question-type diversity.
 */

const Question = require('../models/Question');
const Attempt = require('../models/Attempt');

async function selectOptimalQuestion({
  learnerId,
  conceptId,
  action = 'PRACTICE',
  preferredType = null,
}) {
  const candidateQuestions = await Question.find({
    conceptId,
    active: true,
  }).populate('conceptId');

  if (!candidateQuestions || candidateQuestions.length === 0) {
    return null;
  }

  // Fetch recent attempts to avoid repeating recently seen questions
  const recentAttempts = await Attempt.find({ learnerId, conceptId })
    .sort({ timestamp: -1 })
    .limit(5);

  const recentlyAttemptedIds = new Set(recentAttempts.map((a) => a.questionId.toString()));
  const passedTypes = new Set(recentAttempts.filter((a) => a.correct).map((a) => a.questionType));

  // Filter out questions attempted very recently if alternative candidates exist
  let unattemptedPool = candidateQuestions.filter((q) => !recentlyAttemptedIds.has(q._id.toString()));
  if (unattemptedPool.length === 0) {
    unattemptedPool = candidateQuestions;
  }

  // Score candidates based on instructional action
  const scoredCandidates = unattemptedPool.map((q) => {
    let score = 10;

    switch (action) {
      case 'CHALLENGE':
        if (q.type === 'Transfer') score += 50;
        if (q.type === 'Coding') score += 40;
        if (q.difficulty >= 4) score += 30;
        break;

      case 'REMEDIATE_PREREQUISITE':
        if (q.difficulty <= 3) score += 40;
        if (q.type === 'MCQ' || q.type === 'Code Output') score += 30;
        break;

      case 'REVIEW':
        if (q.type === 'Debugging') score += 45;
        if (q.type === 'Code Output') score += 35;
        if (q.difficulty === 2 || q.difficulty === 3) score += 20;
        break;

      case 'PRACTICE':
      default:
        // Prioritize question types the learner has not yet passed on this concept
        if (!passedTypes.has(q.type)) score += 35;
        if (q.difficulty >= 2 && q.difficulty <= 4) score += 20;
        break;
    }

    if (preferredType && q.type === preferredType) {
      score += 25;
    }

    return { question: q, score };
  });

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  return scoredCandidates[0].question;
}

module.exports = { selectOptimalQuestion };
