const DEFAULT_YEAR = 2026;
const DEFAULT_MONTH_INDEX = 3; // April is 0-indexed as 3

const parseDayTime = (day, time, weekDays, year = DEFAULT_YEAR, monthIndex = DEFAULT_MONTH_INDEX) => {
  const dayConfig = weekDays.find((d) => d.day === day);
  if (!dayConfig) return null;

  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, monthIndex, Number(dayConfig.date), hour, minute);
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const intervalsOverlap = (a, b) => a.start < b.end && a.end > b.start;

export const getSessionInterval = (session, weekDays) => {
  const start = parseDayTime(session.day, session.time, weekDays);
  if (!start) return null;

  const duration = Number(session.durationMinutes ?? 60);
  const end = addMinutes(start, duration);
  return { start, end };
};

export const buildBufferedInterval = (session, weekDays, bufferMinutes) => {
  const interval = getSessionInterval(session, weekDays);
  if (!interval) return null;

  return {
    start: addMinutes(interval.start, -Math.abs(bufferMinutes)),
    end: addMinutes(interval.end, Math.abs(bufferMinutes)),
  };
};

export const doesSessionConflict = (candidate, existingSession, weekDays, bufferMinutes) => {
  const candidateInterval = getSessionInterval(candidate, weekDays);
  const bufferedExisting = buildBufferedInterval(existingSession, weekDays, bufferMinutes);
  if (!candidateInterval || !bufferedExisting) return false;

  return intervalsOverlap(candidateInterval, bufferedExisting);
};

export const isSlotAvailable = (candidate, sessions, weekDays, bufferMinutes) => {
  return !sessions.some((session) => doesSessionConflict(candidate, session, weekDays, bufferMinutes));
};

export const getSlotStatus = (candidate, sessions, weekDays, bufferMinutes) => {
  const candidateInterval = getSessionInterval(candidate, weekDays);
  if (!candidateInterval) return 'unavailable';

  const exactOverlap = sessions.some((session) => {
    const existingInterval = getSessionInterval(session, weekDays);
    return existingInterval ? intervalsOverlap(candidateInterval, existingInterval) : false;
  });

  if (exactOverlap) {
    return 'booked';
  }

  const bufferedOverlap = sessions.some((session) => doesSessionConflict(candidate, session, weekDays, bufferMinutes));
  return bufferedOverlap ? 'buffer' : 'available';
};

export const getConflictingSessions = (candidate, sessions, weekDays, bufferMinutes) => {
  return sessions.filter((session) => doesSessionConflict(candidate, session, weekDays, bufferMinutes));
};
