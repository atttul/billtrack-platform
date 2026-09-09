import {
  normalizeToStartOfDay,
  calculateNextDueDate,
  calculateReminderDate,
  getDaysInUTCMonth,
} from '../../src/utils/date.utils';

describe('Date Utilities & Recurrence Engine', () => {
  describe('normalizeToStartOfDay', () => {
    it('should reset hours, minutes, seconds and milliseconds to 00:00:00.000 UTC', () => {
      const date = new Date('2026-09-10T15:30:45.123Z');
      const normalized = normalizeToStartOfDay(date);

      expect(normalized.getUTCFullYear()).toBe(2026);
      expect(normalized.getUTCMonth()).toBe(8); // September (0-indexed)
      expect(normalized.getUTCDate()).toBe(10);
      expect(normalized.getUTCHours()).toBe(0);
      expect(normalized.getUTCMinutes()).toBe(0);
      expect(normalized.getUTCSeconds()).toBe(0);
      expect(normalized.getUTCMilliseconds()).toBe(0);
    });
  });

  describe('getDaysInUTCMonth', () => {
    it('should return correct number of days for non-leap February', () => {
      expect(getDaysInUTCMonth(2025, 1)).toBe(28);
    });

    it('should return correct number of days for leap February', () => {
      expect(getDaysInUTCMonth(2028, 1)).toBe(29);
    });

    it('should return 31 days for January and March', () => {
      expect(getDaysInUTCMonth(2026, 0)).toBe(31);
      expect(getDaysInUTCMonth(2026, 2)).toBe(31);
    });
  });

  describe('calculateNextDueDate - WEEKLY', () => {
    it('should add exactly 7 days', () => {
      const current = new Date('2026-09-10T00:00:00.000Z');
      const next = calculateNextDueDate(current, 'WEEKLY');
      expect(next.toISOString()).toBe('2026-09-17T00:00:00.000Z');
    });

    it('should handle month boundaries correctly when adding 7 days', () => {
      const current = new Date('2026-09-28T00:00:00.000Z');
      const next = calculateNextDueDate(current, 'WEEKLY');
      expect(next.toISOString()).toBe('2026-10-05T00:00:00.000Z');
    });
  });

  describe('calculateNextDueDate - MONTHLY & Month-End Clamping', () => {
    it('should advance by 1 month for standard mid-month dates', () => {
      const current = new Date('2026-09-15T00:00:00.000Z');
      const next = calculateNextDueDate(current, 'MONTHLY');
      expect(next.toISOString()).toBe('2026-10-15T00:00:00.000Z');
    });

    it('should clamp January 31st to February 28th in non-leap year', () => {
      const jan31 = new Date('2025-01-31T00:00:00.000Z');
      const febNext = calculateNextDueDate(jan31, 'MONTHLY');
      expect(febNext.toISOString()).toBe('2025-02-28T00:00:00.000Z');
    });

    it('should restore anchor day 31st when advancing from February 28th to March with anchorDay 31', () => {
      const feb28 = new Date('2025-02-28T00:00:00.000Z');
      const marNext = calculateNextDueDate(feb28, 'MONTHLY', 31);
      expect(marNext.toISOString()).toBe('2025-03-31T00:00:00.000Z');
    });
  });

  describe('calculateNextDueDate - YEARLY', () => {
    it('should advance by 1 year for standard dates', () => {
      const current = new Date('2026-09-10T00:00:00.000Z');
      const next = calculateNextDueDate(current, 'YEARLY');
      expect(next.toISOString()).toBe('2027-09-10T00:00:00.000Z');
    });

    it('should handle leap year Feb 29 to non-leap Feb 28', () => {
      const leapFeb29 = new Date('2028-02-29T00:00:00.000Z');
      const nextYear = calculateNextDueDate(leapFeb29, 'YEARLY');
      expect(nextYear.toISOString()).toBe('2029-02-28T00:00:00.000Z');
    });
  });

  describe('calculateReminderDate', () => {
    it('should subtract specified days from due date', () => {
      const dueDate = new Date('2026-09-10T00:00:00.000Z');
      const reminderDate = calculateReminderDate(dueDate, 3);
      expect(reminderDate.toISOString()).toBe('2026-09-07T00:00:00.000Z');
    });
  });
});
