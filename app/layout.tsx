import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/StructuredData'
import PerformanceMonitor from "@/components/PerformanceMonitor";
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Find Taekwondo Schools | Dojangs Nationwide',
    description: 'Find the best taekwondo schools and classes across the U.S. Compare programs, hours, and ratings. Discover top-rated taekwondo dojangs near you with classes for all ages and skill levels.',
    keywords: 'taekwondo near me, taekwondo classes near me, taekwondo schools near me, martial arts schools, tkd classes',
    authors: [{ name: 'Dojangs' }],
    creator: 'Dojangs',
    publisher: 'Dojangs',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://www.dojangs.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://www.dojangs.com',
      title: 'Find Taekwondo Schools | Dojangs Nationwide',
      siteName: 'Dojangs',
      images: [
        {
          url: 'https://www.dojangs.com/dojangs.png',
          width: 1200,
          height: 630,
          alt: 'Find Taekwondo Schools | Dojangs Nationwide',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Find Taekwondo Schools | Dojangs Nationwide',
      description: 'Discover taekwondo schools and martial arts classes near you.',
      images: ['https://www.dojangs.com/dojangs.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: 'https://www.dojangs.com',
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
      yahoo: 'your-yahoo-verification-code',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const GA_MEASUREMENT_ID = 'G-MX6CGQHPNF';
  const gtagScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `;

  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-5252536857456617" />
        <WebsiteStructuredData />
        <OrganizationStructuredData />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="icon" type="image/svg+xml" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <PerformanceMonitor />
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {gtagScript}
        </Script>
        {/* Ezoic Privacy Scripts - Load First */}
        <Script
          src="https://cmp.gatekeeperconsent.com/min.js"
          strategy="beforeInteractive"
          data-cfasync="false"
        />
        <Script
          src="https://the.gatekeeperconsent.com/cmp.min.js"
          strategy="beforeInteractive"
          data-cfasync="false"
        />
        {/* Ezoic Main Script */}
        <Script
          src="https://www.ezojs.com/ezoic/sa.min.js"
          strategy="beforeInteractive"
        />
        {/* Ezoic Initialization */}
        <Script id="ezoic-init" strategy="beforeInteractive">
          {`
            window.ezstandalone = window.ezstandalone || {};
            ezstandalone.cmd = ezstandalone.cmd || [];
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header/>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 