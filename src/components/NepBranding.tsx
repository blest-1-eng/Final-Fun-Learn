import React from 'react';
import { BookOpen, Info } from 'lucide-react';
import { soundTap } from '../utils/audio';

interface NepBadgeProps {
  variant?: 'light' | 'glass';
  onOpenAbout?: () => void;
}

/**
 * Lightweight, low-end-friendly NEP 2020 alignment badge & banner.
 * Uses subtle saffron/white/green Indian-inspired accent lines without government emblems.
 */
export const NepBadge: React.FC<NepBadgeProps> = ({
  variant = 'light',
  onOpenAbout,
}) => {
  if (variant === 'glass') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-2.5 py-1 text-[11px] font-bold text-white">
        <span
          aria-hidden="true"
          className="inline-flex flex-col w-2.5 h-2.5 rounded-full overflow-hidden shrink-0 border border-white/50"
        >
          <span className="flex-1 bg-[#FF9933]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#138808]" />
        </span>
        <span>Inspired by NEP 2020</span>
        {onOpenAbout && (
          <button
            type="button"
            onClick={() => {
              soundTap();
              onOpenAbout();
            }}
            aria-label="About Fun Learn and NEP 2020 approach"
            className="ml-0.5 inline-flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 p-0.5"
          >
            <Info className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-slate-700">
      <span
        aria-hidden="true"
        className="inline-flex flex-col w-2.5 h-2.5 rounded-full overflow-hidden shrink-0 border border-slate-200"
      >
        <span className="flex-1 bg-[#FF9933]" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-[#138808]" />
      </span>
      <span className="text-[#1e3a8a] font-extrabold">
        NEP 2020 Aligned Learning Approach
      </span>
      {onOpenAbout && (
        <button
          type="button"
          onClick={() => {
            soundTap();
            onOpenAbout();
          }}
          aria-label="About Fun Learn and NEP 2020 approach"
          className="ml-0.5 text-amber-700 hover:text-indigo-700"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface NepPhilosophyBannerProps {
  compact?: boolean;
  variant?: 'glass' | 'card';
  onOpenAbout?: () => void;
}

export const NepPhilosophyBanner: React.FC<NepPhilosophyBannerProps> = ({
  compact = false,
  variant = 'card',
  onOpenAbout,
}) => {
  if (variant === 'glass') {
    return (
      <div className="rounded-2xl bg-white/12 border border-white/25 overflow-hidden text-left">
        <div
          aria-hidden="true"
          className="h-1 w-full flex"
        >
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white/90" />
          <div className="flex-1 bg-[#138808]" />
        </div>
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-black text-amber-100 leading-tight">
              Learning Beyond Textbooks — Inspired by NEP 2020
            </div>
            {!compact && (
              <p className="text-[10px] font-semibold text-white/90 mt-0.5 leading-snug">
                Encouraging experiential learning, creativity, critical thinking,
                foundational skills and holistic development through engaging
                digital education.
              </p>
            )}
          </div>
          {onOpenAbout && (
            <button
              type="button"
              onClick={() => {
                soundTap();
                onOpenAbout();
              }}
              className="shrink-0 text-[10px] font-black bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-xl border border-white/25"
            >
              Philosophy
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-50/70 via-white to-emerald-50/70 border border-amber-200/80 overflow-hidden text-left">
      <div aria-hidden="true" className="h-1 w-full flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-slate-100" />
        <div className="flex-1 bg-[#138808]" />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#1e3a8a]">
            <BookOpen className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Learning Beyond Textbooks — Inspired by NEP 2020</span>
          </div>
          {onOpenAbout && (
            <button
              type="button"
              onClick={() => {
                soundTap();
                onOpenAbout();
              }}
              className="shrink-0 text-[10px] font-black text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg"
            >
              About
            </button>
          )}
        </div>
        <p className="text-[11px] font-semibold text-slate-600 mt-1.5 leading-relaxed">
          Encouraging experiential learning, creativity, critical thinking,
          foundational skills and holistic development through engaging digital
          education.
        </p>
        {!compact && (
          <>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-extrabold text-slate-700">
              <div className="bg-white/90 border border-orange-100 rounded-lg px-2 py-1">
                Foundational Literacy &amp; Numeracy
              </div>
              <div className="bg-white/90 border border-emerald-100 rounded-lg px-2 py-1">
                Experiential Visual Learning
              </div>
              <div className="bg-white/90 border border-indigo-100 rounded-lg px-2 py-1">
                Critical Thinking &amp; Curiosity
              </div>
              <div className="bg-white/90 border border-amber-100 rounded-lg px-2 py-1">
                Holistic Joyful Growth
              </div>
            </div>
            <p className="mt-2 text-[10px] font-semibold text-slate-500">
              Independent digital learning initiative by NEXORA LABS, inspired by
              India&apos;s NEP 2020 vision (not a government app or official
              endorsement).
            </p>
          </>
        )}
      </div>
    </div>
  );
};
