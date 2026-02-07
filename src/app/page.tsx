'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useStoreSettings } from '@/stores/store-settings'

export default function Home() {
  const { settings } = useStoreSettings()

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary leading-tight">
                Start Your Day<br />
                <span className="text-white">with Moonbeam</span>
              </h1>
              <p className="mt-6 text-lg text-secondary/80 max-w-lg">
                {settings.tagline}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/menu"
                  className="bg-secondary text-primary px-8 py-3 rounded-full font-semibold text-lg hover:bg-secondary-dark transition-colors text-center"
                >
                  View Menu
                </Link>
                <Link
                  href="/menu"
                  className="border-2 border-secondary text-secondary px-8 py-3 rounded-full font-semibold text-lg hover:bg-secondary hover:text-primary transition-colors text-center"
                >
                  Order Now
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/logo.svg"
                alt={settings.store_name}
                width={280}
                height={280}
                className="drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">
            Why Moonbeam?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Fresh Every Morning"
              description="Our beans are roasted locally and our pastries baked fresh daily. Quality you can taste in every sip."
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              title="Made with Love"
              description="Every drink is handcrafted by our skilled baristas with care and attention to detail."
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              title="Earn Rewards"
              description="Join our loyalty program and earn stars with every purchase. Free drinks and exclusive perks await!"
            />
          </div>
        </div>
      </section>

      {/* Signature Drinks Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-4">
            Our Signature Creations
          </h2>
          <p className="text-center text-accent mb-12 max-w-2xl mx-auto">
            Unique drinks you&apos;ll only find at {settings.store_name}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DrinkCard
              name="Moonbeam Signature Latte"
              price="$5.75"
              description="Lavender, vanilla, espresso, and oat milk"
            />
            <DrinkCard
              name="Honey Cinnamon Latte"
              price="$5.50"
              description="Local honey, cinnamon, espresso, and steamed milk"
            />
            <DrinkCard
              name="Rose Cardamom Latte"
              price="$5.75"
              description="Rose water, cardamom, espresso, and steamed milk"
            />
          </div>
          <div className="text-center mt-10">
            <Link
              href="/menu"
              className="inline-block bg-primary text-secondary px-8 py-3 rounded-full font-semibold hover:bg-primary-light transition-colors"
            >
              See Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">
                Find Us in Bloomfield
              </h2>
              <div className="space-y-4 text-text-dark">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">{settings.address_line1}</p>
                    <p className="text-sm text-accent">{settings.address_line2}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="font-medium hover:text-accent transition-colors">
                      {settings.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">{settings.hours_weekday}</p>
                    <p className="font-medium">{settings.hours_weekend}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-primary rounded-2xl p-8 text-center">
              <Image
                src="/logo.svg"
                alt={settings.store_name}
                width={160}
                height={160}
                className="mx-auto mb-6"
              />
              <p className="text-secondary text-lg font-medium mb-4">
                Join our rewards program!
              </p>
              <p className="text-secondary/70 text-sm mb-6">
                Earn stars with every purchase and unlock free drinks, birthday rewards, and more.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-secondary text-primary px-6 py-3 rounded-full font-semibold hover:bg-secondary-dark transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-accent text-sm">{description}</p>
    </div>
  )
}

function DrinkCard({ name, price, description }: { name: string; price: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary-dark/30 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-primary">{name}</h3>
        <span className="text-accent font-bold">{price}</span>
      </div>
      <p className="text-accent text-sm">{description}</p>
    </div>
  )
}
