export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr: string, duration: number): string {
  const totalMinutes = timeToMinutes(timeStr) + duration;
  return minutesToTime(totalMinutes);
}

export function getRelativeDate(dayOffset: number, startFromTomorrow: boolean = false, skipWeekends: boolean = false): string {
  const date = new Date();
  if (startFromTomorrow) date.setDate(date.getDate() + 1);
  date.setDate(date.getDate() + dayOffset);

  if (skipWeekends) {
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
