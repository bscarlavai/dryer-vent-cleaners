import { getNextOpenTime, isBusinessOpen } from './timeUtils';
import MockDate from 'mockdate';

describe('getNextOpenTime', () => {
  const state = 'Florida';

  afterEach(() => {
    MockDate.reset();
  });

  it('returns next open day when today is closed', () => {
    // Today is Saturday (6), closed; Sunday is open at 10:00 AM
    const hours = [
      { day_of_week: 1, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false }, // Monday
      { day_of_week: 2, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false }, // Tuesday
      { day_of_week: 3, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false }, // Wednesday
      { day_of_week: 4, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false }, // Thursday
      { day_of_week: 5, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false }, // Friday
      { day_of_week: 6, open_time: '', close_time: '', is_closed: true }, // Saturday (today)
      { day_of_week: 7, open_time: '10:00 AM', close_time: '04:00 PM', is_closed: false }, // Sunday
    ];
    // Mock Date to Saturday 6:00 PM Eastern Time
    MockDate.set('2023-06-17T18:00:00-04:00');
    expect(getNextOpenTime(hours, state)).toBe('Sunday at 10:00 AM');
  });

  it('returns Today if today is open and opens later', () => {
    // Today is Monday (1), opens at 11:00 AM, now is 9:00 AM
    const hours = [
      { day_of_week: 1, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 2, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 3, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 4, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 5, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 6, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 7, open_time: '10:00 AM', close_time: '04:00 PM', is_closed: false },
    ];
    MockDate.set('2023-06-12T09:00:00-04:00');
    expect(getNextOpenTime(hours, state)).toBe('Today at 11:00 AM');
  });

  it('returns next open day if today is open but already closed', () => {
    // Today is Monday (1), opens at 11:00 AM, now is 6:00 PM (after close)
    const hours = [
      { day_of_week: 1, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 2, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 3, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 4, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 5, open_time: '11:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 6, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 7, open_time: '10:00 AM', close_time: '04:00 PM', is_closed: false },
    ];
    MockDate.set('2023-06-12T18:00:00-04:00');
    expect(getNextOpenTime(hours, state)).toBe('Tuesday at 11:00 AM');
  });

  it('returns null if all days are closed', () => {
    const hours = [
      { day_of_week: 1, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 2, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 3, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 4, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 5, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 6, open_time: '', close_time: '', is_closed: true },
      { day_of_week: 7, open_time: '', close_time: '', is_closed: true },
    ];
    MockDate.set('2023-06-12T09:00:00-04:00');
    expect(getNextOpenTime(hours, state)).toBeNull();
  });

  it('returns next open day if open every day', () => {
    const hours = [
      { day_of_week: 1, open_time: '09:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 2, open_time: '09:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 3, open_time: '09:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 4, open_time: '09:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 5, open_time: '09:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 6, open_time: '09:00 AM', close_time: '05:00 PM', is_closed: false },
      { day_of_week: 7, open_time: '09:00 AM', close_time: '05:00 PM', is_closed: false },
    ];
    MockDate.set('2023-06-12T18:00:00-04:00');
    expect(getNextOpenTime(hours, state)).toBe('Tuesday at 09:00 AM');
  });
});

describe('isBusinessOpen', () => {
  const state = 'Florida';
  afterEach(() => {
    MockDate.reset();
  });

  it('returns true for overnight hours when checked after midnight', () => {
    // Wednesday: open 1:11 PM, close 3:00 AM (overnight)
    // Check at Thursday 12:05 AM (should be open)
    const hours = [
      { day_of_week: 3, open_time: '1:11 PM', close_time: '3:00 AM', is_closed: false }, // Wednesday
      { day_of_week: 4, open_time: '1:11 PM', close_time: '3:00 AM', is_closed: false }, // Thursday
    ];
    // Mock Date to Thursday 12:05 AM Eastern Time
    MockDate.set('2023-06-15T00:05:00-04:00'); // Thursday
    expect(isBusinessOpen(hours, state).isOpen).toBe(true);
  });

  it('returns false for overnight hours after close', () => {
    // Wednesday: open 1:11 PM, close 3:00 AM (overnight)
    // Check at Thursday 3:05 AM (should be closed)
    const hours = [
      { day_of_week: 3, open_time: '1:11 PM', close_time: '3:00 AM', is_closed: false }, // Wednesday
      { day_of_week: 4, open_time: '1:11 PM', close_time: '3:00 AM', is_closed: false }, // Thursday
    ];
    // Mock Date to Thursday 3:05 AM Eastern Time
    MockDate.set('2023-06-15T03:05:00-04:00'); // Thursday
    expect(isBusinessOpen(hours, state).isOpen).toBe(false);
  });
}); 