import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { CLASS_OPTIONS } from '../data/curriculum';
import type { ClassAge, StudentProfile } from '../types/learning';
import { soundTap } from '../utils/audio';
import { NepBadge } from './NepBranding';
import { NexoraBadge } from './NexoraBadge';

interface AgeSelectionScreenProps {
  selectedAge: ClassAge | null;
  students: StudentProfile[];
  activeStudent: StudentProfile;
  onSelectAge: (age: ClassAge) => void;
  onContinue: () => void;
  onSelectStudent: (studentId: string) => void;
  onCreateStudent: (name: string, age: ClassAge) => void;
  onOpenAbout?: () => void;
}

export const AgeSelectionScreen: React.FC<AgeSelectionScreenProps> = ({
  selectedAge,
  students,
  activeStudent,
  onSelectAge,
  onContinue,
  onSelectStudent,
  onCreateStudent,
  onOpenAbout,
}) => {
  const [showAddLearner, setShowAddLearner] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    soundTap();
    onCreateStudent(newName.trim(), selectedAge || activeStudent.age || 3);
    setNewName('');
    setShowAddLearner(false);
  };

  return (
    <section
      id="age-screen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: 'linear-gradient(145deg, #5d9cff, #765fe6 55%, #f06ca8)',
      }}
    >
      <div className="w-full max-w-md bg-white rounded-[38px] p-6 shadow-2xl my-auto">
        <div className="text-center">
          <div className="text-5xl mb-1">🧸</div>
          <h1 className="app-title text-3xl" style={{ color: '#38528a' }}>
            Fun Learn
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Let&apos;s start your learning adventure!
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <NexoraBadge variant="light" />
            <NepBadge variant="light" onOpenAbout={onOpenAbout} />
          </div>
          <p className="text-[11px] font-bold text-[#1e3a8a] mt-1.5">
            Learning Beyond Textbooks — Inspired by NEP 2020
          </p>
        </div>

        {/* Separate Student Profile Selector */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="student-profile-select"
              className="text-xs font-bold text-slate-600"
            >
              👦 Student Profile:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                id="student-profile-select"
                value={activeStudent.id}
                onChange={(e) => {
                  soundTap();
                  onSelectStudent(e.target.value);
                }}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  soundTap();
                  setShowAddLearner((v) => !v);
                }}
                title="Add new student profile"
                className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {showAddLearner && (
            <form onSubmit={handleAdd} className="mt-2 flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter student name..."
                className="flex-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black"
              >
                Add
              </button>
            </form>
          )}
        </div>

        <div className="mt-4">
          <p className="font-bold text-gray-600 text-sm mb-2">
            Select Your Class:
          </p>
          <div id="age-grid" className="grid grid-cols-2 gap-2">
            {CLASS_OPTIONS.map((opt) => (
              <button
                key={opt.age}
                type="button"
                className={`age-button ${selectedAge === opt.age ? 'selected' : ''}`}
                onClick={() => {
                  soundTap();
                  onSelectAge(opt.age);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          id="continue-button"
          type="button"
          onClick={onContinue}
          disabled={!selectedAge}
          className={`w-full mt-5 py-3.5 rounded-2xl text-white font-black text-lg transition-opacity ${
            selectedAge ? 'opacity-100' : 'opacity-50'
          }`}
          style={{
            background: 'linear-gradient(145deg, #ff6fae, #ff8a64)',
            boxShadow: '0 6px 0 #d65372',
          }}
        >
          Start Learning 🚀
        </button>
      </div>
    </section>
  );
};
