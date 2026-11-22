import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import type {
  NyraLowScoreTriggerContext,
  WorksheetQuestion,
} from '../types/learning';
import { soundTap } from '../utils/audio';

interface WorksheetViewProps {
  mode: string;
  question: WorksheetQuestion | null;
  answerLocked: boolean;
  selectedOption: string | null;
  isFinished: boolean;
  score: number;
  levelUpMessage: string;
  nyraTrigger: NyraLowScoreTriggerContext | null;
  onSelectAnswer: (option: string) => void;
  onBackToMenu: () => void;
  onOpenNyraChat: (trigger: NyraLowScoreTriggerContext) => void;
  onCreateEasierLevel: (trigger: NyraLowScoreTriggerContext) => void;
}

export const WorksheetView: React.FC<WorksheetViewProps> = ({
  mode,
  question,
  answerLocked,
  selectedOption,
  isFinished,
  score,
  levelUpMessage,
  nyraTrigger,
  onSelectAnswer,
  onBackToMenu,
  onOpenNyraChat,
  onCreateEasierLevel,
}) => {
  if (isFinished) {
    let starDisplay = '⭐';
    if (score >= 80) starDisplay = '⭐⭐⭐';
    else if (score >= 50) starDisplay = '⭐⭐';

    return (
      <div className="kids-card w-full max-w-md p-6 text-center pop">
        <div className="text-5xl mb-2">{score >= 80 ? '🏆' : '🌟'}</div>
        <div className="text-3xl font-black text-amber-500 mb-2">{starDisplay}</div>
        <h2 className="app-title text-3xl" style={{ color: '#4f8cff' }}>
          {score >= 80 ? 'बहुत बढ़िया!' : 'अच्छा प्रयास!'}
        </h2>
        <div className="text-5xl font-black mt-3">{score}</div>
        <p className="text-gray-500 text-sm mt-1 mb-3">स्कोर</p>

        {levelUpMessage && (
          <div
            className={
              levelUpMessage.includes('शानदार')
                ? 'bg-green-100 text-green-800 font-bold p-3 rounded-2xl mb-3 text-sm'
                : 'text-xs font-bold text-blue-600 mb-3'
            }
          >
            {levelUpMessage}
          </div>
        )}

        {/* Supportive NYRA Offer on Result Screen when score is low or mistakes occurred */}
        {nyraTrigger && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-3.5 mb-3 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-black text-indigo-700 uppercase tracking-wide">
                NYRA Friendly Tutor • NEXORA LABS
              </span>
            </div>
            <p className="text-xs font-bold text-slate-700 leading-relaxed mb-2.5">
              Hey! I noticed this topic was a little difficult today. That&apos;s
              completely okay! Let&apos;s understand it together. 😊
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundTap();
                  onOpenNyraChat(nyraTrigger);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat with NYRA
              </button>
              <button
                type="button"
                onClick={() => {
                  soundTap();
                  onCreateEasierLevel(nyraTrigger);
                }}
                className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-black shadow-sm"
              >
                🎯 Easier Level
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            soundTap();
            onBackToMenu();
          }}
          className="w-full py-3.5 rounded-2xl text-white font-black text-lg shadow-md"
          style={{
            background: 'linear-gradient(145deg, #35c98a, #20a56a)',
          }}
        >
          ओके (OK) 👍
        </button>
      </div>
    );
  }

  if (!question) return null;

  const targetVal = String(question.target);

  const renderQuestionContent = () => {
    if (question.isHindiTest) {
      return (
        <>
          <div className="text-xl font-black mb-3 text-blue-600">
            🇮🇳 सही हिंदी अक्षर पहचानो!
          </div>
          <div className="text-6xl mb-2">{question.targetEmoji}</div>
          <div className="text-lg font-bold text-gray-500 mb-4">
            {question.targetWord}
          </div>
        </>
      );
    }
    if (question.isMatraTest) {
      return (
        <>
          <div className="text-xl font-black mb-3 text-red-500">
            ✍️ सही मात्रा पहचानो!
          </div>
          <div className="text-6xl mb-2">{question.targetEmoji}</div>
          <div className="text-lg font-bold text-gray-500 mb-4">
            {question.targetWord}
          </div>
        </>
      );
    }
    if (question.isWordReadTest) {
      return (
        <>
          <div className="text-xl font-black mb-3 text-purple-600">
            📖 सही हिंदी शब्द पहचानो!
          </div>
          <div className="text-6xl mb-2">{question.targetEmoji}</div>
          <div className="text-sm font-bold text-gray-500 mb-4">
            इस चित्र के लिए सही शब्द कौन सा है?
          </div>
        </>
      );
    }
    if (question.isTableTest) {
      return (
        <div className="text-xl font-black mb-5">
          ✖️ गुणा बताओ: <span className="text-blue-500">{question.a}</span> ×{' '}
          <span className="text-pink-500">{question.b}</span> = ?
        </div>
      );
    }
    if (question.isDivisionTest) {
      return (
        <div className="text-xl font-black mb-5">
          ➗ भाग बताओ: <span className="text-indigo-600">{question.a}</span> ÷{' '}
          <span className="text-pink-500">{question.b}</span> = ?
        </div>
      );
    }
    if (question.isHindiSentenceTest) {
      return (
        <>
          <div className="text-xl font-black mb-3 text-indigo-600">
            📝 रिक्त स्थान भरें (Fill in the blank)
          </div>
          <div className="text-5xl mb-3">{question.emoji}</div>
          <div className="text-2xl font-black text-slate-800 mb-5">
            {question.sentence}
          </div>
        </>
      );
    }
    if (question.isMissingWord && question.word !== undefined) {
      const chars = question.word.split('');
      if (typeof question.missingIndex === 'number') {
        chars[question.missingIndex] = '_';
      }
      return (
        <>
          <div className="text-xl font-black mb-3">
            🧩 Fill in the Missing Letter!
          </div>
          <div className="text-5xl mb-2">{question.emoji}</div>
          <div className="text-4xl font-black tracking-widest text-blue-600 mb-5">
            {chars.join(' ')}
          </div>
        </>
      );
    }
    if (question.isSentenceFill) {
      return (
        <>
          <div className="text-xl font-black mb-3">🔤 Fill in the Blank!</div>
          <div className="text-5xl mb-2">{question.emoji}</div>
          <div className="text-2xl font-black text-blue-600 mb-5">
            {question.sentence}
          </div>
        </>
      );
    }
    if (question.isGreaterLess) {
      return (
        <>
          <div className="text-xl font-black mb-3">
            ⚖️ कौन सा चिह्न आएगा? (Greater or Less)
          </div>
          <div className="text-4xl font-black text-blue-600 mb-5">
            {question.n1} [ ? ] {question.n2}
          </div>
        </>
      );
    }
    if (mode === 'ws1') {
      const starCount = Number(question.target) || 1;
      return (
        <>
          <div className="text-xl font-black mb-3">⭐ Count the Stars</div>
          <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto mb-5">
            {Array.from({ length: starCount }).map((_, idx) => (
              <span key={idx} className="text-3xl">
                ⭐
              </span>
            ))}
          </div>
        </>
      );
    }
    if (mode === 'ws2' || mode === 'tests') {
      return (
        <>
          <div className="text-xl font-black mb-2">🔎 Find this number</div>
          <div className="learning-number" style={{ color: '#f97316' }}>
            {question.target}
          </div>
        </>
      );
    }
    if (mode === 'ws3') {
      const n1 = question.n1 || 0;
      const n2 = question.n2 || 0;
      return (
        <>
          <div className="text-xl font-black mb-3">🍎 Visual Fruit Addition</div>
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="math-box">
              <div className="text-sm font-bold text-gray-400 mb-1">({n1})</div>
              <div className="flex flex-wrap justify-center gap-1">
                {Array.from({ length: n1 }).map((_, idx) => (
                  <span key={idx} className="text-2xl">
                    🍎
                  </span>
                ))}
              </div>
            </div>
            <div className="text-3xl font-black">+</div>
            <div className="math-box">
              <div className="text-sm font-bold text-gray-400 mb-1">({n2})</div>
              <div className="flex flex-wrap justify-center gap-1">
                {Array.from({ length: n2 }).map((_, idx) => (
                  <span key={idx} className="text-2xl">
                    🍎
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }
    if (mode === 'ws4') {
      return (
        <>
          <div className="text-xl font-black mb-3">🧩 Match Letter</div>
          <div className="text-6xl mb-3">{question.targetEmoji}</div>
          <div className="text-sm font-bold text-gray-500 mb-4">
            Which letter matches this?
          </div>
        </>
      );
    }
    if (mode === 'addition' || mode === 'addition2') {
      return (
        <div className="text-xl font-black mb-5">
          ➕ What is <span className="text-blue-500">{question.a}</span> +{' '}
          <span className="text-pink-500">{question.b}</span>?
        </div>
      );
    }
    if (mode === 'subtraction') {
      return (
        <div className="text-xl font-black mb-5">
          ➖ What is <span className="text-blue-500">{question.a}</span> -{' '}
          <span className="text-pink-500">{question.b}</span>?
        </div>
      );
    }
    if (mode === 'multiplication' || mode === 'tables' || mode === 'tables20') {
      return (
        <div className="text-xl font-black mb-5">
          ✖️ What is <span className="text-blue-500">{question.a}</span> ×{' '}
          <span className="text-pink-500">{question.b}</span>?
        </div>
      );
    }
    if (mode === 'wordmath') {
      return <div className="text-lg font-black mb-5 px-2">🧠 {question.word}</div>;
    }
    return (
      <div className="text-xl font-black mb-5">Find {question.target}</div>
    );
  };

  return (
    <div className="kids-card w-full max-w-md p-5 text-center pop">
      {renderQuestionContent()}
      <div className="grid grid-cols-3 gap-3">
        {question.options.map((option, idx) => {
          const optStr = String(option);
          const isChosen = selectedOption === optStr;
          const isTarget = optStr === targetVal;
          let extraClass = '';
          if (answerLocked) {
            if (isTarget) extraClass = 'answer-correct';
            else if (isChosen) extraClass = 'answer-wrong';
          }
          return (
            <button
              key={`${optStr}-${idx}`}
              type="button"
              disabled={answerLocked}
              className={`answer-option ${extraClass}`}
              onClick={() => {
                soundTap();
                onSelectAnswer(optStr);
              }}
            >
              {optStr}
            </button>
          );
        })}
      </div>
    </div>
  );
};
