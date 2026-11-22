import React from 'react';
import { Sparkles } from 'lucide-react';

interface NexoraBadgeProps {
  variant?: 'light' | 'glass' | 'nyra';
  subtitle?: string;
}

export const NexoraBadge: React.FC<NexoraBadgeProps> = ({
  variant = 'light',
  subtitle,
}) => {
  if (variant === 'glass') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        <span>Powered by</span>
        <span className="font-black tracking-wider text-yellow-200">NEXORA LABS</span>
        {subtitle && <span className="opacity-80">• {subtitle}</span>}
      </div>
    );
  }

  if (variant === 'nyra') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[11px] font-bold text-indigo-700">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>NYRA AI</span>
        <span className="text-indigo-300">•</span>
        <span>
          Powered by <strong className="font-black tracking-wide">NEXORA LABS</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600">
      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
      <span>Powered by</span>
      <span className="font-black tracking-wider text-indigo-600">NEXORA LABS</span>
    </div>
  );
};
