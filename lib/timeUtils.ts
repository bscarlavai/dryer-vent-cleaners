// Utility functions for time and business hours

export interface BusinessHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// Get timezone for a state (simplified mapping)
function getStateTimezone(state: string): string {
  const timezoneMap: { [key: string]: string } = {
    // Eastern Time
    'Alabama': 'America/New_York',
    'Connecticut': 'America/New_York',
    'Delaware': 'America/New_York',
    'Florida': 'America/New_York', // Most of FL is Eastern
    'Georgia': 'America/New_York',
    'Indiana': 'America/New_York', // Most of IN is Eastern
    'Kentucky': 'America/New_York', // Most of KY is Eastern
    'Maine': 'America/New_York',
    'Maryland': 'America/New_York',
    'Massachusetts': 'America/New_York',
    'Michigan': 'America/New_York', // Most of MI is Eastern
    'New Hampshire': 'America/New_York',
    'New Jersey': 'America/New_York',
    'New York': 'America/New_York',
    'North Carolina': 'America/New_York',
    'Ohio': 'America/New_York',
    'Pennsylvania': 'America/New_York',
    'Rhode Island': 'America/New_York',
    'South Carolina': 'America/New_York',
    'Tennessee': 'America/New_York', // Most of TN is Eastern
    'Vermont': 'America/New_York',
    'Virginia': 'America/New_York',
    'West Virginia': 'America/New_York',

    // Central Time
    'Arkansas': 'America/Chicago',
    'Illinois': 'America/Chicago',
    'Iowa': 'America/Chicago',
    'Kansas': 'America/Chicago', // Most of KS is Central
    'Louisiana': 'America/Chicago',
    'Minnesota': 'America/Chicago',
    'Mississippi': 'America/Chicago',
    'Missouri': 'America/Chicago',
    'Nebraska': 'America/Chicago', // Most of NE is Central
    'North Dakota': 'America/Chicago', // Most of ND is Central
    'Oklahoma': 'America/Chicago',
    'South Dakota': 'America/Chicago', // Most of SD is Central
    'Texas': 'America/Chicago', // Most of TX is Central
    'Wisconsin': 'America/Chicago',

    // Mountain Time
    'Arizona': 'America/Denver',
    'Colorado': 'America/Denver',
    'Idaho': 'America/Denver', // Most of ID is Mountain
    'Montana': 'America/Denver',
    'New Mexico': 'America/Denver',
    'Utah': 'America/Denver',
    'Wyoming': 'America/Denver',

    // Pacific Time
    'Alaska': 'America/Anchorage', // Most of AK is Alaska Time
    'California': 'America/Los_Angeles',
    'Nevada': 'America/Los_Angeles',
    'Oregon': 'America/Los_Angeles',
    'Washington': 'America/Los_Angeles',

    // Hawaii
    'Hawaii': 'Pacific/Honolulu',
  };

  return timezoneMap[state] || 'America/New_York'; // Default to Eastern
}

// Convert 12-hour time string to minutes since midnight
function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  
  // Handle formats like "10:30 AM" or "6:00 PM"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}

// Check if business is currently open
export function isBusinessOpen(hours: BusinessHour[], state: string): { isOpen: boolean; nextOpen?: string } {
  if (!hours || hours.length === 0) {
    return { isOpen: false };
  }

  try {
    // Get current time in the business's timezone
    const timezone = getStateTimezone(state);
    const now = new Date();
    
    // Convert to business timezone
    const businessTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentDay = businessTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentMinutes = businessTime.getHours() * 60 + businessTime.getMinutes();
    
    // Find today's hours (convert Sunday = 0 to our format where Monday = 1)
    const dayOfWeek = currentDay === 0 ? 7 : currentDay;
    const todayHours = hours.find(h => h.day_of_week === dayOfWeek);

    // Get yesterday's hours
    const prevDayOfWeek = dayOfWeek === 1 ? 7 : dayOfWeek - 1;
    const prevDayHours = hours.find(h => h.day_of_week === prevDayOfWeek);
    if (prevDayHours && !prevDayHours.is_closed) {
      const prevOpen = timeStringToMinutes(prevDayHours.open_time);
      const prevClose = timeStringToMinutes(prevDayHours.close_time);
      // If previous day is overnight (close < open) and current time is before close
      if (prevClose < prevOpen && currentMinutes < prevClose) {
        return { isOpen: true };
      }
    }

    if (!todayHours || todayHours.is_closed) {
      return { isOpen: false };
    }
    
    const openMinutes = timeStringToMinutes(todayHours.open_time);
    const closeMinutes = timeStringToMinutes(todayHours.close_time);
    
    // Handle overnight hours (e.g., open until 2 AM)
    if (closeMinutes < openMinutes) {
      // Business is open overnight
      if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
        return { isOpen: true };
      }
    } else {
      // Normal hours
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return { isOpen: true };
      }
    }
    
    return { isOpen: false };
  } catch (error) {
    console.error('Error checking business hours:', error);
    return { isOpen: false };
  }
}

// Get next open time
export function getNextOpenTime(hours: BusinessHour[], state: string): string | null {
  if (!hours || hours.length === 0) return null;

  try {
    const timezone = getStateTimezone(state);
    const now = new Date();
    const businessTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentDay = businessTime.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayOfWeek = currentDay === 0 ? 7 : currentDay; // 1=Monday, ..., 7=Sunday
    const currentMinutes = businessTime.getHours() * 60 + businessTime.getMinutes();
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const todayHours = hours.find(h => h.day_of_week === dayOfWeek && !h.is_closed);
    if (todayHours) {
      const openMinutes = timeStringToMinutes(todayHours.open_time);
      if (currentMinutes < openMinutes) {
        return `Today at ${formatTime(todayHours.open_time)}`;
      }
    }

    for (let i = 1; i <= 7; i++) {
      const checkDay = ((dayOfWeek + i - 1) % 7) + 1;
      if (checkDay === dayOfWeek) continue;
      const dayHours = hours.find(h => h.day_of_week === checkDay && !h.is_closed);
      if (dayHours) {
        const dayName = dayNames[checkDay - 1];
        return `${dayName} at ${formatTime(dayHours.open_time)}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting next open time:', error);
    return null;
  }
}

// Helper function to remove leading zeros from 12-hour time strings
export function formatTime(time: string): string {
  if (!time) return '';
  // Remove leading zeros from hour part (e.g., "09:00 PM" -> "9:00 PM")
  return time.replace(/^0(\d:)/, '$1');
}

// Convert 24-hour time string (e.g. '18:00:00') to 12-hour time (e.g. '6:00 PM')
export function to12Hour(time: string): string {
  if (!time) return '';
  // Accepts 'HH:MM:SS' or 'HH:MM'
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const minute = m ? parseInt(m, 10) : 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
}

// Format hours for display
export function formatHours(hours: BusinessHour[]): Array<{
  day: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}> {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return hours
    .map(hour => ({
      day: dayNames[hour.day_of_week - 1],
      isClosed: hour.is_closed,
      openTime: hour.is_closed ? '' : hour.open_time,
      closeTime: hour.is_closed ? '' : hour.close_time
    }))
    .sort((a, b) => dayNames.indexOf(a.day) - dayNames.indexOf(b.day));
}
