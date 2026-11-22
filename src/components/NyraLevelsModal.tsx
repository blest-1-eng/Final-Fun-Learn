import React, { useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { generateNyraAdaptiveLevel } from '../services/nyraClient';
import type {
  NyraLevel,
  StudentPerformanceContext,
} from '../types/learning';
import { soundCorrect, soundTap, soundWrong } from '../utils/audio';
import { NexoraBadge } from './NexoraBadge';

interface NyraLevelsModalProps {
  studentContext: StudentPerformanceContext;
  levels: NyraLevel[];
  onClose: () => void;
  onSaveLevel: (level: NyraLevel) => void;
  onMarkLevelCompleted: (levelId: string) => void;
  onCreateTestForLevel: (level: NyraLevel) => void;
}

export const NyraLevelsModal: React.FC<NyraLevelsModalProps> = ({
  studentContext,
  levels,
  onClose,
  onSaveLevel,
  onMarkLevelCompleted,
  onCreateTestForLevel,
}) => {
  const [subject, setSubject] = useState<'Math' | 'English' | 'Hindi'>('Math');
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(
    levels[0]?.id || null
  );
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});

  const activeLevel =
    levels.find((l) => l.id === selectedLevelId) || levels[0] || null;

  const handleGenerate = async () => {
    soundTap();
    setLoading(true);
    try {
      const ctxForSubject: StudentPerformanceContext = {
        ...studentContext,
        subject,
      };
      const { level, meta } = await generateNyraAdaptiveLevel(
        ctxForSubject,
        subject,
        customTopic.trim() || undefined
      );
      onSaveLevel(level);
      setSelectedLevelId(level.id);
      setCustomTopic('');
      setStatusBanner(meta.statusMessage);
      soundCorrect();
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeClick = (
    levelId: string,
    qIdx: number,
    chosen: string,
    correct: string
  ) => {
    const key = `${levelId}-${qIdx}`;
    setPracticeAnswers((prev) => ({ ...prev, [key]: chosen }));
    if (chosen === correct) {
      soundCorrect();
    } else {
      soundWrong();
    }
  };

  return (
    <section className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-xl rounded-[32px] p-5 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
              <span>🎯</span> NYRA Adaptive Levels
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

        {/* Real Student Context Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-slate-700">
            <span>
              👦 {studentContext.studentName} ({studentContext.className})
            </span>
            <span className="text-indigo-600">
              Level: {studentContext.currentLearningLevel}
            </span>
          </div>
          {studentContext.weakTopics.length > 0 && (
            <div className="mt-1 text-amber-700 font-semibold">
              Focus areas detected: {studentContext.weakTopics.join(', ')}
            </div>
          )}
        </div>

        {/* Generator Controls */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3 mb-3">
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
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {subj}
              </button>
            ))}
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Optional topic (or leave blank for auto)"
              className="flex-1 min-w-[160px] text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 bg-white outline-none"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full py-2.5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60"
            style={{ background: 'linear-gradient(145deg, #4f8cff, #765cff)' }}
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'NYRA is thinking...' : 'Generate Next Adaptive Level ✨'}
          </button>

          {statusBanner && (
            <p className="mt-2 text-[11px] font-bold text-indigo-700">
              {statusBanner}
            </p>
          )}
        </div>

        {/* Saved Levels Tabs + Active Level Detail */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {levels.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {levels.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    soundTap();
                    setSelectedLevelId(lvl.id);
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black border ${
                    activeLevel?.id === lvl.id
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {lvl.completed ? '✅ ' : '📘 '}
                  {lvl.subject}: {lvl.topic}
                </button>
              ))}
            </div>
          )}

          {!activeLevel ? (
            <div className="text-center py-8 text-sm font-bold text-slate-400">
              No NYRA levels saved for {studentContext.studentName} yet. Tap
              &ldquo;Generate Next Adaptive Level&rdquo; above!
            </div>
          ) : (
            <div className="kids-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mb-1">
                    {activeLevel.subject} • {activeLevel.difficulty} •{' '}
                    {activeLevel.source === 'backend' ? 'NYRA AI' : 'Saved Practice'}
                  </span>
                  <h3 className="text-lg font-black text-slate-800">
                    {activeLevel.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    Topic: {activeLevel.topic}
                  </p>
                </div>
                {activeLevel.completed && (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
                <div className="text-[11px] font-black text-blue-700 uppercase">
                  Learning Objective
                </div>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {activeLevel.learningObjective}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <div className="text-[11px] font-black text-amber-700 uppercase">
                  Simple Explanation
                </div>
                <p className="text-xs font-bold text-slate-700 mt-0.5 leading-relaxed">
                  {activeLevel.simpleExplanation}
                </p>
              </div>

              <div>
                <div className="text-xs font-black text-slate-700 mb-1.5">
                  🧩 Learning Activities
                </div>
                <div className="space-y-2">
                  {activeLevel.activities.map((act, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs"
                    >
                      <div className="font-black text-slate-800">{act.title}</div>
                      <div className="font-semibold text-slate-600 mt-0.5">
                        {act.instruction}
                      </div>
                      <div className="font-bold text-indigo-600 mt-1">
                        Example: {act.example}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-700 mb-1.5">
                  ✏️ Practice Questions
                </div>
                <div className="space-y-2">
                  {activeLevel.practiceQuestions.map((pq, idx) => {
                    const ansKey = `${activeLevel.id}-${idx}`;
                    const picked = practiceAnswers[ansKey];
                    const isRight = picked === pq.correctAnswer;
                    return (
                      <div
                        key={idx}
                        className="bg-white border-2 border-slate-100 rounded-2xl p-3"
                      >
                        <div className="text-xs font-black text-slate-800 mb-2">
                          {idx + 1}. {pq.prompt}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {pq.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                handlePracticeClick(
                                  activeLevel.id,
                                  idx,
                                  opt,
                                  pq.correctAnswer
                                )
                              }
                              className={`py-1.5 px-2 rounded-xl text-xs font-black border-2 ${
                                picked === opt
                                  ? opt === pq.correctAnswer
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                    : 'bg-red-50 border-red-400 text-red-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {picked && (
                          <div
                            className={`mt-2 text-[11px] font-bold ${
                              isRight ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {isRight
                              ? '🌟 Great job! That is correct!'
                              : `💡 Hint: ${pq.hint}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                ✅ Completion Criteria: {activeLevel.completionCriteria}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {!activeLevel.completed && (
                  <button
                    type="button"
                    onClick={() => {
                      soundCorrect();
                      onMarkLevelCompleted(activeLevel.id);
                    }}
                    className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-sm"
                  >
                    Mark Completed ✅
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    soundTap();
                    onCreateTestForLevel(activeLevel);
                  }}
                  className={`py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-sm ${
                    activeLevel.completed ? 'col-span-2' : ''
                  }`}
                >
                  Create NYRA Test 📝
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
