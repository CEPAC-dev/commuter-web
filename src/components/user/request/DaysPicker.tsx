'use client';

import { useMemo } from 'react';
import type { WeekDay } from '@/types/user';
import { useTranslations } from 'next-intl';

const ALL_DAYS: WeekDay[] = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
// JS Date.getDay() → 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
const JS_TO_WEEKDAY: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DaysPickerProps {
  selected: WeekDay[];
  onChange: (days: WeekDay[]) => void;
  error?: boolean;
  startDate?: string;
}

export default function DaysPicker({ selected, onChange, error, startDate }: DaysPickerProps) {
  const td = useTranslations('days');
  const tf = useTranslations('request_form');
  const orderedDays = useMemo(() => {
    if (!startDate) return ALL_DAYS;
    const jsDay = new Date(startDate + 'T00:00:00').getDay();
    const startAbbr = JS_TO_WEEKDAY[jsDay];
    const startIdx = ALL_DAYS.indexOf(startAbbr);
    return [...ALL_DAYS.slice(startIdx), ...ALL_DAYS.slice(0, startIdx)];
  }, [startDate]);

  function toggle(day: WeekDay) {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {orderedDays.map((day) => {
          const active = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              style={{
                flexShrink: 0,
                minWidth: 40,
                height: 40,
                borderRadius: 8,
                border: `1.5px solid ${error && !active ? '#E74C3C' : active ? '#00C2A8' : '#E2E8F0'}`,
                background: active ? '#00C2A8' : '#fff',
                color: active ? '#0B1E3D' : '#5A6A7A',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {td(day.toLowerCase() as 'sun')}
            </button>
          );
        })}
      </div>
      {error && selected.length === 0 && (
        <p style={{ fontSize: 12, color: '#E74C3C', margin: '4px 0 0' }}>
          {tf('days_label')}
        </p>
      )}
    </div>
  );
}
