import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Send, Sparkles, X } from 'lucide-react';
import { sendNyraSupportMessage } from '../services/nyraClient';
import type {
  NyraChatMessage,
  NyraLowScoreTriggerContext,
  StudentPerformanceContext,
} from '../types/learning';
import { soundCorrect, soundTap, soundWrong } from '../utils/audio';
import { NexoraBadge } from './NexoraBadge';

interface NyraChatModalProps {
  studentContext: StudentPerformanceContext;
  messages: NyraChatMessage[];
  triggerContext: NyraLowScoreTriggerContext | null;
  onClose: () => void;
  onUpdateMessages: (nextMessages: NyraChatMessage[]) => void;
  onRetryTest?: (mode: string) => void;
}

export const NyraChatModal: React.FC<NyraChatModalProps> = ({
  studentContext,
  messages,
  triggerContext,
  onClose,
  onUpdateMessages,
  onRetryTest,
}) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [practicePicks, setPracticePicks] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (triggerContext) {
      const openingId = `nyra-open-${triggerContext.mode}-${triggerContext.score}`;
      const alreadyHasOpening = messages.some((m) => m.id === openingId);
      if (!alreadyHasOpening) {
        const mistakeSummary =
          triggerContext.incorrectItems.length > 0
            ? `Let's look gently at "${triggerContext.incorrectItems[0].question}" together.`
            : `Let's review ${triggerContext.topic} step-by-step!`;
        const welcomeMsg: NyraChatMessage = {
          id: openingId,
          role: 'nyra',
          text: `Hey! I noticed this topic was a little difficult today. That's completely okay! Let's understand it together. 😊\n\nYou tried "${triggerContext.testTitle}" and scored ${triggerContext.score}%. ${mistakeSummary}`,
          hint:
            triggerContext.weakTopics.length > 0
              ? `Focus area: ${triggerContext.weakTopics.join(', ')}`
              : undefined,
          practice: {
            question:
              triggerContext.subject === 'English'
                ? 'Warm-up: Which letter starts Apple 🍎?'
                : triggerContext.subject === 'Hindi'
                  ? 'आसान सवाल: क से क्या होता है? 🕊️'
                  : 'Warm-up: What is 2 🍎 + 2 🍎?',
            options:
              triggerContext.subject === 'English'
                ? ['A', 'B', 'C']
                : triggerContext.subject === 'Hindi'
                  ? ['कबूतर', 'मछली', 'गमला']
                  : ['3', '4', '5'],
            correctAnswer:
              triggerContext.subject === 'English'
                ? 'A'
                : triggerContext.subject === 'Hindi'
                  ? 'कबूतर'
                  : '4',
            praise: 'Great job! See, step-by-step makes it super easy! 🌟',
          },
          timestamp: new Date().toISOString(),
        };
        onUpdateMessages([...messages, welcomeMsg]);
      }
    } else if (messages.length === 0) {
      const greeting: NyraChatMessage = {
        id: 'nyra-greeting',
        role: 'nyra',
        text: `Hi ${studentContext.studentName}! I'm NYRA, your friendly learning buddy. Ask me to explain any topic, give a small hint, or try an easier question! 😊`,
        timestamp: new Date().toISOString(),
      };
      onUpdateMessages([greeting]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerContext]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const clean = (textToSend ?? input).trim();
    if (!clean || sending) return;

    soundTap();
    const userMsg: NyraChatMessage = {
      id: `student-${Date.now()}`,
      role: 'student',
      text: clean,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    onUpdateMessages(nextHistory);
    if (!textToSend) setInput('');
    setSending(true);

    try {
      const { reply, meta } = await sendNyraSupportMessage(
        studentContext,
        clean,
        nextHistory,
        triggerContext || undefined
      );
      onUpdateMessages([...nextHistory, reply]);
      setStatusNote(meta.statusMessage);
      soundCorrect();
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[90] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-lg rounded-[32px] p-5 shadow-2xl h-[86vh] max-h-[760px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              NYRA Friendly Tutor
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
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Student Context Banner */}
        <div className="my-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl px-3 py-2 text-[11px] font-bold text-indigo-800 flex flex-wrap items-center justify-between gap-1">
          <span>
            {studentContext.studentName} • {studentContext.className}
          </span>
          {triggerContext ? (
            <span>
              Test: {triggerContext.testTitle} ({triggerContext.score}%)
            </span>
          ) : (
            <span>
              {studentContext.weakTopics.length > 0
                ? `Weak topics: ${studentContext.weakTopics.slice(0, 2).join(', ')}`
                : studentContext.currentLearningLevel}
            </span>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1"
        >
          {messages.map((msg) => {
            const isNyra = msg.role === 'nyra';
            const picked = practicePicks[msg.id];
            return (
              <div
                key={msg.id}
                className={`flex ${isNyra ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs sm:text-sm font-semibold whitespace-pre-line ${
                    isNyra
                      ? 'bg-slate-100 text-slate-800 border border-slate-200'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <div>{msg.text}</div>

                  {msg.hint && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-2.5 py-1.5 text-xs font-bold">
                      💡 Hint: {msg.hint}
                    </div>
                  )}

                  {msg.example && (
                    <div className="mt-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-2.5 py-1.5 text-xs font-bold">
                      ✨ Example: {msg.example}
                    </div>
                  )}

                  {msg.practice && (
                    <div className="mt-2 bg-white border border-indigo-200 rounded-xl p-2.5 text-slate-800">
                      <div className="text-xs font-black mb-1.5">
                        {msg.practice.question}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {msg.practice.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setPracticePicks((prev) => ({
                                ...prev,
                                [msg.id]: opt,
                              }));
                              if (opt === msg.practice?.correctAnswer) {
                                soundCorrect();
                              } else {
                                soundWrong();
                              }
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-black border ${
                              picked === opt
                                ? opt === msg.practice?.correctAnswer
                                  ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                  : 'bg-red-100 border-red-400 text-red-800'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {picked && (
                        <div
                          className={`mt-1.5 text-[11px] font-bold ${
                            picked === msg.practice.correctAnswer
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {picked === msg.practice.correctAnswer
                            ? msg.practice.praise
                            : 'Almost! Try one of the other choices — you can do it!'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                NYRA is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="flex gap-1.5 overflow-x-auto py-2">
          {[
            'Explain my mistake',
            'Give me an easier question',
            'Give me a small hint',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={sending}
              onClick={() => handleSend(prompt)}
              className="shrink-0 text-[11px] font-black px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              {prompt}
            </button>
          ))}
          {triggerContext &&
            onRetryTest &&
            !triggerContext.mode.startsWith('nyra:') && (
              <button
                type="button"
                onClick={() => {
                  soundTap();
                  onRetryTest(triggerContext.mode);
                }}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-full bg-emerald-600 text-white"
              >
                <RefreshCw className="w-3 h-3" /> Try Again
              </button>
            )}
        </div>

        {statusNote && (
          <div className="text-[10px] font-bold text-slate-400 mb-1.5">
            {statusNote}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask NYRA anything..."
            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
};
