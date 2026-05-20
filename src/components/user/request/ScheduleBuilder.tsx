'use client';

import type { TimeSlot, WeekDay } from '@/types/shared';
import TimeSlotCard from './TimeSlotCard';

interface ScheduleBuilderProps {
  timeSlots:    TimeSlot[];
  assignedDays: WeekDay[];
  allDaysAssigned: boolean;
  onAddSlot:    () => void;
  onRemoveSlot: (slotId: string) => void;
  onSetRoute:   (slotId: string) => void;
  onEditReturnRoute: (slotId: string) => void;
  onTripTypeChange: (slotId: string, tripType: 'one_way' | 'round_trip') => void;
  onPickupChange:   (slotId: string, from: string, to: string) => void;
  onReturnChange:   (slotId: string, from: string, to: string) => void;
  onDayToggle:      (slotId: string, day: WeekDay) => void;
}

export default function ScheduleBuilder({
  timeSlots,
  assignedDays,
  allDaysAssigned,
  onAddSlot,
  onRemoveSlot,
  onSetRoute,
  onEditReturnRoute,
  onTripTypeChange,
  onPickupChange,
  onReturnChange,
  onDayToggle,
}: ScheduleBuilderProps) {
  const slot1 = timeSlots[0];

  const lastSlot = timeSlots[timeSlots.length - 1];
  const lastSlotNeedsDay = !!lastSlot && lastSlot.days.length === 0;
  const addDisabled = allDaysAssigned || timeSlots.length >= 4 || lastSlotNeedsDay;

  return (
    <div className="space-y-3">
      {timeSlots.map((slot, index) => (
        <TimeSlotCard
          key={slot.id}
          slot={slot}
          slotIndex={index}
          slotNumber={index + 1}
          assignedDays={assignedDays}
          canRemove={timeSlots.length > 1}
          slot1Origin={slot1?.origin?.address ?? null}
          slot1Destination={slot1?.destination?.address ?? null}
          onSetRoute={() => onSetRoute(slot.id)}
          onEditReturnRoute={() => onEditReturnRoute(slot.id)}
          onTripTypeChange={(tripType) => onTripTypeChange(slot.id, tripType)}
          onPickupChange={(from, to) => onPickupChange(slot.id, from, to)}
          onReturnChange={(from, to) => onReturnChange(slot.id, from, to)}
          onDayToggle={(day) => onDayToggle(slot.id, day)}
          onRemove={() => onRemoveSlot(slot.id)}
        />
      ))}

      <button
        type="button"
        onClick={onAddSlot}
        disabled={addDisabled}
        className={`
          w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors
          ${addDisabled
            ? 'border-[#E2E8F0] text-[#C5CDD6] cursor-not-allowed'
            : 'border-[#00C2A8] text-[#00C2A8] hover:bg-[#EFF7F6]'}
        `}
      >
        {allDaysAssigned
          ? 'All 7 days scheduled'
          : timeSlots.length >= 4
            ? 'Maximum 4 slots reached'
            : lastSlotNeedsDay
              ? 'Select days for current slot first'
              : '+ Add time slot'}
      </button>

      <div className="w-full bg-[#F1F3F4] rounded-full h-1.5">
        <div
          className="bg-[#00C2A8] h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(assignedDays.length / 7) * 100}%` }}
        />
      </div>
    </div>
  );
}
