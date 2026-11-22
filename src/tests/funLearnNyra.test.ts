import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  buildWorksheetQuestions,
  getClassName,
  getMenuFeatures,
} from '../data/curriculum';
import {
  NYRA_BACKEND_BASE_URL,
  NYRA_ENDPOINTS,
} from '../config/nyraBackend';
import {
  checkBackendHealth,
  fetchNyraQuota,
  generateNyraAdaptiveLevel,
  generateNyraAdaptiveTest,
  sendNyraSupportMessage,
} from '../services/nyraClient';
import {
  buildStudentPerformanceContext,
  createStudentProfile,
  evaluateLowScoreTrigger,
  getStudentStore,
  markNyraLevelCompleted,
  recordTestResultForStudent,
  saveNyraLevel,
  saveNyraTest,
  saveTestHistoryEntry,
} from '../utils/storage';

describe('Fun Learn Core Curriculum & Worksheet Preservation', () => {
  it('maps all 8 classes from Nursery to 5th Class accurately', () => {
    expect(getClassName(3)).toBe('Nursery');
    expect(getClassName(4)).toBe('LKG');
    expect(getClassName(5)).toBe('UKG');
    expect(getClassName(6)).toBe('1st Class');
    expect(getClassName(7)).toBe('2nd Class');
    expect(getClassName(8)).toBe('3rd Class');
    expect(getClassName(9)).toBe('4th Class');
    expect(getClassName(10)).toBe('5th Class');
  });

  it('builds menu features and valid 3-option questions for every age/mode', () => {
    const ages = [3, 4, 5, 6, 7, 8, 9, 10];
    for (const age of ages) {
      const menu = getMenuFeatures(age);
      expect(menu.learningFeatures.length).toBeGreaterThan(0);
      expect(menu.testFeatures.length).toBeGreaterThan(0);

      for (const testFeature of menu.testFeatures) {
        const qs = buildWorksheetQuestions(testFeature.mode, age);
        expect(qs.length).toBe(age === 6 ? 10 : 5);
        for (const q of qs) {
          expect(q.options.length).toBe(3);
          expect(q.options.map(String)).toContain(String(q.target));
        }
      }
    }
  });
});

describe('Student Profile Isolation & Low-Score Trigger', () => {
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

  it('keeps separate students progress and weak topics completely isolated', () => {
    const s1 = createStudentProfile('Aarav', 6);
    const s2 = createStudentProfile('Diya', 10);

    saveTestHistoryEntry(
      s1.id,
      {
        age: 6,
        className: '1st Class',
        mode: 'ws3',
        subject: 'Math',
        score: 40,
        wrong: 6,
        date: '2026-11-21',
      },
      [
        {
          mode: 'ws3',
          subject: 'Math',
          topic: 'Visual Fruit Addition',
          question: '3 + 4 = ?',
          selectedAnswer: '8',
          correctAnswer: '7',
          timestamp: '2026-11-21T00:00:00Z',
        },
      ]
    );

    const ctx1 = buildStudentPerformanceContext(s1, 'Math');
    const ctx2 = buildStudentPerformanceContext(s2, 'Math');

    expect(ctx1.weakTopics).toContain('Visual Fruit Addition');
    expect(ctx1.previousTestScores).toEqual([40]);
    expect(ctx2.weakTopics).toEqual([]);
    expect(ctx2.previousTestScores).toEqual([]);
  });

  it('triggers supportive NYRA offer for low score, repeated mistakes, or score drop', () => {
    const s = createStudentProfile('Rohan', 7);
    const settings = { lowScoreThreshold: 50, repeatedMistakeThreshold: 2 };

    expect(evaluateLowScoreTrigger(s.id, 7, 40, 1, settings)).toBe('low_score');
    expect(evaluateLowScoreTrigger(s.id, 7, 60, 2, settings)).toBe(
      'repeated_mistakes'
    );

    recordTestResultForStudent(s.id, 7, 90);
    recordTestResultForStudent(s.id, 7, 65);
    expect(evaluateLowScoreTrigger(s.id, 7, 65, 1, settings)).toBe(
      'performance_drop'
    );
  });
});

describe('NYRA Live Endpoint Integration & Offline Safeguards', () => {
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

  it('calls /health, /v1/nyra/quota, /v1/nyra/generate, and /v1/nyra/chat cleanly', async () => {
    expect(NYRA_BACKEND_BASE_URL).toBe('https://backend-render-5u80.onrender.com');
    expect(NYRA_ENDPOINTS.HEALTH).toBe('/health');
    expect(NYRA_ENDPOINTS.CHAT).toBe('/v1/nyra/chat');
    expect(NYRA_ENDPOINTS.GENERATE).toBe('/v1/nyra/generate');
    expect(NYRA_ENDPOINTS.QUOTA).toBe('/v1/nyra/quota');

    const calls: Array<{ url: string; headers?: HeadersInit; body?: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({
          url,
          headers: init?.headers,
          body: typeof init?.body === 'string' ? init.body : undefined,
        });
        if (url.endsWith('/health')) {
          return new Response(
            JSON.stringify({ status: 'ok', company: 'NEXORALABS', groqConfigured: true }),
            { status: 200 }
          );
        }
        if (url.endsWith('/v1/nyra/quota')) {
          return new Response(
            JSON.stringify({
              day: '2026-11-21',
              userUsedToday: 2,
              userDailyLimit: 25,
              userRemainingToday: 23,
              cooldownActive: false,
              message: 'NYRA is ready!',
            }),
            { status: 200 }
          );
        }
        if (url.endsWith('/v1/nyra/generate')) {
          const parsedBody = JSON.parse(String(init?.body || '{}'));
          if (String(parsedBody.prompt).includes('4-question')) {
            return new Response(
              JSON.stringify({
                title: 'Multiplication Check',
                questions: [
                  {
                    id: 'q1',
                    type: 'mcq',
                    topic: 'Tables',
                    prompt: 'What is 3 × 4?',
                    options: ['10', '12', '14'],
                    correctAnswer: '12',
                    explanation: '3 groups of 4 make 12.',
                  },
                  {
                    id: 'q2',
                    type: 'true_false',
                    topic: 'Tables',
                    prompt: '2 × 5 = 10.',
                    options: ['True', 'False'],
                    correctAnswer: 'True',
                    explanation: 'Two fives equal 10.',
                  },
                  {
                    id: 'q3',
                    type: 'fill_blank',
                    topic: 'Tables',
                    prompt: '4 × 2 = ___',
                    correctAnswer: '8',
                    explanation: '4 doubled is 8.',
                  },
                  {
                    id: 'q4',
                    type: 'short_answer',
                    topic: 'Tables',
                    prompt: 'How many stars in 3 rows of 2?',
                    correctAnswer: '6',
                    explanation: '3 × 2 = 6.',
                  },
                ],
              }),
              { status: 200 }
            );
          }
          return new Response(
            JSON.stringify({
              title: 'Friendly Tables Fun',
              topic: 'Multiplication',
              learningObjective: 'Understand equal groups.',
              simpleExplanation: 'Multiplication means adding equal groups!',
              activities: [
                {
                  title: 'Apple Groups',
                  instruction: 'Make 2 groups of 3 apples.',
                  example: '3 + 3 = 6 apples',
                },
              ],
              practiceQuestions: [
                {
                  prompt: 'What is 2 × 3?',
                  options: ['5', '6', '7'],
                  correctAnswer: '6',
                  hint: 'Count 3 twice!',
                },
              ],
              completionCriteria: 'Try all activities and questions.',
            }),
            { status: 200 }
          );
        }
        if (url.endsWith('/v1/nyra/chat')) {
          return new Response(
            JSON.stringify({
              reply: 'No worries! Count 2 groups of 3 apples: 3 + 3 makes 6.',
              model: 'openai/gpt-oss-120b',
            }),
            { status: 200 }
          );
        }
        return new Response('Not found', { status: 404 });
      })
    );

    const health = await checkBackendHealth();
    expect(health.ok).toBe(true);
    expect(health.company).toBe('NEXORALABS');

    const s = createStudentProfile('Meera', 8);
    const quota = await fetchNyraQuota(s.id);
    expect(quota?.userRemainingToday).toBe(23);

    const ctx = buildStudentPerformanceContext(s, 'Math');
    const { level, meta: levelMeta } = await generateNyraAdaptiveLevel(ctx, 'Math');
    expect(levelMeta.usedLiveService).toBe(true);
    expect(level.source).toBe('backend');
    expect(level.title).toBe('Friendly Tables Fun');

    saveNyraLevel(s.id, level);
    markNyraLevelCompleted(s.id, level.id);
    expect(getStudentStore(s.id).levels[0].completed).toBe(true);

    const { test, meta: testMeta } = await generateNyraAdaptiveTest(
      ctx,
      'Math',
      level.topic,
      level
    );
    expect(testMeta.usedLiveService).toBe(true);
    expect(test.source).toBe('backend');
    expect(test.questions.map((q) => q.type)).toEqual([
      'mcq',
      'true_false',
      'fill_blank',
      'short_answer',
    ]);
    saveNyraTest(s.id, test);
    expect(getStudentStore(s.id).tests.length).toBe(1);

    const { reply, meta: chatMeta } = await sendNyraSupportMessage(
      ctx,
      'Explain my mistake',
      [],
      {
        mode: 'subtraction',
        testTitle: 'Subtraction',
        subject: 'Math',
        topic: 'Subtraction',
        score: 40,
        wrongCount: 3,
        reason: 'low_score',
        incorrectItems: [],
        weakTopics: ['Subtraction'],
      }
    );
    expect(chatMeta.usedLiveService).toBe(true);
    expect(reply.source).toBe('backend');
    expect(reply.text).toContain('6');

    const chatCall = calls.find((c) => c.url.endsWith('/v1/nyra/chat'));
    expect(chatCall).toBeTruthy();
    const sentChatBody = JSON.parse(chatCall?.body || '{}');
    expect(Array.isArray(sentChatBody.messages)).toBe(true);
    expect(sentChatBody.classLevel).toBe('3rd Class');

    vi.unstubAllGlobals();
  });

  it('handles malformed AI responses and HTTP 429 breaks safely without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/v1/nyra/generate')) {
          return new Response(JSON.stringify({ unexpected: 'incomplete' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            code: 'QUOTA_EXHAUSTED',
            userMessage: 'NYRA is taking a little break. Please try again later!',
          }),
          { status: 429 }
        );
      })
    );

    const s = createStudentProfile('Kabir', 6);
    const ctx = buildStudentPerformanceContext(s, 'Math');

    const { level, meta: lvlMeta } = await generateNyraAdaptiveLevel(ctx, 'Math');
    expect(lvlMeta.usedLiveService).toBe(false);
    expect(level.source).toBe('local-offline');
    expect(level.practiceQuestions.length).toBeGreaterThan(0);

    const { reply, meta: chatMeta } = await sendNyraSupportMessage(ctx, 'Help me', []);
    expect(chatMeta.usedLiveService).toBe(false);
    expect(chatMeta.statusMessage).toBe(
      'NYRA is taking a little break. Please try again later!'
    );
    expect(reply.source).toBe('local-offline');

    vi.unstubAllGlobals();
  });
});
