import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { generateSocialPreview } from '@/components/SocialPreview'

export const metadata: Metadata = generateSocialPreview({
  title: 'Privacy Policy - Dojangs',
  description: 'Learn how Dojangs protects your privacy and handles your data.',
})

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Navigation */}
        <nav className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </nav>

        {/* Privacy Policy Content */}
        <div className="bg-primary-light-100 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Effective Date:</strong> January 1, 2025
            </p>
            <p className="text-gray-700 mb-6">
              Welcome to Dojangs ("we," "our," or "us"). By using our website, you agree to be bound by this Privacy Policy. If you do not agree to this policy, please do not use our site.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-2">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li><strong>Information you provide directly:</strong> This includes search inputs, reviews, feedback, and any optional fields such as name, email address, city, and state.</li>
              <li><strong>Information collected automatically:</strong> When you use our site, we automatically collect technical information such as your IP address, browser type, device information, referring URLs, and pages visited.</li>
              <li><strong>Metadata associated with submissions:</strong> For review and feedback forms, we may also collect your IP address and browser user agent to help detect and prevent spam or abuse.</li>
            </ul>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li>Provide, maintain, and improve our website and services</li>
              <li>Display user-submitted reviews and feedback (with optional attribution)</li>
              <li>Prevent spam, fraud, and abuse</li>
              <li>Communicate with you, including sending optional verification emails</li>
              <li>Analyze and understand how our site is used</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We do not sell your personal information to third parties.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 mb-2">
              We do not share your personal information with third parties except in the following situations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li>With service providers who help us operate and maintain our site (e.g., hosting or email delivery)</li>
              <li>With advertising partners (such as Ezoic) who display advertisements on our website as described in Section 6</li>
              <li>When required by law or legal process</li>
              <li>When you give us explicit consent (e.g., to publish your name with a review)</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We do not sell your personal information to third parties for their direct marketing purposes.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Retention & Security</h2>
            <p className="text-gray-700 mb-6">
              We retain user-submitted reviews and associated data for as long as necessary to operate the website. We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-2">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li>Maintain your browsing session</li>
              <li>Understand how visitors use our site</li>
              <li>Improve the overall user experience</li>
            </ul>
            <p className="text-gray-700 mb-6">
              You can adjust cookie preferences through your browser settings. This includes cookies used by our advertising partners described below.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Advertising and Third-Party Partners (Ezoic Services)</h2>
            <p className="text-gray-700 mb-4">
              This website uses the services of Ezoic Inc. ("Ezoic"), including to manage third-party interest-based advertising. Ezoic may employ a variety of technologies on this website, including tools to serve content, display advertisements and enable advertising to visitors of this website, which may utilize first and third-party cookies.
            </p>
            <p className="text-gray-700 mb-4">
              A cookie is a small text file sent to your device by a web server that enables the website to remember information about your browsing activity. First-party cookies are created by the site you are visiting, while third-party cookies are set by domains other than the one you're visiting. Ezoic and our partners may place third-party cookies, tags, beacons, pixels, and similar technologies to monitor interactions with advertisements and optimize ad targeting.
            </p>
            <p className="text-gray-700 mb-4">
              Please note that disabling cookies may limit access to certain content and features on the website, and rejecting cookies does not eliminate advertisements but will result in non-personalized advertising. You can find more information about cookies and how to manage them at <a href="https://allaboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">All About Cookies</a>.
            </p>
            <p className="text-gray-700 mb-2">
              The following information may be collected, used, and stored in a cookie when serving personalized ads:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>IP address</li>
              <li>Operating system type and version</li>
              <li>Device type</li>
              <li>Language preferences</li>
              <li>Web browser type</li>
              <li>Email (in a hashed or encrypted form)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Ezoic and its partners may use this data in combination with information that has been independently collected to deliver targeted advertisements across various platforms and websites. Ezoic's partners may also gather additional data, such as unique IDs, advertising IDs, geolocation data, usage data, device information, traffic data, referral sources, and interactions between users and websites or advertisements, to create audience segments for targeted advertising across different devices, browsers, and apps.
            </p>
            <p className="text-gray-700 mb-6">
              You can view Ezoic's privacy policy at <a href="https://ezoic.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ezoic.com/privacy</a>. For additional information about Ezoic's advertising partners, you can view their advertising partners list at <a href="https://www.ezoic.com/privacy-policy/advertising-partners/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ezoic.com/privacy-policy/advertising-partners</a>. To learn more about interest-based advertising and how to manage your choices, visit <a href="https://youradchoices.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Your Ad Choices</a>.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. User Rights and Control</h2>
            <p className="text-gray-700 mb-2">
              You may:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li>Request deletion of any review or feedback you've submitted</li>
              <li>Request removal of your email or personal information</li>
              <li>Decline to provide an email address or other identifying information when submitting content</li>
            </ul>
            <p className="text-gray-700 mb-6">
              To make a request, email us at hello@dojangs.com.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 mb-6">
              Our website may contain links to external websites or embedded services (e.g., Google Maps). These services operate under their own privacy policies. We encourage you to review them before interacting.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-6">
              Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Effective Date."
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have questions or requests related to this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-700 mb-6">
              <span role="img" aria-label="email">📧</span> hello@dojangs.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 