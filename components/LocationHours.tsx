'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { isBusinessOpen, getNextOpenTime, formatTime } from '@/lib/timeUtils'

interface LocationHoursProps {
  location: any
}

// Helper function to get timezone abbreviation
function getStateTimezone(state: string): string {
  const timezoneMap: { [key: string]: string } = {
    // Eastern Time
    'Alabama': 'America/New_York', 'Connecticut': 'America/New_York', 'Delaware': 'America/New_York',
    'Florida': 'America/New_York', 'Georgia': 'America/New_York', 'Indiana': 'America/New_York',
    'Kentucky': 'America/New_York', 'Maine': 'America/New_York', 'Maryland': 'America/New_York',
    'Massachusetts': 'America/New_York', 'Michigan': 'America/New_York', 'New Hampshire': 'America/New_York',
    'New Jersey': 'America/New_York', 'New York': 'America/New_York', 'North Carolina': 'America/New_York',
    'Ohio': 'America/New_York', 'Pennsylvania': 'America/New_York', 'Rhode Island': 'America/New_York',
    'South Carolina': 'America/New_York', 'Tennessee': 'America/New_York', 'Vermont': 'America/New_York',
    'Virginia': 'America/New_York', 'West Virginia': 'America/New_York',
    // Central Time
    'Arkansas': 'America/Chicago', 'Illinois': 'America/Chicago', 'Iowa': 'America/Chicago',
    'Kansas': 'America/Chicago', 'Louisiana': 'America/Chicago', 'Minnesota': 'America/Chicago',
    'Mississippi': 'America/Chicago', 'Missouri': 'America/Chicago', 'Nebraska': 'America/Chicago',
    'North Dakota': 'America/Chicago', 'Oklahoma': 'America/Chicago', 'South Dakota': 'America/Chicago',
    'Texas': 'America/Chicago', 'Wisconsin': 'America/Chicago',
    // Mountain Time
    'Arizona': 'America/Denver', 'Colorado': 'America/Denver', 'Idaho': 'America/Denver',
    'Montana': 'America/Denver', 'New Mexico': 'America/Denver', 'Utah': 'America/Denver', 'Wyoming': 'America/Denver',
    // Pacific Time
    'Alaska': 'America/Anchorage', 'California': 'America/Los_Angeles', 'Nevada': 'America/Los_Angeles',
    'Oregon': 'America/Los_Angeles', 'Washington': 'America/Los_Angeles',
    // Hawaii
    'Hawaii': 'Pacific/Honolulu',
  };
  return timezoneMap[state] || 'America/New_York';
}

function getTimezoneAbbr(state: string): string {
  const timezone = getStateTimezone(state);
  const now = new Date();
  const timeString = now.toLocaleString('en-US', { 
    timeZone: timezone,
    timeZoneName: 'short'
  });
  const match = timeString.match(/\s([A-Z]{3,4})$/);
  return match ? match[1] : '';
}

// Helper function to check if a day is open 24 hours
function isOpen24Hours(hour: any): boolean {
  if (!hour || hour.is_closed) return false;
  return (hour.open_time === '12:00 AM' && (hour.close_time === '11:59 PM' || hour.close_time === '12:00 AM'));
}

export default function LocationHours({ location }: LocationHoursProps) {
  const [openStatus, setOpenStatus] = useState<{ isOpen: boolean; nextOpen?: string; isTemporarilyClosed?: boolean }>({ isOpen: false });
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update open status and current time
  useEffect(() => {
    const updateStatus = () => {
      if (location.business_status === 'CLOSED_TEMPORARILY') {
        setOpenStatus({ isOpen: false, isTemporarilyClosed: true });
      } else {
        const newStatus = isBusinessOpen(location.location_hours || [], location.state);
        const nextOpen = getNextOpenTime(location.location_hours || [], location.state);
        setOpenStatus({ ...newStatus, nextOpen: nextOpen || undefined, isTemporarilyClosed: false });
      }
      
      const now = new Date();
      const timezone = getStateTimezone(location.state);
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: timezone 
      }));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, [location.location_hours, location.state, location.business_status]);

  return (
    <div className="mt-4 mb-4">
      {(!location.location_hours || location.location_hours.length === 0) ? (
        // No hours - assume open 24 hours
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-green-700">Open 24 hours</div>
            <div className="text-xs text-gray-500">
              Current Local Time: {currentTime} {getTimezoneAbbr(location.state)}
            </div>
          </div>
        </div>
      ) : (
        // Has hours - show status and hours list
        <>
          <div className="flex items-start space-x-2 mb-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
              openStatus.isTemporarilyClosed
                ? 'bg-red-100 text-red-600'
                : openStatus.isOpen 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
            }`}>
              {openStatus.isTemporarilyClosed ? (
                <XCircle className="h-4 w-4" />
              ) : openStatus.isOpen ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                {openStatus.isTemporarilyClosed ? 'Temporarily Closed' : (
                  openStatus.isOpen ? <span className="text-green-700">Open Now</span> : (
                    !openStatus.isOpen && !openStatus.isTemporarilyClosed && openStatus.nextOpen 
                      ? <span><span className="text-red-700">Closed</span> • Opens {openStatus.nextOpen}</span>
                      : <span className="text-red-700">Closed</span>
                  )
                )}
              </div>
              <div className="text-xs text-gray-500">
                Current Local Time: {currentTime} {getTimezoneAbbr(location.state)}
              </div>
            </div>
          </div>
          
          {/* Compact Hours List - only show if not all days are 24 hours */}
          {(() => {
            const allDays24Hours = location.location_hours?.every((h: any) => 
              !h.is_closed && isOpen24Hours(h)
            );
            
            if (!allDays24Hours) {
              return (
                <div className="space-y-1">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
                    const dayNum = idx + 1;
                    const h = location.location_hours?.find((hh: any) => hh.day_of_week === dayNum);
                    const now = new Date();
                    const timezone = getStateTimezone(location.state);
                    const businessTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
                    const currentDay = businessTime.getDay();
                    const dayOfWeek = currentDay === 0 ? 7 : currentDay;
                    const isToday = dayNum === dayOfWeek;
                    
                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between py-1 px-2 rounded text-xs ${
                          isToday 
                            ? 'bg-primary text-white font-medium' 
                            : 'text-gray-700'
                        }`}
                      >
                        <span className={isToday ? 'text-white' : 'text-gray-600'}>
                          {day.slice(0, 3)}
                          {isToday && <span className="ml-1 text-white/80">• Today</span>}
                        </span>
                        <span className={isToday ? 'text-white' : 'text-gray-700'}>
                          {!h || h.is_closed ? (
                            <span className={isToday ? 'text-red-200' : 'text-red-600'}>Closed</span>
                          ) : (
                            isOpen24Hours(h)
                              ? '24h'
                              : `${formatTime(h.open_time)}-${formatTime(h.close_time)}`
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  )
} 