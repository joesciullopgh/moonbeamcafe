'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useStoreSettings } from '@/stores/store-settings'
import type { MenuItem } from '@/lib/types/database'

const SIGNATURE_NAMES = [
  'Moonbeam Signature Latte',
  'Honey Cinnamon Latte',
  'Brown Sugar Oat Latte',
  'Lavender Mocha',
  'Rose Cardamom Latte',
  'Maple Pecan Latte',
]

const SIGNATURE_FALLBACKS: Pick<MenuItem, 'name' | 'price' | 'description' | 'image_url'>[] = [
  { name: 'Moonbeam Signature Latte', price: 5.75, description: 'Lavender, vanilla, espresso, and oat milk', image_url: null },
  { name: 'Honey Cinnamon Latte', price: 5.50, description: 'Local honey, cinnamon, espresso, and steamed milk', image_url: null },
  { name: 'Brown Sugar Oat Latte', price: 5.75, description: 'Brown sugar syrup, espresso, and oat milk', image_url: null },
  { name: 'Lavender Mocha', price: 5.75, description: 'Lavender, chocolate, espresso, and steamed milk', image_url: null },
  { name: 'Rose Cardamom Latte', price: 5.75, description: 'Rose water, cardamom, espresso, and steamed milk', image_url: null },
  { name: 'Maple Pecan Latte', price: 5.75, description: 'Maple syrup, pecan, espresso, and steamed milk', image_url: null },
]

// Curated coffee shop photos for the gallery
const GALLERY_PHOTOS = [
  { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop', alt: 'Latte art from above' },
  { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=600&fit=crop', alt: 'Coffee with latte art' },
  { src: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=600&h=600&fit=crop', alt: 'Fresh baked croissants' },
  { src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=600&fit=crop', alt: 'Cozy cafe interior' },
  { src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=600&fit=crop', alt: 'Coffee beans close up' },
  { src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=600&h=600&fit=crop', alt: 'Espresso being pulled' },
  { src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=600&fit=crop', alt: 'Sunny cafe atmosphere' },
  { src: 'https://images.unsplash.com/photo-1534687941688-651ccaafbff8?w=600&h=600&fit=crop', alt: 'Iced coffee drink' },
]

export default function Home() {
  const { settings } = useStoreSettings()
  const [signatureDrinks, setSignatureDrinks] = useState<Pick<MenuItem, 'name' | 'price' | 'description' | 'image_url'>[]>(SIGNATURE_FALLBACKS)
  const [currentSlide, setCurrentSlide] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchSignature() {
      const { data } = await supabase
        .from('menu_items')
        .select('name, price, description, image_url')
        .in('name', SIGNATURE_NAMES)
        .eq('is_available', true)
      if (data && data.length > 0) {
        setSignatureDrinks(data)
      }
    }
    fetchSignature()
  }, [supabase])

  // Auto-advance gallery carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % GALLERY_PHOTOS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  return (
    <div>
      {/* Hero Section — full-bleed photo background */}
      <section className="relative h-[85vh] min-h-[500px] max-h-[800px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1600&h=900&fit=crop"
          alt="Warm cafe atmosphere"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/80" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <Image
            src="/logo.svg"
            alt=""
            width={80}
            height={80}
            className="mb-6 drop-shadow-lg"
            aria-hidden="true"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-secondary leading-tight max-w-4xl">
            Your Neighborhood
            <br />
            <span className="text-white">Coffee Shop</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-secondary/90 max-w-xl">
            {settings.tagline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/menu"
              className="bg-secondary text-primary px-10 py-4 rounded-full font-semibold text-lg hover:bg-secondary-dark transition-colors shadow-lg"
            >
              Order Now
            </Link>
            <Link
              href="/menu"
              className="border-2 border-secondary/80 text-secondary px-10 py-4 rounded-full font-semibold text-lg hover:bg-secondary hover:text-primary transition-colors"
            >
              View Menu
            </Link>
          </div>
          {/* Scroll hint */}
          <div className="absolute bottom-8 animate-bounce">
            <svg className="w-6 h-6 text-secondary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* What Makes Us Special */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full text-primary mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Handcrafted with Care</h3>
              <p className="text-accent text-sm leading-relaxed">
                Every drink is made to order by our skilled baristas using organic ingredients and house-made syrups.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full text-primary mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Community Hub</h3>
              <p className="text-accent text-sm leading-relaxed">
                More than a cafe &mdash; we&apos;re a gathering place for neighbors, creators, and friends.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full text-primary mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Earn Rewards</h3>
              <p className="text-accent text-sm leading-relaxed">
                Join our loyalty program &mdash; earn stars with every purchase and unlock free drinks and perks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Carousel — Instagram-inspired */}
      <section className="py-16 sm:py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              From Our Shop
            </h2>
            <p className="text-accent max-w-lg mx-auto">
              A glimpse into the everyday magic at {settings.store_name}
            </p>
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={GALLERY_PHOTOS[currentSlide].src}
                alt={GALLERY_PHOTOS[currentSlide].alt}
                fill
                className="object-cover transition-opacity duration-500"
                sizes="(max-width: 768px) 100vw"
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {GALLERY_PHOTOS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentSlide ? 'bg-primary w-6' : 'bg-primary/30'
                  }`}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-4 gap-3">
            {GALLERY_PHOTOS.map((photo, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1280px) 25vw, 300px"
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300" />
              </div>
            ))}
          </div>

          {/* Follow CTA */}
          {settings.instagram_url && (
            <div className="text-center mt-8">
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-light transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Follow us on Instagram
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Signature Drinks Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              Our Signature Creations
            </h2>
            <p className="text-accent max-w-2xl mx-auto">
              Unique, handcrafted drinks you&apos;ll only find at {settings.store_name} &mdash; made with house-made syrups and organic ingredients
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {signatureDrinks.map((drink) => (
              <DrinkCard
                key={drink.name}
                name={drink.name}
                price={`$${drink.price.toFixed(2)}`}
                description={drink.description}
                imageUrl={drink.image_url}
              />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/menu"
              className="inline-block bg-primary text-secondary px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-primary-light transition-colors shadow-md"
            >
              See Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* About / Story Section */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Photo side */}
          <div className="relative h-80 md:h-auto md:min-h-[500px]">
            <Image
              src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop"
              alt="Inside the cafe"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Text side */}
          <div className="bg-primary flex items-center">
            <div className="px-8 sm:px-12 lg:px-16 py-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-6">
                More Than Just Coffee
              </h2>
              <div className="space-y-4 text-secondary/85 leading-relaxed">
                <p>
                  {settings.store_name} is where the neighborhood comes together. We believe that great coffee has the power to build community, spark conversation, and brighten your day.
                </p>
                <p>
                  Every drink is handcrafted using locally roasted beans, organic ingredients, and syrups we make in-house. From our signature lavender lattes to our fresh-baked pastries, everything is made with intention and care.
                </p>
                <p>
                  Whether you&apos;re grabbing your morning espresso, meeting a friend for lunch, or settling in for an afternoon of work, there&apos;s always a seat and a warm welcome waiting for you.
                </p>
              </div>
              <Link
                href="/menu"
                className="inline-block mt-8 bg-secondary text-primary px-8 py-3 rounded-full font-semibold hover:bg-secondary-dark transition-colors"
              >
                Explore Our Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rewards CTA Section */}
      <section className="py-16 sm:py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-10 sm:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium w-fit mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Rewards Program
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                  Earn Stars,<br />Get Free Drinks
                </h2>
                <p className="text-accent leading-relaxed mb-8">
                  Join our loyalty program and earn stars with every purchase. Unlock free drinks, birthday treats, and exclusive member perks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/signup"
                    className="bg-primary text-secondary px-8 py-3.5 rounded-full font-semibold hover:bg-primary-light transition-colors text-center shadow-md"
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    href="/rewards"
                    className="border-2 border-primary text-primary px-8 py-3.5 rounded-full font-semibold hover:bg-primary hover:text-secondary transition-colors text-center"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="relative h-64 md:h-auto">
                <Image
                  src="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=600&fit=crop"
                  alt="Beautifully crafted cappuccino"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Us Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              Come Say Hello
            </h2>
            <p className="text-accent">
              We&apos;d love to see you. Stop by anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-primary mb-1">Location</h3>
              <p className="text-accent text-sm">{settings.address_line1}</p>
              <p className="text-accent text-sm">{settings.address_line2}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-primary mb-1">Hours</h3>
              <p className="text-accent text-sm">{settings.hours_weekday}</p>
              <p className="text-accent text-sm">{settings.hours_weekend}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full text-primary mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-primary mb-1">Contact</h3>
              <p className="text-accent text-sm">
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="hover:text-primary transition-colors">
                  {settings.phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function DrinkCard({ name, price, description, imageUrl }: { name: string; price: string; description: string; imageUrl?: string | null }) {
  return (
    <Link href="/menu" className="group block">
      <div className="bg-white rounded-2xl shadow-sm border border-secondary-dark/20 hover:shadow-lg transition-all overflow-hidden">
        {imageUrl ? (
          <div className="relative w-full h-52 overflow-hidden">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
            <svg className="w-12 h-12 text-primary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-lg font-semibold text-primary group-hover:text-primary-light transition-colors">{name}</h3>
            <span className="text-accent font-bold text-sm">{price}</span>
          </div>
          <p className="text-accent text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  )
}
