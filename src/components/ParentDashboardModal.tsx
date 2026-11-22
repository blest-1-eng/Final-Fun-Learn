import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import type {
  NepEarnedBadge,
  NepZoneProgressRecord,
  NyraBackendHealth,
  NyraQuotaInfo,
  NyraSettings,
  StudentPerformanceContext,
  TestHistoryItem,
} from '../types/learning';
import { soundTap } from '../utils/audio';
import { NepBadge, NepPhilosophyBanner } from './NepBranding';
import { NexoraBadge } from './NexoraBadge';

interface ParentDashboardModalProps {
  history: TestHistoryItem[];
  studentContext: StudentPerformanceContext;
  settings: NyraSettings;
  backendHealth: NyraBackendHealth | null;
  nyraQuota?: NyraQuotaInfo | null;
  nepBadges?: NepEarnedBadge[];
  nepProgress?: Record<string, NepZoneProgressRecord>;
  onUpdateSettings: (next: NyraSettings) => void;
  onRefreshHealth: () => void;
  onClose: () => void;
  onOpenAbout?: () => void;
}

export const ParentDashboardModal: React.FC<ParentDashboardModalProps> = ({
  history,
  studentContext,
  settings,
  backendHealth,
  nyraQuota,
  nepBadges = [],
  nepProgress = {},
  onUpdateSettings,
  onRefreshHealth,
  onClose,
  onOpenAbout,
}) => {
  return (
    <section
      id="parent-screen"
      className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-5"
    >
      <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl max-h-[88vh] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-black">📊 Parent Dashboard</h2>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <NexoraBadge variant="light" />
              <NepBadge variant="light" onOpenAbout={onOpenAbout} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundTap();
              onClose();
            }}
            className="text-xl font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2 space-y-3 overflow-y-auto pr-1 flex-1">
          {/* NEP 2020 Educational Philosophy & About Fun & Learn */}
          <NepPhilosophyBanner onOpenAbout={onOpenAbout} />

          {/* Student Overview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
            <div className="font-black text-slate-800">
              👦 {studentContext.studentName} • {studentContext.className}
            </div>
            <div className="font-bold text-slate-600">
              Learning Level: {studentContext.currentLearningLevel} • Completed
              Lessons: {studentContext.completedLessons.length}
            </div>
            <div className="font-bold text-amber-700">
              Focus Areas:{' '}
              {studentContext.weakTopics.length > 0
                ? studentContext.weakTopics.join(', ')
                : 'Doing great so far!'}
            </div>
          </div>

          {/* NEP 2020 Discovery Zones & Badges */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-900">
                🏅 NEP 2020 Holistic Progress ({Object.keys(nepProgress).length} started)
              </span>
              <span className="font-black text-emerald-700">
                {nepBadges.length} {nepBadges.length === 1 ? 'Badge' : 'Badges'}
              </span>
            </div>
            {nepBadges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {nepBadges.slice(0, 8).map((b) => (
                  <span
                    key={b.badgeId}
                    className="inline-flex items-center gap-1 bg-white border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-700"
                  >
                    <span>{b.emoji}</span>
                    <span>{b.title}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[11px] font-semibold text-emerald-800">
                Explore the 8 Discovery Zones on the home menu to earn holistic badges!
              </div>
            )}
          </div>

          {/* Configurable NYRA Low-Score Threshold */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs">
            <div className="font-black text-indigo-800 mb-1.5">
              💬 NYRA Helpful Support Trigger
            </div>
            <p className="text-slate-600 font-semibold mb-2">
              Offer friendly NYRA help automatically when test score is below:
            </p>
            <div className="flex gap-1.5">
              {[40, 50, 60, 70].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    soundTap();
                    onUpdateSettings({ ...settings, lowScoreThreshold: val });
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-black border ${
                    settings.lowScoreThreshold === val
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-indigo-200'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Non-technical NYRA Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-slate-700">
                ✨ NYRA Learning Companion Status
              </span>
              <button
                type="button"
                onClick={() => {
                  soundTap();
                  onRefreshHealth();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600"
              >
                <RefreshCw className="w-3 h-3" /> Check
              </button>
            </div>
            {backendHealth ? (
              <div className="mt-1 space-y-1 font-bold text-slate-700">
                <div
                  className={
                    backendHealth.ok ? 'text-emerald-600' : 'text-amber-600'
                  }
                >
                  {backendHealth.ok
                    ? 'NYRA is connected and ready ✨'
                    : 'NYRA is temporarily unavailable. Saved lessons and practice remain ready.'}
                </div>
                {nyraQuota && (
                  <div className="text-[11px] font-semibold text-slate-500">
                    {nyraQuota.cooldownActive
                      ? 'NYRA is taking a little break right now.'
                      : `Daily NYRA turns left today: ${nyraQuota.userRemainingToday} of ${nyraQuota.userDailyLimit}`}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-1 text-slate-400 font-bold">
                NYRA is thinking...
              </div>
            )}
          </div>

          {/* Preserved Test History */}
          <div>
            <div className="text-xs font-black uppercase text-slate-400 mb-2">
              Test History
            </div>
            <div id="history" className="space-y-2.5">
              {!history.length ? (
                <div className="text-center text-gray-400 p-5 text-sm">
                  अभी तक कोई टेस्ट पूरा नहीं हुआ है।
                </div>
              ) : (
                history
                  .slice()
                  .reverse()
                  .map((item, idx) => (
                    <div
                      key={`${item.date}-${idx}`}
                      className="kids-card p-3 flex justify-between items-center text-sm"
                    >
                      <div>
                        <div className="font-black">
                          {item.className || `Class ${item.age}`} ({item.mode})
                        </div>
                        <div className="text-xs text-gray-400">{item.date}</div>
                      </div>
                      <div className="font-black text-blue-500 text-base">
                        {item.score}%
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
