import type {
  ClassAge,
  NepGradeModule,
  NepZoneDefinition,
  NepZoneId,
} from '../types/learning';
import {
  DIGITAL_AI_MODULES,
  ENV_SUSTAINABILITY_MODULES,
  FINANCIAL_LITERACY_MODULES,
  LOGICAL_THINKING_MODULES,
} from './nepZones/zonesPart1';
import {
  ART_CREATIVITY_MODULES,
  INDIAN_HERITAGE_MODULES,
  LIFE_SKILLS_MODULES,
  STEM_INNOVATION_MODULES,
} from './nepZones/zonesPart2';

export const NEP_ZONES: NepZoneDefinition[] = [
  {
    id: 'logical_thinking',
    emoji: '🧩',
    title: 'Logical Thinking & Problem Solving',
    shortTitle: 'Logic & Puzzles',
    hindiTitle: 'तार्किक सोच और पहेलियाँ',
    accentColor: '#4f46e5',
    bgGradient: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
    nepPillarTag: 'Critical Thinking',
  },
  {
    id: 'digital_ai',
    emoji: '💻',
    title: 'Digital Literacy & AI Awareness',
    shortTitle: 'Digital & AI Smart',
    hindiTitle: 'डिजिटल समझ और AI ज्ञान',
    accentColor: '#0284c7',
    bgGradient: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
    nepPillarTag: 'Unplugged Digital Wisdom',
  },
  {
    id: 'env_sustainability',
    emoji: '🌱',
    title: 'Environmental Learning & Sustainability',
    shortTitle: 'Nature & Earth',
    hindiTitle: 'पर्यावरण और हरित पृथ्वी',
    accentColor: '#16a34a',
    bgGradient: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    nepPillarTag: 'Eco-Stewardship',
  },
  {
    id: 'financial_literacy',
    emoji: '🪙',
    title: 'Financial Literacy & Money Awareness',
    shortTitle: 'Money & Saving',
    hindiTitle: 'रुपये, बचत और स्मार्ट बजट',
    accentColor: '#d97706',
    bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    nepPillarTag: 'Life Readiness',
  },
  {
    id: 'indian_heritage',
    emoji: '🪷',
    title: 'Indian Knowledge, Heritage & Culture',
    shortTitle: 'Bharat Heritage',
    hindiTitle: 'भारतीय ज्ञान, संस्कृति और गौरव',
    accentColor: '#ea580c',
    bgGradient: 'linear-gradient(135deg, #ffedd5, #fed7aa)',
    nepPillarTag: 'Rooted in India',
  },
  {
    id: 'life_skills_sel',
    emoji: '💛',
    title: 'Life Skills, Communication & SEL',
    shortTitle: 'Life Skills & SEL',
    hindiTitle: 'जीवन कौशल, संवाद और संवेदना',
    accentColor: '#db2777',
    bgGradient: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
    nepPillarTag: 'Holistic Well-Being',
  },
  {
    id: 'art_creativity',
    emoji: '🎨',
    title: 'Art, Music, Creativity & Storytelling',
    shortTitle: 'Art, Music & Stories',
    hindiTitle: 'कला, संगीत, रचनात्मकता और कहानियाँ',
    accentColor: '#9333ea',
    bgGradient: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
    nepPillarTag: 'Art-Integrated Learning',
  },
  {
    id: 'stem_innovation',
    emoji: '🔬',
    title: 'STEM, Science Discovery & Innovation',
    shortTitle: 'STEM & Discovery',
    hindiTitle: 'विज्ञान, प्रयोग और नवाचार',
    accentColor: '#0d9488',
    bgGradient: 'linear-gradient(135deg, #ccfbf1, #99f6e4)',
    nepPillarTag: 'Experiential Inquiry',
  },
];

const MODULE_MAP: Record<NepZoneId, Record<ClassAge, NepGradeModule>> = {
  logical_thinking: LOGICAL_THINKING_MODULES,
  digital_ai: DIGITAL_AI_MODULES,
  env_sustainability: ENV_SUSTAINABILITY_MODULES,
  financial_literacy: FINANCIAL_LITERACY_MODULES,
  indian_heritage: INDIAN_HERITAGE_MODULES,
  life_skills_sel: LIFE_SKILLS_MODULES,
  art_creativity: ART_CREATIVITY_MODULES,
  stem_innovation: STEM_INNOVATION_MODULES,
};

export function getNepZoneDefinition(zoneId: NepZoneId): NepZoneDefinition {
  return NEP_ZONES.find((z) => z.id === zoneId) || NEP_ZONES[0];
}

export function getNepZoneModule(
  zoneId: NepZoneId,
  classAge: ClassAge
): NepGradeModule {
  const zoneModules = MODULE_MAP[zoneId];
  return zoneModules[classAge] || zoneModules[3];
}

export function getAllNepModulesForClass(classAge: ClassAge): NepGradeModule[] {
  return NEP_ZONES.map((z) => getNepZoneModule(z.id, classAge));
}

export const NEP_EXISTING_TOPIC_AUDIT = {
  alreadyExistingSkipped: [
    'English Alphabet A-Z & Letter Match (abc, ws4)',
    'English Phonics & Missing Vowels (phonics, missingword, english)',
    'English Basic Sentences & Fill Blanks (sentences, sentencefill)',
    'Hindi Varnamala & Matras (hindivarna, hinditest, hindimatras, matratest)',
    'Hindi Word Reading & Sentence Quiz (hindiwords, wordreadtest, advancedhindi, hindisentencequiz)',
    'Counting 1-20/50/100, Star Counting & Number Finding (numbers, numbers50, numbers100, ws1, ws2, tests)',
    'Arithmetic Operations, Tables 2-20, Division & Apple Story Word Math (ws3, visualadd, addition, addition2, subtraction, multiplication, visualdiv, tables, wordmath, greaterless)',
  ],
  newZonesAdded: NEP_ZONES.map((z) => `${z.title} (Classes Nursery–5th Class)`),
};
