import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, HelpCircle, Sparkles, Trophy, Volume2, X } from 'lucide-react';
import {
  getNepZoneDefinition,
  getNepZoneModule,
} from '../data/nep2020Curriculum';
import type {
  ClassAge,
  IncorrectAnswerRecord,
  NepZoneId,
  NepZoneProgressRecord,
  NyraLowScoreTriggerContext,
  NyraSettings,
  StudentProfile,
} from '../types/learning';
import {
  soundCorrect,
  soundFinish,
  soundTap,
  soundWrong,
  speakText,
} from '../utils/audio';
import { createConfetti } from '../utils/confetti';
import {
  getNepZoneProgress,
  markLessonCompleted,
  saveNepZoneProgress,
  saveTestHistoryEntry,
  unlockNepBadge,
} from '../utils/storage';

type NepTab = 'lessons' | 'activity' | 'quiz' | 'challenge';

interface NepZoneModalProps {
  zoneId: NepZoneId;
  classAge: ClassAge;
  activeStudent: StudentProfile;
  settings: NyraSettings;
  onClose: () => void;
  onProgressUpdated: () => void;
  onAskNyra: (prompt: string, trigger?: NyraLowScoreTriggerContext) => void;
}

export const NepZoneModal: React.FC<NepZoneModalProps> = ({
  zoneId,
  classAge,
  activeStudent,
  settings,
  onClose,
  onProgressUpdated,
  onAskNyra,
}) => {
  const zoneDef = useMemo(() => getNepZoneDefinition(zoneId), [zoneId]);
  const mod = useMemo(
    () => getNepZoneModule(zoneId, classAge),
    [zoneId, classAge]
  );

  const [tab, setTab] = useState<NepTab>('lessons');
  const [lessonIdx, setLessonIdx] = useState(0);
  const [progress, setProgress] = useState<NepZoneProgressRecord>(() =>
    getNepZoneProgress(activeStudent.id, zoneId, classAge)
  );
  const [unlockedToast, setUnlockedToast] = useState<string | null>(null);

  // Activity states
  const [sortedItems, setSortedItems] = useState<Record<string, 'left' | 'right'>>({});
  const [sortFeedback, setSortFeedback] = useState<string>('');
  const [nextOrderExpected, setNextOrderExpected] = useState(1);
  const [completedSeqIds, setCompletedSeqIds] = useState<string[]>([]);
  const [seqFeedback, setSeqFeedback] = useState<string>('');
  const [experimentChoice, setExperimentChoice] = useState<string | null>(null);
  const [experimentFeedback, setExperimentFeedback] = useState<string>('');

  // Quiz states
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [showQuizHint, setShowQuizHint] = useState(false);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizWrongList, setQuizWrongList] = useState<IncorrectAnswerRecord[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [quizFinalScore, setQuizFinalScore] = useState(0);

  const shuffledSequence = useMemo(() => {
    if (mod.activity.kind !== 'sequence' || !mod.activity.sequenceSteps) return [];
    const items = [...mod.activity.sequenceSteps];
    // Deterministic gentle shuffle by alternating/reversing so it's never already solved
    if (items.length >= 3) {
      return [items[1], items[items.length - 1], items[0], ...items.slice(2, items.length - 1)];
    }
    return items.reverse();
  }, [mod]);

  useEffect(() => {
    // Mark lesson viewed on open & sync local progress when student/grade changes
    const updated = saveNepZoneProgress(activeStudent.id, zoneId, classAge, {
      lessonsViewed: true,
    });
    markLessonCompleted(activeStudent.id, `${mod.className}:nep_${zoneId}`);
    setProgress(updated);
    onProgressUpdated();

    // Reset transient interactive states when module changes
    setTab('lessons');
    setLessonIdx(0);
    setSortedItems({});
    setSortFeedback('');
    setNextOrderExpected(1);
    setCompletedSeqIds([]);
    setSeqFeedback('');
    setExperimentChoice(null);
    setExperimentFeedback('');
    setQuizIdx(0);
    setQuizSelected(null);
    setShowQuizHint(false);
    setQuizCorrectCount(0);
    setQuizWrongList([]);
    setQuizDone(false);
    setQuizFinalScore(0);
    setUnlockedToast(null);
  }, [activeStudent.id, zoneId, classAge, mod.className, onProgressUpdated]);

  const tryUnlockBadge = (latest: NepZoneProgressRecord) => {
    const passedQuiz = (latest.quizBestScore ?? 0) >= 60;
    if (
      latest.lessonsViewed &&
      (latest.activityDone || latest.challengeDone) &&
      (passedQuiz || latest.challengeDone)
    ) {
      unlockNepBadge(activeStudent.id, zoneId, classAge, mod.badge);
      setUnlockedToast(`${mod.badge.emoji} Badge Earned: ${mod.badge.title}!`);
    }
  };

  const markActivityDone = () => {
    soundFinish();
    createConfetti(window.innerWidth / 2, window.innerHeight / 2);
    const updated = saveNepZoneProgress(activeStudent.id, zoneId, classAge, {
      activityDone: true,
    });
    setProgress(updated);
    tryUnlockBadge(updated);
    onProgressUpdated();
  };

  const handleClassifyPick = (itemId: string, expected: 'left' | 'right', picked: 'left' | 'right') => {
    if (sortedItems[itemId]) return;
    if (expected === picked) {
      soundCorrect();
      const next = { ...sortedItems, [itemId]: picked };
      setSortedItems(next);
      setSortFeedback('Great match!');
      const total = mod.activity.classifyItems?.length || 0;
      if (Object.keys(next).length === total) {
        setSortFeedback(mod.activity.successMessage);
        markActivityDone();
      }
    } else {
      soundWrong();
      setSortFeedback('Oops—check which group fits best and try again!');
    }
  };

  const handleSequencePick = (stepId: string, order: number) => {
    if (completedSeqIds.includes(stepId)) return;
    if (order === nextOrderExpected) {
      soundCorrect();
      const nextIds = [...completedSeqIds, stepId];
      setCompletedSeqIds(nextIds);
      const total = mod.activity.sequenceSteps?.length || 0;
      if (nextIds.length === total) {
        setSeqFeedback(mod.activity.successMessage);
        markActivityDone();
      } else {
        setNextOrderExpected(order + 1);
        setSeqFeedback(`Nice! Now tap Step ${order + 1}!`);
      }
    } else {
      soundWrong();
      setSeqFeedback(`Not quite—look for what happens at Step ${nextOrderExpected}!`);
    }
  };

  const handleExperimentPick = (label: string, correct: boolean, feedback: string) => {
    setExperimentChoice(label);
    setExperimentFeedback(feedback);
    if (correct) {
      markActivityDone();
    } else {
      soundWrong();
    }
  };

  const handleSelectQuizOption = (opt: string) => {
    if (quizSelected !== null) return;
    const currentQ = mod.quiz[quizIdx];
    if (!currentQ) return;

    setQuizSelected(opt);
    const isCorrect = opt === currentQ.correctAnswer;
    const nextCorrect = isCorrect ? quizCorrectCount + 1 : quizCorrectCount;
    let nextWrongList = quizWrongList;

    if (isCorrect) {
      soundCorrect();
      setQuizCorrectCount(nextCorrect);
      createConfetti(window.innerWidth / 2, window.innerHeight / 2);
    } else {
      soundWrong();
      nextWrongList = [
        ...quizWrongList,
        {
          mode: `nep_${zoneId}`,
          subject: zoneDef.title,
          topic: mod.moduleTitle,
          question: currentQ.prompt,
          selectedAnswer: opt,
          correctAnswer: currentQ.correctAnswer,
          timestamp: new Date().toISOString(),
        },
      ];
      setQuizWrongList(nextWrongList);
    }
  };

  const handleNextQuizQuestion = () => {
    soundTap();
    if (quizIdx + 1 < mod.quiz.length) {
      setQuizIdx(quizIdx + 1);
      setQuizSelected(null);
      setShowQuizHint(false);
    } else {
      const pct = Math.round((quizCorrectCount / mod.quiz.length) * 100);
      setQuizFinalScore(pct);
      setQuizDone(true);
      soundFinish();

      saveTestHistoryEntry(
        activeStudent.id,
        {
          age: classAge,
          className: mod.className,
          mode: `nep:${zoneDef.shortTitle}`,
          subject: zoneDef.title,
          score: pct,
          wrong: mod.quiz.length - quizCorrectCount,
          date: new Date().toLocaleString(),
          incorrectItems: quizWrongList,
        },
        quizWrongList
      );

      const updated = saveNepZoneProgress(activeStudent.id, zoneId, classAge, {
        quizBestScore: pct,
      });
      setProgress(updated);
      tryUnlockBadge(updated);
      onProgressUpdated();
    }
  };

  const handleRestartQuiz = () => {
    soundTap();
    setQuizIdx(0);
    setQuizSelected(null);
    setShowQuizHint(false);
    setQuizCorrectCount(0);
    setQuizWrongList([]);
    setQuizDone(false);
    setQuizFinalScore(0);
  };

  const handleToggleChallengeDone = () => {
    soundCorrect();
    createConfetti(window.innerWidth / 2, window.innerHeight / 2);
    const updated = saveNepZoneProgress(activeStudent.id, zoneId, classAge, {
      challengeDone: true,
    });
    setProgress(updated);
    unlockNepBadge(activeStudent.id, zoneId, classAge, mod.badge);
    setUnlockedToast(`${mod.badge.emoji} Badge Earned: ${mod.badge.title}!`);
    onProgressUpdated();
  };

  const activeLesson = mod.lessons[lessonIdx] || mod.lessons[0];
  const activeQuizQ = mod.quiz[quizIdx];

  return (
    <section
      id="nep-zone-modal"
      className="fixed inset-0 z-[75] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white w-full max-w-lg rounded-[32px] border-4 border-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-5 pt-4 pb-3 border-b border-slate-100"
          style={{ background: zoneDef.bgGradient }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/85 px-2 py-0.5 rounded-full text-slate-700">
                  {mod.className} • {zoneDef.nepPillarTag}
                </span>
                <span className="text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded-full text-slate-600">
                  NEP 2020 Inspired
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5">
                <span>{zoneDef.emoji}</span>
                <span>{mod.moduleTitle}</span>
              </h2>
              <div className="text-xs font-bold text-slate-700">
                {mod.hindiSubtitle}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundTap();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-sm shrink-0"
              aria-label="Close NEP Zone"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-600 mt-1.5">
            {mod.ncertGoalNote}
          </div>

          {/* 4 Step Tabs */}
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {(
              [
                { id: 'lessons', label: '📖 Lessons', done: progress.lessonsViewed },
                { id: 'activity', label: '🎮 Activity', done: progress.activityDone },
                { id: 'quiz', label: '⭐ Quiz', done: (progress.quizBestScore ?? 0) >= 60 },
                { id: 'challenge', label: '🌟 Challenge', done: progress.challengeDone },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundTap();
                  setTab(item.id);
                }}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
                  tab === item.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/85 text-slate-700 hover:bg-white'
                }`}
              >
                <span>{item.label}</span>
                {item.done && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Toast */}
        {unlockedToast && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-black text-amber-800 flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>{unlockedToast}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {tab === 'lessons' && activeLesson && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  Concept {lessonIdx + 1} of {mod.lessons.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundTap();
                    speakText(`${activeLesson.title}. ${activeLesson.explanation}`);
                  }}
                  className="inline-flex items-center gap-1 text-indigo-600 font-black bg-indigo-50 px-2.5 py-1 rounded-xl"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Read Aloud
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                <div className="text-2xl sm:text-3xl font-black py-2 px-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  {activeLesson.emojiVisual}
                </div>
                <h3 className="text-base font-black text-slate-900 pt-1">
                  {activeLesson.title}
                </h3>
                <div className="text-xs font-bold text-indigo-600">
                  {activeLesson.hindiTitle}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed text-left">
                  {activeLesson.explanation}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs space-y-1">
                <div className="font-black text-emerald-800">🇮🇳 Everyday India Example:</div>
                <div className="font-semibold text-emerald-900">
                  {activeLesson.indianExample}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs space-y-1">
                <div className="font-black text-amber-800">✨ Curiosity Spark:</div>
                <div className="font-semibold text-amber-900">{activeLesson.funFact}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundTap();
                  onAskNyra(activeLesson.askNyraPrompt);
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask NYRA to Explore This Further 💬
              </button>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundTap();
                    setLessonIdx((prev) =>
                      prev - 1 < 0 ? mod.lessons.length - 1 : prev - 1
                    );
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs"
                >
                  ← Previous Card
                </button>
                {lessonIdx + 1 < mod.lessons.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundTap();
                      setLessonIdx(lessonIdx + 1);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-900 text-white font-black text-xs"
                  >
                    Next Card →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundTap();
                      setTab('activity');
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs"
                  >
                    Try Activity 🎮 →
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3">
                <h3 className="text-sm font-black text-indigo-900">
                  🎮 {mod.activity.title}
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  {mod.activity.instruction}
                </p>
              </div>

              {mod.activity.kind === 'classify' && mod.activity.classifyItems && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-black">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-emerald-800">
                      {mod.activity.leftBucketLabel}
                    </div>
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-2 text-sky-800">
                      {mod.activity.rightBucketLabel}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {mod.activity.classifyItems.map((item) => {
                      const placed = sortedItems[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl p-3 border flex items-center justify-between gap-2 ${
                            placed
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-xs font-black text-slate-800">
                              {item.label}
                            </span>
                          </div>
                          {placed ? (
                            <span className="text-[11px] font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                              ✓ Sorted!
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleClassifyPick(item.id, item.bucket, 'left')
                                }
                                className="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-black"
                              >
                                {mod.activity.leftBucketLabel?.split(' ')[0]} Left
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleClassifyPick(item.id, item.bucket, 'right')
                                }
                                className="px-2 py-1 rounded-xl bg-sky-100 text-sky-800 text-[11px] font-black"
                              >
                                {mod.activity.rightBucketLabel?.split(' ')[0]} Right
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {sortFeedback && (
                    <div className="text-xs font-black text-center text-indigo-700 bg-indigo-50 p-2.5 rounded-xl">
                      {sortFeedback}
                    </div>
                  )}
                </div>
              )}

              {mod.activity.kind === 'sequence' && (
                <div className="space-y-2.5">
                  <div className="space-y-2">
                    {shuffledSequence.map((step) => {
                      const done = completedSeqIds.includes(step.id);
                      return (
                        <button
                          key={step.id}
                          type="button"
                          disabled={done}
                          onClick={() => handleSequencePick(step.id, step.order)}
                          className={`w-full rounded-2xl p-3 border text-left flex items-center justify-between transition ${
                            done
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{step.emoji}</span>
                            <span className="text-xs font-black">{step.label}</span>
                          </div>
                          <span className="text-xs font-black px-2 py-1 rounded-lg bg-slate-100">
                            {done ? `Step ${step.order} ✓` : 'Tap Next'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {seqFeedback && (
                    <div className="text-xs font-black text-center text-indigo-700 bg-indigo-50 p-2.5 rounded-xl">
                      {seqFeedback}
                    </div>
                  )}
                </div>
              )}

              {mod.activity.kind === 'experiment' && mod.activity.options && (
                <div className="space-y-2.5">
                  <div className="text-xs font-black text-slate-700 px-1">
                    {mod.activity.prompt}
                  </div>
                  <div className="space-y-2">
                    {mod.activity.options.map((opt) => {
                      const chosen = experimentChoice === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            handleExperimentPick(opt.label, opt.correct, opt.feedback)
                          }
                          className={`w-full rounded-2xl p-3 border text-left flex items-center gap-2.5 transition ${
                            chosen
                              ? opt.correct
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                : 'bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-2xl">{opt.emoji}</span>
                          <span className="text-xs font-black">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {experimentFeedback && (
                    <div className="text-xs font-bold text-slate-800 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      {experimentFeedback}
                    </div>
                  )}
                </div>
              )}

              {progress.activityDone && (
                <button
                  type="button"
                  onClick={() => {
                    soundTap();
                    setTab('quiz');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs"
                >
                  Take the Mini Quiz ⭐ →
                </button>
              )}
            </div>
          )}

          {tab === 'quiz' && (
            <div className="space-y-3">
              {!quizDone && activeQuizQ ? (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>
                      Question {quizIdx + 1} of {mod.quiz.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundTap();
                        setShowQuizHint((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1 text-amber-600 font-black"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Hint
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                    <div className="text-4xl">{activeQuizQ.emoji}</div>
                    <div className="text-sm font-black text-slate-800">
                      {activeQuizQ.prompt}
                    </div>
                  </div>

                  {showQuizHint && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs font-bold text-amber-800">
                      💡 Hint: {activeQuizQ.hint}
                    </div>
                  )}

                  <div className="space-y-2">
                    {activeQuizQ.options.map((opt) => {
                      const isPicked = quizSelected === opt;
                      const isRight = opt === activeQuizQ.correctAnswer;
                      let style = 'bg-white border-slate-200 text-slate-800';
                      if (quizSelected !== null) {
                        if (isRight) style = 'bg-emerald-50 border-emerald-400 text-emerald-900';
                        else if (isPicked) style = 'bg-rose-50 border-rose-300 text-rose-900';
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={quizSelected !== null}
                          onClick={() => handleSelectQuizOption(opt)}
                          className={`w-full rounded-2xl p-3 border text-left text-xs font-black transition ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSelected !== null && (
                    <div className="space-y-2">
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs font-bold text-indigo-900">
                        {quizSelected === activeQuizQ.correctAnswer
                          ? `✅ Great! ${activeQuizQ.explanation}`
                          : `💛 Let’s learn: ${activeQuizQ.explanation}`}
                      </div>
                      <button
                        type="button"
                        onClick={handleNextQuizQuestion}
                        className="w-full py-2.5 rounded-2xl bg-slate-900 text-white font-black text-xs"
                      >
                        {quizIdx + 1 < mod.quiz.length
                          ? 'Next Question →'
                          : 'See My Quiz Score 🏆'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
                  <div className="text-4xl">{quizFinalScore >= 60 ? '🏆' : '🌟'}</div>
                  <div className="text-2xl font-black text-indigo-600">
                    {quizFinalScore}%
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    You got {quizCorrectCount} out of {mod.quiz.length} right!
                  </div>

                  {quizFinalScore < settings.lowScoreThreshold && (
                    <button
                      type="button"
                      onClick={() => {
                        soundTap();
                        onAskNyra(
                          `Can you gently help me understand ${mod.moduleTitle} (${mod.className})?`,
                          {
                            mode: `nep_${zoneId}`,
                            testTitle: mod.moduleTitle,
                            subject: zoneDef.title,
                            topic: mod.moduleTitle,
                            score: quizFinalScore,
                            wrongCount: mod.quiz.length - quizCorrectCount,
                            reason: 'low_score',
                            incorrectItems: quizWrongList,
                            weakTopics: [mod.moduleTitle],
                          }
                        );
                      }}
                      className="w-full py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-xs"
                    >
                      💬 Ask NYRA for Gentle Practice Tips
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRestartQuiz}
                      className="flex-1 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-xs"
                    >
                      Try Quiz Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundTap();
                        setTab('challenge');
                      }}
                      className="flex-1 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs"
                    >
                      Real Challenge 🌟 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'challenge' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-black uppercase tracking-wide text-amber-700">
                  🌍 Hands-On Family Mission
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {mod.realLifeChallenge.title}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                  {mod.realLifeChallenge.instruction}
                </p>
                <div className="bg-white/90 rounded-xl p-2.5 text-[11px] font-bold text-slate-600 border border-amber-100">
                  👨‍👩‍👧 Parent Tip: {mod.realLifeChallenge.familyTip}
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{mod.badge.emoji}</span>
                  <div>
                    <div className="text-xs font-black text-indigo-900">
                      Zone Badge: {mod.badge.title}
                    </div>
                    <div className="text-[11px] font-semibold text-indigo-700">
                      {progress.challengeDone
                        ? 'Earned & saved in your profile!'
                        : 'Finish the mission above to unlock this badge!'}
                    </div>
                  </div>
                </div>
                <span className="text-lg">
                  {progress.challengeDone ? '✅' : '🔒'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleChallengeDone}
                className={`w-full py-3 rounded-2xl font-black text-xs text-white shadow-sm ${
                  progress.challengeDone ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
              >
                {progress.challengeDone
                  ? 'Challenge Completed! 🌟 (Badge Unlocked)'
                  : 'I Did This Real-Life Challenge! 🌟'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
