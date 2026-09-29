const Concept = require('../models/Concept');
const Question = require('../models/Question');
const AdaptiveConfig = require('../models/AdaptiveConfig');
const Attempt = require('../models/Attempt');
const LearnerState = require('../models/LearnerState');
const Decision = require('../models/Decision');
const LearningPath = require('../models/LearningPath');

const { evaluateEvidence } = require('../services/evidenceEngine');
const { computeMasteryUpdate } = require('../services/masteryEngine');
const { computeUncertaintyUpdate } = require('../services/uncertaintyEngine');
const { getNextLearningAction } = require('../services/adaptiveEngine');

// @desc    Get all active concepts
// @route   GET /api/adaptive/concepts
// @access  Public
exports.getConcepts = async (req, res, next) => {
  try {
    const concepts = await Concept.find({ active: true })
      .populate('prerequisites', 'slug name order requiredMastery')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: concepts.length,
      concepts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get concept graph structure (nodes & edges)
// @route   GET /api/adaptive/concepts/graph
// @access  Public
exports.getConceptGraph = async (req, res, next) => {
  try {
    const concepts = await Concept.find({ active: true }).sort({ order: 1 });

    const nodes = concepts.map((c) => ({
      id: c._id.toString(),
      slug: c.slug,
      name: c.name,
      order: c.order,
      category: c.category,
      description: c.description,
      requiredMastery: c.requiredMastery,
      difficultyRange: c.difficultyRange,
      prerequisites: c.prerequisites.map((p) => p.toString()),
    }));

    const edges = [];
    concepts.forEach((c) => {
      c.prerequisites.forEach((pId) => {
        edges.push({
          source: pId.toString(),
          target: c._id.toString(),
          type: 'prerequisite',
        });
      });
    });

    res.status(200).json({
      success: true,
      graph: {
        nodes,
        edges,
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions filtered by concept, difficulty, or type
// @route   GET /api/adaptive/questions
// @access  Public
exports.getQuestions = async (req, res, next) => {
  try {
    const { conceptId, conceptSlug, type, difficulty } = req.query;
    const filter = { active: true };

    if (conceptId) {
      filter.conceptId = conceptId;
    } else if (conceptSlug) {
      const c = await Concept.findOne({ slug: conceptSlug });
      if (c) filter.conceptId = c._id;
    }

    if (type) filter.type = type;
    if (difficulty) filter.difficulty = Number(difficulty);

    const questions = await Question.find(filter)
      .populate('conceptId', 'slug name order')
      .select('-correctAnswer');

    res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active Adaptive Configuration
// @route   GET /api/adaptive/config
// @access  Public
exports.getAdaptiveConfig = async (req, res, next) => {
  try {
    let config = await AdaptiveConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!config) {
      config = await AdaptiveConfig.findOne({ configurationVersion: '1.0' });
    }

    res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a learning attempt and execute Evidence -> Mastery -> Uncertainty update loop
// @route   POST /api/adaptive/attempts
// @access  Private / Optional Auth
exports.submitAttempt = async (req, res, next) => {
  try {
    const learnerId = req.user?.id || req.body.learnerId;
    if (!learnerId) {
      return res.status(400).json({ success: false, message: 'learnerId is required' });
    }

    const questionId = req.body.questionId || req.body.id || req.body._id;
    const {
      userAnswer,
      responseTime = 15,
      confidence = 3,
      hintsUsed = 0,
      sessionId = null,
    } = req.body;

    if (!questionId || userAnswer === undefined) {
      return res.status(400).json({ success: false, message: 'questionId and userAnswer are required' });
    }

    const question = await Question.findById(questionId).populate('conceptId');
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // 1. Evaluate Correctness
    const normalizedUserAnswer = String(userAnswer).trim().toLowerCase();
    const normalizedCorrectAnswer = String(question.correctAnswer).trim().toLowerCase();
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;

    // 2. Fetch Prior Attempts for Anti-Gaming & Consistency Context
    const priorAttemptsOnQuestion = await Attempt.find({
      learnerId,
      questionId,
    }).sort({ timestamp: -1 });

    const priorAttemptsOnConcept = await Attempt.find({
      learnerId,
      conceptId: question.conceptId._id,
    }).sort({ timestamp: -1 }).limit(10);

    // 3. Load Active Adaptive Config
    let config = await AdaptiveConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!config) config = { transferWeight: 1.5, hintPenalty: 0.25, retryPenalty: 0.35 };

    // 4. Evidence Engine Evaluation
    const evidenceEvaluation = evaluateEvidence({
      question,
      correct,
      responseTime: Number(responseTime),
      confidence: Number(confidence),
      hintsUsed: Number(hintsUsed),
      priorAttemptsOnQuestion,
      priorAttemptsOnConcept,
      config,
    });

    // 5. Persist Immutable Attempt Record
    const attempt = await Attempt.create({
      learnerId,
      questionId: question._id,
      conceptId: question.conceptId._id,
      correct,
      userAnswer,
      difficulty: question.difficulty,
      responseTime: Number(responseTime),
      confidence: Number(confidence),
      hintsUsed: Number(hintsUsed),
      attemptNumber: evidenceEvaluation.gamingAnalysis.attemptNumber,
      evidenceWeight: evidenceEvaluation.evidenceWeight,
      evidenceQuality: evidenceEvaluation.evidenceQuality,
      isRapidRetry: evidenceEvaluation.gamingAnalysis.isRapidRetry,
      isRepeatedQuestion: evidenceEvaluation.gamingAnalysis.isRepeatedQuestion,
      questionType: question.type,
      questionVersion: question.questionVersion || 1,
      sessionId,
      timestamp: new Date(),
    });

    // 6. Retrieve or Initialize Persistent LearnerState
    let learnerState = await LearnerState.findOne({
      learnerId,
      conceptId: question.conceptId._id,
    });

    if (!learnerState) {
      learnerState = new LearnerState({
        learnerId,
        conceptId: question.conceptId._id,
        mastery: 0,
        uncertainty: 100,
        evidenceCount: 0,
        masteryVersion: 1,
      });
    }

    // 7. Mastery Engine Incremental Update
    const masteryUpdate = computeMasteryUpdate({
      currentMastery: learnerState.mastery,
      evidenceEvaluation,
      masteryVersion: learnerState.masteryVersion,
    });

    // 8. Uncertainty Engine Update
    const distinctTypesPassed = new Set(
      priorAttemptsOnConcept
        .filter((a) => a.correct)
        .map((a) => a.questionType)
    );
    if (correct) distinctTypesPassed.add(question.type);

    const uncertaintyUpdate = computeUncertaintyUpdate({
      currentUncertainty: learnerState.uncertainty,
      evidenceEvaluation,
      recentAttemptsOnConcept: priorAttemptsOnConcept,
      distinctTypesPassed,
      isStale: learnerState.isStale,
    });

    // 9. Update LearnerState Aggregates
    const allConceptAttempts = [attempt, ...priorAttemptsOnConcept];
    const recentAttempts = allConceptAttempts.slice(0, 5);
    const recentCorrectCount = recentAttempts.filter((a) => a.correct).length;
    const historicalCorrectCount = allConceptAttempts.filter((a) => a.correct).length;

    learnerState.mastery = masteryUpdate.newMastery;
    learnerState.uncertainty = uncertaintyUpdate.newUncertainty;
    learnerState.evidenceCount += 1;
    learnerState.masteryVersion = masteryUpdate.masteryVersion;
    learnerState.recentPerformance = Math.round((recentCorrectCount / recentAttempts.length) * 100);
    learnerState.historicalPerformance = Math.round((historicalCorrectCount / allConceptAttempts.length) * 100);
    learnerState.lastAttemptAt = new Date();
    learnerState.isStale = false;

    if (evidenceEvaluation.evidenceQuality === 'STRONG') {
      learnerState.lastStrongEvidenceAt = new Date();
    }

    if (question.type === 'Transfer') {
      learnerState.transferPerformance = correct ? 100 : 0;
    }

    await learnerState.save();

    res.status(200).json({
      success: true,
      attemptId: attempt._id,
      correct,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      evidence: {
        quality: evidenceEvaluation.evidenceQuality,
        weight: evidenceEvaluation.evidenceWeight,
        description: evidenceEvaluation.description,
        gamingFlags: evidenceEvaluation.gamingAnalysis.flags,
      },
      stateUpdate: {
        concept: {
          id: question.conceptId._id,
          name: question.conceptId.name,
          slug: question.conceptId.slug,
        },
        previousMastery: masteryUpdate.previousMastery,
        newMastery: masteryUpdate.newMastery,
        masteryDelta: masteryUpdate.masteryDelta,
        previousUncertainty: uncertaintyUpdate.previousUncertainty,
        newUncertainty: uncertaintyUpdate.newUncertainty,
        uncertaintyDelta: uncertaintyUpdate.uncertaintyDelta,
        evidenceCount: learnerState.evidenceCount,
        masteryVersion: learnerState.masteryVersion,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get learner mastery and uncertainty across all concepts
// @route   GET /api/adaptive/mastery
// @access  Private / Optional Auth
exports.getLearnerMastery = async (req, res, next) => {
  try {
    const learnerId = req.user?.id || req.query.learnerId;
    if (!learnerId) {
      return res.status(400).json({ success: false, message: 'learnerId is required' });
    }

    const concepts = await Concept.find({ active: true }).sort({ order: 1 });
    const states = await LearnerState.find({ learnerId });
    const stateMap = new Map();
    states.forEach((s) => stateMap.set(s.conceptId.toString(), s));

    const overview = concepts.map((c) => {
      const state = stateMap.get(c._id.toString());
      return {
        conceptId: c._id,
        slug: c.slug,
        name: c.name,
        order: c.order,
        category: c.category,
        requiredMastery: c.requiredMastery,
        mastery: state ? state.mastery : 0,
        uncertainty: state ? state.uncertainty : 100,
        evidenceCount: state ? state.evidenceCount : 0,
        recentPerformance: state ? state.recentPerformance : 0,
        historicalPerformance: state ? state.historicalPerformance : 0,
        lastAttemptAt: state ? state.lastAttemptAt : null,
        isStale: state ? state.isStale : false,
      };
    });

    res.status(200).json({
      success: true,
      count: overview.length,
      mastery: overview,
      overview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Next Adaptive Action and optimal question
// @route   GET /api/adaptive/next-action
// @access  Private / Optional Auth
exports.getNextAction = async (req, res, next) => {
  try {
    const learnerId = req.user?.id || req.query.learnerId;
    if (!learnerId) {
      return res.status(400).json({ success: false, message: 'learnerId is required' });
    }

    const targetConceptId = req.query.conceptId || null;
    const result = await getNextLearningAction(learnerId, targetConceptId);

    res.status(200).json({
      success: true,
      action: result.action,
      targetConcept: {
        id: result.activeConcept._id,
        _id: result.activeConcept._id,
        name: result.activeConcept.name,
        slug: result.activeConcept.slug,
        order: result.activeConcept.order,
      },
      reason: result.reason,
      decisionFactors: result.decisionFactors,
      decisionId: result.decision._id,
      nextQuestion: result.nextQuestion
        ? {
            id: result.nextQuestion._id,
            _id: result.nextQuestion._id,
            questionId: result.nextQuestion._id,
            question: result.nextQuestion.question,
            type: result.nextQuestion.type,
            difficulty: result.nextQuestion.difficulty,
            options: result.nextQuestion.options,
            codeSnippet: result.nextQuestion.codeSnippet,
            concept: result.nextQuestion.conceptId,
            conceptId: result.nextQuestion.conceptId,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full 12-concept learning path status for learner
// @route   GET /api/adaptive/learning-path
// @access  Private / Optional Auth
exports.getLearningPath = async (req, res, next) => {
  try {
    const learnerId = req.user?.id || req.query.learnerId;
    if (!learnerId) {
      return res.status(400).json({ success: false, message: 'learnerId is required' });
    }

    let pathNodes = await LearningPath.find({ learnerId })
      .populate('conceptId', 'slug name order requiredMastery difficultyRange')
      .sort({ position: 1 });

    // If path not yet initialized, trigger evaluation to populate
    if (pathNodes.length === 0) {
      await getNextLearningAction(learnerId);
      pathNodes = await LearningPath.find({ learnerId })
        .populate('conceptId', 'slug name order requiredMastery difficultyRange')
        .sort({ position: 1 });
    }

    res.status(200).json({
      success: true,
      count: pathNodes.length,
      learningPath: pathNodes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit trail of adaptive decisions
// @route   GET /api/adaptive/decisions
// @access  Private / Optional Auth
exports.getDecisions = async (req, res, next) => {
  try {
    const learnerId = req.user?.id || req.query.learnerId;
    if (!learnerId) {
      return res.status(400).json({ success: false, message: 'learnerId is required' });
    }

    const decisions = await Decision.find({ learnerId })
      .populate('conceptId', 'slug name order')
      .sort({ timestamp: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: decisions.length,
      decisions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attempt history for a learner
// @route   GET /api/adaptive/attempts
// @access  Private / Optional Auth
exports.getAttempts = async (req, res, next) => {
  try {
    const learnerId = req.user?.id || req.query.learnerId;
    if (!learnerId) {
      return res.status(400).json({ success: false, message: 'learnerId is required' });
    }

    const { conceptId, limit = 50 } = req.query;
    const filter = { learnerId };
    if (conceptId) filter.conceptId = conceptId;

    const attempts = await Attempt.find(filter)
      .populate('conceptId', 'slug name order')
      .populate('questionId', 'question type difficulty options codeSnippet explanation')
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get 10 cold-start diagnostic questions covering foundational concepts
// @route   GET /api/adaptive/diagnostic-questions
// @access  Public
exports.getDiagnosticQuestions = async (req, res, next) => {
  try {
    const diagnosticSlugs = [
      'programming-basics',
      'variables-datatypes',
      'operators',
      'conditionals',
      'loops',
      'functions',
      'oop-basics',
      'encapsulation',
      'inheritance',
      'exception-handling',
    ];

    const concepts = await Concept.find({ slug: { $in: diagnosticSlugs } }).sort({ order: 1 });
    const conceptMap = new Map();
    concepts.forEach((c) => conceptMap.set(c.slug, c));

    const questions = [];
    for (const slug of diagnosticSlugs) {
      const c = conceptMap.get(slug);
      if (c) {
        // Pick one representative question (preferably difficulty 1 or 2)
        const q = await Question.findOne({ conceptId: c._id, active: true })
          .populate('conceptId', 'slug name order')
          .select('-correctAnswer')
          .sort({ difficulty: 1 });
        if (q) questions.push(q);
      }
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get synthesized Career Evidence (Claimed vs Verified skills)
// @route   GET /api/adaptive/career-evidence
// @access  Private / Optional Auth
exports.getCareerEvidence = async (req, res, next) => {
  try {
    const learnerId = req.user?.id || req.query.learnerId;
    if (!learnerId) {
      return res.status(400).json({ success: false, message: 'learnerId is required' });
    }

    const CareerEvidence = require('../models/CareerEvidence');
    let evidenceList = await CareerEvidence.find({ learnerId }).populate('conceptId', 'name slug order requiredMastery');

    // Auto-seed default resume/github claimed skills if none exist
    if (evidenceList.length === 0) {
      const concepts = await Concept.find({ active: true });
      const conceptMap = new Map();
      concepts.forEach((c) => conceptMap.set(c.slug, c));

      const defaultClaims = [
        {
          skillName: 'Core Java Syntax & Bytecode',
          conceptSlug: 'programming-basics',
          source: 'resume',
          claimedProficiency: 85,
        },
        {
          skillName: 'Object-Oriented Programming (OOP)',
          conceptSlug: 'oop-basics',
          source: 'resume',
          claimedProficiency: 90,
        },
        {
          skillName: 'Java Collections Framework',
          conceptSlug: 'collections',
          source: 'github',
          claimedProficiency: 80,
        },
        {
          skillName: 'Exception Handling Architecture',
          conceptSlug: 'exception-handling',
          source: 'resume',
          claimedProficiency: 75,
        },
        {
          skillName: 'Algorithm Design & Problem Solving',
          conceptSlug: 'problem-solving',
          source: 'github',
          claimedProficiency: 70,
        },
      ];

      for (const claim of defaultClaims) {
        const c = conceptMap.get(claim.conceptSlug);
        await CareerEvidence.create({
          learnerId,
          skillName: claim.skillName,
          conceptId: c ? c._id : null,
          source: claim.source,
          claimedProficiency: claim.claimedProficiency,
          status: 'claimed',
        });
      }

      evidenceList = await CareerEvidence.find({ learnerId }).populate('conceptId', 'name slug order requiredMastery');
    }

    // Cross-reference with live LearnerState
    const states = await LearnerState.find({ learnerId });
    const stateMap = new Map();
    states.forEach((s) => stateMap.set(s.conceptId.toString(), s));

    const enrichedList = [];
    let claimedCount = 0;
    let verifiedCount = 0;
    let discrepancyCount = 0;

    for (const ev of evidenceList) {
      claimedCount++;
      let verifiedProficiency = 0;
      let status = ev.status;
      let hasDiscrepancy = false;
      let discrepancyNote = null;

      if (ev.conceptId) {
        const s = stateMap.get(ev.conceptId._id.toString());
        if (s) {
          verifiedProficiency = s.mastery;
          if (s.mastery >= 70 && s.uncertainty <= 30) {
            status = 'verified';
            verifiedCount++;
          } else if (s.evidenceCount > 0) {
            status = 'verifying';
          }

          // Discrepancy detection: Claimed high, but tested poorly
          if (ev.claimedProficiency >= 75 && s.mastery < 40 && s.evidenceCount >= 2) {
            hasDiscrepancy = true;
            discrepancyCount++;
            discrepancyNote = `Claimed ${ev.claimedProficiency}% on ${ev.source}, but demonstrated only ${s.mastery}% in adaptive evaluation.`;
          }
        }
      }

      enrichedList.push({
        id: ev._id,
        skillName: ev.skillName,
        source: ev.source,
        claimedProficiency: ev.claimedProficiency,
        verifiedProficiency,
        status,
        hasDiscrepancy,
        discrepancyNote,
        concept: ev.conceptId ? { name: ev.conceptId.name, slug: ev.conceptId.slug } : null,
      });
    }

    res.status(200).json({
      success: true,
      count: enrichedList.length,
      skills: enrichedList,
      summary: {
        totalClaimed: claimedCount,
        totalVerified: verifiedCount,
        totalDiscrepancies: discrepancyCount,
      },
    });
  } catch (error) {
    next(error);
  }
};


