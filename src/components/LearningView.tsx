import React from 'react';
import {
  advancedHindiSentences,
  alphabet,
  createNumbers100,
  divisionLearningList,
  englishWordsList,
  hindiMatras,
  hindiVarnamala,
  hindiWordReadingList,
  numbers,
  numbers50,
  phonicWordsList,
  sentencesList,
  tables2to20List,
  tables2to5List,
  visualAdditionLearning,
  visualGreaterLessLearning,
  visualMultiplicationLearning,
  visualSubtractionLearning,
} from '../data/curriculum';
import type {
  AdvancedHindiSentenceItem,
  BasicLearningCard,
  LearningMode,
  TableLearningItem,
  VisualDivisionItem,
  VisualGreaterLessItem,
  VisualMathOpItem,
} from '../types/learning';

interface LearningViewProps {
  mode: LearningMode;
  currentIndex: number;
  shuffledPhonics?: BasicLearningCard[];
}

export function getLearningListLength(mode: LearningMode): number {
  switch (mode) {
    case 'abc':
      return alphabet.length;
    case 'numbers':
      return numbers.length;
    case 'numbers50':
      return numbers50.length;
    case 'numbers100':
      return 100;
    case 'hindivarna':
      return hindiVarnamala.length;
    case 'hindimatras':
      return hindiMatras.length;
    case 'hindiwords':
      return hindiWordReadingList.length;
    case 'tables2to5':
      return tables2to5List.length;
    case 'tables2to20':
      return tables2to20List.length;
    case 'visualdiv':
      return divisionLearningList.length;
    case 'advancedhindi':
      return advancedHindiSentences.length;
    case 'visualsub':
      return visualSubtractionLearning.length;
    case 'visualmul':
      return visualMultiplicationLearning.length;
    case 'phonics':
      return phonicWordsList.length;
    case 'english':
      return englishWordsList.length;
    case 'sentences':
      return sentencesList.length;
    case 'visualadd':
      return visualAdditionLearning.length;
    case 'visualgreaterless':
      return visualGreaterLessLearning.length;
  }
}

const numbers100Cache = createNumbers100();

export const LearningView: React.FC<LearningViewProps> = ({
  mode,
  currentIndex,
  shuffledPhonics,
}) => {
  if (mode === 'visualsub') {
    const data: VisualMathOpItem =
      visualSubtractionLearning[currentIndex % visualSubtractionLearning.length];
    const rem = data.a - data.b;
    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div className="text-xl font-black mb-3 text-red-500">
          ➖ घटाव सीखें (How to Subtract)
        </div>
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <div className="math-box">
            <div className="text-xs font-bold text-gray-400 mb-1">कुल: {data.a}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
              {Array.from({ length: data.a }).map((_, idx) => (
                <span key={idx} className="text-2xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="text-2xl font-black">-</div>
          <div className="math-box">
            <div className="text-xs font-bold text-gray-400 mb-1">हटाए: {data.b}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
              {Array.from({ length: data.b }).map((_, idx) => (
                <span key={idx} className="text-2xl opacity-40">
                  ❌
                </span>
              ))}
            </div>
          </div>
          <div className="text-2xl font-black">=</div>
          <div className="math-box bg-red-50 border-red-200">
            <div className="text-xs font-bold text-red-600 mb-1">बचे: {rem}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
              {Array.from({ length: rem }).map((_, idx) => (
                <span key={idx} className="text-2xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-base font-bold text-gray-700 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          {data.title}
        </div>
      </div>
    );
  }

  if (mode === 'visualmul') {
    const data: VisualMathOpItem =
      visualMultiplicationLearning[currentIndex % visualMultiplicationLearning.length];
    const total = data.a * data.b;
    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div className="text-xl font-black mb-3 text-purple-600">
          ✖️ गुणा सीखें (How to Multiply)
        </div>
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
          <div className="math-box">
            <div className="text-xs font-bold text-purple-500 mb-1">समूह: {data.a}</div>
            <div className="text-lg font-black">{data.a} बार</div>
          </div>
          <div className="text-2xl font-black">×</div>
          <div className="math-box">
            <div className="text-xs font-bold text-purple-500 mb-1">
              हर समूह में: {data.b}
            </div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
              {Array.from({ length: data.b }).map((_, idx) => (
                <span key={idx} className="text-xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="text-2xl font-black">=</div>
          <div className="math-box bg-purple-50 border-purple-200">
            <div className="text-xs font-bold text-purple-600 mb-1">कुल: {total}</div>
            <div className="text-lg font-black text-purple-600">{total}</div>
          </div>
        </div>
        <div className="text-base font-bold text-gray-700 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          {data.title}
        </div>
      </div>
    );
  }

  if (mode === 'tables2to5' || mode === 'tables2to20') {
    const list = mode === 'tables2to5' ? tables2to5List : tables2to20List;
    const data: TableLearningItem = list[currentIndex % list.length];
    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div className="text-2xl font-black mb-2 text-blue-600">{data.l}</div>
        <div className="bg-white/90 border-4 border-blue-200 p-4 rounded-2xl shadow-sm text-xl font-black text-slate-700 leading-relaxed max-w-xs mx-auto whitespace-pre-line">
          {data.contentStr}
        </div>
      </div>
    );
  }

  if (mode === 'visualdiv') {
    const data: VisualDivisionItem =
      divisionLearningList[currentIndex % divisionLearningList.length];
    const eachGroup = data.total / data.groups;
    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div className="text-lg font-black mb-2 text-indigo-600">
          ➗ भाग (Division) का मतलब बराबर बांटना
        </div>
        <div className="text-sm font-bold text-slate-500 mb-2">
          कुल वस्तुएँ: {data.total} | {data.groups} बच्चों में बराबर बांटें
        </div>
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          {Array.from({ length: data.groups }).map((_, g) => (
            <div key={g} className="math-box bg-indigo-50 border-indigo-200 p-2 m-1">
              <div className="text-xs font-bold text-indigo-600 mb-1">डिब्बा {g + 1}</div>
              <div className="flex flex-wrap justify-center gap-1 max-w-[70px]">
                {Array.from({ length: eachGroup }).map((__, idx) => (
                  <span key={idx} className="text-xl">
                    {data.symbol}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-sm font-bold text-slate-700 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          {data.title}
        </div>
      </div>
    );
  }

  if (mode === 'advancedhindi') {
    const data: AdvancedHindiSentenceItem =
      advancedHindiSentences[currentIndex % advancedHindiSentences.length];
    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div className="text-5xl bounce mb-2">{data.e}</div>
        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">
          📖 हिंदी वाक्य पढ़ना और समझना
        </div>
        <div className="text-2xl md:text-3xl font-black px-3 mb-2 text-slate-800">
          {data.sentence}
        </div>
        <div className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 mb-2">
          {data.hint}
        </div>
        <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 max-w-xs mx-auto shadow-sm">
          {data.meaning}
        </div>
      </div>
    );
  }

  if (mode === 'visualadd') {
    const data: VisualMathOpItem =
      visualAdditionLearning[currentIndex % visualAdditionLearning.length];
    const sum = data.a + data.b;
    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div className="text-xl font-black mb-3 text-blue-600">
          ➕ जोड़ना सीखें (How to Add)
        </div>
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <div className="math-box">
            <div className="text-xs font-bold text-gray-400 mb-1">{data.a}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
              {Array.from({ length: data.a }).map((_, idx) => (
                <span key={idx} className="text-2xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="text-2xl font-black">+</div>
          <div className="math-box">
            <div className="text-xs font-bold text-gray-400 mb-1">{data.b}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
              {Array.from({ length: data.b }).map((_, idx) => (
                <span key={idx} className="text-2xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="text-2xl font-black">=</div>
          <div className="math-box bg-green-50 border-green-200">
            <div className="text-xs font-bold text-green-600 mb-1">{sum}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
              {Array.from({ length: sum }).map((_, idx) => (
                <span key={idx} className="text-2xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-base font-bold text-gray-700 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          {data.title}
        </div>
      </div>
    );
  }

  if (mode === 'visualgreaterless') {
    const data: VisualGreaterLessItem =
      visualGreaterLessLearning[currentIndex % visualGreaterLessLearning.length];
    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div className="text-xl font-black mb-3 text-blue-600">
          ⚖️ छोटा और बड़ा (Greater &amp; Less Than)
        </div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="math-box">
            <div className="text-xs font-bold text-gray-400 mb-1">{data.n1}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
              {Array.from({ length: data.n1 }).map((_, idx) => (
                <span key={idx} className="text-2xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="text-4xl font-black text-pink-500 bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-md">
            {data.sign}
          </div>
          <div className="math-box">
            <div className="text-xs font-bold text-gray-400 mb-1">{data.n2}</div>
            <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
              {Array.from({ length: data.n2 }).map((_, idx) => (
                <span key={idx} className="text-2xl">
                  {data.symbol}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-base font-bold text-gray-700 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          {data.title}
        </div>
      </div>
    );
  }

  const listMap: Record<string, BasicLearningCard[]> = {
    abc: alphabet,
    numbers,
    numbers50,
    numbers100: numbers100Cache,
    hindivarna: hindiVarnamala,
    hindimatras: hindiMatras,
    hindiwords: hindiWordReadingList,
    phonics: shuffledPhonics || phonicWordsList,
    english: englishWordsList,
    sentences: sentencesList,
  };

  const list = listMap[mode] || alphabet;
  const data = list[currentIndex % list.length];
  const isLetter =
    mode === 'abc' ||
    mode === 'hindivarna' ||
    mode === 'hindimatras' ||
    mode === 'hindiwords' ||
    mode === 'sentences' ||
    mode === 'phonics' ||
    mode === 'english';

  if (isLetter) {
    if (mode === 'sentences') {
      return (
        <div className="w-full text-center pop flex flex-col items-center justify-center">
          <div className="text-5xl bounce mb-4">{data.e}</div>
          <div
            className="text-2xl md:text-3xl font-black px-4 mb-3"
            style={{ color: data.c, fontFamily: 'Fredoka', lineHeight: 1.4 }}
          >
            {data.l}
          </div>
          <div className="text-lg font-bold text-gray-500 bg-white/80 p-3 rounded-2xl shadow-sm border border-gray-100 max-w-sm mx-auto">
            {data.w.split('\n')[1] || ''}
          </div>
        </div>
      );
    }

    if (mode === 'hindiwords') {
      return (
        <div className="w-full text-center pop flex flex-col items-center justify-center">
          <div className="text-6xl bounce mb-3">{data.e}</div>
          <div
            className="text-4xl font-black px-4 mb-2"
            style={{ color: data.c, fontFamily: 'Fredoka' }}
          >
            {data.l}
          </div>
          <div className="text-2xl font-bold mt-4 text-gray-700 px-4">{data.w}</div>
        </div>
      );
    }

    return (
      <div className="w-full text-center pop flex flex-col items-center justify-center">
        <div
          className="learning-letter bounce px-3"
          style={{
            color: data.c,
            fontSize: '4.5rem',
            lineHeight: 1.3,
            fontFamily: 'Fredoka',
          }}
        >
          {data.l}
        </div>
        <div className="text-5xl bounce mt-3">{data.e}</div>
        <div className="text-2xl font-bold mt-4 text-gray-700 px-4">{data.w}</div>
      </div>
    );
  }

  const count = data.n || Number(data.l) || 1;
  let columns = 5;
  if (count > 10) columns = 6;
  if (count > 30) columns = 8;
  if (count > 60) columns = 10;

  return (
    <div className="w-full text-center pop flex flex-col items-center justify-center">
      <div
        className="learning-number bounce"
        style={{ color: data.c, fontSize: '4rem' }}
      >
        {data.l}
      </div>
      <div
        className="star-grid bounce mt-3"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          maxWidth: '320px',
        }}
      >
        {Array.from({ length: Math.min(count, 100) }).map((_, idx) => (
          <span key={idx} className="text-xl">
            {data.e}
          </span>
        ))}
      </div>
      <div className="text-2xl font-bold mt-4 text-gray-700 px-4">{data.w}</div>
    </div>
  );
};
