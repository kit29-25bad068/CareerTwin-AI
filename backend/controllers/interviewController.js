const fs = require('fs');
const path = require('path');
const Interview = require('../models/Interview');
const CareerProfile = require('../models/CareerProfile');
const CompanyInterviewData = require('../models/CompanyInterviewData');
const geminiService = require('../services/geminiService');
const whisperService = require('../services/whisperService');

// @desc    Start a new AI mock interview session
// @route   POST /api/interviews
// @access  Private
exports.createInterview = async (req, res, next) => {
  try {
    const {
      role,
      company,
      interviewType,
      difficulty,
      recruiterType,
      privacyMode,
      cameraEnabled,
      micEnabled,
    } = req.body;

    const profile = await CareerProfile.findOne({ user: req.user._id });
    const targetRole = role || profile?.targetRole || 'Software Engineer';
    const targetCompany = company || 'General Tech Company';
    const chosenType = interviewType || 'Mixed';
    const chosenDifficulty = difficulty || 'Medium';
    const chosenRecruiter = recruiterType || 'Technical Interviewer';
    const chosenPrivacyMode = privacyMode === 'replay' ? 'replay' : 'privacy';

    // 1. Retrieve company grounding data from MongoDB
    const companyData = await CompanyInterviewData.findOne({
      company: new RegExp('^' + targetCompany.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i'),
    });

    // 2. Generate First Question using Gemini (Dual-Source Grounded)
    let firstQuestion;
    try {
      firstQuestion = await geminiService.generateInterviewQuestion({
        role: targetRole,
        company: targetCompany,
        interviewType: chosenType,
        difficulty: chosenDifficulty,
        recruiterType: chosenRecruiter,
        questionIndex: 0,
        previousQuestions: [],
        previousAnswers: [],
        companyInterviewData: companyData,
      });
    } catch (aiErr) {
      console.warn('[Interview Gemini Warning] Fallback question used:', aiErr.message);
      firstQuestion = geminiService.getDynamicFallbackQuestion(targetRole, 0, chosenDifficulty, companyData, targetCompany);
    }

    // 3. Create Interview document in MongoDB
    const interview = await Interview.create({
      user: req.user._id,
      role: targetRole,
      company: targetCompany,
      interviewType: chosenType,
      difficulty: chosenDifficulty,
      recruiterType: chosenRecruiter,
      privacyMode: chosenPrivacyMode,
      cameraEnabled: Boolean(cameraEnabled),
      micEnabled: micEnabled !== false,
      status: 'in-progress',
      startedAt: new Date(),
      questions: [
        {
          questionIndex: 0,
          questionText: firstQuestion.questionText,
          category: firstQuestion.category || 'technical',
          difficulty: firstQuestion.difficulty || chosenDifficulty,
          expectedConcepts: firstQuestion.expectedConcepts || [],
          sourceType: firstQuestion.sourceType || (companyData ? 'pattern_derived' : 'generic_role_based'),
          sourceId: firstQuestion.sourceId || null,
          whyThisQuestion: firstQuestion.whyThisQuestion || (companyData ? "Generated from patterns found in the company's collected interview data." : "Generated from general interview patterns for your selected role."),
        },
      ],
      events: [
        {
          timestampSeconds: 0,
          formattedTime: '00:00',
          type: 'INFO',
          category: 'other',
          title: 'Interview Session Started',
          description: `Simulation initialized with ${chosenRecruiter} representing ${targetCompany} in ${chosenPrivacyMode === 'privacy' ? 'Privacy Mode (no media stored)' : 'Replay Mode (secure media saved)'}.`,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Interview session initialized.',
      interview,
      currentQuestion: interview.questions[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all interviews for current user
// @route   GET /api/interviews
// @access  Private
exports.getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-questions.audioUrl');
    res.status(200).json({ success: true, count: interviews.length, interviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview details & report
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    // Defensive check: If finalReport is missing or incomplete, auto-populate so the UI never displays stuck 'Loading...' placeholders
    if (!interview.finalReport || !interview.finalReport.summary) {
      interview.finalReport = generateDeterministicReport(interview);
      if (interview.status !== 'completed') {
        interview.status = 'completed';
        interview.completedAt = interview.completedAt || new Date();
      }
      await interview.save();
    }

    res.status(200).json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit answer to current question, evaluate, and get next adaptive question
// @route   POST /api/interviews/:id/answer
// @access  Private
exports.submitAnswer = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This interview has already been completed.' });
    }

    const {
      answerText = '',
      durationSeconds = 30,
      currentTimestampSeconds = 0,
      visionMetrics = {},
    } = req.body;

    let finalTranscript = answerText;
    let audioFilePath = req.file ? req.file.path : null;

    // 1. Run Whisper Speech Analysis
    const speechResult = await whisperService.transcribeAudio(
      audioFilePath,
      finalTranscript,
      Number(durationSeconds) || 30
    );
    finalTranscript = speechResult.transcript || finalTranscript || 'Answer provided via microphone.';

    // Privacy cleanup: if privacy mode, delete temporary audio file immediately
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      try {
        fs.unlinkSync(audioFilePath);
      } catch (e) {
        console.warn('Could not delete temp audio:', e.message);
      }
    }

    const currentQIdx = interview.questions.length - 1;
    const currentQ = interview.questions[currentQIdx];

    // 2. Evaluate Answer with Gemini
    let answerEvaluation;
    try {
      answerEvaluation = await geminiService.evaluateAnswer({
        role: interview.role,
        question: currentQ.questionText,
        answerText: finalTranscript,
        category: currentQ.category,
        difficulty: currentQ.difficulty,
        recruiterType: interview.recruiterType,
      });
    } catch (aiErr) {
      console.warn('[Answer Eval Warning] Fallback evaluation used:', aiErr.message);
      answerEvaluation = {
        technicalScore: finalTranscript.length > 50 ? 75 : 55,
        communicationScore: speechResult.speechMetrics.wordsPerMinute > 100 ? 80 : 65,
        problemSolvingScore: 70,
        whatWasCorrect: ['Addressed the main question topic directly'],
        whatWasMissing: ['Could provide deeper architectural trade-offs'],
        improvementTips: ['Structure thoughts using Problem-Action-Result format'],
        recommendedConcepts: ['System Design principles', 'Core Data Structures'],
        feedbackSummary: 'Clear answer with foundational understanding.',
      };
    }

    let parsedVisionMetrics = {};
    if (typeof visionMetrics === 'string') {
      try {
        parsedVisionMetrics = JSON.parse(visionMetrics);
      } catch (e) {
        parsedVisionMetrics = {};
      }
    } else if (typeof visionMetrics === 'object' && visionMetrics !== null) {
      parsedVisionMetrics = visionMetrics;
    }

    // 3. Save Question Details
    currentQ.answerText = finalTranscript;
    currentQ.durationSeconds = Number(durationSeconds) || 30;
    currentQ.answeredAt = new Date();
    currentQ.speechMetrics = speechResult.speechMetrics;
    currentQ.visionMetrics = {
      faceDetectedPercentage: parsedVisionMetrics.faceDetectedPercentage ?? 100,
      eyeContactPercentage: parsedVisionMetrics.eyeContactPercentage ?? 100,
      lookingAwayCount: parsedVisionMetrics.lookingAwayCount ?? 0,
      framingQuality: parsedVisionMetrics.framingQuality || 'Good',
    };
    currentQ.evaluation = answerEvaluation;

    // 4. Append timestamped events to interview timeline
    const baseSecs = Number(currentTimestampSeconds) || (currentQIdx * 60);
    const formatTime = (secs) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    // Add evaluation timestamp events
    if (answerEvaluation.technicalScore >= 80) {
      interview.events.push({
        timestampSeconds: baseSecs + 10,
        formattedTime: formatTime(baseSecs + 10),
        type: 'GOOD',
        category: 'technical',
        title: `Strong Technical Explanation (Q${currentQIdx + 1})`,
        description: answerEvaluation.whatWasCorrect[0] || 'Clear, accurate technical breakdown.',
      });
    } else if (answerEvaluation.technicalScore < 60) {
      interview.events.push({
        timestampSeconds: baseSecs + 12,
        formattedTime: formatTime(baseSecs + 12),
        type: 'NEEDS_IMPROVEMENT',
        category: 'technical',
        title: `Concept Gaps Detected (Q${currentQIdx + 1})`,
        description: answerEvaluation.whatWasMissing[0] || 'Review fundamental concepts for this topic.',
      });
    }

    // Add vision and eye contact events
    if (interview.cameraEnabled) {
      const eyePct = currentQ.visionMetrics.eyeContactPercentage;
      const awayCount = currentQ.visionMetrics.lookingAwayCount;

      if (eyePct < 70 || awayCount >= 2) {
        interview.events.push({
          timestampSeconds: baseSecs + 8,
          formattedTime: formatTime(baseSecs + 8),
          type: 'NEEDS_IMPROVEMENT',
          category: 'vision',
          title: `Gaze Shift Detected (Q${currentQIdx + 1})`,
          description: `Averted eye contact ${awayCount} times (${eyePct}% eye contact). Practice looking directly into the camera lens to project confidence.`,
        });
      } else if (eyePct >= 85) {
        interview.events.push({
          timestampSeconds: baseSecs + 8,
          formattedTime: formatTime(baseSecs + 8),
          type: 'GOOD',
          category: 'vision',
          title: `Strong Eye Contact (Q${currentQIdx + 1})`,
          description: `Maintained consistent direct eye contact (${eyePct}%) and steady presence throughout this explanation.`,
        });
      }
    }

    // Add speech events
    if (speechResult.speechMetrics.timestampEvents) {
      speechResult.speechMetrics.timestampEvents.forEach((ev) => {
        interview.events.push({
          timestampSeconds: baseSecs + ev.timestampSeconds,
          formattedTime: formatTime(baseSecs + ev.timestampSeconds),
          type: ev.type,
          category: ev.category,
          title: ev.title,
          description: ev.description,
        });
      });
    }

    // 5. Determine whether to ask next question or conclude (Default 5 questions per session)
    const MAX_QUESTIONS = 5;
    let nextQuestion = null;
    let isComplete = false;

    if (interview.questions.length < MAX_QUESTIONS) {
      const previousQuestions = interview.questions.map((q) => q.questionText);
      const previousAnswers = interview.questions.map((q) => q.answerText);

      // Retrieve company grounding data from MongoDB
      const companyData = await CompanyInterviewData.findOne({
        company: new RegExp('^' + interview.company.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i'),
      });

      try {
        const nextQData = await geminiService.generateInterviewQuestion({
          role: interview.role,
          company: interview.company,
          interviewType: interview.interviewType,
          difficulty: interview.difficulty,
          recruiterType: interview.recruiterType,
          questionIndex: interview.questions.length,
          previousQuestions,
          previousAnswers,
          companyInterviewData: companyData,
        });

        interview.questions.push({
          questionIndex: interview.questions.length,
          questionText: nextQData.questionText,
          category: nextQData.category || 'technical',
          difficulty: nextQData.difficulty || interview.difficulty,
          expectedConcepts: nextQData.expectedConcepts || [],
          sourceType: nextQData.sourceType || (companyData ? 'pattern_derived' : 'generic_role_based'),
          sourceId: nextQData.sourceId || null,
          whyThisQuestion: nextQData.whyThisQuestion || (companyData ? "Generated from patterns found in the company's collected interview data." : "Generated from general interview patterns for your selected role."),
        });
        nextQuestion = interview.questions[interview.questions.length - 1];
      } catch (aiErr) {
        console.warn('[Next Question Warning] Fallback next question used:', aiErr.message);
        const fallbackQ = geminiService.getDynamicFallbackQuestion(
          interview.role,
          interview.questions.length,
          interview.difficulty,
          companyData,
          interview.company
        );
        interview.questions.push({
          questionIndex: interview.questions.length,
          questionText: fallbackQ.questionText,
          category: fallbackQ.category || 'technical',
          difficulty: fallbackQ.difficulty || interview.difficulty,
          expectedConcepts: fallbackQ.expectedConcepts || [],
          sourceType: fallbackQ.sourceType || (companyData ? 'database_question' : 'generic_role_based'),
          sourceId: fallbackQ.sourceId || null,
          whyThisQuestion: fallbackQ.whyThisQuestion || (companyData ? "Selected from the company's interview knowledge base." : "Generated from general interview patterns for your selected role."),
        });
        nextQuestion = interview.questions[interview.questions.length - 1];
      }
    } else {
      isComplete = true;
    }

    await interview.save();

    res.status(200).json({
      success: true,
      evaluatedQuestion: currentQ,
      isComplete,
      nextQuestion,
      currentQuestionIndex: interview.questions.length - (isComplete ? 0 : 1),
      totalQuestions: MAX_QUESTIONS,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to compute deterministic scorecard and diagnostics instantly (<50ms)
 */
function generateDeterministicReport(interview) {
  const answered = (interview.questions || []).filter((q) => q.evaluation && (q.evaluation.technicalScore || q.evaluation.communicationScore));
  const techAvg = answered.length > 0
    ? Math.round(answered.reduce((a, c) => a + (c.evaluation?.technicalScore || 70), 0) / answered.length)
    : 75;
  const commAvg = answered.length > 0
    ? Math.round(answered.reduce((a, c) => a + (c.evaluation?.communicationScore || 70), 0) / answered.length)
    : 78;
  const probAvg = answered.length > 0
    ? Math.round(answered.reduce((a, c) => a + (c.evaluation?.problemSolvingScore || 74), 0) / answered.length)
    : 74;

  const strengths = [
    `Demonstrated clear technical vocabulary and understanding for ${interview.role || 'the position'}`,
    'Maintained structured response progression with direct answers',
  ];
  const weaknesses = [
    'Incorporate deeper architectural trade-offs and performance implications into answers',
  ];

  if (interview.cameraEnabled && interview.questions && interview.questions.length > 0) {
    const avgEye = Math.round(
      interview.questions.reduce((a, c) => a + (c.visionMetrics?.eyeContactPercentage || 100), 0) /
        interview.questions.length
    );
    const totalAway = interview.questions.reduce((a, c) => a + (c.visionMetrics?.lookingAwayCount || 0), 0);
    if (avgEye >= 80) {
      strengths.push(`Strong camera presence: Maintained ${avgEye}% direct gaze consistency throughout answers.`);
    } else if (avgEye < 70 || totalAway >= 3) {
      weaknesses.push(`Averted camera gaze during responses (${avgEye}% average, ${totalAway} gaze shifts). Practice maintaining direct camera focus.`);
    }
  }

  const overall = Math.round((techAvg * 0.45) + (commAvg * 0.35) + (probAvg * 0.2));

  return {
    overallScore: overall,
    technicalScore: techAvg,
    communicationScore: commAvg,
    problemSolvingScore: probAvg,
    answerStructureScore: 72,
    strengths,
    weaknesses,
    mostImportantImprovement: 'Incorporate quantifiable results and concrete architectural choices into technical answers.',
    recommendedPractice: ['Practice STAR structured behavioral questions', 'Review system design scaling techniques'],
    roleReadiness: techAvg >= 80 ? 'Interview Ready' : (techAvg >= 70 ? 'Developing' : 'Early Stage'),
    summary: `Completed mock interview simulation for ${interview.role || 'Software Engineer'} at ${interview.company || 'Target Company'}. Demonstrated solid foundational competencies with clear opportunities for refinement.`,
  };
}

// @desc    Complete interview & generate final comprehensive report
// @route   POST /api/interviews/:id/end
// @access  Private
exports.finishInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    const { totalDurationSeconds = 300 } = req.body;
    interview.totalDurationSeconds = Number(totalDurationSeconds) || 300;
    interview.completedAt = new Date();
    interview.status = 'completed';

    const profile = await CareerProfile.findOne({ user: req.user._id });

    // Generate Final Report via Gemini with 3.5s strict timeout to prevent slow loading
    let finalReport;
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 3500)
      );
      finalReport = await Promise.race([
        geminiService.generateInterviewReport({ interview, profile }),
        timeoutPromise,
      ]);
    } catch (aiErr) {
      console.warn('[Final Report Notice] Instant deterministic report applied:', aiErr.message);
      finalReport = generateDeterministicReport(interview);
    }

    interview.finalReport = finalReport;
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview completed and report generated.',
      interview,
      report: finalReport,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload video/audio recording for Replay Mode
// @route   POST /api/interviews/:id/recording
// @access  Private
exports.uploadRecordingFile = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (interview.privacyMode !== 'replay') {
      // In privacy mode, enforce no storage
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'This interview was conducted in Privacy Mode. Recordings cannot be stored.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No recording file received.' });
    }

    interview.recordingPath = `/uploads/recordings/${req.file.filename}`;
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Recording securely saved for replay.',
      recordingPath: interview.recordingPath,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete recording file for a specific interview (keeps metrics & report)
// @route   DELETE /api/interviews/:id/recording
// @access  Private
exports.deleteRecording = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    if (interview.recordingPath) {
      const fullPath = path.join(__dirname, '../../', interview.recordingPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      interview.recordingPath = null;
      await interview.save();
    }

    res.status(200).json({
      success: true,
      message: 'Interview recording permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an entire interview session
// @route   DELETE /api/interviews/:id
// @access  Private
exports.deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (interview.recordingPath) {
      const fullPath = path.join(__dirname, '../../', interview.recordingPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Interview.findByIdAndDelete(interview._id);

    res.status(200).json({
      success: true,
      message: 'Interview session and related data deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
