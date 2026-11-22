import { getClassName } from '../data/curriculum';
import type {
  ClassAge,
  IncorrectAnswerRecord,
  NepBadgeMeta,
  NepEarnedBadge,
  NepZoneId,
  NepZoneProgressRecord,
  NyraChatMessage,
  NyraLevel,
  NyraLowScoreTriggerContext,
  NyraSettings,
  NyraTest,
  NyraTestAttempt,
  StudentPerformanceContext,
  StudentProfile,
  TestHistoryItem,
} from '../types/learning';

const memoryFallback: Record<string, string> = {};

export const safeStorage = {
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryFallback[key] = value;
    }
  },
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key) || memoryFallback[key] || null;
    } catch {
      return memoryFallback[key] || null;
    }
  },
};

const STUDENTS_KEY = 'funlearn_students_v1';
const ACTIVE_STUDENT_KEY = 'funlearn_active_student_v1';
const NYRA_SETTINGS_KEY = 'funlearn_nyra_settings_v1';
const LEGACY_TEST_HISTORY_KEY = 'baby_play_test_history';
const LEGACY_HISTORY_KEY = 'baby_play_history_v5';

export interface StudentNyraStore {
  completedLessons: string[];
  incorrectAnswers: IncorrectAnswerRecord[];
  levels: NyraLevel[];
  tests: NyraTest[];
  testAttempts: NyraTestAttempt[];
  chatMessages: NyraChatMessage[];
  testHistory: TestHistoryItem[];
  classScoreRing: Record<number, number[]>;
  nepProgress?: Record<string, NepZoneProgressRecord>;
  nepBadges?: NepEarnedBadge[];
}

const DEFAULT_STUDENT_ID = 'student-default';

export function getDefaultStudents(): StudentProfile[] {
  try {
    const raw = safeStorage.getItem(STUDENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudentProfile[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const initial: StudentProfile[] = [
    {
      id: DEFAULT_STUDENT_ID,
      name: 'Learner 1',
      age: 3,
      createdAt: new Date().toISOString(),
    },
  ];
  safeStorage.setItem(STUDENTS_KEY, JSON.stringify(initial));
  return initial;
}

export function saveStudents(students: StudentProfile[]): void {
  safeStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function getActiveStudentId(): string {
  const id = safeStorage.getItem(ACTIVE_STUDENT_KEY);
  if (id) return id;
  safeStorage.setItem(ACTIVE_STUDENT_KEY, DEFAULT_STUDENT_ID);
  return DEFAULT_STUDENT_ID;
}

export function setActiveStudentId(id: string): void {
  safeStorage.setItem(ACTIVE_STUDENT_KEY, id);
}

export function createStudentProfile(name: string, age: ClassAge): StudentProfile {
  const students = getDefaultStudents();
  const trimmed = name.trim() || `Learner ${students.length + 1}`;
  const profile: StudentProfile = {
    id: `student-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    age,
    createdAt: new Date().toISOString(),
  };
  saveStudents([...students, profile]);
  setActiveStudentId(profile.id);
  return profile;
}

export function updateStudentAge(studentId: string, age: ClassAge): StudentProfile[] {
  const students = getDefaultStudents().map((s) =>
    s.id === studentId ? { ...s, age } : s
  );
  saveStudents(students);
  return students;
}

function getStudentStoreKey(studentId: string): string {
  return `funlearn_nyra_student_${studentId}`;
}

function createEmptyStore(): StudentNyraStore {
  return {
    completedLessons: [],
    incorrectAnswers: [],
    levels: [],
    tests: [],
    testAttempts: [],
    chatMessages: [],
    testHistory: [],
    classScoreRing: {},
    nepProgress: {},
    nepBadges: [],
  };
}

export function getStudentStore(studentId: string): StudentNyraStore {
  try {
    const raw = safeStorage.getItem(getStudentStoreKey(studentId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StudentNyraStore>;
      return {
        ...createEmptyStore(),
        ...parsed,
      };
    }
  } catch {
    // ignore
  }

  // Migrate legacy data only into the default student profile without erasing legacy keys
  if (studentId === DEFAULT_STUDENT_ID) {
    try {
      const legacyHistory = JSON.parse(
        safeStorage.getItem(LEGACY_HISTORY_KEY) || '[]'
      ) as TestHistoryItem[];
      const legacyRing = JSON.parse(
        safeStorage.getItem(LEGACY_TEST_HISTORY_KEY) || '{}'
      ) as Record<number, number[]>;
      if (legacyHistory.length > 0 || Object.keys(legacyRing).length > 0) {
        const seeded: StudentNyraStore = {
          ...createEmptyStore(),
          testHistory: legacyHistory,
          classScoreRing: legacyRing,
        };
        saveStudentStore(studentId, seeded);
        return seeded;
      }
    } catch {
      // ignore
    }
  }
  return createEmptyStore();
}

export function saveStudentStore(studentId: string, store: StudentNyraStore): void {
  safeStorage.setItem(getStudentStoreKey(studentId), JSON.stringify(store));
}

export function getNyraSettings(): NyraSettings {
  try {
    const raw = safeStorage.getItem(NYRA_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NyraSettings>;
      return {
        lowScoreThreshold:
          typeof parsed.lowScoreThreshold === 'number' ? parsed.lowScoreThreshold : 50,
        repeatedMistakeThreshold:
          typeof parsed.repeatedMistakeThreshold === 'number'
            ? parsed.repeatedMistakeThreshold
            : 2,
      };
    }
  } catch {
    // ignore
  }
  return { lowScoreThreshold: 50, repeatedMistakeThreshold: 2 };
}

export function saveNyraSettings(settings: NyraSettings): void {
  safeStorage.setItem(NYRA_SETTINGS_KEY, JSON.stringify(settings));
}

export function getRecentTestHistory(studentId: string, currentAge: number): number[] {
  const store = getStudentStore(studentId);
  return store.classScoreRing[currentAge] || [];
}

export function recordTestResultForStudent(
  studentId: string,
  currentAge: number,
  currentScore: number
): number[] {
  const store = getStudentStore(studentId);
  const existing = store.classScoreRing[currentAge] || [];
  const next = [...existing, currentScore];
  if (next.length > 10) next.shift();
  store.classScoreRing[currentAge] = next;
  saveStudentStore(studentId, store);

  // Also keep legacy key updated for default student compatibility
  if (studentId === DEFAULT_STUDENT_ID) {
    try {
      const legacy = JSON.parse(safeStorage.getItem(LEGACY_TEST_HISTORY_KEY) || '{}');
      legacy[currentAge] = next;
      safeStorage.setItem(LEGACY_TEST_HISTORY_KEY, JSON.stringify(legacy));
    } catch {
      // ignore
    }
  }
  return next;
}

export function checkLevelUpEligibility(studentId: string, currentAge: number): boolean {
  const recentScores = getRecentTestHistory(studentId, currentAge);
  if (recentScores.length < 10) return false;
  const perfectOrGreatCount = recentScores.filter((s) => s >= 80).length;
  return perfectOrGreatCount >= 8;
}

export function clearClassProgressAfterLevelUp(studentId: string, oldAge: number): void {
  const store = getStudentStore(studentId);
  store.classScoreRing[oldAge] = [];
  saveStudentStore(studentId, store);
  if (studentId === DEFAULT_STUDENT_ID) {
    try {
      const legacy = JSON.parse(safeStorage.getItem(LEGACY_TEST_HISTORY_KEY) || '{}');
      legacy[oldAge] = [];
      safeStorage.setItem(LEGACY_TEST_HISTORY_KEY, JSON.stringify(legacy));
    } catch {
      // ignore
    }
  }
}

export function saveTestHistoryEntry(
  studentId: string,
  entry: TestHistoryItem,
  newIncorrectItems: IncorrectAnswerRecord[]
): void {
  const store = getStudentStore(studentId);
  const nextHistory = [...store.testHistory, { ...entry, studentId }];
  if (nextHistory.length > 30) nextHistory.shift();
  store.testHistory = nextHistory;

  if (newIncorrectItems.length > 0) {
    const mergedIncorrect = [...store.incorrectAnswers, ...newIncorrectItems];
    store.incorrectAnswers = mergedIncorrect.slice(-40);
  }
  saveStudentStore(studentId, store);

  // Preserve legacy baby_play_history_v5 format
  try {
    const legacy = JSON.parse(safeStorage.getItem(LEGACY_HISTORY_KEY) || '[]') as TestHistoryItem[];
    legacy.push({
      studentId,
      age: entry.age,
      className: entry.className,
      mode: entry.mode,
      subject: entry.subject,
      score: entry.score,
      wrong: entry.wrong,
      date: entry.date,
    });
    if (legacy.length > 20) legacy.shift();
    safeStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(legacy));
  } catch {
    // ignore
  }
}

export function markLessonCompleted(studentId: string, lessonKey: string): void {
  const store = getStudentStore(studentId);
  if (!store.completedLessons.includes(lessonKey)) {
    store.completedLessons = [...store.completedLessons, lessonKey];
    saveStudentStore(studentId, store);
  }
}

export function saveNyraLevel(studentId: string, level: NyraLevel): void {
  const store = getStudentStore(studentId);
  store.levels = [level, ...store.levels.filter((l) => l.id !== level.id)];
  saveStudentStore(studentId, store);
}

export function markNyraLevelCompleted(studentId: string, levelId: string): void {
  const store = getStudentStore(studentId);
  store.levels = store.levels.map((l) =>
    l.id === levelId
      ? { ...l, completed: true, completedAt: new Date().toISOString() }
      : l
  );
  saveStudentStore(studentId, store);
}

export function saveNyraTest(studentId: string, test: NyraTest): void {
  const store = getStudentStore(studentId);
  store.tests = [test, ...store.tests.filter((t) => t.id !== test.id)];
  saveStudentStore(studentId, store);
}

export function saveNyraTestAttempt(studentId: string, attempt: NyraTestAttempt): void {
  const store = getStudentStore(studentId);
  store.testAttempts = [attempt, ...store.testAttempts].slice(0, 30);
  if (attempt.incorrectItems.length > 0) {
    store.incorrectAnswers = [...store.incorrectAnswers, ...attempt.incorrectItems].slice(-40);
  }
  store.testHistory = [
    ...store.testHistory,
    {
      studentId,
      age: attempt.classAge,
      className: getClassName(attempt.classAge),
      mode: `nyra:${attempt.topic}`,
      subject: attempt.subject,
      score: attempt.score,
      wrong: attempt.totalQuestions - attempt.correctCount,
      date: new Date().toLocaleString(),
      incorrectItems: attempt.incorrectItems,
    },
  ].slice(-30);
  saveStudentStore(studentId, store);
}

export function saveNyraChatMessages(studentId: string, messages: NyraChatMessage[]): void {
  const store = getStudentStore(studentId);
  store.chatMessages = messages.slice(-60);
  saveStudentStore(studentId, store);
}

export function deriveWeakTopics(store: StudentNyraStore): string[] {
  const topicCounts: Record<string, number> = {};
  for (const item of store.incorrectAnswers) {
    const label = item.topic || item.subject || item.mode;
    topicCounts[label] = (topicCounts[label] || 0) + 1;
  }
  for (const attempt of store.testAttempts.slice(0, 5)) {
    if (attempt.score < 70) {
      for (const wt of attempt.weakTopics) {
        topicCounts[wt] = (topicCounts[wt] || 0) + 1;
      }
    }
  }
  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

export function buildStudentPerformanceContext(
  student: StudentProfile,
  preferredSubject = 'Math'
): StudentPerformanceContext {
  const store = getStudentStore(student.id);
  const previousTestScores = store.testHistory.slice(-10).map((h) => h.score);
  const avg =
    previousTestScores.length > 0
      ? previousTestScores.reduce((acc, v) => acc + v, 0) / previousTestScores.length
      : null;

  let currentLearningLevel = 'Getting Started';
  if (avg !== null) {
    if (avg >= 85) currentLearningLevel = 'Confident / Ready for Challenge';
    else if (avg >= 60) currentLearningLevel = 'Steady Progress';
    else currentLearningLevel = 'Needs Gentle Foundation Support';
  }

  return {
    studentId: student.id,
    studentName: student.name,
    selectedClass: student.age,
    className: getClassName(student.age),
    subject: preferredSubject,
    currentLearningLevel,
    previousTestScores,
    recentHistory: store.testHistory.slice(-10),
    incorrectAnswers: store.incorrectAnswers.slice(-15),
    weakTopics: deriveWeakTopics(store),
    completedLessons: store.completedLessons,
    completedNyraLevels: store.levels.filter((l) => l.completed).map((l) => l.title),
  };
}

export function evaluateLowScoreTrigger(
  studentId: string,
  classAge: ClassAge,
  score: number,
  wrongCount: number,
  settings: NyraSettings
): NyraLowScoreTriggerContext['reason'] | null {
  if (score < settings.lowScoreThreshold) {
    return 'low_score';
  }
  if (wrongCount >= settings.repeatedMistakeThreshold) {
    return 'repeated_mistakes';
  }
  const ring = getRecentTestHistory(studentId, classAge);
  if (ring.length >= 2) {
    const prior = ring.slice(0, -1);
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
    if (priorAvg - score >= 20) {
      return 'performance_drop';
    }
  }
  return null;
}

export function makeNepProgressKey(zoneId: NepZoneId, classAge: ClassAge): string {
  return `${classAge}:${zoneId}`;
}

export function getNepZoneProgress(
  studentId: string,
  zoneId: NepZoneId,
  classAge: ClassAge
): NepZoneProgressRecord {
  const store = getStudentStore(studentId);
  const key = makeNepProgressKey(zoneId, classAge);
  const existing = store.nepProgress?.[key];
  if (existing) return existing;
  return {
    zoneId,
    classAge,
    lessonsViewed: false,
    activityDone: false,
    quizBestScore: null,
    challengeDone: false,
    updatedAt: '',
  };
}

export function saveNepZoneProgress(
  studentId: string,
  zoneId: NepZoneId,
  classAge: ClassAge,
  patch: Partial<Omit<NepZoneProgressRecord, 'zoneId' | 'classAge'>>
): NepZoneProgressRecord {
  const store = getStudentStore(studentId);
  const key = makeNepProgressKey(zoneId, classAge);
  const prev = getNepZoneProgress(studentId, zoneId, classAge);
  const bestQuiz =
    typeof patch.quizBestScore === 'number'
      ? prev.quizBestScore !== null
        ? Math.max(prev.quizBestScore, patch.quizBestScore)
        : patch.quizBestScore
      : prev.quizBestScore;

  const updated: NepZoneProgressRecord = {
    ...prev,
    ...patch,
    quizBestScore: bestQuiz,
    zoneId,
    classAge,
    updatedAt: new Date().toISOString(),
  };
  store.nepProgress = {
    ...(store.nepProgress || {}),
    [key]: updated,
  };
  saveStudentStore(studentId, store);
  return updated;
}

export function unlockNepBadge(
  studentId: string,
  zoneId: NepZoneId,
  classAge: ClassAge,
  badge: NepBadgeMeta
): NepEarnedBadge[] {
  const store = getStudentStore(studentId);
  const list = store.nepBadges || [];
  if (list.some((b) => b.badgeId === badge.id)) {
    return list;
  }
  const next: NepEarnedBadge[] = [
    {
      badgeId: badge.id,
      zoneId,
      classAge,
      title: badge.title,
      emoji: badge.emoji,
      earnedAt: new Date().toISOString(),
    },
    ...list,
  ];
  store.nepBadges = next;
  saveStudentStore(studentId, store);
  return next;
}

