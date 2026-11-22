import type {
  AdvancedHindiSentenceItem,
  BasicLearningCard,
  ClassAge,
  FeatureMode,
  MenuFeatureItem,
  TableLearningItem,
  VisualDivisionItem,
  VisualGreaterLessItem,
  VisualMathOpItem,
  WorksheetQuestion,
} from '../types/learning';

export const CLASS_OPTIONS: Array<{ age: ClassAge; label: string }> = [
  { age: 3, label: 'Nursery' },
  { age: 4, label: 'LKG' },
  { age: 5, label: 'UKG' },
  { age: 6, label: '1st Class' },
  { age: 7, label: '2nd Class' },
  { age: 8, label: '3rd Class' },
  { age: 9, label: '4th Class' },
  { age: 10, label: '5th Class' },
];

export function getClassName(a: number): string {
  const map: Record<number, string> = {
    3: 'Nursery',
    4: 'LKG',
    5: 'UKG',
    6: '1st Class',
    7: '2nd Class',
    8: '3rd Class',
    9: '4th Class',
    10: '5th Class',
  };
  return map[a] || `Class ${a}`;
}

export const alphabet: BasicLearningCard[] = [
  { l: 'A', w: 'Apple', e: '🍎', c: '#ef4444' },
  { l: 'B', w: 'Ball', e: '⚽', c: '#3b82f6' },
  { l: 'C', w: 'Cat', e: '🐱', c: '#f59e0b' },
  { l: 'D', w: 'Dog', e: '🐶', c: '#10b981' },
  { l: 'E', w: 'Elephant', e: '🐘', c: '#8b5cf6' },
  { l: 'F', w: 'Fish', e: '🐟', c: '#06b6d4' },
  { l: 'G', w: 'Grape', e: '🍇', c: '#84cc16' },
  { l: 'H', w: 'Horse', e: '🐎', c: '#d946ef' },
  { l: 'I', w: 'Ice Cream', e: '🍦', c: '#f43f5e' },
  { l: 'J', w: 'Juice', e: '🧃', c: '#fb923c' },
  { l: 'K', w: 'Kangaroo', e: '🦘', c: '#4ade80' },
  { l: 'L', w: 'Lion', e: '🦁', c: '#fbbf24' },
  { l: 'M', w: 'Monkey', e: '🐒', c: '#a855f7' },
  { l: 'N', w: 'Nest', e: '🪺', c: '#14b8a6' },
  { l: 'O', w: 'Orange', e: '🍊', c: '#f97316' },
  { l: 'P', w: 'Panda', e: '🐼', c: '#475569' },
  { l: 'Q', w: 'Queen', e: '👸', c: '#ec4899' },
  { l: 'R', w: 'Rabbit', e: '🐰', c: '#6366f1' },
  { l: 'S', w: 'Sun', e: '☀️', c: '#eab308' },
  { l: 'T', w: 'Tiger', e: '🐯', c: '#f97316' },
  { l: 'U', w: 'Umbrella', e: '⛱️', c: '#0ea5e9' },
  { l: 'V', w: 'Violin', e: '🎻', c: '#6366f1' },
  { l: 'W', w: 'Watermelon', e: '🍉', c: '#22c55e' },
  { l: 'X', w: 'Xylophone', e: '🎹', c: '#f43f5e' },
  { l: 'Y', w: 'Yo-Yo', e: '🪀', c: '#8b5cf6' },
  { l: 'Z', w: 'Zebra', e: '🦓', c: '#334155' },
];

export const hindiVarnamala: BasicLearningCard[] = [
  { l: 'क', w: 'क से कबूतर', e: '🕊️', c: '#ef4444' },
  { l: 'ख', w: 'ख से खरगोश', e: '🐇', c: '#f59e0b' },
  { l: 'ग', w: 'ग से गमला', e: '🪴', c: '#10b981' },
  { l: 'घ', w: 'घ से घर', e: '🏠', c: '#3b82f6' },
  { l: 'ङ', w: 'ङ से खाली', e: '✨', c: '#8b5cf6' },
  { l: 'च', w: 'च से चम्मच', e: '🥄', c: '#ec4899' },
  { l: 'छ', w: 'छ से छाता', e: '🌂', c: '#06b6d4' },
  { l: 'ज', w: 'ज से जहाज', e: '🚢', c: '#84cc16' },
  { l: 'झ', w: 'झ से झंडा', e: '🚩', c: '#f43f5e' },
  { l: 'ञ', w: 'ञ से खाली', e: '✨', c: '#fb923c' },
  { l: 'ट', w: 'ट से टमाटर', e: '🍅', c: '#ef4444' },
  { l: 'ठ', w: 'ठ से ठठेरा', e: '🍲', c: '#3b82f6' },
  { l: 'ड', w: 'ड से डमरू', e: '🥁', c: '#f59e0b' },
  { l: 'ढ', w: 'ढ से ढक्कन', e: '🟢', c: '#10b981' },
  { l: 'ण', w: 'ण से खाली', e: '✨', c: '#8b5cf6' },
  { l: 'त', w: 'त से तरबूज', e: '🍉', c: '#22c55e' },
  { l: 'थ', w: 'थ से थर्मास', e: '🍼', c: '#0ea5e9' },
  { l: 'द', w: 'द से दवात', e: '✒️', c: '#6366f1' },
  { l: 'ध', w: 'ध से धनुष', e: '🏹', c: '#d946ef' },
  { l: 'न', w: 'न से नल', e: '🚰', c: '#f97316' },
  { l: 'प', w: 'प से पतंग', e: '🪁', c: '#eab308' },
  { l: 'फ', w: 'फ से फल', e: '🍎', c: '#ef4444' },
  { l: 'ब', w: 'ब से बतक', e: '🦆', c: '#3b82f6' },
  { l: 'भ', w: 'भ से भालू', e: '🐻', c: '#a855f7' },
  { l: 'म', w: 'म से मछली', e: '🐟', c: '#06b6d4' },
  { l: 'य', w: 'य से यज्ञ', e: '🔥', c: '#f43f5e' },
  { l: 'र', w: 'र से रथ', e: '🛒', c: '#14b8a6' },
  { l: 'ल', w: 'ल से लट्टू', e: '🎡', c: '#84cc16' },
  { l: 'व', w: 'व से वॉक', e: '🚶', c: '#f97316' },
  { l: 'श', w: 'श से शलजम', e: '🟣', c: '#8b5cf6' },
  { l: 'ष', w: 'ष से षटकोण', e: '💠', c: '#3b82f6' },
  { l: 'स', w: 'स से सपेरा', e: '🐍', c: '#10b981' },
  { l: 'ह', w: 'ह से हलवाई', e: '🍲', c: '#f59e0b' },
  { l: 'क्ष', w: 'क्ष से क्षत्रिय', e: '🛡️', c: '#ef4444' },
  { l: 'त्र', w: 'त्र से त्रिशूल', e: '🔱', c: '#ec4899' },
  { l: 'ज्ञ', w: 'ज्ञ से ज्ञानी', e: '📖', c: '#6366f1' },
];

export const hindiMatras: BasicLearningCard[] = [
  { l: 'ा', w: 'आ की मात्रा (जैसे क + ा = का)', e: '🍎', c: '#ef4444' },
  { l: 'ि', w: 'इ की मात्रा (जैसे क + ि = कि)', e: '🎈', c: '#3b82f6' },
  { l: 'ी', w: 'ई की मात्रा (जैसे क + ी = की)', e: '⭐', c: '#10b981' },
  { l: 'ु', w: 'उ की मात्रा (जैसे क + ु = कु)', e: '🧸', c: '#f59e0b' },
  { l: 'ू', w: 'ऊ की मात्रा (जैसे क + ू = कू)', e: '🍇', c: '#8b5cf6' },
  { l: 'े', w: 'ए की मात्रा (जैसे क + े = के)', e: '🍦', c: '#06b6d4' },
  { l: 'ै', w: 'ऐ की मात्रा (जैसे क + ै = कै)', e: '⚽', c: '#f43f5e' },
  { l: 'ो', w: 'ओ की मात्रा (जैसे क + ो = को)', e: '☀️', c: '#eab308' },
  { l: 'ौ', w: 'औ की मात्रा (जैसे क + ौ = कौ)', e: '🌺', c: '#14b8a6' },
  { l: 'ं', w: 'अं की बिंदी (जैसे क + ं = कं)', e: '🚀', c: '#f97316' },
];

export const hindiWordReadingList: BasicLearningCard[] = [
  { l: 'कमल', w: 'क + म + ल = कमल (Kamal)', e: '🌸', c: '#ef4444' },
  { l: 'कलम', w: 'क + ल + म = कलम (Kalam)', e: '🖊️', c: '#3b82f6' },
  { l: 'मटर', w: 'म + ट + र = मटर (Matar)', e: '🟢', c: '#10b981' },
  { l: 'घर', w: 'घ + र = घर (Ghar)', e: '🏠', c: '#f59e0b' },
  { l: 'जल', w: 'ज + ल = जल (Jal)', e: '💧', c: '#06b6d4' },
  { l: 'फल', w: 'फ + ल = फल (Fal)', e: '🍎', c: '#8b5cf6' },
  { l: 'रथ', w: 'र + थ = रथ (Rath)', e: '🛒', c: '#ec4899' },
  { l: 'नयन', w: 'न + य + न = नयन (Nayan)', e: '👀', c: '#eab308' },
];

export const tables2to5List: TableLearningItem[] = [];
for (let t = 2; t <= 5; t++) {
  let fullTableStr = '';
  for (let i = 1; i <= 10; i++) {
    fullTableStr += `${t} × ${i} = ${t * i}\n`;
  }
  tables2to5List.push({
    tableNum: t,
    l: `${t} का पहाड़ा (Table of ${t})`,
    contentStr: fullTableStr.trim(),
    e: t === 2 ? '🦆' : t === 3 ? '⭐' : t === 4 ? '🎈' : '🍎',
    c: t === 2 ? '#3b82f6' : t === 3 ? '#10b981' : t === 4 ? '#f59e0b' : '#ef4444',
  });
}

export const tables2to20List: TableLearningItem[] = [];
for (let t = 2; t <= 20; t++) {
  let fullTableStr = '';
  for (let i = 1; i <= 10; i++) {
    fullTableStr += `${t} × ${i} = ${t * i}\n`;
  }
  tables2to20List.push({
    tableNum: t,
    l: `${t} का पहाड़ा (Table of ${t})`,
    contentStr: fullTableStr.trim(),
    e: '⭐',
    c: '#765cff',
  });
}

export const divisionLearningList: VisualDivisionItem[] = [
  { total: 6, groups: 2, symbol: '🍬', title: 'कुल 6 टॉफियां थीं। उन्हें 2 बच्चों में बराबर बांटा गया, तो हर बच्चे को 3 टॉफियां मिलीं! (6 ÷ 2 = 3)' },
  { total: 8, groups: 4, symbol: '⭐', title: 'कुल 8 तारे थे। उन्हें 4 आसमानों में बराबर बांटा गया, तो हर आसमान में 2 तारे आए! (8 ÷ 4 = 2)' },
  { total: 10, groups: 2, symbol: '🍎', title: 'कुल 10 सेब थे। उन्हें 2 टोकरियों में बराबर रखा गया, तो हर टोकरी में 5 सेब आए! (10 ÷ 2 = 5)' },
  { total: 12, groups: 3, symbol: '⚽', title: 'कुल 12 गेंदें थीं। उन्हें 3 थैलों में बराबर बांटा गया, तो हर थैले में 4 गेंदें आईं! (12 ÷ 3 = 4)' },
];

export const advancedHindiSentences: AdvancedHindiSentenceItem[] = [
  { sentence: 'राम एक अच्छा ___ है।', hint: "(यहाँ सही शब्द 'लड़का' आएगा)", target: 'लड़का', meaning: 'अर्थ: राम एक अच्छा बालक है।', e: '👦', c: '#3b82f6' },
  { sentence: 'सूरज पूर्व दिशा से ___ है।', hint: "(यहाँ सही शब्द 'उगता' आएगा)", target: 'उगता', meaning: 'अर्थ: सूरज सुबह पूर्व दिशा से निकलता है।', e: '🌅', c: '#f59e0b' },
  { sentence: 'गाय हमें मीठा ___ देती है।', hint: "(यहाँ सही शब्द 'दूध' आएगा)", target: 'दूध', meaning: 'अर्थ: गाय हमें पीने के लिए मीठा दूध देती है।', e: '🐄', c: '#10b981' },
  { sentence: 'हमें रोज स्कूल ___ चाहिए।', hint: "(यहाँ सही शब्द 'जाना' आएगा)", target: 'जाना', meaning: 'अर्थ: हमें रोजाना पढ़ाई करने स्कूल जाना चाहिए।', e: '🏫', c: '#8b5cf6' },
  { sentence: 'पक्षी आसमान में ऊंचे ___ हैं।', hint: "(यहाँ सही शब्द 'उड़ते' आएगा)", target: 'उड़ते', meaning: 'अर्थ: चिड़ियाँ आसमान में बहुत ऊंचे उड़ती हैं।', e: '🦅', c: '#06b6d4' },
];

export const advancedHindiTestPool = [
  { sentence: 'राम एक अच्छा ___ है।', target: 'लड़का', emoji: '👦', options: ['लड़का', 'किताब', 'पेड़'] },
  { sentence: 'सूरज पूर्व दिशा से ___ है।', target: 'उगता', emoji: '🌅', options: ['उगता', 'दौड़ता', 'सोता'] },
  { sentence: 'गाय हमें मीठा ___ देती है।', target: 'दूध', emoji: '🐄', options: ['दूध', 'पानी', 'पत्थर'] },
  { sentence: 'हमें रोज स्कूल ___ चाहिए।', target: 'जाना', emoji: '🏫', options: ['जाना', 'रोना', 'सोना'] },
  { sentence: 'पक्षी आसमान में ऊंचे ___ हैं।', target: 'उड़ते', emoji: '🦅', options: ['उड़ते', 'चलते', 'बैठते'] },
];

export const visualSubtractionLearning: VisualMathOpItem[] = [
  { a: 5, b: 2, symbol: '🍎', title: '5 एप्पल्स में से 2 एप्पल्स खा लिए = 3 एप्पल्स बचे!' },
  { a: 4, b: 1, symbol: '⭐', title: '4 स्टार्स में से 1 स्टार चला गया = 3 स्टार्स बचे!' },
  { a: 6, b: 3, symbol: '🎈', title: '6 गुब्बारों में से 3 गुब्बारे फूट गए = 3 गुब्बारे बचे!' },
  { a: 5, b: 2, symbol: '⚽', title: '5 गेंदों में से 2 गेंदें खो गईं = 3 गेंदें बचीं!' },
];

export const visualMultiplicationLearning: VisualMathOpItem[] = [
  { a: 3, b: 2, symbol: '🍎', title: '3 बक्से और हर बक्से में 2 एप्पल्स = कुल 6 एप्पल्स (3 × 2 = 6)' },
  { a: 4, b: 2, symbol: '⭐', title: '4 समूह और हर समूह में 2 स्टार्स = कुल 8 स्टार्स (4 × 2 = 8)' },
  { a: 2, b: 5, symbol: '🎈', title: '2 समूह और हर समूह में 5 गुब्बारे = कुल 10 गुब्बारे (2 × 5 = 10)' },
];

export const numbers: BasicLearningCard[] = [
  { l: '1', w: 'One', e: '⭐', n: 1, c: '#ef4444' },
  { l: '2', w: 'Two', e: '⭐', n: 2, c: '#3b82f6' },
  { l: '3', w: 'Three', e: '⭐', n: 3, c: '#10b981' },
  { l: '4', w: 'Four', e: '⭐', n: 4, c: '#f59e0b' },
  { l: '5', w: 'Five', e: '⭐', n: 5, c: '#8b5cf6' },
  { l: '6', w: 'Six', e: '⭐', n: 6, c: '#06b6d4' },
  { l: '7', w: 'Seven', e: '⭐', n: 7, c: '#f43f5e' },
  { l: '8', w: 'Eight', e: '⭐', n: 8, c: '#14b8a6' },
  { l: '9', w: 'Nine', e: '⭐', n: 9, c: '#f97316' },
  { l: '10', w: 'Ten', e: '⭐', n: 10, c: '#334155' },
  { l: '11', w: 'Eleven', e: '⭐', n: 11, c: '#ef4444' },
  { l: '12', w: 'Twelve', e: '⭐', n: 12, c: '#3b82f6' },
  { l: '13', w: 'Thirteen', e: '⭐', n: 13, c: '#10b981' },
  { l: '14', w: 'Fourteen', e: '⭐', n: 14, c: '#f59e0b' },
  { l: '15', w: 'Fifteen', e: '⭐', n: 15, c: '#8b5cf6' },
  { l: '16', w: 'Sixteen', e: '⭐', n: 16, c: '#06b6d4' },
  { l: '17', w: 'Seventeen', e: '⭐', n: 17, c: '#f43f5e' },
  { l: '18', w: 'Eighteen', e: '⭐', n: 18, c: '#14b8a6' },
  { l: '19', w: 'Nineteen', e: '⭐', n: 19, c: '#f97316' },
  { l: '20', w: 'Twenty', e: '⭐', n: 20, c: '#334155' },
];

export function numberToWord(num: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty'];
  if (num <= 19) return ones[num];
  if (num % 10 === 0) return tens[Math.floor(num / 10)];
  return tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
}

const funEmojis = ['🍎', '🐱', '🐶', '⚽', '🚗', '🌟', '🍌', '🎈', '🐸', '🚀', '🍦', '🍇', '🧸', '🐼', '🍉'];

export const numbers50: BasicLearningCard[] = Array.from({ length: 50 }, (_, i) => ({
  l: numberToWord(i + 1),
  w: `Number ${i + 1} (${numberToWord(i + 1)})`,
  e: funEmojis[i % funEmojis.length],
  n: i + 1,
  c: '#4f8cff',
}));

export function createNumbers100(): BasicLearningCard[] {
  const words = [
    'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen', 'Twenty',
  ];
  const list: BasicLearningCard[] = [];
  for (let i = 1; i <= 100; i++) {
    let word = '';
    if (i <= 20) word = words[i - 1];
    else if (i === 30) word = 'Thirty';
    else if (i === 40) word = 'Forty';
    else if (i === 50) word = 'Fifty';
    else if (i === 60) word = 'Sixty';
    else if (i === 70) word = 'Seventy';
    else if (i === 80) word = 'Eighty';
    else if (i === 90) word = 'Ninety';
    else if (i === 100) word = 'One Hundred';
    else {
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      word = tens[Math.floor(i / 10)] + ' ' + words[(i % 10) - 1];
    }
    list.push({ l: String(i), w: word, e: '⭐', n: i, c: '#4f8cff' });
  }
  return list;
}

export const phonicWordsList: BasicLearningCard[] = [
  { l: 'C + A + T', w: 'C - A - T spells CAT 🐱', e: '🐱', c: '#f59e0b' },
  { l: 'D + O + G', w: 'D - O - G spells DOG 🐶', e: '🐶', c: '#10b981' },
  { l: 'S + U + N', w: 'S - U - N spells SUN ☀️', e: '☀️', c: '#eab308' },
  { l: 'B + A + T', w: 'B - A - T spells BAT 🏏', e: '🏏', c: '#3b82f6' },
  { l: 'P + I + G', w: 'P - I - G spells PIG 🐷', e: '🐷', c: '#ec4899' },
  { l: 'H + E + N', w: 'H - E - N spells HEN 🐔', e: '🐔', c: '#8b5cf6' },
  { l: 'F + I + S + H', w: 'F - I - S - H spells FISH 🐟', e: '🐟', c: '#06b6d4' },
  { l: 'B + A + L + L', w: 'B - A - L - L spells BALL ⚽', e: '⚽', c: '#ef4444' },
];

export const englishWordsList: BasicLearningCard[] = [
  { l: 'CAT', w: 'Cat - A cute pet', e: '🐱', c: '#f59e0b' },
  { l: 'DOG', w: 'Dog - A loyal animal', e: '🐶', c: '#10b981' },
  { l: 'SUN', w: 'Sun - Shines bright', e: '☀️', c: '#eab308' },
  { l: 'BOOK', w: 'Book - For reading', e: '📖', c: '#3b82f6' },
  { l: 'TREE', w: 'Tree - Gives shade', e: '🌳', c: '#22c55e' },
];

export const sentencesList: BasicLearningCard[] = [
  { l: 'I love reading story books.', w: 'I love reading story books.\n(मुझे कहानी की किताबें पढ़ना पसंद है।)', e: '📚', c: '#3b82f6' },
  { l: 'The cat drinks sweet milk.', w: 'The cat drinks sweet milk.\n(बिल्ली मीठा दूध पीती है।)', e: '🐱', c: '#f59e0b' },
  { l: 'Birds fly high in the blue sky.', w: 'Birds fly high in the blue sky.\n(पक्षी नीले आसमान में ऊंचे उड़ते हैं।)', e: '🦅', c: '#06b6d4' },
  { l: 'The sun shines bright today.', w: 'The sun shines bright today.\n(सूरज आज तेज चमक रहा है।)', e: '☀️', c: '#eab308' },
  { l: 'We go to school to learn new things.', w: 'We go to school to learn new things.\n(हम नई चीजें सीखने स्कूल जाते हैं।)', e: '🏫', c: '#8b5cf6' },
];

export const visualAdditionLearning: VisualMathOpItem[] = [
  { a: 2, b: 3, symbol: '🍎', title: '2 एप्पल्स में 3 एप्पल्स और मिलाए = 5 एप्पल्स!' },
  { a: 4, b: 2, symbol: '⭐', title: '4 स्टार्स में 2 स्टार्स और मिलाए = 6 स्टार्स!' },
  { a: 3, b: 3, symbol: '🎈', title: '3 गुब्बारों में 3 गुब्बारे और मिलाए = 6 गुब्बारे!' },
  { a: 5, b: 1, symbol: '⚽', title: '5 गेंदों में 1 गेंद और मिलाई = 6 गेंदें!' },
  { a: 3, b: 4, symbol: '🍬', title: '3 टॉफियों में 4 टॉफियां और मिलाईं = 7 टॉफियां!' },
];

export const visualGreaterLessLearning: VisualGreaterLessItem[] = [
  { n1: 5, n2: 3, symbol: '🍎', sign: '>', title: '5 एप्पल्स 3 एप्पल्स से ज़्यादा हैं! (5 > 3)' },
  { n1: 2, n2: 6, symbol: '⭐', sign: '<', title: '2 स्टार्स 6 स्टार्स से कम हैं! (2 < 6)' },
  { n1: 7, n2: 4, symbol: '⚽', sign: '>', title: '7 गेंदें 4 गेंदों से ज़्यादा हैं! (7 > 4)' },
  { n1: 3, n2: 8, symbol: '🎈', sign: '<', title: '3 गुब्बारे 8 गुब्बारों से कम हैं! (3 < 8)' },
];

export function getMenuFeatures(age: number): {
  learningFeatures: MenuFeatureItem[];
  testFeatures: MenuFeatureItem[];
} {
  if (age <= 5) {
    return {
      learningFeatures: [
        { emoji: '🔤', label: 'ABC A-Z', mode: 'abc' },
        { emoji: '🇮🇳', label: 'हिंदी वर्णमाला (क, ख, ग)', mode: 'hindivarna' },
        { emoji: '🔢', label: 'Counting', mode: 'numbers' },
      ],
      testFeatures: [
        { emoji: '⭐', label: 'Count Stars', mode: 'ws1' },
        { emoji: '🔎', label: 'Find Number', mode: 'ws2' },
        { emoji: '🍎', label: 'Apple Plus (विजुअल फ्रूट मैथ)', mode: 'ws3' },
        { emoji: '🇮🇳', label: 'पहचानो अक्षर (Hindi Quiz)', mode: 'hinditest' },
        { emoji: '🧩', label: 'Match Game', mode: 'ws4' },
      ],
    };
  }
  if (age === 6) {
    return {
      learningFeatures: [
        { emoji: '🔢', label: 'Counting 1-50', mode: 'numbers50' },
        { emoji: '🇮🇳', label: 'हिंदी वर्णमाला (क, ख, ग)', mode: 'hindivarna' },
        { emoji: '🔤', label: 'Phonics & Word Building', mode: 'phonics' },
      ],
      testFeatures: [
        { emoji: '🧩', label: 'Missing Letter Game', mode: 'missingword' },
        { emoji: '🍎', label: 'Apple Plus (विजुअल फ्रूट मैथ)', mode: 'ws3' },
        { emoji: '🇮🇳', label: 'पहचानो अक्षर (Hindi Quiz)', mode: 'hinditest' },
      ],
    };
  }
  if (age === 7) {
    return {
      learningFeatures: [
        { emoji: '➕', label: 'Learn Addition (जोड़ना सीखें)', mode: 'visualadd' },
        { emoji: '⚖️', label: 'Greater & Less (> <)', mode: 'visualgreaterless' },
        { emoji: '📝', label: 'Easy English Sentences', mode: 'sentences' },
      ],
      testFeatures: [
        { emoji: '➕', label: '2 Digit Addition', mode: 'addition2' },
        { emoji: '🧠', label: 'Math Story', mode: 'wordmath' },
        { emoji: '🔤', label: 'Sentence Fill in Blanks', mode: 'sentencefill' },
        { emoji: '⚖️', label: 'Greater & Less Quiz', mode: 'greaterlessquiz' },
      ],
    };
  }
  if (age === 8) {
    return {
      learningFeatures: [
        { emoji: '✍️', label: 'हिंदी की मात्राएँ (Matras)', mode: 'hindimatras' },
        { emoji: '➖', label: 'घटाव सीखें (Visual Subtraction)', mode: 'visualsub' },
        { emoji: '✖️', label: 'गुणा सीखें (Visual Multiplication)', mode: 'visualmul' },
      ],
      testFeatures: [
        { emoji: '✍️', label: 'मात्रा पहचानो टेस्ट', mode: 'matratest' },
        { emoji: '➖', label: 'घटाव क्विज़ (Subtraction Quiz)', mode: 'subtraction' },
        { emoji: '✖️', label: 'गुणा अभ्यास (Tables)', mode: 'tables' },
      ],
    };
  }
  if (age === 9) {
    return {
      learningFeatures: [
        { emoji: '📖', label: 'हिंदी में शब्द पढ़ना सीखें', mode: 'hindiwords' },
        { emoji: '✖️', label: '2 से 5 तक के टेबल (Tables 2-5)', mode: 'tables2to5' },
        { emoji: '📝', label: 'English Sentences', mode: 'sentences' },
      ],
      testFeatures: [
        { emoji: '📖', label: 'हिंदी शब्द पढ़ना टेस्ट', mode: 'wordreadtest' },
        { emoji: '✖️', label: '2 से 5 टेबल टेस्ट (Table Quiz)', mode: 'table2to5test' },
        { emoji: '➖', label: 'Subtraction', mode: 'subtraction' },
      ],
    };
  }
  return {
    learningFeatures: [
      { emoji: '✖️', label: '2 से 20 तक के टेबल (Tables 2-20)', mode: 'tables2to20' },
      { emoji: '➗', label: 'भाग सीखें (Visual Division)', mode: 'visualdiv' },
      { emoji: '📖', label: 'हिंदी वाक्य पढ़ना और समझना', mode: 'advancedhindi' },
    ],
    testFeatures: [
      { emoji: '✖️', label: '2 से 20 टेबल टेस्ट (Table 2-20 Quiz)', mode: 'table2to20test' },
      { emoji: '➗', label: 'भाग टेस्ट (Division Quiz)', mode: 'divisionquiz' },
      { emoji: '📝', label: 'हिंदी वाक्य खाली स्थान भरो टेस्ट', mode: 'hindisentencequiz' },
    ],
  };
}

export function getFeatureTitle(mode: string): string {
  const titles: Record<string, string> = {
    abc: 'ABC Adventure',
    hindivarna: 'हिंदी वर्णमाला (क, ख, ग)',
    hindimatras: 'हिंदी की मात्राएँ (Matras)',
    hindiwords: 'हिंदी शब्द पढ़ना सीखें',
    tables2to5: '2 से 5 तक के टेबल',
    tables2to20: '2 से 20 तक के टेबल',
    visualdiv: 'भाग (Division) सीखें',
    advancedhindi: 'हिंदी वाक्य पढ़ना और समझना',
    hinditest: 'हिंदी अक्षर पहचानो टेस्ट',
    matratest: 'मात्रा पहचानो टेस्ट',
    wordreadtest: 'हिंदी शब्द पढ़ना टेस्ट',
    table2to5test: '2 से 5 टेबल टेस्ट',
    table2to20test: '2 से 20 टेबल टेस्ट',
    divisionquiz: 'भाग (Division) टेस्ट',
    hindisentencequiz: 'हिंदी वाक्य रिक्त स्थान टेस्ट',
    visualsub: 'घटाव सीखें (Visual Subtraction)',
    visualmul: 'गुणा सीखें (Visual Multiplication)',
    numbers: 'Number Adventure',
    numbers100: 'Counting 1-100',
    numbers50: 'Counting 1-50',
    phonics: 'Phonics & Word Building',
    ws1: 'Count Stars',
    ws2: 'Find Number',
    ws3: 'Visual Fruit Math',
    ws4: 'Match Game ✨',
    addition: 'Easy Addition Quiz',
    missingword: 'Missing Letter Game 🧩',
    addition2: '2 Digit Addition',
    wordmath: 'Math Story',
    sentences: 'Easy English Sentences ✨',
    visualadd: 'Learn Addition (जोड़ना सीखें) ➕',
    visualgreaterless: 'Greater & Less (> <) ⚖️',
    sentencefill: 'Sentence Fill in Blanks 🔤',
    greaterlessquiz: 'Greater & Less Quiz ⚖️',
    tables: 'Tables 2-10',
    tables20: 'Tables 2-20',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    english: 'English Words',
    tests: 'Test Zone',
  };
  return titles[mode] || 'Learning';
}

export function getModeSubjectAndTopic(mode: string): { subject: string; topic: string } {
  const map: Record<string, { subject: string; topic: string }> = {
    abc: { subject: 'English', topic: 'Alphabet A-Z' },
    phonics: { subject: 'English', topic: 'Phonics & Word Building' },
    english: { subject: 'English', topic: 'English Words' },
    sentences: { subject: 'English', topic: 'Easy English Sentences' },
    ws4: { subject: 'English', topic: 'Alphabet & Picture Matching' },
    missingword: { subject: 'English', topic: 'Missing Letters & Spelling' },
    sentencefill: { subject: 'English', topic: 'English Sentence Fill in Blanks' },
    hindivarna: { subject: 'Hindi', topic: 'Hindi Varnamala' },
    hindimatras: { subject: 'Hindi', topic: 'Hindi Matras' },
    hindiwords: { subject: 'Hindi', topic: 'Hindi Word Reading' },
    advancedhindi: { subject: 'Hindi', topic: 'Hindi Sentences & Meaning' },
    hinditest: { subject: 'Hindi', topic: 'Hindi Akshar Recognition' },
    matratest: { subject: 'Hindi', topic: 'Hindi Matra Recognition' },
    wordreadtest: { subject: 'Hindi', topic: 'Hindi Word Reading' },
    hindisentencequiz: { subject: 'Hindi', topic: 'Hindi Sentence Completion' },
    numbers: { subject: 'Math', topic: 'Counting 1-20' },
    numbers50: { subject: 'Math', topic: 'Counting 1-50' },
    numbers100: { subject: 'Math', topic: 'Counting 1-100' },
    ws1: { subject: 'Math', topic: 'Counting Stars' },
    ws2: { subject: 'Math', topic: 'Number Recognition' },
    ws3: { subject: 'Math', topic: 'Visual Fruit Addition' },
    visualadd: { subject: 'Math', topic: 'Visual Addition' },
    visualsub: { subject: 'Math', topic: 'Visual Subtraction' },
    visualmul: { subject: 'Math', topic: 'Visual Multiplication' },
    visualdiv: { subject: 'Math', topic: 'Visual Division' },
    visualgreaterless: { subject: 'Math', topic: 'Greater & Less Comparison' },
    addition: { subject: 'Math', topic: 'Easy Addition' },
    addition2: { subject: 'Math', topic: '2-Digit Addition' },
    subtraction: { subject: 'Math', topic: 'Subtraction' },
    multiplication: { subject: 'Math', topic: 'Multiplication' },
    tables: { subject: 'Math', topic: 'Multiplication Tables 2-10' },
    tables20: { subject: 'Math', topic: 'Multiplication Tables 2-20' },
    tables2to5: { subject: 'Math', topic: 'Tables 2-5' },
    tables2to20: { subject: 'Math', topic: 'Tables 2-20' },
    table2to5test: { subject: 'Math', topic: 'Tables 2-5 Quiz' },
    table2to20test: { subject: 'Math', topic: 'Tables 2-20 Quiz' },
    divisionquiz: { subject: 'Math', topic: 'Division Quiz' },
    wordmath: { subject: 'Math', topic: 'Addition Word Problems' },
    greaterlessquiz: { subject: 'Math', topic: 'Greater & Less Comparison' },
  };
  return map[mode] || { subject: 'Math', topic: getFeatureTitle(mode) };
}

export function isLearningMode(mode: FeatureMode): boolean {
  const learningModes: FeatureMode[] = [
    'abc',
    'numbers',
    'hindivarna',
    'hindimatras',
    'hindiwords',
    'tables2to5',
    'tables2to20',
    'visualdiv',
    'advancedhindi',
    'visualsub',
    'visualmul',
    'numbers100',
    'numbers50',
    'phonics',
    'english',
    'sentences',
    'visualadd',
    'visualgreaterless',
  ];
  return learningModes.includes(mode);
}

export function makeOptions(target: number, min: number, max: number): number[] {
  const options = [target];
  while (options.length < 3) {
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!options.includes(value)) options.push(value);
  }
  return options.sort(() => Math.random() - 0.5);
}

export function makeOptionsString(target: string, pool: string[]): string[] {
  const options = [target];
  while (options.length < 3) {
    const rand = pool[Math.floor(Math.random() * pool.length)];
    if (!options.includes(rand)) options.push(rand);
  }
  return options.sort(() => Math.random() - 0.5);
}

export function buildWorksheetQuestions(mode: string, age: number): WorksheetQuestion[] {
  const questionCount = age === 6 ? 10 : 5;
  const questions: WorksheetQuestion[] = [];
  const meta = getModeSubjectAndTopic(mode);

  const sampleWords = [
    { word: 'CAT', emoji: '🐱', missingIndex: 1, target: 'A', options: ['A', 'E', 'O'] },
    { word: 'DOG', emoji: '🐶', missingIndex: 1, target: 'O', options: ['O', 'I', 'U'] },
    { word: 'SUN', emoji: '☀️', missingIndex: 1, target: 'U', options: ['U', 'A', 'E'] },
    { word: 'BAT', emoji: '🏏', missingIndex: 1, target: 'A', options: ['A', 'O', 'I'] },
    { word: 'PIG', emoji: '🐷', missingIndex: 1, target: 'I', options: ['I', 'E', 'A'] },
    { word: 'HEN', emoji: '🐔', missingIndex: 1, target: 'E', options: ['E', 'A', 'U'] },
    { word: 'CUP', emoji: '🥤', missingIndex: 1, target: 'U', options: ['U', 'A', 'I'] },
    { word: 'HAT', emoji: '👒', missingIndex: 1, target: 'A', options: ['A', 'E', 'O'] },
    { word: 'PEN', emoji: '🖊️', missingIndex: 1, target: 'E', options: ['E', 'I', 'U'] },
    { word: 'VAN', emoji: '🚐', missingIndex: 1, target: 'A', options: ['A', 'O', 'E'] },
  ];

  const sentenceFillList = [
    { sentence: 'This is ___ cat.', target: 'my', options: ['my', 'it', 'he'], emoji: '🐱' },
    { sentence: 'She ___ a nice book.', target: 'reads', options: ['reads', 'run', 'eat'], emoji: '📖' },
    { sentence: 'The sun is very ___.', target: 'hot', options: ['hot', 'cold', 'blue'], emoji: '☀️' },
    { sentence: 'Birds fly in the ___.', target: 'sky', options: ['sky', 'water', 'bed'], emoji: '🦅' },
    { sentence: 'We go to ___ to study.', target: 'school', options: ['school', 'park', 'zoo'], emoji: '🏫' },
  ];

  const tableQuizPool: Array<{ a: number; b: number; target: number; options: number[] }> = [];
  for (let t = 2; t <= 5; t++) {
    for (let i = 1; i <= 10; i++) {
      tableQuizPool.push({
        a: t,
        b: i,
        target: t * i,
        options: [
          t * i,
          t * i + 1 > 50 ? t * i - 2 : t * i + 1,
          t * i - 1 < 0 ? t * i + 3 : t * i - 1,
        ].sort(() => Math.random() - 0.5),
      });
    }
  }

  const table2to20QuizPool: Array<{ a: number; b: number; target: number; options: number[] }> = [];
  for (let t = 2; t <= 20; t++) {
    for (let i = 1; i <= 10; i++) {
      table2to20QuizPool.push({
        a: t,
        b: i,
        target: t * i,
        options: [
          t * i,
          t * i + 2 > 250 ? t * i - 3 : t * i + 2,
          t * i - 2 < 0 ? t * i + 4 : t * i - 2,
        ].sort(() => Math.random() - 0.5),
      });
    }
  }

  for (let i = 0; i < questionCount; i++) {
    if (mode === 'ws1') {
      const target = Math.floor(Math.random() * 10) + 1;
      questions.push({
        target,
        options: makeOptions(target, 1, 12),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Count ${target} stars`,
      });
    } else if (mode === 'ws2' || mode === 'tests') {
      const target = Math.floor(Math.random() * 20) + 1;
      questions.push({
        target,
        options: makeOptions(target, 1, 20),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Find number ${target}`,
      });
    } else if (mode === 'hinditest') {
      const sample = hindiVarnamala[Math.floor(Math.random() * hindiVarnamala.length)];
      questions.push({
        isHindiTest: true,
        target: sample.l,
        targetEmoji: sample.e,
        targetWord: sample.w,
        options: makeOptionsString(sample.l, hindiVarnamala.map((h) => h.l)),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Identify Hindi letter for ${sample.w}`,
      });
    } else if (mode === 'matratest') {
      const sample = hindiMatras[Math.floor(Math.random() * hindiMatras.length)];
      questions.push({
        isMatraTest: true,
        target: sample.l,
        targetEmoji: sample.e,
        targetWord: sample.w,
        options: makeOptionsString(sample.l, hindiMatras.map((m) => m.l)),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Identify Matra: ${sample.w}`,
      });
    } else if (mode === 'wordreadtest') {
      const sample = hindiWordReadingList[Math.floor(Math.random() * hindiWordReadingList.length)];
      questions.push({
        isWordReadTest: true,
        target: sample.l,
        targetEmoji: sample.e,
        targetWord: sample.w,
        options: makeOptionsString(sample.l, hindiWordReadingList.map((w) => w.l)),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Hindi word for ${sample.e} (${sample.l})`,
      });
    } else if (mode === 'table2to5test') {
      const sample = tableQuizPool[Math.floor(Math.random() * tableQuizPool.length)];
      questions.push({
        isTableTest: true,
        a: sample.a,
        b: sample.b,
        target: sample.target,
        options: [...sample.options].sort(() => Math.random() - 0.5),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${sample.a} × ${sample.b} = ?`,
      });
    } else if (mode === 'table2to20test') {
      const sample = table2to20QuizPool[Math.floor(Math.random() * table2to20QuizPool.length)];
      questions.push({
        isTableTest: true,
        a: sample.a,
        b: sample.b,
        target: sample.target,
        options: [...sample.options].sort(() => Math.random() - 0.5),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${sample.a} × ${sample.b} = ?`,
      });
    } else if (mode === 'divisionquiz') {
      const b = Math.floor(Math.random() * 4) + 2;
      const ans = Math.floor(Math.random() * 5) + 1;
      const a = b * ans;
      questions.push({
        isDivisionTest: true,
        a,
        b,
        target: ans,
        options: [ans, ans > 1 ? ans - 1 : ans + 2, ans + 1].sort(() => Math.random() - 0.5),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${a} ÷ ${b} = ?`,
      });
    } else if (mode === 'hindisentencequiz') {
      const sample = advancedHindiTestPool[Math.floor(Math.random() * advancedHindiTestPool.length)];
      questions.push({
        isHindiSentenceTest: true,
        sentence: sample.sentence,
        target: sample.target,
        emoji: sample.emoji,
        options: [...sample.options].sort(() => Math.random() - 0.5),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: sample.sentence,
      });
    } else if (mode === 'ws3') {
      const n1 = Math.floor(Math.random() * 6) + 1;
      const n2 = Math.floor(Math.random() * 6) + 1;
      const target = n1 + n2;
      questions.push({
        n1,
        n2,
        target,
        options: makeOptions(target, 1, 12),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${n1} 🍎 + ${n2} 🍎 = ?`,
      });
    } else if (mode === 'missingword') {
      const qData = sampleWords[Math.floor(Math.random() * sampleWords.length)];
      questions.push({
        isMissingWord: true,
        word: qData.word,
        emoji: qData.emoji,
        missingIndex: qData.missingIndex,
        target: qData.target,
        options: [...qData.options].sort(() => Math.random() - 0.5),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Missing letter in ${qData.word}`,
      });
    } else if (mode === 'sentencefill') {
      const sData = sentenceFillList[Math.floor(Math.random() * sentenceFillList.length)];
      questions.push({
        isSentenceFill: true,
        sentence: sData.sentence,
        emoji: sData.emoji,
        target: sData.target,
        options: [...sData.options].sort(() => Math.random() - 0.5),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: sData.sentence,
      });
    } else if (mode === 'greaterlessquiz') {
      const n1 = Math.floor(Math.random() * 15) + 1;
      let n2 = Math.floor(Math.random() * 15) + 1;
      while (n1 === n2) n2 = Math.floor(Math.random() * 15) + 1;
      const target = n1 > n2 ? '>' : '<';
      questions.push({
        isGreaterLess: true,
        n1,
        n2,
        target,
        options: ['>', '<', '='].sort(() => Math.random() - 0.5),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Compare ${n1} and ${n2}`,
      });
    } else if (mode === 'ws4') {
      const sample = alphabet[Math.floor(Math.random() * alphabet.length)];
      questions.push({
        target: sample.l,
        targetEmoji: sample.e,
        options: makeOptionsString(sample.l, alphabet.map((a) => a.l)),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Match letter for ${sample.e} (${sample.w})`,
      });
    } else if (mode === 'addition') {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const target = a + b;
      questions.push({
        a,
        b,
        target,
        options: makeOptions(target, 2, 20),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${a} + ${b} = ?`,
      });
    } else if (mode === 'addition2') {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 40) + 10;
      const target = a + b;
      questions.push({
        a,
        b,
        target,
        options: makeOptions(target, 10, 100),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${a} + ${b} = ?`,
      });
    } else if (mode === 'subtraction') {
      const a = Math.floor(Math.random() * 50) + 20;
      const b = Math.floor(Math.random() * 20) + 1;
      const target = a - b;
      questions.push({
        a,
        b,
        target,
        options: makeOptions(target, 1, 70),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${a} - ${b} = ?`,
      });
    } else if (mode === 'multiplication') {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const target = a * b;
      questions.push({
        a,
        b,
        target,
        options: makeOptions(target, 1, 100),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${a} × ${b} = ?`,
      });
    } else if (mode === 'tables' || mode === 'tables20') {
      const limit = mode === 'tables' ? 10 : 20;
      const a = Math.floor(Math.random() * limit) + 2;
      const b = Math.floor(Math.random() * 10) + 1;
      const target = a * b;
      questions.push({
        a,
        b,
        target,
        options: makeOptions(target, 2, limit * 10),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${a} × ${b} = ?`,
      });
    } else if (mode === 'wordmath') {
      const apples = Math.floor(Math.random() * 8) + 2;
      const more = Math.floor(Math.random() * 6) + 1;
      const target = apples + more;
      questions.push({
        word: `Rahul has ${apples} apples. He gets ${more} more. How many apples does he have now?`,
        target,
        options: makeOptions(target, 2, 20),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `${apples} apples + ${more} more apples`,
      });
    } else {
      const target = Math.floor(Math.random() * 15) + 1;
      questions.push({
        target,
        options: makeOptions(target, 1, 20),
        topicLabel: meta.topic,
        subjectLabel: meta.subject,
        promptSummary: `Find ${target}`,
      });
    }
  }

  return questions.sort(() => Math.random() - 0.5);
}
