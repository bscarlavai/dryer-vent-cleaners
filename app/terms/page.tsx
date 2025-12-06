import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { generateSocialPreview } from '@/components/SocialPreview'

export const metadata: Metadata = generateSocialPreview({
  title: 'Terms of Service - Dryer Vent Cleaners',
  description: 'Terms of service and usage guidelines for Dryer Vent Cleaners.',
})

export default function TermsPage() {
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

        {/* Terms of Service Content */}
        <div className="bg-primary-light-100 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Effective Date:</strong> January 1, 2025
            </p>
            <p className="text-gray-700 mb-6">
              Welcome to Dryer Vent Cleaners ("we," "our," or "us"). By accessing or using our website, you agree to be bound by the following Terms of Service. If you do not agree to these terms, please do not use our site.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Use of Our Website</h2>
            <p className="text-gray-700 mb-2">
              Our website is intended to help users find and explore dryer vent cleaning services across the United States. By using the site, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li>Use the site only for lawful and non-commercial purposes</li>
              <li>Not interfere with the website’s operation or security</li>
              <li>Not submit false, misleading, abusive, or harmful content</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We reserve the right to block or restrict access to users who violate these terms.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Accuracy of Information</h2>
            <p className="text-gray-700 mb-6">
              We strive to provide accurate and up-to-date information. However, business listings—including hours, services, pricing, and location details—are subject to change and may not always be current. We do not guarantee the accuracy or reliability of any listing on the site.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User-Generated Content</h2>
            <p className="text-gray-700 mb-2">
              You may submit reviews, feedback, or other content through our website. By doing so, you agree:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li>Your submission is truthful and based on your own experience</li>
              <li>You grant us a non-exclusive, royalty-free license to display, publish, and moderate your content</li>
              <li>We may edit, reject, or remove submissions at our sole discretion, especially if they violate our content standards or appear to be spam or abuse</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We are not responsible for the opinions or statements expressed in user-submitted content.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. External Links</h2>
            <p className="text-gray-700 mb-6">
              Our website may contain links to third-party websites or services. These external sites are not under our control, and we are not responsible for their content, practices, or availability. Visiting any external site is at your own risk.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 mb-6">
              All content on this site—including but not limited to text, design, layout, graphics, and logos—is owned by Dryer Vent Cleaners unless otherwise stated. You may not copy, reproduce, distribute, or republish any portion of the site without our prior written permission.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 mb-2">
              We are not liable for any direct, indirect, incidental, or consequential damages resulting from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-2">
              <li>The use or inability to use our site</li>
              <li>Errors or omissions in listings</li>
              <li>Issues with third-party businesses featured on the site</li>
              <li>Content submitted by users</li>
            </ul>
            <p className="text-gray-700 mb-6">
              Your use of the site is at your own discretion and risk.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to These Terms</h2>
            <p className="text-gray-700 mb-6">
              We may update these Terms of Service from time to time. Any changes will be posted on this page with a revised "Effective Date." Your continued use of the website after changes are made constitutes acceptance of the new terms.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Termination</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to suspend or terminate access to our website at any time, without notice, for violations of these terms or if we believe it is necessary to protect the site or its users.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Information</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-gray-700 mb-6">
              <span role="img" aria-label="email">📧</span> hello@dryerventcleaners.co
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 