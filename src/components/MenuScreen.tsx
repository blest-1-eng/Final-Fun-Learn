import React from 'react';
import { Sparkles, Wifi, WifiOff } from 'lucide-react';
import { CLASS_OPTIONS, getClassName, getMenuFeatures } from '../data/curriculum';
import { getNepZoneModule, NEP_ZONES } from '../data/nep2020Curriculum';
import type {
  ClassAge,
  FeatureMode,
  NepZoneId,
  NepZoneProgressRecord,
  NyraBackendHealth,
  StudentProfile,
} from '../types/learning';
import { soundTap } from '../utils/audio';
import { NepBadge, NepPhilosophyBanner } from './NepBranding';
import { NexoraBadge } from './NexoraBadge';

interface MenuScreenProps {
  age: ClassAge;
  activeStudent: StudentProfile;
  recentTestCount: number;
  nyraLevelCount: number;
  nyraTestCount: number;
  backendHealth: NyraBackendHealth | null;
  nepProgress?: Record<string, NepZoneProgressRecord>;
  onChangeAge: (newAge: ClassAge) => void;
  onOpenFeature: (mode: FeatureMode) => void;
  onOpenNepZone: (zoneId: NepZoneId) => void;
  onOpenParentDashboard: () => void;
  onOpenNyraLevels: () => void;
  onOpenNyraTests: () => void;
  onOpenNyraChat: () => void;
  onSwitchProfile: () => void;
  onOpenAbout?: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  age,
  activeStudent,
  recentTestCount,
  nyraLevelCount,
  nyraTestCount,
  backendHealth,
  nepProgress = {},
  onChangeAge,
  onOpenFeature,
  onOpenNepZone,
  onOpenParentDashboard,
  onOpenNyraLevels,
  onOpenNyraTests,
  onOpenNyraChat,
  onSwitchProfile,
  onOpenAbout,
}) => {
  const { learningFeatures, testFeatures } = getMenuFeatures(age);

  return (
    <section
      id="menu-screen"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center p-4 text-white overflow-y-auto"
      style={{
        background: 'linear-gradient(145deg, #5d9cff, #765fe6 55%, #f06ca8)',
      }}
    >
      <div className="w-full max-w-lg my-auto">
        <div className="text-center mb-2.5">
          <div className="text-3xl">🌈</div>
          <h1 className="app-title text-2xl">Fun Learn</h1>
          <p id="profile-text" className="text-xs mt-0.5 opacity-90">
            {getClassName(age)} Learning Adventure • {activeStudent.name}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 flex-wrap">
            <NexoraBadge variant="glass" />
            <NepBadge variant="glass" onOpenAbout={onOpenAbout} />
            <button
              type="button"
              onClick={() => {
                soundTap();
                onSwitchProfile();
              }}
              className="text-[11px] font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full border border-white/25"
            >
              Switch Student
            </button>
          </div>
          <div className="mt-2">
            <NepPhilosophyBanner
              variant="glass"
              compact
              onOpenAbout={onOpenAbout}
            />
          </div>
        </div>

        {/* Class Change Option inside Menu */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl mb-3 flex items-center justify-between">
          <span className="text-xs font-bold">Change Class:</span>
          <select
            id="menu-age-select"
            value={age}
            onChange={(e) => {
              soundTap();
              onChangeAge(Number(e.target.value) as ClassAge);
            }}
            className="bg-white text-gray-800 p-1.5 px-3 rounded-xl border-none outline-none text-xs font-bold"
          >
            {CLASS_OPTIONS.map((opt) => (
              <option key={opt.age} value={opt.age}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div
          id="sections-container"
          className="max-h-[54vh] overflow-y-auto pr-1 space-y-3"
        >
          {learningFeatures.length > 0 && (
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-yellow-200 px-1 mb-1 mt-1">
                📚 Learning Zone
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {learningFeatures.map((feature) => (
                  <button
                    key={feature.mode}
                    type="button"
                    className="mode-card p-2.5 flex flex-col items-center justify-center text-center"
                    onClick={() => {
                      soundTap();
                      onOpenFeature(feature.mode);
                    }}
                  >
                    <div className="text-2xl mb-1">{feature.emoji}</div>
                    <div className="font-black text-xs">{feature.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {testFeatures.length > 0 && (
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-yellow-200 px-1 mb-1">
                ⭐ Test &amp; Practice Zone{' '}
                <span className="text-xs bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded-full ml-1">
                  Tests: {recentTestCount}/10
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {testFeatures.map((feature) => (
                  <button
                    key={feature.mode}
                    type="button"
                    className="mode-card p-2.5 flex flex-col items-center justify-center text-center"
                    onClick={() => {
                      soundTap();
                      onOpenFeature(feature.mode);
                    }}
                  >
                    <div className="text-2xl mb-1">{feature.emoji}</div>
                    <div className="font-black text-xs">{feature.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additive NEP 2020 8 Discovery Zones */}
          <div className="pt-1">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-yellow-200">
                🌟 NEP 2020 Discovery Zones
              </span>
              <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full">
                {getClassName(age)} • 8 Zones
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NEP_ZONES.map((zone) => {
                const mod = getNepZoneModule(zone.id, age);
                const prog = nepProgress[`${age}:${zone.id}`];
                const isBadgeReady = Boolean(
                  prog && (prog.challengeDone || (prog.activityDone && (prog.quizBestScore ?? 0) >= 60))
                );
                return (
                  <button
                    key={zone.id}
                    type="button"
                    className="mode-card p-2.5 flex flex-col items-center justify-center text-center relative"
                    onClick={() => {
                      soundTap();
                      onOpenNepZone(zone.id);
                    }}
                  >
                    {isBadgeReady && (
                      <span
                        className="absolute top-1.5 right-1.5 text-[11px]"
                        title={`Badge earned: ${mod.badge.title}`}
                      >
                        {mod.badge.emoji}
                      </span>
                    )}
                    <div className="text-2xl mb-0.5">{zone.emoji}</div>
                    <div className="font-black text-[11px] leading-tight text-slate-800">
                      {zone.shortTitle}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-600 mt-0.5 line-clamp-1">
                      {mod.moduleTitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additive NYRA AI Learning Zone */}
          <div className="pt-1">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-yellow-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                NYRA AI Companion
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full">
                {backendHealth?.ok ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-300" />
                    <span>NYRA Ready</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-200" />
                    <span>Saved Practice</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className="mode-card p-2.5 flex flex-col items-center justify-center text-center"
                onClick={() => {
                  soundTap();
                  onOpenNyraLevels();
                }}
              >
                <div className="text-2xl mb-1">🎯</div>
                <div className="font-black text-xs">NYRA Levels</div>
                <div className="text-[10px] font-bold text-indigo-600 mt-0.5">
                  {nyraLevelCount} saved
                </div>
              </button>

              <button
                type="button"
                className="mode-card p-2.5 flex flex-col items-center justify-center text-center"
                onClick={() => {
                  soundTap();
                  onOpenNyraTests();
                }}
              >
                <div className="text-2xl mb-1">📝</div>
                <div className="font-black text-xs">NYRA Tests</div>
                <div className="text-[10px] font-bold text-pink-600 mt-0.5">
                  {nyraTestCount} saved
                </div>
              </button>

              <button
                type="button"
                className="mode-card p-2.5 flex flex-col items-center justify-center text-center"
                onClick={() => {
                  soundTap();
                  onOpenNyraChat();
                }}
              >
                <div className="text-2xl mb-1">💬</div>
                <div className="font-black text-xs">Ask NYRA</div>
                <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                  Friendly Help
                </div>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundTap();
            onOpenParentDashboard();
          }}
          className="w-full mt-3 bg-white text-gray-700 rounded-2xl py-3 font-black shadow-lg text-sm"
        >
          👨‍👩‍👧 Parent Dashboard
        </button>
      </div>
    </section>
  );
};
