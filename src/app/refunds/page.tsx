import Link from 'next/link'

export const metadata = {
  title: 'Refund Policy | Moonbeam Cafe',
  description: 'Refund and cancellation policy for Moonbeam Cafe orders.',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-2">Refund Policy</h1>
      <p className="text-sm text-accent mb-8">Last updated: February 8, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-primary mt-0">1. Order Cancellation</h2>
          <p>
            You may cancel your order before it enters the &quot;Preparing&quot; stage. Once
            our staff begins preparing your order, cancellations are no longer available
            through the online system. If you need to cancel an order that is already being
            prepared, please contact our staff directly at the cafe.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">2. Refund Eligibility</h2>
          <p>You may be eligible for a full or partial refund in the following situations:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Order not fulfilled:</strong> If we are unable to fulfill your order for
              any reason (e.g., item unavailability, store closure), you will receive a full
              refund.
            </li>
            <li>
              <strong>Incorrect order:</strong> If you receive an order that does not match
              what you ordered, we will either remake the order or issue a full refund.
            </li>
            <li>
              <strong>Quality issues:</strong> If your order does not meet our quality
              standards, please notify our staff within 15 minutes of pickup and we will
              remake the item or issue a refund.
            </li>
            <li>
              <strong>Duplicate charges:</strong> If you are charged more than once for the
              same order, the duplicate charge will be refunded.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">3. Non-Refundable Situations</h2>
          <p>Refunds are generally not available for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Orders not picked up within 15 minutes of being marked ready</li>
            <li>Change of mind after the order has been prepared</li>
            <li>Customizations that were correctly made as ordered</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">4. Refund Process</h2>
          <p>
            Approved refunds will be processed back to your original payment method. Please
            allow 5&ndash;10 business days for the refund to appear on your statement,
            depending on your financial institution.
          </p>
          <p>
            If your order was cancelled before payment processing completed, no charge will
            appear on your statement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">5. Rewards Stars and Refunds</h2>
          <p>
            If a refund is issued for an order, the rewards stars earned from that order will
            be deducted from your account. If stars from the refunded order have already been
            redeemed, the star balance may go negative and will be offset against future
            earnings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">6. How to Request a Refund</h2>
          <p>To request a refund, you can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Speak to our staff directly at the cafe during your visit</li>
            <li>Email us at hello@moonbeamcafe.com with your order number</li>
          </ul>
          <p>
            Please include your order number, the reason for the refund request, and any
            relevant details. We aim to respond to all refund requests within 1 business day.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary">7. Contact Us</h2>
          <p>
            If you have questions about our Refund Policy, please contact us at:
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
        <Link href="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</Link>
      </div>
    </div>
  )
}
