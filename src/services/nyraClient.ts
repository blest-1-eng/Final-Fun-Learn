import {
  NYRA_ENDPOINTS,
  NYRA_TIMEOUTS_MS,
  buildNyraEndpointUrl,
} from '../config/nyraBackend';
import type {
  ClassAge,
  NyraBackendHealth,
  NyraChatMessage,
  NyraChatPracticePrompt,
  NyraLevel,
  NyraLowScoreTriggerContext,
  NyraQuotaInfo,
  NyraTest,
  NyraTestQuestion,
  StudentPerformanceContext,
} from '../types/learning';

export type { NyraQuotaInfo };

const inFlightKeys = new Set<string>();

export interface NyraCallMeta {
  usedLiveService: boolean;
  offline: boolean;
  statusMessage: string;
  health?: NyraBackendHealth;
}

function getFunLearnClientId(studentId?: string): string {
  const safeStudent = (studentId || 'student')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 24);
  let installPart = 'funlearn_web';
  try {
    if (typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem('funlearn_install_client_id');
      if (existing && existing.length >= 8) {
        installPart = existing;
      } else {
        const created = `fl_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('funlearn_install_client_id', created);
        installPart = created;
      }
    }
  } catch {
    // ignore storage errors in restricted contexts
  }
  const combined = `${installPart}_${safeStudent}`.replace(/[^a-zA-Z0-9_-]/g, '');
  return combined.slice(0, 64).padEnd(8, '0');
}

export async function checkBackendHealth(): Promise<NyraBackendHealth> {
  const checkedAt = new Date().toISOString();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      ok: false,
      status: 'offline',
      checkedAt,
      error: 'You are offline right now. Your saved lessons are still ready!',
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NYRA_TIMEOUTS_MS.HEALTH);
    const response = await fetch(buildNyraEndpointUrl(NYRA_ENDPOINTS.HEALTH), {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      return {
        ok: false,
        status: 'unavailable',
        checkedAt,
        error: 'NYRA is temporarily unavailable. Please try again.',
      };
    }

    const data = (await response.json()) as Partial<NyraBackendHealth>;
    return {
      ok: data.status === 'ok' && data.groqConfigured !== false,
      status: data.status || 'unknown',
      company: data.company,
      service: data.service,
      model: data.model,
      groqConfigured: data.groqConfigured,
      requireAppCheck: data.requireAppCheck,
      requireFirebaseAuth: data.requireFirebaseAuth,
      quota: data.quota,
      checkedAt,
    };
  } catch {
    return {
      ok: false,
      status: 'unreachable',
      checkedAt,
      error: 'NYRA is temporarily unavailable. Please try again.',
    };
  }
}

export async function fetchNyraQuota(
  studentId?: string
): Promise<NyraQuotaInfo | null> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NYRA_TIMEOUTS_MS.QUOTA);
    const response = await fetch(buildNyraEndpointUrl(NYRA_ENDPOINTS.QUOTA), {
      method: 'GET',
      headers: {
        'X-FunLearn-Client-Id': getFunLearnClientId(studentId),
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<NyraQuotaInfo>;
    if (typeof data.userRemainingToday !== 'number') return null;
    return {
      day: String(data.day || ''),
      userUsedToday: Number(data.userUsedToday || 0),
      userDailyLimit: Number(data.userDailyLimit || 25),
      userRemainingToday: Number(data.userRemainingToday || 0),
      cooldownActive: Boolean(data.cooldownActive),
      message: String(data.message || 'NYRA is ready!'),
    };
  } catch {
    return null;
  }
}

async function postNyraEndpoint<T>(
  requestKey: string,
  path: string,
  payload: Record<string, unknown>,
  studentId?: string,
  retries = 1
): Promise<{
  data?: T;
  offline: boolean;
  unavailable: boolean;
  rateLimited?: boolean;
  friendlyMessage?: string;
}> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { offline: true, unavailable: true };
  }
  if (!path) {
    return { offline: false, unavailable: true };
  }
  if (inFlightKeys.has(requestKey)) {
    return {
      offline: false,
      unavailable: true,
      friendlyMessage: 'NYRA is already preparing this for you — just a moment!',
    };
  }

  inFlightKeys.add(requestKey);
  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), NYRA_TIMEOUTS_MS.AI);
        const response = await fetch(buildNyraEndpointUrl(path), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-FunLearn-Client-Id': getFunLearnClientId(studentId),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (response.status === 429) {
          let friendly = 'NYRA is taking a little break. Please try again later!';
          try {
            const errJson = (await response.json()) as { userMessage?: string };
            if (errJson?.userMessage) friendly = errJson.userMessage;
          } catch {
            // keep safe child-friendly fallback
          }
          return {
            offline: false,
            unavailable: true,
            rateLimited: true,
            friendlyMessage: friendly,
          };
        }

        if (!response.ok) {
          if (attempt < retries && response.status >= 500) continue;
          let friendly: string | undefined;
          try {
            const errJson = (await response.json()) as { userMessage?: string };
            if (errJson?.userMessage) friendly = errJson.userMessage;
          } catch {
            // ignore non-json error body
          }
          return { offline: false, unavailable: true, friendlyMessage: friendly };
        }

        const json = (await response.json()) as T;
        if (!json || typeof json !== 'object') {
          return { offline: false, unavailable: true };
        }
        return { data: json, offline: false, unavailable: false };
      } catch {
        if (attempt < retries) continue;
        return { offline: false, unavailable: true };
      }
    }
    return { offline: false, unavailable: true };
  } finally {
    inFlightKeys.delete(requestKey);
  }
}

function determineDifficulty(
  ctx: StudentPerformanceContext
): NyraLevel['difficulty'] {
  const scores = ctx.previousTestScores;
  if (scores.length === 0) return 'foundational';
  const recent = scores.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (avg < 55) return 'foundational';
  if (avg < 80) return 'steady';
  return 'challenge';
}

function ctxClassLabel(age: ClassAge): string {
  const labels: Record<ClassAge, string> = {
    3: 'Nursery',
    4: 'LKG',
    5: 'UKG',
    6: '1st Class',
    7: '2nd Class',
    8: '3rd Class',
    9: '4th Class',
    10: '5th Class',
  };
  return labels[age];
}

function pickTopicForClassAndSubject(
  classAge: ClassAge,
  subject: string,
  weakTopics: string[],
  existingTitles: string[]
): { topic: string; focusHint: string } {
  if (weakTopics.length > 0) {
    const weak = weakTopics[0];
    return {
      topic: weak,
      focusHint: `Let's practice "${weak}" together with easy steps`,
    };
  }

  const catalog: Record<string, Record<number, string[]>> = {
    Math: {
      3: ['Counting 1 to 10 with Fruits', 'Counting Stars & Matching Numbers', 'Simple Fruit Addition'],
      4: ['Counting 1 to 20', 'Visual Fruit Addition', 'Number Recognition 1-20'],
      5: ['Counting 1 to 20', 'Visual Fruit Addition', 'Missing Numbers'],
      6: ['Counting 1 to 50', 'Visual Fruit Addition', 'Missing Number Patterns'],
      7: ['2-Digit Addition', 'Greater & Less (> <)', 'Addition Math Stories'],
      8: ['Visual Subtraction', 'Visual Multiplication', 'Tables 2 to 10'],
      9: ['Tables 2 to 5 Mastery', 'Two-Digit Subtraction', 'Word Problem Solving'],
      10: ['Tables 2 to 20 Mastery', 'Visual Division & Equal Sharing', 'Multi-Step Arithmetic'],
    },
    English: {
      3: ['Alphabet A to M', 'Alphabet N to Z', 'Picture & Letter Match'],
      4: ['Alphabet Phonics Sounds', 'First Letter Words', 'Alphabet A to Z'],
      5: ['Alphabet & Words', 'Picture Matching', 'Letter Recognition'],
      6: ['Phonics & CVC Words', 'Missing Vowel Letters', 'Three-Letter Word Building'],
      7: ['Easy English Sentences', 'Sentence Fill in the Blanks', 'Action Words in Sentences'],
      8: ['Reading Short Sentences', 'Word Meanings & Usage', 'Sentence Completion'],
      9: ['English Sentence Comprehension', 'Vocabulary Building', 'Sentence Structure'],
      10: ['Reading Comprehension', 'Grammar & Sentence Accuracy', 'Vocabulary in Context'],
    },
    Hindi: {
      3: ['हिंदी स्वर और व्यंजन परिचय', 'क से च तक अक्षर पहचान', 'चित्र देखकर अक्षर पहचानो'],
      4: ['हिंदी वर्णमाला (क से ज्ञ)', 'चित्र और अक्षर मिलान', 'सही अक्षर चुनो'],
      5: ['हिंदी वर्णमाला अभ्यास', 'अक्षर पहचानो क्विज़', 'चित्र से शब्द'],
      6: ['हिंदी वर्णमाला (क से ज्ञ)', 'सरल अक्षर ज्ञान', 'अक्षर पहचान अभ्यास'],
      7: ['दो अक्षर के सरल शब्द', 'हिंदी अक्षर और शब्द', 'सही शब्द पहचान'],
      8: ['हिंदी की मात्राएँ (ा, ि, ी, ु, ू)', 'मात्रा जोड़कर शब्द बनाना', 'मात्रा पहचान अभ्यास'],
      9: ['बिना मात्रा और मात्रा वाले शब्द पढ़ना', 'तीन अक्षर के हिंदी शब्द', 'शब्द और अर्थ मिलान'],
      10: ['हिंदी वाक्य पढ़ना और समझना', 'वाक्य में सही शब्द भरना', 'वाक्य अर्थ और प्रयोग'],
    },
  };

  const subjectBank = catalog[subject] || catalog.Math;
  const options = subjectBank[classAge] || subjectBank[6];
  const unseen = options.find(
    (t) => !existingTitles.some((title) => title.toLowerCase().includes(t.toLowerCase()))
  );
  const chosen = unseen || options[existingTitles.length % options.length];
  return {
    topic: chosen,
    focusHint: `Next ${subject} milestone for ${ctxClassLabel(classAge)}`,
  };
}

function buildGuidedLevel(
  ctx: StudentPerformanceContext,
  subject: string,
  requestedTopic?: string
): NyraLevel {
  const difficulty = determineDifficulty(ctx);
  const picked = requestedTopic?.trim()
    ? { topic: requestedTopic.trim(), focusHint: "Let's practice this topic together!" }
    : pickTopicForClassAndSubject(
        ctx.selectedClass,
        subject,
        ctx.weakTopics,
        ctx.completedNyraLevels
      );

  const stepTone =
    difficulty === 'foundational'
      ? 'Step-by-step gentle guide with visual examples'
      : difficulty === 'steady'
        ? 'Guided practice with helpful patterns'
        : 'Confidence-builder challenge with mixed ideas';

  const a = difficulty === 'foundational' ? 2 : difficulty === 'steady' ? 4 : 7;
  const b = difficulty === 'foundational' ? 3 : difficulty === 'steady' ? 5 : 6;

  let simpleExplanation = `Let's learn "${picked.topic}" together! ${stepTone}. Take one small step at a time and count carefully.`;
  let activities = [
    {
      title: 'Visual Warm-Up',
      instruction: 'Look closely at the items and say each step out loud.',
      example: `🍎 × ${a} and 🍎 × ${b} together make ${a + b} apples.`,
    },
    {
      title: 'Guided Try',
      instruction: 'Count on your fingers or draw small stars to check your answer before tapping.',
      example: `Start from ${a}, then count ${b} more steps forward!`,
    },
  ];
  let practiceQuestions = [
    {
      prompt: `If you have ${a} 🍎 and get ${b} more 🍎, how many apples do you have?`,
      options: [String(a + b), String(a + b + 1), String(Math.max(1, a + b - 1))],
      correctAnswer: String(a + b),
      hint: `Count ${a} apples first, then add ${b} more!`,
    },
    {
      prompt: `What is ${a + 1} + ${b - 1}?`,
      options: [String(a + b), String(a + b + 2), String(a + b - 2)],
      correctAnswer: String(a + b),
      hint: `Notice it makes the exact same total as ${a} + ${b}!`,
    },
  ];

  if (subject === 'English') {
    simpleExplanation = `Let's explore "${picked.topic}" in ${ctx.className}! Look at each letter sound and match it with a familiar picture.`;
    activities = [
      {
        title: 'Sound It Out',
        instruction: 'Say each letter slowly, then blend the sounds together.',
        example: 'C - A - T → CAT 🐱',
      },
      {
        title: 'Spot the Clue',
        instruction: 'Check the picture clue to pick the right letter or word.',
        example: '☀️ shines in the sky → S-U-N (SUN)',
      },
    ];
    practiceQuestions = [
      {
        prompt: 'Which missing letter completes C _ T for 🐱?',
        options: ['A', 'O', 'U'],
        correctAnswer: 'A',
        hint: 'Say the word CAT slowly — hear the "ae" sound in the middle!',
      },
      {
        prompt: 'Which word matches the picture 🐶?',
        options: ['DOG', 'SUN', 'BAT'],
        correctAnswer: 'DOG',
        hint: 'D-O-G spells the cute puppy!',
      },
    ];
  } else if (subject === 'Hindi') {
    simpleExplanation = `आइए "${picked.topic}" को आसान उदाहरणों से समझें! पहले अक्षर या मात्रा को ध्यान से देखें और बोलकर अभ्यास करें।`;
    activities = [
      {
        title: 'चित्र और अक्षर जोड़ो',
        instruction: 'हर अक्षर को उसके चित्र के साथ जोर से बोलें।',
        example: 'क से कबूतर 🕊️, म से मछली 🐟',
      },
      {
        title: 'शब्द बनाओ',
        instruction: 'दो या तीन अक्षरों को मिलाकर एक नया शब्द पढ़ें।',
        example: 'क + म + ल = कमल 🌸',
      },
    ];
    practiceQuestions = [
      {
        prompt: '🕊️ कबूतर किस अक्षर से शुरू होता है?',
        options: ['क', 'म', 'त'],
        correctAnswer: 'क',
        hint: 'क से कबूतर!',
      },
      {
        prompt: 'क + म + ल मिलकर कौन सा शब्द बनता है?',
        options: ['कमल', 'घर', 'फल'],
        correctAnswer: 'कमल',
        hint: 'तीनों अक्षरों को क्रम से जोड़कर पढ़ें।',
      },
    ];
  } else if (ctx.selectedClass >= 8 && picked.topic.toLowerCase().includes('div')) {
    const groups = difficulty === 'foundational' ? 2 : 3;
    const perGroup = difficulty === 'foundational' ? 3 : 4;
    const total = groups * perGroup;
    simpleExplanation = `Division means sharing equally! When ${total} items are shared equally into ${groups} groups, each group gets ${perGroup}.`;
    activities = [
      {
        title: 'Equal Sharing Boxes',
        instruction: `Imagine placing ${total} candies one by one into ${groups} boxes.`,
        example: `${total} ÷ ${groups} = ${perGroup}`,
      },
      {
        title: 'Reverse Multiplication Check',
        instruction: 'Check your division answer using multiplication!',
        example: `${groups} × ${perGroup} = ${total}`,
      },
    ];
    practiceQuestions = [
      {
        prompt: `What is ${total} ÷ ${groups}?`,
        options: [String(perGroup), String(perGroup + 1), String(Math.max(1, perGroup - 1))],
        correctAnswer: String(perGroup),
        hint: `Think: ${groups} times what number equals ${total}?`,
      },
      {
        prompt: 'If 8 ⭐ are shared equally among 4 friends, how many does each friend get?',
        options: ['2', '3', '4'],
        correctAnswer: '2',
        hint: '4 × 2 = 8!',
      },
    ];
  }

  return {
    id: `nyra-lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId: ctx.studentId,
    classAge: ctx.selectedClass,
    className: ctx.className,
    difficulty,
    title: `${picked.topic} (${
      difficulty === 'foundational'
        ? 'Gentle Step'
        : difficulty === 'steady'
          ? 'Practice Step'
          : 'Challenge Step'
    })`,
    subject,
    topic: picked.topic,
    learningObjective: `${picked.focusHint}. Build clear understanding at ${ctx.className} level.`,
    simpleExplanation,
    activities,
    practiceQuestions,
    completionCriteria: 'Answer all 2 practice checks and review each guided activity.',
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'local-offline',
  };
}

function buildGuidedTest(
  ctx: StudentPerformanceContext,
  subject: string,
  topic: string,
  linkedLevel?: NyraLevel
): NyraTest {
  const difficulty = determineDifficulty(ctx);
  const questions: NyraTestQuestion[] = [];

  if (subject === 'English') {
    questions.push(
      {
        id: 'q1',
        type: 'mcq',
        topic,
        prompt: 'Which word matches the picture 🍎?',
        options: ['Apple', 'Ball', 'Cat'],
        correctAnswer: 'Apple',
        explanation: 'A is for Apple 🍎.',
      },
      {
        id: 'q2',
        type: 'true_false',
        topic,
        prompt: 'True or False: The word "SUN" starts with the letter S.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'S-U-N starts with S (☀️).',
      },
      {
        id: 'q3',
        type: 'fill_blank',
        topic,
        prompt: 'Fill in the missing letter: D _ G (🐶)',
        correctAnswer: 'O',
        explanation: 'D + O + G spells DOG 🐶.',
      },
      {
        id: 'q4',
        type: 'short_answer',
        topic,
        prompt: 'Write the missing word: Birds fly in the ___ (sky / bed).',
        correctAnswer: 'sky',
        explanation: 'Birds fly high in the sky 🦅.',
      }
    );
  } else if (subject === 'Hindi') {
    questions.push(
      {
        id: 'q1',
        type: 'mcq',
        topic,
        prompt: '🐟 मछली किस अक्षर से शुरू होती है?',
        options: ['म', 'क', 'ल'],
        correctAnswer: 'म',
        explanation: 'म से मछली होती है।',
      },
      {
        id: 'q2',
        type: 'true_false',
        topic,
        prompt: 'सही या गलत (True / False): "घ + र" मिलकर "घर" बनता है।',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'घ और र को जोड़ने पर घर (🏠) शब्द बनता है।',
      },
      {
        id: 'q3',
        type: 'fill_blank',
        topic,
        prompt: 'रिक्त स्थान भरें: राम एक अच्छा ___ है। (लड़का / किताब)',
        correctAnswer: 'लड़का',
        explanation: 'सही वाक्य है: राम एक अच्छा लड़का है।',
      },
      {
        id: 'q4',
        type: 'short_answer',
        topic,
        prompt: 'क + ल + म जोड़कर कौन सा शब्द बनेगा?',
        correctAnswer: 'कलम',
        explanation: 'क + ल + म = कलम (🖊️)।',
      }
    );
  } else {
    const base = difficulty === 'foundational' ? 3 : difficulty === 'steady' ? 7 : 12;
    const addend = difficulty === 'foundational' ? 2 : difficulty === 'steady' ? 5 : 8;
    const sum = base + addend;
    const mulA = ctx.selectedClass >= 8 ? (difficulty === 'foundational' ? 2 : 4) : 2;
    const mulB = difficulty === 'foundational' ? 3 : 5;
    const prod = mulA * mulB;

    questions.push(
      {
        id: 'q1',
        type: 'mcq',
        topic,
        prompt: `What is ${base} + ${addend}?`,
        options: [String(sum), String(sum + 1), String(Math.max(1, sum - 1))],
        correctAnswer: String(sum),
        explanation: `Count ${base} and add ${addend} more to get ${sum}.`,
      },
      {
        id: 'q2',
        type: 'true_false',
        topic,
        prompt: `True or False: ${base + 2} is greater than ${base}.`,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: `${base + 2} comes after ${base}, so ${base + 2} > ${base}.`,
      },
      {
        id: 'q3',
        type: 'fill_blank',
        topic,
        prompt: `Fill in the blank: ${sum} - ${addend} = ___`,
        correctAnswer: String(base),
        explanation: `Taking away ${addend} from ${sum} leaves ${base}.`,
      },
      {
        id: 'q4',
        type: 'short_answer',
        topic,
        prompt:
          ctx.selectedClass >= 8
            ? `What is ${mulA} × ${mulB}?`
            : `If you have ${base} 🍎 and eat 1 🍎, how many are left?`,
        correctAnswer: ctx.selectedClass >= 8 ? String(prod) : String(base - 1),
        explanation:
          ctx.selectedClass >= 8
            ? `${mulA} groups of ${mulB} equals ${prod}.`
            : `${base} minus 1 equals ${base - 1}.`,
      }
    );
  }

  return {
    id: `nyra-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId: ctx.studentId,
    linkedLevelId: linkedLevel?.id,
    classAge: ctx.selectedClass,
    className: ctx.className,
    subject,
    topic,
    difficulty,
    title: linkedLevel
      ? `NYRA Check: ${linkedLevel.topic}`
      : `NYRA ${subject} Practice Test (${ctx.className})`,
    questions,
    createdAt: new Date().toISOString(),
    source: 'local-offline',
  };
}

function buildGuidedChatReply(
  ctx: StudentPerformanceContext,
  userMessage: string,
  trigger?: NyraLowScoreTriggerContext
): {
  text: string;
  hint?: string;
  example?: string;
  practice?: NyraChatPracticePrompt;
} {
  const lower = userMessage.toLowerCase();
  const focusTopic =
    trigger?.weakTopics[0] ||
    trigger?.topic ||
    ctx.weakTopics[0] ||
    "today's topic";
  const lastWrong =
    trigger?.incorrectItems[0] ||
    ctx.incorrectAnswers[ctx.incorrectAnswers.length - 1];

  if (lower.includes('easier') || lower.includes('practice') || lower.includes('try')) {
    return {
      text: `You've got this, ${ctx.studentName}! Let's try an easy warm-up question on ${focusTopic} together. Take your time!`,
      hint: 'Count slowly or read the clue carefully before tapping.',
      practice:
        trigger?.subject === 'English' || focusTopic.toLowerCase().includes('letter')
          ? {
              question: 'Which letter starts the word Apple 🍎?',
              options: ['A', 'B', 'C'],
              correctAnswer: 'A',
              praise: 'Awesome job! A is for Apple! 🌟',
            }
          : trigger?.subject === 'Hindi' || focusTopic.toLowerCase().includes('hindi')
            ? {
                question: '🕊️ कबूतर किस अक्षर से आता है?',
                options: ['क', 'ग', 'न'],
                correctAnswer: 'क',
                praise: 'शाबाश! क से कबूतर होता है! 🎉',
              }
            : {
                question: 'Count together: 2 🍎 + 1 🍎 = ?',
                options: ['2', '3', '4'],
                correctAnswer: '3',
                praise: 'Yay! 2 apples and 1 more apple makes 3 apples! ⭐',
              },
    };
  }

  if (
    lastWrong &&
    (lower.includes('mistake') ||
      lower.includes('why') ||
      lower.includes('explain') ||
      lower.includes('help'))
  ) {
    return {
      text: `Don't worry! Let's learn this step by step. On "${lastWrong.question}", you chose "${lastWrong.selectedAnswer}", and the right answer is "${lastWrong.correctAnswer}".`,
      hint: `When practicing ${lastWrong.topic}, take a deep breath and check each small step.`,
      example: `Think through "${lastWrong.question}" slowly — taking your time makes "${lastWrong.correctAnswer}" easy to spot!`,
      practice: {
        question: 'Want to try a quick confidence question: What is 3 + 2?',
        options: ['4', '5', '6'],
        correctAnswer: '5',
        praise: 'Brilliant! You took your time and nailed it! 🚀',
      },
    };
  }

  const scoreLine = trigger
    ? `In "${trigger.testTitle}", you scored ${trigger.score}%. Every mistake simply shows us what to practice next!`
    : `You are learning in ${ctx.className}. Let's practice this topic together!`;

  return {
    text: `${scoreLine} Would you like me to explain a mistake step by step, give you a small hint on ${focusTopic}, or try an easier practice question?`,
    hint: `Tip for ${focusTopic}: go one small step at a time!`,
    example: lastWrong
      ? `Earlier question: "${lastWrong.question}" → Correct answer: "${lastWrong.correctAnswer}".`
      : 'Example: 2 🍎 + 3 🍎 = 5 🍎 (count 1, 2... then 3, 4, 5!).',
  };
}

function normalizeAiLevelResponse(
  raw: Record<string, unknown>,
  ctx: StudentPerformanceContext,
  subject: string,
  fallbackTopic: string,
  difficulty: NyraLevel['difficulty']
): NyraLevel | null {
  const sourceObj =
    raw.level && typeof raw.level === 'object' && !Array.isArray(raw.level)
      ? (raw.level as Record<string, unknown>)
      : raw;

  const title = typeof sourceObj.title === 'string' ? sourceObj.title.trim() : '';
  const simpleExplanation =
    typeof sourceObj.simpleExplanation === 'string'
      ? sourceObj.simpleExplanation.trim()
      : '';
  const learningObjective =
    typeof sourceObj.learningObjective === 'string'
      ? sourceObj.learningObjective.trim()
      : `Build clear understanding of ${fallbackTopic} for ${ctx.className}.`;
  const completionCriteria =
    typeof sourceObj.completionCriteria === 'string'
      ? sourceObj.completionCriteria.trim()
      : 'Complete the guided activities and answer all practice questions.';

  const rawActivities = Array.isArray(sourceObj.activities)
    ? sourceObj.activities
    : [];
  const activities = rawActivities
    .filter((a): a is Record<string, unknown> => Boolean(a && typeof a === 'object'))
    .map((a) => ({
      title: String(a.title || '').trim(),
      instruction: String(a.instruction || '').trim(),
      example: String(a.example || '').trim(),
    }))
    .filter((a) => a.title && a.instruction)
    .slice(0, 4);

  const rawPractice = Array.isArray(sourceObj.practiceQuestions)
    ? sourceObj.practiceQuestions
    : [];
  const practiceQuestions = rawPractice
    .filter((q): q is Record<string, unknown> => Boolean(q && typeof q === 'object'))
    .map((q) => {
      const prompt = String(q.prompt || '').trim();
      const correctAnswer = String(q.correctAnswer || '').trim();
      const hint = String(q.hint || 'Take one slow step and double-check!').trim();
      const opts = Array.isArray(q.options)
        ? Array.from(new Set(q.options.map((o) => String(o).trim()).filter(Boolean)))
        : [];
      if (correctAnswer && !opts.includes(correctAnswer)) {
        opts.unshift(correctAnswer);
      }
      return {
        prompt,
        options: opts.slice(0, 3),
        correctAnswer,
        hint,
      };
    })
    .filter(
      (q) =>
        q.prompt &&
        q.correctAnswer &&
        q.options.length >= 2 &&
        q.options.includes(q.correctAnswer)
    )
    .slice(0, 4);

  if (
    !title ||
    !simpleExplanation ||
    activities.length === 0 ||
    practiceQuestions.length === 0
  ) {
    return null;
  }

  return {
    id: `nyra-lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId: ctx.studentId,
    classAge: ctx.selectedClass,
    className: ctx.className,
    difficulty,
    title,
    subject,
    topic:
      typeof sourceObj.topic === 'string' && sourceObj.topic.trim()
        ? sourceObj.topic.trim()
        : fallbackTopic,
    learningObjective,
    simpleExplanation,
    activities,
    practiceQuestions,
    completionCriteria,
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'backend',
  };
}

function normalizeAiTestResponse(
  raw: Record<string, unknown>,
  ctx: StudentPerformanceContext,
  subject: string,
  topic: string,
  difficulty: NyraLevel['difficulty'],
  linkedLevel?: NyraLevel
): NyraTest | null {
  const sourceObj =
    raw.test && typeof raw.test === 'object' && !Array.isArray(raw.test)
      ? (raw.test as Record<string, unknown>)
      : raw;

  const rawQuestions = Array.isArray(sourceObj.questions) ? sourceObj.questions : [];
  const allowedTypes: NyraTestQuestion['type'][] = [
    'mcq',
    'true_false',
    'fill_blank',
    'short_answer',
  ];

  const questions: NyraTestQuestion[] = rawQuestions
    .filter((q): q is Record<string, unknown> => Boolean(q && typeof q === 'object'))
    .map((q, idx) => {
      const rawType = String(q.type || 'mcq') as NyraTestQuestion['type'];
      const type = allowedTypes.includes(rawType) ? rawType : 'mcq';
      const prompt = String(q.prompt || '').trim();
      let correctAnswer = String(q.correctAnswer || '').trim();
      const explanation = String(
        q.explanation || `The correct answer is ${correctAnswer}.`
      ).trim();

      let options: string[] | undefined;
      if (type === 'true_false') {
        options = ['True', 'False'];
      } else if (type === 'mcq') {
        const opts = Array.isArray(q.options)
          ? Array.from(new Set(q.options.map((o) => String(o).trim()).filter(Boolean)))
          : [];
        if (correctAnswer && !opts.includes(correctAnswer)) {
          const letterIdx = ['a', 'b', 'c', 'd'].indexOf(correctAnswer.toLowerCase());
          if (letterIdx >= 0 && opts[letterIdx]) {
            correctAnswer = opts[letterIdx];
          } else {
            opts.unshift(correctAnswer);
          }
        }
        options = opts.slice(0, 4);
      }

      return {
        id: String(q.id || `q${idx + 1}`),
        type,
        topic: String(q.topic || topic).trim() || topic,
        prompt,
        options,
        correctAnswer,
        explanation,
      };
    })
    .filter((q) => {
      if (!q.prompt || !q.correctAnswer) return false;
      if (q.type === 'mcq' && (!q.options || q.options.length < 2)) return false;
      return true;
    })
    .slice(0, 6);

  if (questions.length === 0) return null;

  const title =
    typeof sourceObj.title === 'string' && sourceObj.title.trim()
      ? sourceObj.title.trim()
      : linkedLevel
        ? `NYRA Check: ${linkedLevel.topic}`
        : `NYRA ${subject} Practice Test (${ctx.className})`;

  return {
    id: `nyra-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId: ctx.studentId,
    linkedLevelId: linkedLevel?.id,
    classAge: ctx.selectedClass,
    className: ctx.className,
    subject,
    topic,
    difficulty,
    title,
    questions,
    createdAt: new Date().toISOString(),
    source: 'backend',
  };
}

export async function generateNyraAdaptiveLevel(
  ctx: StudentPerformanceContext,
  subject: string,
  requestedTopic?: string
): Promise<{ level: NyraLevel; meta: NyraCallMeta }> {
  const difficulty = determineDifficulty(ctx);
  const picked = requestedTopic?.trim()
    ? { topic: requestedTopic.trim(), focusHint: "Let's practice this topic together!" }
    : pickTopicForClassAndSubject(
        ctx.selectedClass,
        subject,
        ctx.weakTopics,
        ctx.completedNyraLevels
      );

  const languageMode = subject === 'Hindi' ? 'HINDI' : 'ENGLISH';
  const prompt = [
    `Create 1 adaptive learning level for a ${ctx.className} student in ${subject}.`,
    `Topic: "${picked.topic}". Difficulty: ${difficulty}.`,
    ctx.weakTopics.length > 0
      ? `Weak topics to support gently: ${ctx.weakTopics.slice(0, 3).join(', ')}.`
      : '',
    ctx.completedNyraLevels.length > 0
      ? `Avoid repeating already mastered topics: ${ctx.completedNyraLevels.slice(-5).join(', ')}.`
      : '',
    subject === 'Hindi'
      ? 'Write simple explanations, activities, and questions in easy child-friendly Hindi (Devanagari).'
      : 'Use simple, encouraging, child-friendly English with small emoji examples.',
    'Return strictly valid JSON matching this exact structure:',
    '{"title":"string","topic":"string","learningObjective":"string","simpleExplanation":"string","activities":[{"title":"string","instruction":"string","example":"string"}],"practiceQuestions":[{"prompt":"string","options":["A","B","C"],"correctAnswer":"A","hint":"string"}],"completionCriteria":"string"}',
    'Include 2 activities and 2 practiceQuestions, each with exactly 3 options including correctAnswer.',
  ]
    .filter(Boolean)
    .join(' ');

  const remote = await postNyraEndpoint<Record<string, unknown>>(
    `level-${ctx.studentId}-${subject}-${picked.topic}`,
    NYRA_ENDPOINTS.LEVEL,
    {
      prompt,
      classLevel: ctx.className,
      subject,
      languageMode,
      difficulty,
      topic: picked.topic,
    },
    ctx.studentId
  );

  if (remote.data) {
    const normalized = normalizeAiLevelResponse(
      remote.data,
      ctx,
      subject,
      picked.topic,
      difficulty
    );
    if (normalized) {
      return {
        level: normalized,
        meta: {
          usedLiveService: true,
          offline: false,
          statusMessage: 'NYRA created a personalized learning level for you! ✨',
        },
      };
    }
  }

  const localLevel = buildGuidedLevel(ctx, subject, requestedTopic);
  return {
    level: localLevel,
    meta: {
      usedLiveService: false,
      offline: remote.offline,
      statusMessage: remote.offline
        ? "You're offline right now — saved a guided practice level for you."
        : remote.friendlyMessage ||
          'NYRA prepared a saved practice level from your progress! ✨',
    },
  };
}

export async function generateNyraAdaptiveTest(
  ctx: StudentPerformanceContext,
  subject: string,
  topic: string,
  linkedLevel?: NyraLevel
): Promise<{ test: NyraTest; meta: NyraCallMeta }> {
  const difficulty = determineDifficulty(ctx);
  const languageMode = subject === 'Hindi' ? 'HINDI' : 'ENGLISH';
  const recentMistakeHints = ctx.incorrectAnswers
    .slice(-3)
    .map((m) => `"${m.question}" (answered "${m.selectedAnswer}", right "${m.correctAnswer}")`)
    .join('; ');

  const prompt = [
    `Create an adaptive 4-question mixed quiz for a ${ctx.className} student in ${subject} on "${topic}".`,
    `Difficulty: ${difficulty}.`,
    ctx.weakTopics.length > 0
      ? `Reinforce weak topics: ${ctx.weakTopics.slice(0, 3).join(', ')}.`
      : '',
    recentMistakeHints ? `Recent student mistakes to help practice: ${recentMistakeHints}.` : '',
    subject === 'Hindi'
      ? 'Write prompts and explanations in simple child-friendly Hindi (Devanagari).'
      : 'Use warm, clear, child-friendly English.',
    'Return strictly valid JSON matching this schema:',
    '{"title":"string","questions":[{"id":"q1","type":"mcq","topic":"string","prompt":"string","options":["opt1","opt2","opt3"],"correctAnswer":"opt1","explanation":"string"}]}',
    'Include 4 questions covering these 4 types in order: "mcq" (3 options, set correctAnswer to the exact matching option text), "true_false" (options ["True","False"], correctAnswer "True" or "False"), "fill_blank" (no options needed), "short_answer" (no options needed).',
  ]
    .filter(Boolean)
    .join(' ');

  const remote = await postNyraEndpoint<Record<string, unknown>>(
    `test-${ctx.studentId}-${subject}-${topic}`,
    NYRA_ENDPOINTS.TEST,
    {
      prompt,
      classLevel: ctx.className,
      subject,
      languageMode,
      difficulty,
      topic,
      linkedLevelId: linkedLevel?.id,
    },
    ctx.studentId
  );

  if (remote.data) {
    const normalized = normalizeAiTestResponse(
      remote.data,
      ctx,
      subject,
      topic,
      difficulty,
      linkedLevel
    );
    if (normalized) {
      return {
        test: normalized,
        meta: {
          usedLiveService: true,
          offline: false,
          statusMessage: 'NYRA created a personalized quiz for you! 📝',
        },
      };
    }
  }

  const localTest = buildGuidedTest(ctx, subject, topic, linkedLevel);
  return {
    test: localTest,
    meta: {
      usedLiveService: false,
      offline: remote.offline,
      statusMessage: remote.offline
        ? "You're offline right now — saved a practice quiz for you."
        : remote.friendlyMessage ||
          'NYRA prepared a saved practice quiz from your learning progress! 📝',
    },
  };
}

function extractChatReplyText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;
  if (typeof obj.reply === 'string' && obj.reply.trim()) {
    return obj.reply.trim();
  }
  if (obj.reply && typeof obj.reply === 'object') {
    const nested = (obj.reply as Record<string, unknown>).text;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  if (typeof obj.text === 'string' && obj.text.trim()) {
    return obj.text.trim();
  }
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const first = obj.choices[0] as Record<string, unknown> | undefined;
    const msg = first?.message as Record<string, unknown> | undefined;
    if (typeof msg?.content === 'string' && msg.content.trim()) {
      return msg.content.trim();
    }
  }
  return '';
}

export async function sendNyraSupportMessage(
  ctx: StudentPerformanceContext,
  userMessage: string,
  history: NyraChatMessage[],
  trigger?: NyraLowScoreTriggerContext
): Promise<{ reply: NyraChatMessage; meta: NyraCallMeta }> {
  const activeSubject = trigger?.subject || ctx.subject || 'Math';
  const languageMode = activeSubject === 'Hindi' ? 'HINDI' : 'ENGLISH';
  const mistakeSnippet = trigger?.incorrectItems?.[0]
    ? `Recent mistake: on "${trigger.incorrectItems[0].question}", student picked "${trigger.incorrectItems[0].selectedAnswer}" instead of "${trigger.incorrectItems[0].correctAnswer}".`
    : '';

  const systemPrompt = [
    `You are NYRA, a warm, encouraging learning buddy for ${ctx.studentName} in ${ctx.className} (${activeSubject}).`,
    trigger
      ? `The student just scored ${trigger.score}% on "${trigger.testTitle}" (${trigger.topic}). Be gentle, reassuring, and explain step-by-step.`
      : `Help ${ctx.studentName} learn ${activeSubject} gently step by step.`,
    mistakeSnippet,
    ctx.weakTopics.length > 0
      ? `Weak topics to support: ${ctx.weakTopics.slice(0, 3).join(', ')}.`
      : '',
    'Keep answers short (2-5 sentences), kid-friendly, with one tiny relatable example. Never mention technical words.',
  ]
    .filter(Boolean)
    .join(' ');

  const mappedHistory = history
    .slice(-6)
    .map((m) => ({
      role: m.role === 'nyra' ? ('assistant' as const) : ('user' as const),
      content: m.text.slice(0, 1200),
    }))
    .filter((m) => m.content.trim().length > 0);

  const lastEntry = mappedHistory[mappedHistory.length - 1];
  const needsAppendUser =
    !lastEntry ||
    lastEntry.role !== 'user' ||
    lastEntry.content.trim() !== userMessage.trim();

  const messagesPayload = [
    { role: 'system' as const, content: systemPrompt },
    ...mappedHistory,
    ...(needsAppendUser ? [{ role: 'user' as const, content: userMessage.trim() }] : []),
  ];

  const remote = await postNyraEndpoint<Record<string, unknown>>(
    `chat-${ctx.studentId}`,
    NYRA_ENDPOINTS.CHAT,
    {
      classLevel: ctx.className,
      subject: activeSubject,
      languageMode,
      stream: false,
      studentContext: {
        studentName: ctx.studentName,
        weakTopics: ctx.weakTopics,
        previousTestScores: ctx.previousTestScores.slice(-5),
        currentLearningLevel: ctx.currentLearningLevel,
      },
      lowScoreContext: trigger || undefined,
      messages: messagesPayload,
    },
    ctx.studentId
  );

  const cleanReply = remote.data ? extractChatReplyText(remote.data) : '';
  if (cleanReply) {
    return {
      reply: {
        id: `nyra-msg-${Date.now()}`,
        role: 'nyra',
        text: cleanReply,
        timestamp: new Date().toISOString(),
        source: 'backend',
      },
      meta: {
        usedLiveService: true,
        offline: false,
        statusMessage: 'NYRA replied ✨',
      },
    };
  }

  const local = buildGuidedChatReply(ctx, userMessage, trigger);
  return {
    reply: {
      id: `nyra-msg-${Date.now()}`,
      role: 'nyra',
      timestamp: new Date().toISOString(),
      source: 'local-offline',
      ...local,
    },
    meta: {
      usedLiveService: false,
      offline: remote.offline,
      statusMessage: remote.offline
        ? "You're offline right now — NYRA is helping using your saved practice."
        : remote.friendlyMessage ||
          "NYRA is helping using your saved step-by-step practice!",
    },
  };
}
