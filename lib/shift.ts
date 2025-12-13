// Shift configuration for November Coffee
export interface Shift {
  id: number;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  label: string;
}

export const SHIFTS: Shift[] = [
  {
    id: 1,
    name: 'Pagi',
    startTime: '11:00',
    endTime: '19:00',
    label: 'Shift Pagi (11:00 - 19:00)'
  },
  {
    id: 2,
    name: 'Malam',
    startTime: '19:00',
    endTime: '03:00',
    label: 'Shift Malam (19:00 - 03:00)'
  },
  {
    id: 3,
    name: 'Dini Hari',
    startTime: '03:00',
    endTime: '11:00',
    label: 'Shift Dini Hari (03:00 - 11:00)'
  }
];

export function getCurrentShift(): Shift {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Shift 1: 11:00 - 19:00 (660 - 1140 minutes)
  if (currentTimeInMinutes >= 660 && currentTimeInMinutes < 1140) {
    return SHIFTS[0];
  }
  // Shift 2: 19:00 - 03:00 (1140 minutes - 180 minutes next day)
  else if (currentTimeInMinutes >= 1140 || currentTimeInMinutes < 180) {
    return SHIFTS[1];
  }
  // Shift 3: 03:00 - 11:00 (180 - 660 minutes)
  else {
    return SHIFTS[2];
  }
}

export function getShiftById(shiftId: number): Shift | undefined {
  return SHIFTS.find(shift => shift.id === shiftId);
}

export function formatShiftTime(shift: Shift): string {
  return `${shift.startTime} - ${shift.endTime}`;
}
