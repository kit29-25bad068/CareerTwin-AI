// Type definitions for CareerTwin AI Next.js / React 19 Frontend

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  githubUrl?: string;
  codolioUrl?: string;
  role?: string;
  targetRole?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface CategoryCounts {
  [category: string]: number;
}

export interface CompanySummary {
  company: string;
  totalQuestions: number;
  availableCategories: string[] | string;
  categoryCounts: Record<string, number>;
  metadata?: {
    source?: string;
    datasetSource?: string;
    importedAt?: string;
  };
}

export interface QuestionItem {
  id?: string;
  text: string;
  category: string;
  subcategory?: string;
  roles?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  expectedConcepts?: string[];
  sourceReference?: string;
}

export interface CompanyInterviewData {
  company: string;
  companyKey: string;
  description?: string;
  totalQuestions: number;
  questions: QuestionItem[];
  categories: Record<string, QuestionItem[]>;
  metadata?: {
    source?: string;
    datasetSource?: string;
    importedAt?: string;
  };
}

export type QuestionSourceType = 'database_question' | 'pattern_derived' | 'generic_role_based';

export interface InterviewQuestion {
  questionNumber: number;
  question: string;
  category: string;
  sourceType: QuestionSourceType;
  sourceId?: string;
  whyThisQuestion?: string;
  candidateAnswer?: string;
  transcription?: string;
  audioDurationSeconds?: number;
  speechMetrics?: {
    wpm?: number;
    pauseCount?: number;
    fillerWordsCount?: number;
    fillerWordsDetected?: string[];
  };
  visionMetrics?: {
    eyeContactPercentage?: number;
    facePresencePercentage?: number;
    lookAwayCount?: number;
  };
  evaluation?: {
    overallScore?: number;
    technicalAccuracy?: number;
    communicationClarity?: number;
    problemSolving?: number;
    strengths?: string[];
    improvements?: string[];
    feedback?: string;
  };
  answeredAt?: string;
}

export interface InterviewSession {
  _id: string;
  id?: string;
  user?: string;
  companyTwin: string;
  targetRole: string;
  recruiterPersona: string;
  experienceLevel: string;
  difficulty: string;
  isComplete: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: InterviewQuestion[];
  overallScore?: number;
  performanceSummary?: {
    technicalScore?: number;
    communicationScore?: number;
    readinessTier?: string;
    strengths?: string[];
    keyGaps?: string[];
    actionItems?: string[];
  };
  createdAt?: string;
  completedAt?: string;
}

export interface Concept {
  id: string;
  title: string;
  domain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  prerequisites: string[];
  subconcepts?: string[];
}

export interface LearnerConceptState {
  conceptId: string;
  mastery: number; // 0 - 100
  uncertainty: number; // 5 - 100
  attemptsCount: number;
  lastAttemptAt?: string;
  status: 'LOCKED' | 'READY_TO_LEARN' | 'IN_PROGRESS' | 'MASTERED' | 'NEEDS_REVIEW';
}

export interface AdaptiveDecision {
  action: 'ADVANCE' | 'PRACTICE' | 'REVIEW' | 'REMEDIATE_PREREQUISITE' | 'CHALLENGE' | 'TEACHER_INTERVENTION';
  targetConceptId: string;
  targetConceptTitle: string;
  reason: string;
  decisionFactors: {
    currentMastery: number;
    currentUncertainty: number;
    consecutiveFailures: number;
    prerequisiteBlockers: string[];
    daysSinceLastAttempt?: number;
    antiGamingApplied?: boolean;
    teacherOverrideActive?: boolean;
  };
  nextQuestion?: {
    id: string;
    conceptId: string;
    type: 'MCQ' | 'CodeOutput' | 'Debugging' | 'Coding' | 'Scenario' | 'Transfer';
    prompt: string;
    codeSnippet?: string;
    options?: string[];
    difficulty: string;
  };
}

export interface CareerTwinState {
  readinessIndex: number;
  targetRole: string;
  careerGoals: Array<{ goal: string; targetDate: string; completed: boolean }>;
  verifiedSkills: Array<{ name: string; level: number; category: string }>;
  skillGaps: Array<{ skill: string; priority: 'high' | 'medium' | 'low'; recommendation: string }>;
  recentScores: {
    technical: number;
    communication: number;
    problemSolving: number;
    coding: number;
  };
  githubStats?: {
    username: string;
    repoCount: number;
    languages: Record<string, number>;
  };
  codolioStats?: {
    username: string;
    platformsConnected: string[];
    totalSolved: number;
  };
}
