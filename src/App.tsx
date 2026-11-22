import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AboutFunLearnModal } from './components/AboutFunLearnModal';
import { AgeSelectionScreen } from './components/AgeSelectionScreen';
import { LearningView, getLearningListLength } from './components/LearningView';
import { MenuScreen } from './components/MenuScreen';
import { NepZoneModal } from './components/NepZoneModal';
import { NyraChatModal } from './components/NyraChatModal';
import { NyraLevelsModal } from './components/NyraLevelsModal';
import { NyraTestModal } from './components/NyraTestModal';
import { ParentDashboardModal } from './components/ParentDashboardModal';
import { WorksheetView } from './components/WorksheetView';
import {
  buildWorksheetQuestions,
  getClassName,
  getFeatureTitle,
  getModeSubjectAndTopic,
  isLearningMode,
  phonicWordsList,
} from './data/curriculum';
import {
  checkBackendHealth,
  fetchNyraQuota,
  generateNyraAdaptiveLevel,
} from './services/nyraClient';
import type {
  BasicLearningCard,
  ClassAge,
  FeatureMode,
  IncorrectAnswerRecord,
  LearningMode,
  NepZoneId,
  NyraBackendHealth,
  NyraChatMessage,
  NyraLevel,
  NyraLowScoreTriggerContext,
  NyraQuotaInfo,
  NyraSettings,
  NyraTest,
  NyraTestAttempt,
  StudentProfile,
  WorksheetQuestion,
} from './types/learning';
import {
  soundCorrect,
  soundFinish,
  soundTap,
  soundWrong,
} from './utils/audio';
import { createConfetti } from './utils/confetti';
import {
  buildStudentPerformanceContext,
  checkLevelUpEligibility,
  clearClassProgressAfterLevelUp,
  createStudentProfile,
  evaluateLowScoreTrigger,
  getActiveStudentId,
  getDefaultStudents,
  getNyraSettings,
  getRecentTestHistory,
  getStudentStore,
  markLessonCompleted,
  markNyraLevelCompleted,
  recordTestResultForStudent,
  saveNyraChatMessages,
  saveNyraLevel,
  saveNyraSettings,
  saveNyraTest,
  saveNyraTestAttempt,
  saveTestHistoryEntry,
  setActiveStudentId,
  updateStudentAge,
} from './utils/storage';

type ActiveScreen = 'age' | 'menu' | 'app';

export function App() {
  const [students, setStudents] = useState<StudentProfile[]>(() =>
    getDefaultStudents()
  );
  const [activeStudentId, setActiveStudentIdState] = useState<string>(() =>
    getActiveStudentId()
  );
  const activeStudent = useMemo(
    () =>
      students.find((s) => s.id === activeStudentId) ||
      students[0] || {
        id: 'student-default',
        name: 'Learner 1',
        age: 3 as ClassAge,
        createdAt: new Date().toISOString(),
      },
    [students, activeStudentId]
  );

  const [selectedAge, setSelectedAge] = useState<ClassAge | null>(null);
  const [age, setAge] = useState<ClassAge>(activeStudent.age || 3);
  const [screen, setScreen] = useState<ActiveScreen>('age');
  const [currentMode, setCurrentMode] = useState<FeatureMode>('abc');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [worksheetQuestions, setWorksheetQuestions] = useState<WorksheetQuestion[]>([]);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState('');
  const [shuffledPhonics, setShuffledPhonics] = useState<BasicLearningCard[]>(
    phonicWordsList
  );
  const [sessionIncorrect, setSessionIncorrect] = useState<IncorrectAnswerRecord[]>([]);
  const [nyraTrigger, setNyraTrigger] =
    useState<NyraLowScoreTriggerContext | null>(null);

  const [storeVersion, setStoreVersion] = useState(0);
  const [nyraSettings, setNyraSettings] = useState<NyraSettings>(() =>
    getNyraSettings()
  );
  const [backendHealth, setBackendHealth] = useState<NyraBackendHealth | null>(
    null
  );
  const [nyraQuota, setNyraQuota] = useState<NyraQuotaInfo | null>(null);

  const [showParentModal, setShowParentModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showNyraLevels, setShowNyraLevels] = useState(false);
  const [showNyraTests, setShowNyraTests] = useState(false);
  const [showNyraChat, setShowNyraChat] = useState(false);
  const [activeNepZone, setActiveNepZone] = useState<NepZoneId | null>(null);
  const [linkedLevelForTest, setLinkedLevelForTest] = useState<NyraLevel | null>(
    null
  );
  const [chatTriggerContext, setChatTriggerContext] =
    useState<NyraLowScoreTriggerContext | null>(null);

  const timerRef = useRef<number | null>(null);

  const refreshStore = useCallback(() => {
    setStoreVersion((v) => v + 1);
  }, []);

  const refreshHealth = useCallback(async () => {
    const [h, q] = await Promise.all([
      checkBackendHealth(),
      fetchNyraQuota(activeStudent.id),
    ]);
    setBackendHealth(h);
    setNyraQuota(q);
  }, [activeStudent.id]);

  useEffect(() => {
    refreshHealth();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [refreshHealth]);

  const studentStore = useMemo(() => {
    void storeVersion;
    return getStudentStore(activeStudent.id);
  }, [activeStudent.id, storeVersion]);

  const studentContext = useMemo(() => {
    void storeVersion;
    return buildStudentPerformanceContext(
      { ...activeStudent, age },
      getModeSubjectAndTopic(currentMode).subject
    );
  }, [activeStudent, age, currentMode, storeVersion]);

  const recentTestCount = useMemo(() => {
    void storeVersion;
    return getRecentTestHistory(activeStudent.id, age).length;
  }, [activeStudent.id, age, storeVersion]);

  const handleSelectStudent = (studentId: string) => {
    setActiveStudentId(studentId);
    setActiveStudentIdState(studentId);
    const found = students.find((s) => s.id === studentId);
    if (found) {
      setAge(found.age);
      setSelectedAge(found.age);
    }
    refreshStore();
  };

  const handleCreateStudent = (name: string, studentAge: ClassAge) => {
    const created = createStudentProfile(name, studentAge);
    setStudents(getDefaultStudents());
    setActiveStudentIdState(created.id);
    setAge(created.age);
    setSelectedAge(created.age);
    refreshStore();
  };

  const handleContinueFromAge = () => {
    if (!selectedAge) return;
    setAge(selectedAge);
    setStudents(updateStudentAge(activeStudent.id, selectedAge));
    setScreen('menu');
    soundCorrect();
  };

  const handleChangeAgeFromMenu = (newAge: ClassAge) => {
    setAge(newAge);
    setSelectedAge(newAge);
    setStudents(updateStudentAge(activeStudent.id, newAge));
  };

  const handleOpenFeature = (mode: FeatureMode) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setCurrentMode(mode);
    setCurrentIndex(0);
    setScore(0);
    setWrongAnswers(0);
    setAnswerLocked(false);
    setSelectedOption(null);
    setIsFinished(false);
    setLevelUpMessage('');
    setSessionIncorrect([]);
    setNyraTrigger(null);

    if (isLearningMode(mode)) {
      if (mode === 'phonics') {
        setShuffledPhonics([...phonicWordsList].sort(() => Math.random() - 0.5));
      }
      setWorksheetQuestions([]);
      markLessonCompleted(activeStudent.id, `${getClassName(age)}:${mode}`);
      refreshStore();
      setScreen('app');
      return;
    }

    const generated = buildWorksheetQuestions(mode, age);
    setWorksheetQuestions(generated);
    setScreen('app');
  };

  const handleBackToMenu = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setScreen('menu');
    soundTap();
  };

  const learningMode = isLearningMode(currentMode);
  const learningLength = learningMode
    ? getLearningListLength(currentMode as LearningMode)
    : 0;

  const handleNextLearning = () => {
    soundTap();
    setCurrentIndex((prev) => (prev + 1 >= learningLength ? 0 : prev + 1));
  };

  const handlePrevLearning = () => {
    soundTap();
    setCurrentIndex((prev) => (prev - 1 < 0 ? learningLength - 1 : prev - 1));
  };

  const finishTest = (
    finalScore: number,
    finalWrong: number,
    incorrectList: IncorrectAnswerRecord[]
  ) => {
    soundFinish();
    const meta = getModeSubjectAndTopic(currentMode);

    recordTestResultForStudent(activeStudent.id, age, finalScore);
    saveTestHistoryEntry(
      activeStudent.id,
      {
        age,
        className: getClassName(age),
        mode: currentMode,
        subject: meta.subject,
        score: finalScore,
        wrong: finalWrong,
        date: new Date().toLocaleString(),
        incorrectItems: incorrectList,
      },
      incorrectList
    );

    const triggerReason = evaluateLowScoreTrigger(
      activeStudent.id,
      age,
      finalScore,
      finalWrong,
      nyraSettings
    );

    if (triggerReason) {
      setNyraTrigger({
        mode: currentMode,
        testTitle: getFeatureTitle(currentMode),
        subject: meta.subject,
        topic: meta.topic,
        score: finalScore,
        wrongCount: finalWrong,
        reason: triggerReason,
        incorrectItems: incorrectList,
        weakTopics: Array.from(new Set(incorrectList.map((i) => i.topic))),
      });
    } else {
      setNyraTrigger(null);
    }

    const canLevelUp = checkLevelUpEligibility(activeStudent.id, age);
    if (canLevelUp && age < 10) {
      const nextAge = (age + 1) as ClassAge;
      clearClassProgressAfterLevelUp(activeStudent.id, age);
      setAge(nextAge);
      setSelectedAge(nextAge);
      setStudents(updateStudentAge(activeStudent.id, nextAge));
      setLevelUpMessage(
        `🎉 शानदार! आपने लगातार अच्छा प्रदर्शन किया है, अब आप ${getClassName(nextAge)} पर पहुँच गए हैं! 🚀`
      );
    } else {
      const historyCount = getRecentTestHistory(activeStudent.id, age).length;
      setLevelUpMessage(
        `⭐ टेस्ट पूरा हुआ! कुल टेस्ट रिकॉर्ड: ${historyCount}/10`
      );
    }

    setIsFinished(true);
    refreshStore();
  };

  const handleSelectAnswer = (option: string) => {
    if (answerLocked || isFinished) return;
    const q = worksheetQuestions[currentIndex];
    if (!q) return;

    setAnswerLocked(true);
    setSelectedOption(option);

    const targetVal = String(q.target);
    const correct = option === targetVal;

    let nextScore = score;
    let nextWrong = wrongAnswers;
    let nextIncorrect = sessionIncorrect;

    if (correct) {
      nextScore = Math.min(
        100,
        Math.round(score + 100 / worksheetQuestions.length)
      );
      setScore(nextScore);
      soundCorrect();
      createConfetti(window.innerWidth / 2, window.innerHeight / 2);
    } else {
      nextWrong = wrongAnswers + 1;
      setWrongAnswers(nextWrong);
      soundWrong();
      const record: IncorrectAnswerRecord = {
        mode: currentMode,
        subject: q.subjectLabel,
        topic: q.topicLabel,
        question: q.promptSummary,
        selectedAnswer: option,
        correctAnswer: targetVal,
        timestamp: new Date().toISOString(),
      };
      nextIncorrect = [...sessionIncorrect, record];
      setSessionIncorrect(nextIncorrect);
    }

    timerRef.current = window.setTimeout(() => {
      const nextIdx = currentIndex + 1;
      setAnswerLocked(false);
      setSelectedOption(null);
      if (nextIdx >= worksheetQuestions.length) {
        finishTest(nextScore, nextWrong, nextIncorrect);
      } else {
        setCurrentIndex(nextIdx);
      }
    }, correct ? 900 : 1500);
  };

  const handleOpenNyraChatWithTrigger = (trigger: NyraLowScoreTriggerContext | null) => {
    setChatTriggerContext(trigger);
    setShowNyraChat(true);
  };

  const handleCreateEasierLevelFromTrigger = async (
    trigger: NyraLowScoreTriggerContext
  ) => {
    const ctx = buildStudentPerformanceContext(
      { ...activeStudent, age },
      trigger.subject
    );
    const { level } = await generateNyraAdaptiveLevel(
      ctx,
      trigger.subject,
      trigger.topic
    );
    saveNyraLevel(activeStudent.id, level);
    refreshStore();
    setShowNyraLevels(true);
  };

  // Progress dots calculation matching original logic
  const progressTotal =
    worksheetQuestions.length > 0
      ? worksheetQuestions.length
      : Math.min(learningLength, 10);
  const progressActive =
    worksheetQuestions.length > 0
      ? currentIndex
      : learningLength > 0
        ? Math.floor((currentIndex / learningLength) * progressTotal)
        : 0;

  return (
    <>
      {screen === 'age' && (
        <AgeSelectionScreen
          selectedAge={selectedAge}
          students={students}
          activeStudent={activeStudent}
          onSelectAge={setSelectedAge}
          onContinue={handleContinueFromAge}
          onSelectStudent={handleSelectStudent}
          onCreateStudent={handleCreateStudent}
          onOpenAbout={() => setShowAboutModal(true)}
        />
      )}

      {screen === 'menu' && (
        <MenuScreen
          age={age}
          activeStudent={activeStudent}
          recentTestCount={recentTestCount}
          nyraLevelCount={studentStore.levels.length}
          nyraTestCount={studentStore.tests.length}
          backendHealth={backendHealth}
          nepProgress={studentStore.nepProgress}
          onChangeAge={handleChangeAgeFromMenu}
          onOpenFeature={handleOpenFeature}
          onOpenNepZone={(zId) => setActiveNepZone(zId)}
          onOpenParentDashboard={() => setShowParentModal(true)}
          onOpenNyraLevels={() => setShowNyraLevels(true)}
          onOpenNyraTests={() => {
            setLinkedLevelForTest(null);
            setShowNyraTests(true);
          }}
          onOpenNyraChat={() => handleOpenNyraChatWithTrigger(null)}
          onSwitchProfile={() => setScreen('age')}
          onOpenAbout={() => setShowAboutModal(true)}
        />
      )}

      {screen === 'app' && (
        <section
          id="app-screen"
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
        >
          <div
            id="app-card"
            className="relative w-full max-w-lg h-full max-h-[850px] rounded-[34px] border-[6px] border-white shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #ffffff, #f7faff)',
            }}
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-16 px-5 flex items-center justify-between z-10 bg-white/80 backdrop-blur-md">
              <button
                type="button"
                onClick={handleBackToMenu}
                className="w-10 h-10 rounded-xl bg-white shadow-md border border-gray-100 text-lg flex items-center justify-center"
              >
                🏠
              </button>

              <div
                id="app-title"
                className="font-black text-gray-600 text-sm md:text-base text-center px-2 truncate"
              >
                {getFeatureTitle(currentMode)}
              </div>

              {!learningMode && !isFinished ? (
                <div
                  id="score-badge"
                  className="bg-yellow-400 text-white px-3 py-1.5 rounded-xl font-black text-sm shrink-0"
                >
                  ⭐ <span id="score">{score}</span>
                </div>
              ) : (
                <div className="w-10" />
              )}
            </div>

            {/* Progress Dots */}
            {!isFinished && (
              <div
                id="progress"
                className="absolute top-[64px] left-0 right-0 flex justify-center gap-2 z-10 py-1"
              >
                {Array.from({ length: progressTotal }).map((_, i) => (
                  <div
                    key={i}
                    className={`progress-dot ${i === progressActive ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}

            {/* Main Content */}
            <div
              id="content"
              className="flex-1 flex items-center justify-center px-5 pt-16 pb-16 overflow-y-auto w-full"
            >
              {learningMode ? (
                <LearningView
                  mode={currentMode as LearningMode}
                  currentIndex={currentIndex}
                  shuffledPhonics={shuffledPhonics}
                />
              ) : (
                <WorksheetView
                  mode={currentMode}
                  question={worksheetQuestions[currentIndex] || null}
                  answerLocked={answerLocked}
                  selectedOption={selectedOption}
                  isFinished={isFinished}
                  score={score}
                  levelUpMessage={levelUpMessage}
                  nyraTrigger={nyraTrigger}
                  onSelectAnswer={handleSelectAnswer}
                  onBackToMenu={handleBackToMenu}
                  onOpenNyraChat={handleOpenNyraChatWithTrigger}
                  onCreateEasierLevel={handleCreateEasierLevelFromTrigger}
                />
              )}
            </div>

            {/* Navigation Arrows for Learning Mode */}
            {learningMode && (
              <div
                id="navigation"
                className="absolute bottom-3 left-0 right-0 px-6 flex justify-between z-10 pointer-events-none"
              >
                <button
                  type="button"
                  className="nav-button pointer-events-auto flex items-center justify-center"
                  onClick={handlePrevLearning}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="nav-button pointer-events-auto flex items-center justify-center"
                  onClick={handleNextLearning}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {showParentModal && (
        <ParentDashboardModal
          history={studentStore.testHistory}
          studentContext={studentContext}
          settings={nyraSettings}
          backendHealth={backendHealth}
          nyraQuota={nyraQuota}
          nepBadges={studentStore.nepBadges}
          nepProgress={studentStore.nepProgress}
          onUpdateSettings={(next) => {
            saveNyraSettings(next);
            setNyraSettings(next);
          }}
          onRefreshHealth={refreshHealth}
          onClose={() => setShowParentModal(false)}
          onOpenAbout={() => setShowAboutModal(true)}
        />
      )}

      {showAboutModal && (
        <AboutFunLearnModal onClose={() => setShowAboutModal(false)} />
      )}

      {activeNepZone && (
        <NepZoneModal
          zoneId={activeNepZone}
          classAge={age}
          activeStudent={activeStudent}
          settings={nyraSettings}
          onClose={() => setActiveNepZone(null)}
          onProgressUpdated={refreshStore}
          onAskNyra={(prompt, trigger) => {
            setActiveNepZone(null);
            handleOpenNyraChatWithTrigger(
              trigger || {
                mode: `nep_${activeNepZone}`,
                testTitle: prompt,
                subject: prompt,
                topic: prompt,
                score: 70,
                wrongCount: 0,
                reason: 'manual',
                incorrectItems: [],
                weakTopics: [],
              }
            );
          }}
        />
      )}

      {showNyraLevels && (
        <NyraLevelsModal
          studentContext={studentContext}
          levels={studentStore.levels}
          onClose={() => setShowNyraLevels(false)}
          onSaveLevel={(lvl) => {
            saveNyraLevel(activeStudent.id, lvl);
            refreshStore();
          }}
          onMarkLevelCompleted={(lvlId) => {
            markNyraLevelCompleted(activeStudent.id, lvlId);
            refreshStore();
          }}
          onCreateTestForLevel={(lvl) => {
            setShowNyraLevels(false);
            setLinkedLevelForTest(lvl);
            setShowNyraTests(true);
          }}
        />
      )}

      {showNyraTests && (
        <NyraTestModal
          studentContext={studentContext}
          tests={studentStore.tests}
          attempts={studentStore.testAttempts}
          linkedLevel={linkedLevelForTest}
          settings={nyraSettings}
          onClose={() => setShowNyraTests(false)}
          onSaveTest={(t: NyraTest) => {
            saveNyraTest(activeStudent.id, t);
            refreshStore();
          }}
          onSaveAttempt={(att: NyraTestAttempt) => {
            saveNyraTestAttempt(activeStudent.id, att);
            refreshStore();
          }}
          onOpenNyraChat={(trigger) => {
            setShowNyraTests(false);
            handleOpenNyraChatWithTrigger(trigger);
          }}
        />
      )}

      {showNyraChat && (
        <NyraChatModal
          studentContext={studentContext}
          messages={studentStore.chatMessages}
          triggerContext={chatTriggerContext}
          onClose={() => setShowNyraChat(false)}
          onUpdateMessages={(msgs: NyraChatMessage[]) => {
            saveNyraChatMessages(activeStudent.id, msgs);
            refreshStore();
          }}
          onRetryTest={(mode) => {
            setShowNyraChat(false);
            handleOpenFeature(mode as FeatureMode);
          }}
        />
      )}
    </>
  );
}

export default App;
