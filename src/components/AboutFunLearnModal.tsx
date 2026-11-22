import React from 'react';
import { BookOpen, Sparkles, X } from 'lucide-react';
import { soundTap } from '../utils/audio';
import { NepPhilosophyBanner } from './NepBranding';
import { NexoraBadge } from './NexoraBadge';

interface AboutFunLearnModalProps {
  onClose: () => void;
}

export const AboutFunLearnModal: React.FC<AboutFunLearnModalProps> = ({
  onClose,
}) => {
  return (
    <section
      id="about-funlearn-modal"
      className="fixed inset-0 z-[85] bg-slate-900/75 flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-md rounded-[30px] overflow-hidden shadow-2xl border border-slate-100">
        <div aria-hidden="true" className="h-1.5 w-full flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-slate-100" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧸</span>
                <h2 className="app-title text-xl font-black text-[#1e3a8a]">
                  About Fun Learn
                </h2>
              </div>
              <div className="mt-1.5">
                <NexoraBadge variant="light" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundTap();
                onClose();
              }}
              aria-label="Close About Fun Learn"
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <NepPhilosophyBanner />

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-black text-[#1e3a8a]">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Our Educational Philosophy</span>
            </div>
            <p className="font-semibold leading-relaxed text-slate-600">
              Fun Learn is designed for Nursery through 5th Class learners to
              make foundational numeracy, English, and Hindi interactive,
              stress-free, and joyful.
            </p>
            <div className="flex items-start gap-1.5 font-semibold text-slate-600 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                Guided by NEXORA LABS and our NYRA companion for gentle,
                concept-first understanding at every learner&apos;s own pace.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundTap();
              onClose();
            }}
            className="w-full py-3 rounded-2xl text-white font-black text-sm shadow-md"
            style={{
              background: 'linear-gradient(145deg, #4f8cff, #765cff)',
            }}
          >
            Back to Learning
          </button>
        </div>
      </div>
    </section>
  );
};
