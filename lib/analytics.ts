// Google Analytics 4 event tracking utilities

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Event tracking hook
export const useAnalytics = () => {
  const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number,
    customParameters?: Record<string, any>
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...customParameters,
      });
    }
  };

  // Predefined event tracking functions for location page buttons
  const trackLocationButtonClick = (
    buttonType: 'get_directions' | 'call_now' | 'book_appointment' | 'make_reservation' | 'view_menu' | 'order_online' | 'claim_listing' | 'submit_claim',
    name: string,
    location: string,
    additionalParams?: Record<string, any>
  ) => {
    const buttonLabels = {
      get_directions: 'Get Directions',
      call_now: 'Call Now',
      book_appointment: 'Book Appointment',
      make_reservation: 'Make Reservation',
      view_menu: 'View Menu',
      order_online: 'Order Online',
      claim_listing: 'Claim Listing',
      submit_claim: 'Submit Claim'
    };

    trackEvent(
      'button_click',
      'location_actions',
      `${buttonLabels[buttonType]} - ${name}`,
      undefined,
      {
        button_type: buttonType,
        name,
        location,
        page_type: 'location_detail',
        ...additionalParams
      }
    );
  };

  return {
    trackEvent,
    trackLocationButtonClick,
  };
};

// Direct function for server-side or non-hook usage
export const trackGAEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
  customParameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParameters,
    });
  }
}; 