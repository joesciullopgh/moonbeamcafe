import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Moonbeam Cafe',
  description: 'Privacy Policy for Moonbeam Cafe — how we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-accent mb-8">Last updated: February 8, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-primary mt-0">1. Information We Collect</h2>
          <p>When you use Moonbeam Cafe&apos;s online ordering service, we collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account Information:</strong> Email address, first and last name, phone
              number, and account credentials
            </li>
            <li>
              <strong>Billing Information:</strong> Billing address (street address, city,
              state, ZIP code). Credit card details are processed securely by our third-party
              payment processor and are never stored on our servers.
            </li>
            <li>
              <strong>Order Information:</strong> Items ordered, customizations, special
              instructions, order history, and transaction amounts
            </li>
            <li>
              <strong>Rewards Data:</strong> Stars earned, redemption history, and program
              participation
            </li>
            <li>
              <strong>Usage Data:</strong> Browser type, device information, IP address, and
              how you interact with our Service
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Process payments and prevent fraud</li>
            <li>Send order status updates and notifications</li>
            <li>Manage your rewards program participation</li>
            <li>Improve our Service and customer experience</li>
            <li>Communicate important updates about your account or our Service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">3. Payment Security</h2>
          <p>
            Moonbeam Cafe takes payment security seriously. We use industry-standard
            encryption and security measures to protect your information:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              All payment processing is handled by PCI DSS-compliant third-party processors
            </li>
            <li>
              We never store, process, or transmit full credit card numbers on our servers
            </li>
            <li>All data transmission is encrypted using TLS/SSL</li>
            <li>
              Billing address information is stored securely and used only for payment
              verification and fraud prevention
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">4. Information Sharing</h2>
          <p>
            We do not sell, rent, or trade your personal information. We may share your
            information with:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Payment Processors:</strong> To process your transactions securely
            </li>
            <li>
              <strong>Service Providers:</strong> Who help us operate the Service (e.g.,
              hosting, email delivery), under strict confidentiality agreements
            </li>
            <li>
              <strong>Legal Authorities:</strong> When required by law, court order, or to
              protect our rights and safety
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">5. Data Retention</h2>
          <p>
            We retain your account and order information for as long as your account is active
            or as needed to provide services. You may request deletion of your account and
            personal data by contacting us. Some information may be retained as required by law
            or for legitimate business purposes (e.g., transaction records for tax compliance).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal data</li>
            <li>Withdraw consent for data processing</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at hello@moonbeamcafe.com.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">7. Cookies and Tracking</h2>
          <p>
            We use essential cookies to maintain your session and authentication state. We do
            not use third-party tracking cookies for advertising purposes. Analytics data is
            collected in aggregate form to improve the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">8. Children&apos;s Privacy</h2>
          <p>
            Our Service is not directed to children under 13. We do not knowingly collect
            personal information from children under 13. If you believe we have collected
            information from a child under 13, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by email or through a notice on our Service. The &quot;Last updated&quot;
            date at the top reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please
            contact us at:
          </p>
          <p>
            Moonbeam Cafe<br />
            4621 Liberty Avenue<br />
            Pittsburgh, PA 15224<br />
            hello@moonbeamcafe.com
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200 flex gap-6 text-sm">
        <Link href="/terms" className="text-primary font-medium hover:underline">Terms of Service</Link>
        <Link href="/refunds" className="text-primary font-medium hover:underline">Refund Policy</Link>
      </div>
    </div>
  )
}
