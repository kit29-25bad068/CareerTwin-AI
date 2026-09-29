const User = require('../models/User');
const Concept = require('../models/Concept');
const LearnerState = require('../models/LearnerState');
const Decision = require('../models/Decision');
const TeacherOverride = require('../models/TeacherOverride');
const Intervention = require('../models/Intervention');
const AuditLog = require('../models/AuditLog');
const Attempt = require('../models/Attempt');

const { getNextLearningAction } = require('../services/adaptiveEngine');

// @desc    Get cohort overview of all student learners
// @route   GET /api/teacher/cohort
// @access  Teacher / Admin
exports.getCohort = async (req, res, next) => {
  try {
    const students = await User.find({ role: { $in: ['student', 'user'] } }).select('-password');
    const concepts = await Concept.find({ active: true }).sort({ order: 1 });
    const totalConcepts = concepts.length || 12;

    const cohortData = [];

    for (const student of students) {
      const states = await LearnerState.find({ learnerId: student._id });
      const attemptsCount = await Attempt.countDocuments({ learnerId: student._id });
      const pendingInterventions = await Intervention.countDocuments({
        learnerId: student._id,
        status: { $in: ['PENDING', 'IN_PROGRESS'] },
      });

      let avgMastery = 0;
      let avgUncertainty = 100;
      let masteredCount = 0;

      if (states.length > 0) {
        const sumMastery = states.reduce((sum, s) => sum + s.mastery, 0);
        const sumUncertainty = states.reduce((sum, s) => sum + s.uncertainty, 0);
        avgMastery = Math.round(sumMastery / totalConcepts);
        avgUncertainty = Math.round(sumUncertainty / totalConcepts);
        masteredCount = states.filter((s) => s.mastery >= 70 && s.uncertainty <= 30).length;
      }

      // Latest Decision
      const latestDecision = await Decision.findOne({ learnerId: student._id })
        .populate('conceptId', 'name slug order')
        .sort({ timestamp: -1 });

      cohortData.push({
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        avgMastery,
        avgUncertainty,
        masteredCount,
        totalConcepts,
        attemptsCount,
        pendingInterventions,
        currentAction: latestDecision?.action || 'PRACTICE',
        targetConcept: latestDecision?.conceptId?.name || 'Programming Basics',
        lastActive: student.updatedAt,
      });
    }

    res.status(200).json({
      success: true,
      count: cohortData.length,
      cohort: cohortData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active intervention alerts across cohort
// @route   GET /api/teacher/interventions
// @access  Teacher / Admin
exports.getInterventions = async (req, res, next) => {
  try {
    const students = await User.find({ role: { $in: ['student', 'user'] } });
    const concepts = await Concept.find({ active: true });
    const conceptMap = new Map();
    concepts.forEach((c) => conceptMap.set(c._id.toString(), c));

    // Automated scanning for intervention conditions
    for (const student of students) {
      // 1. Check for 3+ consecutive failures
      const recentAttempts = await Attempt.find({ learnerId: student._id })
        .sort({ timestamp: -1 })
        .limit(5);

      let consecutiveFails = 0;
      for (const a of recentAttempts) {
        if (!a.correct) consecutiveFails++;
        else break;
      }

      if (consecutiveFails >= 3) {
        const existing = await Intervention.findOne({
          learnerId: student._id,
          triggerType: 'CONSECUTIVE_FAILURES',
          status: 'PENDING',
        });
        if (!existing) {
          const failedConcept = conceptMap.get(recentAttempts[0].conceptId.toString());
          await Intervention.create({
            learnerId: student._id,
            conceptId: failedConcept ? failedConcept._id : null,
            triggerType: 'CONSECUTIVE_FAILURES',
            triggerDetails: {
              consecutiveFails,
              conceptName: failedConcept ? failedConcept.name : 'Unknown',
              detectedAt: new Date(),
            },
            notes: `Student experienced ${consecutiveFails} consecutive incorrect attempts on ${failedConcept ? failedConcept.name : 'Java Core'}. Requires 1-on-1 pedagogical review.`,
            status: 'PENDING',
          });
        }
      }

      // 2. Check for high uncertainty despite attempts
      const states = await LearnerState.find({ learnerId: student._id });
      for (const state of states) {
        if (state.evidenceCount >= 4 && state.uncertainty > 60) {
          const existing = await Intervention.findOne({
            learnerId: student._id,
            conceptId: state.conceptId,
            triggerType: 'CONFLICTING_EVIDENCE_HIGH_UNCERTAINTY',
            status: 'PENDING',
          });
          if (!existing) {
            const concept = conceptMap.get(state.conceptId.toString());
            await Intervention.create({
              learnerId: student._id,
              conceptId: state.conceptId,
              triggerType: 'CONFLICTING_EVIDENCE_HIGH_UNCERTAINTY',
              triggerDetails: {
                uncertainty: state.uncertainty,
                evidenceCount: state.evidenceCount,
                conceptName: concept ? concept.name : 'Unknown',
              },
              notes: `High uncertainty (${state.uncertainty}%) after ${state.evidenceCount} attempts on ${concept ? concept.name : 'concept'}. Likely misconception or guessing pattern.`,
              status: 'PENDING',
            });
          }
        }
      }
    }

    const interventions = await Intervention.find({ status: { $in: ['PENDING', 'IN_PROGRESS'] } })
      .populate('learnerId', 'name email role')
      .populate('conceptId', 'name slug order')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interventions.length,
      interventions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a teacher override for an adaptive action
// @route   POST /api/teacher/override
// @access  Teacher / Admin
exports.postOverride = async (req, res, next) => {
  try {
    const { learnerId, conceptId, teacherAction, reason } = req.body;

    if (!learnerId || !conceptId || !teacherAction) {
      return res.status(400).json({
        success: false,
        message: 'learnerId, conceptId, and teacherAction are required',
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory pedagogical reason (at least 5 characters) is required for teacher overrides',
      });
    }

    // Verify Learner and Concept exist
    const learner = await User.findById(learnerId);
    if (!learner) return res.status(404).json({ success: false, message: 'Learner not found' });

    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ success: false, message: 'Concept not found' });

    // Find original latest decision
    const originalDecision = await Decision.findOne({ learnerId }).sort({ timestamp: -1 });

    const teacherId = req.user?.id || req.body.teacherId || learnerId; // Default fallback to active teacher

    // Create Immutable TeacherOverride Record
    const override = await TeacherOverride.create({
      learnerId,
      conceptId: concept._id,
      originalDecisionId: originalDecision ? originalDecision._id : concept._id,
      originalAction: originalDecision ? originalDecision.action : 'PRACTICE',
      teacherAction,
      teacherId,
      reason: reason.trim(),
      timestamp: new Date(),
    });

    // Create AuditLog Record
    await AuditLog.create({
      actorId: teacherId,
      actorRole: 'teacher',
      action: 'TEACHER_OVERRIDE',
      learnerId,
      conceptId: concept._id,
      details: {
        teacherAction,
        reason: reason.trim(),
        originalAction: originalDecision ? originalDecision.action : 'PRACTICE',
        overrideId: override._id,
      },
      timestamp: new Date(),
    });

    // Trigger Adaptive Engine Re-evaluation
    const updatedDecision = await getNextLearningAction(learnerId, concept._id);

    res.status(201).json({
      success: true,
      message: 'Teacher override successfully recorded and applied to adaptive engine',
      override,
      updatedDecision,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get immutable audit log for teacher overrides
// @route   GET /api/teacher/audit-log
// @access  Teacher / Admin
exports.getAuditLog = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const logs = await AuditLog.find({ action: 'TEACHER_OVERRIDE' })
      .populate('actorId', 'name email role')
      .populate('learnerId', 'name email')
      .populate('conceptId', 'name slug order')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve or dismiss an intervention
// @route   PUT /api/teacher/interventions/:id/resolve
// @access  Teacher / Admin
exports.resolveIntervention = async (req, res, next) => {
  try {
    const { status = 'RESOLVED', notes = '' } = req.body;
    const intervention = await Intervention.findById(req.params.id);

    if (!intervention) {
      return res.status(404).json({ success: false, message: 'Intervention not found' });
    }

    intervention.status = status;
    if (notes) intervention.notes = `${intervention.notes} | Resolution: ${notes}`;
    intervention.resolvedAt = new Date();
    await intervention.save();

    res.status(200).json({
      success: true,
      message: `Intervention marked as ${status}`,
      intervention,
    });
  } catch (error) {
    next(error);
  }
};
