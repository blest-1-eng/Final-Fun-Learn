import React, { useState } from 'react';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import { generateNyraAdaptiveTest } from '../services/nyraClient';
import type {
  IncorrectAnswerRecord,
  NyraLevel,
  NyraLowScoreTriggerContext,
  NyraSettings,
  NyraTest,
  NyraTestAttempt,
  StudentPerformanceContext,
} from '../types/learning';
import { soundCorrect, soundFinish, soundTap, soundWrong } from '../utils/audio';
import { createConfetti } from '../utils/confetti';
import { NexoraBadge } from './NexoraBadge';

interface NyraTestModalProps {
  studentContext: StudentPerformanceContext;
  tests: NyraTest[];
  attempts: NyraTestAttempt[];
  linkedLevel?: NyraLevel | null;
  settings: NyraSettings;
  onClose: () => void;
  onSaveTest: (test: NyraTest) => void;
  onSaveAttempt: (attempt: NyraTestAttempt) => void;
  onOpenNyraChat: (trigger: NyraLowScoreTriggerContext) => void;
}

export const NyraTestModal: React.FC<NyraTestModalProps> = ({
  studentContext,
  tests,
  attempts,
  linkedLevel,
  settings,
  onClose,
  onSaveTest,
  onSaveAttempt,
  onOpenNyraChat,
}) => {
  const [subject, setSubject] = useState<'Math' | 'English' | 'Hindi'>(
    (linkedLevel?.subject as 'Math' | 'English' | 'Hindi') || 'Math'
  );
  const [topic, setTopic] = useState(
    linkedLevel?.topic || studentContext.weakTopics[0] || 'Core Practice'
  );
  const [loading, setLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');
  const [activeTest, setActiveTest] = useState<NyraTest | null>(tests[0] || null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedAttempt, setSubmittedAttempt] = useState<NyraTestAttempt | null>(
    null
  );

  const handleGenerateTest = async () => {
    soundTap();
    setLoading(true);
    setSubmittedAttempt(null);
    setAnswers({});
    try {
      const { test, meta } = await generateNyraAdaptiveTest(
        { ...studentContext, subject },
        subject,
        topic.trim() || 'Core Practice',
        linkedLevel || undefined
      );
      onSaveTest(test);
      setActiveTest(test);
      setStatusBanner(meta.statusMessage);
      soundCorrect();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTest) return;
    let correctCount = 0;
    const incorrectItems: IncorrectAnswerRecord[] = [];
    const weakSet = new Set<string>();

    for (const q of activeTest.questions) {
      const userAns = (answers[q.id] || '').trim();
      const isRight =
        userAns.toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isRight) {
        correctCount++;
      } else {
        weakSet.add(q.topic || activeTest.topic);
        incorrectItems.push({
          mode: `nyra:${activeTest.topic}`,
          subject: activeTest.subject,
          topic: q.topic || activeTest.topic,
          question: q.prompt,
          selectedAnswer: userAns || '(blank)',
          correctAnswer: q.correctAnswer,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const score = Math.round(
      (correctCount / Math.max(1, activeTest.questions.length)) * 100
    );

    const attempt: NyraTestAttempt = {
      id: `nyra-att-${Date.now()}`,
      testId: activeTest.id,
      testTitle: activeTest.title,
      studentId: studentContext.studentId,
      classAge: studentContext.selectedClass,
      subject: activeTest.subject,
      topic: activeTest.topic,
      score,
      totalQuestions: activeTest.questions.length,
      correctCount,
      weakTopics: Array.from(weakSet),
      incorrectItems,
      createdAt: new Date().toISOString(),
    };

    onSaveAttempt(attempt);
    setSubmittedAttempt(attempt);
    if (score >= 50) {
      soundFinish();
      createConfetti(window.innerWidth / 2, window.innerHeight / 2);
    } else {
      soundWrong();
    }
  };

  const shouldOfferSupport =
    submittedAttempt &&
    (submittedAttempt.score < settings.lowScoreThreshold ||
      submittedAttempt.incorrectItems.length >= settings.repeatedMistakeThreshold);

  return (
    <section className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-xl rounded-[32px] p-5 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
              <span>📝</span> NYRA Smart Tests
            </h2>
            <div className="mt-1">
              <NexoraBadge variant="nyra" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundTap();
              onClose();
            }}
            className="text-lg font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Test Bar */}
        <div className="bg-pink-50/70 border border-pink-200 rounded-2xl p-3 mb-3">
          <div className="flex flex-wrap gap-2 items-center mb-2">
            {(['Math', 'English', 'Hindi'] as const).map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  soundTap();
                  setSubject(subj);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black border ${
                  subject === subj
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {subj}
              </button>
            ))}
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic..."
              className="flex-1 min-w-[140px] text-xs font-bold px-3 py-1.5 rounded-xl border border-pink-200 bg-white outline-none"
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerateTest}
            className="w-full py-2.5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60"
            style={{ background: 'linear-gradient(145deg, #ff6fae, #ff8a64)' }}
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'NYRA is thinking...' : 'Create Adaptive Mixed Test ✨'}
          </button>
          {statusBanner && (
            <p className="mt-2 text-[11px] font-bold text-pink-700">
              {statusBanner}
            </p>
          )}
        </div>

        {/* Saved Test Switcher */}
        {tests.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1">
            {tests.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundTap();
                  setActiveTest(t);
                  setSubmittedAttempt(null);
                  setAnswers({});
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black border ${
                  activeTest?.id === t.id
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {t.subject}: {t.topic}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {!activeTest ? (
            <div className="text-center py-8 text-sm font-bold text-slate-400">
              No NYRA tests created yet. Tap &ldquo;Create Adaptive Mixed Test&rdquo;
              to start!
            </div>
          ) : (
            <form onSubmit={handleSubmitTest} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-800">
                  {activeTest.title}
                </h3>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                  {activeTest.difficulty}
                </span>
              </div>

              {activeTest.questions.map((q, idx) => {
                const userAns = answers[q.id] || '';
                const isRight =
                  submittedAttempt &&
                  userAns.trim().toLowerCase() ===
                    q.correctAnswer.trim().toLowerCase();

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border-2 p-3.5 ${
                      submittedAttempt
                        ? isRight
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-red-50/70 border-red-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-indigo-600">
                        {q.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Q{idx + 1}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-800 mb-2">
                      {q.prompt}
                    </div>

                    {q.options && q.options.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            disabled={!!submittedAttempt}
                            onClick={() => {
                              soundTap();
                              setAnswers((prev) => ({ ...prev, [q.id]: opt }));
                            }}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black border-2 ${
                              userAns === opt
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        disabled={!!submittedAttempt}
                        value={userAns}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Type your answer here..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold outline-none"
                      />
                    )}

                    {submittedAttempt && (
                      <div className="mt-2 text-xs font-bold">
                        <div
                          className={
                            isRight ? 'text-emerald-700' : 'text-red-700'
                          }
                        >
                          {isRight
                            ? '✅ Correct!'
                            : `❌ Answer: ${q.correctAnswer}`}
                        </div>
                        <div className="text-slate-600 mt-0.5">{q.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!submittedAttempt ? (
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl text-white font-black text-sm shadow-md"
                  style={{
                    background: 'linear-gradient(145deg, #35c98a, #20a56a)',
                  }}
                >
                  Check My Answers ✅
                </button>
              ) : (
                <div className="kids-card p-4 text-center space-y-2">
                  <div className="text-3xl font-black text-indigo-600">
                    {submittedAttempt.score}%
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    {submittedAttempt.correctCount} / {submittedAttempt.totalQuestions}{' '}
                    correct
                    {submittedAttempt.weakTopics.length > 0 &&
                      ` • Practice next: ${submittedAttempt.weakTopics.join(', ')}`}
                  </div>

                  {shouldOfferSupport && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-left">
                      <p className="text-xs font-bold text-slate-700 mb-2">
                        Hey! I noticed this topic was a little difficult today.
                        That&apos;s completely okay! Let&apos;s understand it together. 😊
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          soundTap();
                          onOpenNyraChat({
                            mode: `nyra:${submittedAttempt.topic}`,
                            testTitle: submittedAttempt.testTitle,
                            subject: submittedAttempt.subject,
                            topic: submittedAttempt.topic,
                            score: submittedAttempt.score,
                            wrongCount:
                              submittedAttempt.totalQuestions -
                              submittedAttempt.correctCount,
                            reason:
                              submittedAttempt.score < settings.lowScoreThreshold
                                ? 'low_score'
                                : 'repeated_mistakes',
                            incorrectItems: submittedAttempt.incorrectItems,
                            weakTopics: submittedAttempt.weakTopics,
                          });
                        }}
                        className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat with NYRA About Mistakes 💬
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

          {attempts.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-black text-slate-500 uppercase mb-1.5">
                Recent NYRA Test Results
              </div>
              <div className="space-y-1.5">
                {attempts.slice(0, 4).map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl"
                  >
                    <span className="font-bold text-slate-700">
                      {att.testTitle}
                    </span>
                    <span className="font-black text-indigo-600">{att.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
