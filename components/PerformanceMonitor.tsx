import Script from 'next/script'

export default function PerformanceMonitor() {
  return (
    <Script id="performance-monitor" strategy="afterInteractive">
      {`
        // Core Web Vitals monitoring
        if ('PerformanceObserver' in window) {
          // LCP (Largest Contentful Paint)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              console.log('LCP:', lastEntry.startTime);
              // Send to analytics
              if (typeof gtag !== 'undefined') {
                gtag('event', 'web_vitals', {
                  event_category: 'Web Vitals',
                  event_label: 'LCP',
                  value: Math.round(lastEntry.startTime),
                });
              }
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // FID (First Input Delay)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              console.log('FID:', entry.processingStart - entry.startTime);
              if (typeof gtag !== 'undefined') {
                gtag('event', 'web_vitals', {
                  event_category: 'Web Vitals',
                  event_label: 'FID',
                  value: Math.round(entry.processingStart - entry.startTime),
                });
              }
            });
          }).observe({ entryTypes: ['first-input'] });

          // CLS (Cumulative Layout Shift)
          let clsValue = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            console.log('CLS:', clsValue);
            if (typeof gtag !== 'undefined') {
              gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'CLS',
                value: Math.round(clsValue * 1000) / 1000,
              });
            }
          }).observe({ entryTypes: ['layout-shift'] });
        }

        // Page load time
        window.addEventListener('load', () => {
          const loadTime = performance.now();
          console.log('Page load time:', loadTime);
          if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
              name: 'load',
              value: Math.round(loadTime),
            });
          }
        });
      `}
    </Script>
  )
} 