import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Moonbeam Cafe',
  description: 'Terms of Service for Moonbeam Cafe online ordering and rewards program.',
}

export default function TermsPage() {
  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-2">Terms of Service</h1>
      <p className="text-sm text-accent mb-8">Last updated: February 8, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-primary mt-0">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Moonbeam Cafe website and online ordering platform
            (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not
            agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">2. Account Registration</h2>
          <p>
            To place orders, you must create an account with a valid email address. You are
            responsible for maintaining the confidentiality of your account credentials and for
            all activities that occur under your account. You must provide accurate, current,
            and complete information during registration, including your legal name, phone
            number, and billing address.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">3. Orders and Payment</h2>
          <p>
            All orders placed through the Service are subject to acceptance by Moonbeam Cafe.
            We reserve the right to refuse or cancel any order for any reason, including but
            not limited to product availability, errors in pricing, or suspected fraudulent
            activity.
          </p>
          <p>
            Payment is required at the time of ordering. By providing your payment information,
            you authorize Moonbeam Cafe to charge the total amount shown at checkout, including
            applicable taxes. All prices are listed in US dollars.
          </p>
          <p>
            You agree that the billing information you provide is accurate and that you are
            authorized to use the payment method submitted. Moonbeam Cafe uses third-party
            payment processors and does not store your full credit card information on our
            servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">4. Order Pickup</h2>
          <p>
            Orders are prepared for pickup at our location at 4621 Liberty Avenue, Pittsburgh,
            PA. You will receive a notification when your order is ready. Orders not picked up
            within 15 minutes of being marked ready may be considered completed and are not
            eligible for a refund.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">5. Rewards Program</h2>
          <p>
            Moonbeam Cafe offers a rewards program where customers earn stars based on their
            purchases. Stars are earned at a rate of 1 star per dollar spent (rounded down).
            Stars have no cash value and cannot be transferred between accounts. Moonbeam Cafe
            reserves the right to modify, suspend, or terminate the rewards program at any time
            with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">6. Cancellations and Refunds</h2>
          <p>
            Please see our{' '}
            <Link href="/refunds" className="text-primary underline font-medium">
              Refund Policy
            </Link>{' '}
            for details on order cancellations and refunds.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">7. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Provide false or misleading information</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Use the Service to transmit harmful or malicious content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">8. Intellectual Property</h2>
          <p>
            All content on the Service, including text, graphics, logos, and images, is the
            property of Moonbeam Cafe and is protected by applicable intellectual property
            laws. You may not reproduce, distribute, or create derivative works without our
            prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">9. Limitation of Liability</h2>
          <p>
            Moonbeam Cafe shall not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of the Service. Our total liability
            for any claim related to the Service shall not exceed the amount you paid for the
            specific order giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">10. Changes to Terms</h2>
          <p>
            We may update these Terms of Service from time to time. We will notify registered
            users of material changes via email or through the Service. Your continued use of
            the Service after changes are posted constitutes your acceptance of the updated
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">11. Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, please contact us at:
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
        <Link href="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</Link>
        <Link href="/refunds" className="text-primary font-medium hover:underline">Refund Policy</Link>
      </div>
    </div>
  )
}
