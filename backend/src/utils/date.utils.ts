export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Normalizes a date to UTC 00:00:00.000
 */
export function normalizeToStartOfDay(date: Date | string): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Gets the number of days in a given month and year (1-indexed month: 1-12)
 */
export function getDaysInUTCMonth(year: number, monthZeroBased: number): number {
  // Month is 0-indexed in JS Date constructor when passing year, month+1, 0
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
}

/**
 * Calculates the next due date based on recurrence frequency and anchor day.
 *
 * @param currentDueDate The current reference due date
 * @param frequency 'WEEKLY' | 'MONTHLY' | 'YEARLY'
 * @param anchorDay Preferred day of month (1-31) for MONTHLY calculations
 */
export function calculateNextDueDate(
  currentDueDate: Date | string,
  frequency: RecurrenceFrequency,
  anchorDay?: number
): Date {
  const current = normalizeToStartOfDay(currentDueDate);
  const year = current.getUTCFullYear();
  const month = current.getUTCMonth();
  const date = current.getUTCDate();

  if (frequency === 'WEEKLY') {
    const next = new Date(current);
    next.setUTCDate(date + 7);
    return normalizeToStartOfDay(next);
  }

  if (frequency === 'MONTHLY') {
    const targetMonth = month + 1;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    const preferredDay = anchorDay || date;
    const maxDays = getDaysInUTCMonth(targetYear, normalizedMonth);
    const actualDay = Math.min(preferredDay, maxDays);

    return new Date(Date.UTC(targetYear, normalizedMonth, actualDay, 0, 0, 0, 0));
  }

  if (frequency === 'YEARLY') {
    const targetYear = year + 1;
    const maxDays = getDaysInUTCMonth(targetYear, month);
    const actualDay = Math.min(date, maxDays);

    return new Date(Date.UTC(targetYear, month, actualDay, 0, 0, 0, 0));
  }

  throw new Error(`Unsupported frequency: ${frequency}`);
}

/**
 * Calculates the reminder execution timestamp for a given due date and offset days.
 */
export function calculateReminderDate(dueDate: Date | string, reminderDaysBefore: number): Date {
  const normalizedDue = normalizeToStartOfDay(dueDate);
  const reminderTime = normalizedDue.getTime() - reminderDaysBefore * 24 * 60 * 60 * 1000;
  return new Date(reminderTime);
}
