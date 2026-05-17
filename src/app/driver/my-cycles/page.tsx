'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
// Mock data removed
import DayRunCard from '@/components/driver/DayRunCard';
import WeekCalendar from '@/components/driver/WeekCalendar';
import EmptyState from '@/components/shared/EmptyState';
import type { DriverCycleSchedule } from '@/types/cycle';

type TabKey = 'active' | 'pending' | 'completed';

export default function MyCyclesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const schedule: DriverCycleSchedule = {
    cycle_id: '',
    status: 'confirmed',
    days: [],
    cycle_start_date: new Date().toISOString().split('T')[0],
    cycle_end_date: new Date().toISOString().split('T')[0],
  }; // TODO: fetch from API

  const todayDays     = schedule.days.filter(d => d.is_today);
  const pendingDays   = schedule.days.filter(d => !d.is_today && d.status === 'upcoming');
  const completedDays = schedule.days.filter(d => d.status === 'completed');

  function handleStartRun(runId: string) {
    router.push(`/driver/trip/${runId}`);
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'active',    label: 'Currently Active' },
    { key: 'pending',   label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Cycle header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#0B1E3D]">My Cycles</h1>
        <p className="text-sm text-[#5A6A7A] mt-0.5">
          Cycle:{' '}
          {format(parseISO(schedule.cycle_start_date), 'EEE d MMM')}
          {' '}–{' '}
          {format(parseISO(schedule.cycle_end_date), 'EEE d MMM yyyy')}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#E2E8F0] mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 mr-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#00C2A8] text-[#0B1E3D]'
                : 'border-transparent text-[#5A6A7A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Currently Active tab */}
      {activeTab === 'active' && (
        <div>
          {todayDays.length === 0 ? (
            <EmptyState
              icon="🚗"
              title="No active runs today"
              description="Check the Pending tab for upcoming runs."
            />
          ) : (
            <>
              <p className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wide mb-3">
                {todayDays[0].day_name},{' '}
                {format(parseISO(todayDays[0].date), 'd MMM')} · Today
              </p>
              {todayDays[0].runs.map(run => (
                <DayRunCard
                  key={run.run_id}
                  run={run}
                  dayDate={todayDays[0].date}
                  isToday={true}
                  onStart={handleStartRun}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Pending tab */}
      {activeTab === 'pending' && (
        pendingDays.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No upcoming days"
            description="All remaining days in this cycle have been completed."
          />
        ) : (
          <WeekCalendar days={pendingDays} onStartRun={handleStartRun} />
        )
      )}

      {/* Completed tab */}
      {activeTab === 'completed' && (
        completedDays.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No completed days yet"
            description="Completed days will appear here."
          />
        ) : (
          <WeekCalendar days={completedDays} onStartRun={() => {}} />
        )
      )}
    </div>
  );
}
