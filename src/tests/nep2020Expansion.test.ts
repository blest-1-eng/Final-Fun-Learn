import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNepZoneModule,
  NEP_EXISTING_TOPIC_AUDIT,
  NEP_ZONES,
} from '../data/nep2020Curriculum';
import type { ClassAge } from '../types/learning';
import {
  createStudentProfile,
  getNepZoneProgress,
  getStudentStore,
  saveNepZoneProgress,
  unlockNepBadge,
} from '../utils/storage';

const ALL_AGES: ClassAge[] = [3, 4, 5, 6, 7, 8, 9, 10];

describe('NEP 2020 Holistic Expansion (8 Zones × 8 Classes)', () => {
  it('defines all 8 required NEP 2020 zones with distinct non-duplicated modules per grade', () => {
    expect(NEP_ZONES).toHaveLength(8);
    expect(NEP_EXISTING_TOPIC_AUDIT.alreadyExistingSkipped.length).toBeGreaterThanOrEqual(7);

    for (const zone of NEP_ZONES) {
      const titlesForZone = new Set<string>();
      const badgeIdsForZone = new Set<string>();

      for (const age of ALL_AGES) {
        const mod = getNepZoneModule(zone.id, age);
        expect(mod.zoneId).toBe(zone.id);
        expect(mod.classAge).toBe(age);
        expect(mod.lessons.length).toBeGreaterThanOrEqual(2);
        expect(mod.quiz).toHaveLength(3);
        expect(mod.realLifeChallenge.title.length).toBeGreaterThan(3);

        // Distinct per-grade title and badge (no class copy-pasting)
        expect(titlesForZone.has(mod.moduleTitle)).toBe(false);
        titlesForZone.add(mod.moduleTitle);
        expect(badgeIdsForZone.has(mod.badge.id)).toBe(false);
        badgeIdsForZone.add(mod.badge.id);

        // Valid quiz structure
        for (const q of mod.quiz) {
          expect(q.options.length).toBe(3);
          expect(q.options).toContain(q.correctAnswer);
          expect(q.hint.length).toBeGreaterThan(4);
          expect(q.explanation.length).toBeGreaterThan(6);
        }

        // Valid interactive activity structure
        if (mod.activity.kind === 'classify') {
          expect((mod.activity.classifyItems || []).length).toBe(4);
        } else if (mod.activity.kind === 'sequence') {
          expect((mod.activity.sequenceSteps || []).length).toBeGreaterThanOrEqual(3);
        } else {
          const opts = mod.activity.options || [];
          expect(opts.length).toBe(3);
          expect(opts.filter((o) => o.correct)).toHaveLength(1);
        }
      }
    }
  });

  it('keeps Digital Literacy & AI Awareness strictly unplugged (no coding syntax for Nursery–Class 5)', () => {
    const codingRegex = /\b(console\.log|function\s*\(|import\s+react|python|javascript|for\s*\(\s*let|while\s*\()\b/i;
    for (const age of ALL_AGES) {
      const mod = getNepZoneModule('digital_ai', age);
      const serialized = JSON.stringify(mod);
      expect(codingRegex.test(serialized)).toBe(false);
    }
  });

  describe('Per-Student Progress & Badge Isolation', () => {
    beforeEach(() => {
      const store: Record<string, string> = {};
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          for (const k of Object.keys(store)) delete store[k];
        },
      });
    });

    it('tracks NEP zone completion, best quiz scores, and badges cleanly per student', () => {
      const s1 = createStudentProfile('Ananya', 6);
      const s2 = createStudentProfile('Vihaan', 9);

      const mod = getNepZoneModule('env_sustainability', 6);
      saveNepZoneProgress(s1.id, 'env_sustainability', 6, {
        lessonsViewed: true,
        activityDone: true,
        quizBestScore: 100,
        challengeDone: true,
      });
      unlockNepBadge(s1.id, 'env_sustainability', 6, mod.badge);

      const p1 = getNepZoneProgress(s1.id, 'env_sustainability', 6);
      const p2 = getNepZoneProgress(s2.id, 'env_sustainability', 6);

      expect(p1.quizBestScore).toBe(100);
      expect(p1.challengeDone).toBe(true);
      expect(p2.quizBestScore).toBeNull();
      expect(p2.challengeDone).toBe(false);

      expect((getStudentStore(s1.id).nepBadges || []).length).toBe(1);
      expect((getStudentStore(s2.id).nepBadges || []).length).toBe(0);
    });
  });
});
