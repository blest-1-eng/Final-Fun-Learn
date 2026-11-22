export type ClassAge = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type LearningMode =
  | 'abc'
  | 'numbers'
  | 'numbers50'
  | 'numbers100'
  | 'hindivarna'
  | 'hindimatras'
  | 'hindiwords'
  | 'tables2to5'
  | 'tables2to20'
  | 'visualdiv'
  | 'advancedhindi'
  | 'visualsub'
  | 'visualmul'
  | 'phonics'
  | 'english'
  | 'sentences'
  | 'visualadd'
  | 'visualgreaterless';

export type QuizMode =
  | 'ws1'
  | 'ws2'
  | 'ws3'
  | 'ws4'
  | 'hinditest'
  | 'matratest'
  | 'wordreadtest'
  | 'table2to5test'
  | 'table2to20test'
  | 'divisionquiz'
  | 'hindisentencequiz'
  | 'missingword'
  | 'sentencefill'
  | 'greaterlessquiz'
  | 'addition'
  | 'addition2'
  | 'subtraction'
  | 'multiplication'
  | 'tables'
  | 'tables20'
  | 'wordmath'
  | 'tests';

export type FeatureMode = LearningMode | QuizMode;

export interface MenuFeatureItem {
  emoji: string;
  label: string;
  mode: FeatureMode;
}

export interface BasicLearningCard {
  l: string;
  w: string;
  e: string;
  c: string;
  n?: number;
}

export interface TableLearningItem {
  tableNum: number;
  l: string;
  contentStr: string;
  e: string;
  c: string;
}

export interface VisualMathOpItem {
  a: number;
  b: number;
  symbol: string;
  title: string;
}

export interface VisualDivisionItem {
  total: number;
  groups: number;
  symbol: string;
  title: string;
}

export interface VisualGreaterLessItem {
  n1: number;
  n2: number;
  symbol: string;
  sign: '>' | '<';
  title: string;
}

export interface AdvancedHindiSentenceItem {
  sentence: string;
  hint: string;
  target: string;
  meaning: string;
  e: string;
  c: string;
}

export interface WorksheetQuestion {
  target: string | number;
  options: Array<string | number>;
  topicLabel: string;
  subjectLabel: string;
  promptSummary: string;
  isHindiTest?: boolean;
  isMatraTest?: boolean;
  isWordReadTest?: boolean;
  isTableTest?: boolean;
  isDivisionTest?: boolean;
  isHindiSentenceTest?: boolean;
  isMissingWord?: boolean;
  isSentenceFill?: boolean;
  isGreaterLess?: boolean;
  targetEmoji?: string;
  targetWord?: string;
  a?: number;
  b?: number;
  n1?: number;
  n2?: number;
  sentence?: string;
  emoji?: string;
  word?: string;
  missingIndex?: number;
}

export interface IncorrectAnswerRecord {
  mode: string;
  subject: string;
  topic: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  timestamp: string;
}

export interface TestHistoryItem {
  studentId?: string;
  age: number;
  className: string;
  mode: string;
  subject?: string;
  score: number;
  wrong: number;
  date: string;
  incorrectItems?: IncorrectAnswerRecord[];
}

export interface StudentProfile {
  id: string;
  name: string;
  age: ClassAge;
  createdAt: string;
}

export interface NyraLevelActivity {
  title: string;
  instruction: string;
  example: string;
}

export interface NyraPracticeQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  hint: string;
}

export interface NyraLevel {
  id: string;
  studentId: string;
  classAge: ClassAge;
  className: string;
  difficulty: 'foundational' | 'steady' | 'challenge';
  title: string;
  subject: string;
  topic: string;
  learningObjective: string;
  simpleExplanation: string;
  activities: NyraLevelActivity[];
  practiceQuestions: NyraPracticeQuestion[];
  completionCriteria: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  source: 'backend' | 'local-offline';
}

export type NyraQuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer';

export interface NyraTestQuestion {
  id: string;
  type: NyraQuestionType;
  topic: string;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface NyraTest {
  id: string;
  studentId: string;
  linkedLevelId?: string;
  classAge: ClassAge;
  className: string;
  subject: string;
  topic: string;
  difficulty: 'foundational' | 'steady' | 'challenge';
  title: string;
  questions: NyraTestQuestion[];
  createdAt: string;
  source: 'backend' | 'local-offline';
}

export interface NyraTestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string;
  classAge: ClassAge;
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  weakTopics: string[];
  incorrectItems: IncorrectAnswerRecord[];
  createdAt: string;
}

export interface NyraChatPracticePrompt {
  question: string;
  options: string[];
  correctAnswer: string;
  praise: string;
}

export interface NyraChatMessage {
  id: string;
  role: 'nyra' | 'student';
  text: string;
  hint?: string;
  example?: string;
  practice?: NyraChatPracticePrompt;
  timestamp: string;
  source?: 'backend' | 'local-offline';
}

export interface NyraLowScoreTriggerContext {
  mode: string;
  testTitle: string;
  subject: string;
  topic: string;
  score: number;
  wrongCount: number;
  reason: 'low_score' | 'repeated_mistakes' | 'performance_drop' | 'manual';
  incorrectItems: IncorrectAnswerRecord[];
  weakTopics: string[];
}

export interface NyraSettings {
  lowScoreThreshold: number;
  repeatedMistakeThreshold: number;
}

export interface StudentPerformanceContext {
  studentId: string;
  studentName: string;
  selectedClass: ClassAge;
  className: string;
  subject: string;
  currentLearningLevel: string;
  previousTestScores: number[];
  recentHistory: TestHistoryItem[];
  incorrectAnswers: IncorrectAnswerRecord[];
  weakTopics: string[];
  completedLessons: string[];
  completedNyraLevels: string[];
}

export interface NyraQuotaInfo {
  day: string;
  userUsedToday: number;
  userDailyLimit: number;
  userRemainingToday: number;
  cooldownActive: boolean;
  message: string;
}

export interface NyraBackendHealth {
  ok: boolean;
  status: string;
  company?: string;
  service?: string;
  model?: string;
  groqConfigured?: boolean;
  requireAppCheck?: boolean;
  requireFirebaseAuth?: boolean;
  quota?: {
    day?: string;
    orgRequestsToday?: number;
    orgDailyReqLimit?: number;
    userDailyReqLimit?: number;
    userRpmLimit?: number;
    cooldownActive?: boolean;
    note?: string;
  };
  checkedAt: string;
  error?: string;
}

export type NepZoneId =
  | 'logical_thinking'
  | 'digital_ai'
  | 'env_sustainability'
  | 'financial_literacy'
  | 'indian_heritage'
  | 'life_skills_sel'
  | 'art_creativity'
  | 'stem_innovation';

export type NepPedagogyTier = 'play' | 'foundational' | 'conceptual';

export interface NepLessonItem {
  id: string;
  title: string;
  hindiTitle: string;
  emojiVisual: string;
  explanation: string;
  indianExample: string;
  funFact: string;
  askNyraPrompt: string;
}

export interface NepClassifyItem {
  id: string;
  label: string;
  emoji: string;
  bucket: 'left' | 'right';
}

export interface NepSequenceStep {
  id: string;
  label: string;
  emoji: string;
  order: number;
}

export interface NepPracticeActivity {
  kind: 'classify' | 'sequence' | 'experiment';
  title: string;
  instruction: string;
  leftBucketLabel?: string;
  rightBucketLabel?: string;
  classifyItems?: NepClassifyItem[];
  sequenceSteps?: NepSequenceStep[];
  prompt?: string;
  options?: Array<{ label: string; emoji: string; correct: boolean; feedback: string }>;
  successMessage: string;
}

export interface NepQuizQuestion {
  id: string;
  prompt: string;
  emoji: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
}

export interface NepBadgeMeta {
  id: string;
  title: string;
  emoji: string;
}

export interface NepGradeModule {
  zoneId: NepZoneId;
  classAge: ClassAge;
  className: string;
  pedagogyTier: NepPedagogyTier;
  moduleTitle: string;
  hindiSubtitle: string;
  ncertGoalNote: string;
  lessons: NepLessonItem[];
  activity: NepPracticeActivity;
  quiz: NepQuizQuestion[];
  realLifeChallenge: {
    title: string;
    instruction: string;
    familyTip: string;
  };
  badge: NepBadgeMeta;
}

export interface NepZoneDefinition {
  id: NepZoneId;
  emoji: string;
  title: string;
  shortTitle: string;
  hindiTitle: string;
  accentColor: string;
  bgGradient: string;
  nepPillarTag: string;
}

export interface NepZoneProgressRecord {
  zoneId: NepZoneId;
  classAge: ClassAge;
  lessonsViewed: boolean;
  activityDone: boolean;
  quizBestScore: number | null;
  challengeDone: boolean;
  updatedAt: string;
}

export interface NepEarnedBadge {
  badgeId: string;
  zoneId: NepZoneId;
  classAge: ClassAge;
  title: string;
  emoji: string;
  earnedAt: string;
}

