'use client';

import { useState, useEffect } from 'react';

interface AgeGateInputProps {
  value: string; // ISO "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
  error?: string;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const MAX_YEAR = new Date().getFullYear() - 18;

function calcAge(year: number, month: number, day: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) age--;
  return age;
}

export default function AgeGateInput({ value, onChange, error }: AgeGateInputProps) {
  const parts = value ? value.split('-') : ['', '', ''];
  const [year,  setYear]  = useState(parts[0] ?? '');
  const [month, setMonth] = useState(parts[1] ?? '');
  const [day,   setDay]   = useState(parts[2] ?? '');
  const [ageError, setAgeError] = useState('');

  useEffect(() => {
    // Only proceed if we have all three date fields
    if (!year || !month || !day) {
      setAgeError('');
      return;
    }

    const y = parseInt(year), m = parseInt(month), d = parseInt(day);
    const iso = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    const age = calcAge(y, m, d);

    if (age < 18) {
      setAgeError('You must be at least 18 years old to register');
      onChange(''); // signal invalid
    } else {
      setAgeError('');
      onChange(iso);
    }
  }, [year, month, day, onChange]);

  const isValid = !ageError && !!value;
  const showInline = ageError || error;

  const selectClass = [
    'border rounded-lg px-2 py-2.5 text-primary text-sm bg-white focus:outline-none focus:ring-2 transition-shadow',
    showInline ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-secondary',
  ].join(' ');

  return (
    <div>
      <div className="flex gap-2 items-center">
        {/* Day */}
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          aria-label="Day of birth"
          className={`${selectClass} w-20`}
        >
          <option value="">DD</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Month of birth"
          className={`${selectClass} flex-1`}
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1)}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Year of birth"
          className={`${selectClass} w-24`}
        >
          <option value="">YYYY</option>
          {Array.from({ length: MAX_YEAR - 1950 + 1 }, (_, i) => MAX_YEAR - i).map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        {/* Age check icon */}
        {isValid && (
          <svg className="w-5 h-5 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Age verified">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
        )}
      </div>

      {(ageError || error) && (
        <p className="mt-1 text-xs text-danger">{ageError || error}</p>
      )}
    </div>
  );
}
