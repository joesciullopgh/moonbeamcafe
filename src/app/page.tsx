'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useStoreSettings } from '@/stores/store-settings'

const GOOGLE_PHOTOS_URL = 'https://share.google/QpQgYb0Vfhhg8ls84'

const GALLERY_IMAGES = [
  '/storefront.jpg',
  '/gallery/1.jpg',
  '/gallery/2.jpg',
  '/gallery/3.jpg',
  '/gallery/4.jpg',
  '/gallery/5.jpg',
]

interface FeaturedItem {
  id: string
  name: string
  price: number
  description: string
  image_url: string | null
  featured_tagline: string | null
  category: string
}

export default function Home() {
  const { settings } = useStoreSettings()
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let done = false
    async function fetchFeatured() {
      try {
        const { data } = await supabase
          .from('menu_items')
          .select('id, name, price, description, image_url, featured_tagline, category')
          .eq('is_featured', true)
          .eq('is_available', true)
          .order('featured_order', { ascending: true })
        if (!done && data && data.length > 0) {
          setFeaturedItems(data)
        }
      } catch {
        // silently fall back to no featured items
      } finally {
        done = true
        setFeaturedLoading(false)
      }
    }
    fetchFeatured()
    // Safety net: if Supabase hangs, stop loading spinner after 6s
    const timer = setTimeout(() => {
      if (!done) { done = true; setFeaturedLoading(false) }
    }, 6000)
    return () => { done = true; clearTimeout(timer) }
  }, [supabase])

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="relative h-[90vh] min-h-[600px] max-h-[900px] overflow-hidden">
        {/* SVG base layer */}
        <Image src="/hero-bg.svg" alt="" fill className="object-cover" priority />
        {/* Storefront photo overlay — subtle and transparent */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/storefront.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {/* Warm gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/80" />
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          {/* Moonbeam glow effect */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f5e6c8]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <Image
              src="/logo.svg"
              alt=""
              width={110}
              height={110}
              className="mx-auto mb-8 drop-shadow-2xl"
              aria-hidden="true"
            />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-secondary leading-[1.1] max-w-4xl tracking-tight">
              Your Neighborhood
              <br />
              <span className="bg-gradient-to-r from-[#f5e6c8] to-white bg-clip-text text-transparent">Coffee Shop</span>
            </h1>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/menu"
                className="group bg-secondary text-primary px-10 py-4 rounded-full font-semibold text-lg shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  Order Now
                  <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/menu"
                className="border-2 border-secondary/60 text-secondary px-10 py-4 rounded-full font-semibold text-lg hover:bg-secondary/10 transition-all backdrop-blur-sm"
              >
                View Menu
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 flex flex-col items-center gap-2">
            <span className="text-secondary/40 text-xs uppercase tracking-widest font-medium">Scroll</span>
            <div className="w-5 h-8 border-2 border-secondary/30 rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-secondary/50 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED BANNER ===== */}
      <section className="bg-secondary py-4 overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
          {[...Array(3)].map((_, g) => (
            <div key={g} className="flex items-center gap-8 shrink-0">
              <span className="text-primary/60 font-semibold text-sm tracking-wider uppercase">Locally Roasted Beans</span>
              <span className="text-primary/30">&#9670;</span>
              <span className="text-primary/60 font-semibold text-sm tracking-wider uppercase">House-Made Syrups</span>
              <span className="text-primary/30">&#9670;</span>
              <span className="text-primary/60 font-semibold text-sm tracking-wider uppercase">Organic Ingredients</span>
              <span className="text-primary/30">&#9670;</span>
              <span className="text-primary/60 font-semibold text-sm tracking-wider uppercase">Fresh Pastries Daily</span>
              <span className="text-primary/30">&#9670;</span>
              <span className="text-primary/60 font-semibold text-sm tracking-wider uppercase">Free WiFi</span>
              <span className="text-primary/30">&#9670;</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHAT MAKES US SPECIAL ===== */}
      <section className="py-20 sm:py-24 bg-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.02] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/30 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">Why Moonbeam?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary">
              Crafted with Intention
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              }
              title="Handcrafted Drinks"
              description="Every drink is made to order by our skilled baristas using organic ingredients and house-made syrups."
            />
            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Community Hub"
              description="More than a cafe — we're a gathering place for neighbors, creators, and friends in Bloomfield."
            />
            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              title="Earn Rewards"
              description="Join our loyalty program — earn stars with every purchase and unlock free drinks, birthday treats, and more."
            />
          </div>
        </div>
      </section>

      {/* ===== SIGNATURE CREATIONS ===== */}
      {featuredItems.length > 0 && (
        <section className="py-20 sm:py-24 bg-gradient-to-b from-[#faf6ee] to-white relative overflow-hidden">
          {/* Decorative accents */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#3d4a2d 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary-dark/10 rounded-full blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">Only at {settings.store_name}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                Signature Creations
              </h2>
              <p className="text-accent max-w-2xl mx-auto leading-relaxed">
                Handcrafted originals made with house-made syrups, organic ingredients, and a little bit of magic
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map(item => (
                <FeaturedCard key={item.id} item={item} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2 bg-primary text-secondary px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-light transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                See Full Menu
                <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== ABOUT / STORY SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
          {/* Illustration side */}
          <div className="relative h-80 md:h-auto overflow-hidden">
            <Image
              src="/cafe-scene.svg"
              alt="Inside Moonbeam Cafe"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Warm overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/10 md:to-primary/20" />
          </div>
          {/* Text side */}
          <div className="bg-primary flex items-center relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4d5e39] rounded-full -translate-y-1/2 translate-x-1/2 opacity-40" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4d5e39] rounded-full translate-y-1/2 -translate-x-1/2 opacity-30" />

            <div className="px-8 sm:px-12 lg:px-16 py-16 relative">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-secondary/50 mb-4">Our Story</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-6 leading-tight whitespace-pre-line">
                {settings.story_title || 'More Than\nJust Coffee'}
              </h2>
              <div className="space-y-4 text-secondary/80 leading-relaxed">
                {(settings.story_body || '').split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 mt-8 bg-secondary text-primary px-8 py-3.5 rounded-full font-semibold hover:bg-secondary-dark transition-all"
              >
                Explore Our Menu
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PHOTO GALLERY / SLIDESHOW ===== */}
      <section className="py-20 sm:py-24 bg-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">Gallery</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Inside Moonbeam
            </h2>
            <p className="text-accent max-w-2xl mx-auto leading-relaxed">
              Take a peek inside our cozy corner of the neighborhood
            </p>
          </div>

          <PhotoSlideshow />

          <div className="text-center mt-10">
            <a
              href={GOOGLE_PHOTOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-primary text-secondary px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-light transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Full Gallery
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ===== REWARDS CTA ===== */}
      <section className="py-20 sm:py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#3d4a2d 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Text side */}
              <div className="bg-white p-10 sm:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold w-fit mb-6">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  Rewards Program
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4 leading-tight">
                  Earn Stars,
                  <br />Get Free Drinks
                </h2>
                <p className="text-accent leading-relaxed mb-8">
                  Join our loyalty program and earn stars with every purchase. Unlock free drinks, birthday treats, and exclusive member perks. It&apos;s free to sign up!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/signup"
                    className="bg-primary text-secondary px-8 py-3.5 rounded-full font-semibold hover:bg-primary-light transition-all text-center shadow-lg shadow-primary/20"
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    href="/rewards"
                    className="border-2 border-primary text-primary px-8 py-3.5 rounded-full font-semibold hover:bg-primary hover:text-secondary transition-all text-center"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              {/* Illustration side */}
              <div className="relative h-72 md:h-auto">
                <Image
                  src="/rewards-illustration.svg"
                  alt="Earn rewards at Moonbeam Cafe"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VISIT US + SOCIAL ===== */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-[#faf6ee] to-secondary/40 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">Visit Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              Come Say Hello
            </h2>
            <p className="text-accent">
              We&apos;d love to see you. Stop by anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <InfoCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="Location"
              line1={settings.address_line1}
              line2={settings.address_line2}
            />
            <InfoCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Hours"
              line1={settings.hours_weekday}
              line2={settings.hours_weekend}
            />
            <InfoCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
              title="Contact"
              line1={settings.phone}
              href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
            />
          </div>

          {/* Social links */}
          {settings.instagram_url && (
            <div className="text-center mt-12">
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-white text-primary px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 border border-secondary-dark/20"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Follow @moonbeamcafe
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ===== FOOTER ACCENT ===== */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group text-center px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/[0.08] rounded-2xl text-primary mb-5 group-hover:bg-primary group-hover:text-secondary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
      <p className="text-accent text-sm leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
    </div>
  )
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Espresso Drinks': '☕',
  'Brewed Coffee & Tea': '🍵',
  'Specialty Drinks': '✨',
  'Iced Drinks': '🧊',
  'Food - Breakfast': '🥐',
  'Food - Pastries': '🧁',
  'Food - Lunch': '🥪',
  'Kids Menu': '🧃',
}

function FeaturedCard({ item }: { item: FeaturedItem }) {
  const emoji = CATEGORY_EMOJI[item.category] || '☕'

  return (
    <Link href="/menu" className="group block">
      <div className="rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-secondary-dark/10">
        {/* Photo area */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {item.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary to-secondary-dark/20 flex items-center justify-center">
              <span className="text-7xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{emoji}</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          {/* Price badge */}
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary font-black text-sm px-3 py-1.5 rounded-full shadow-sm">
            ${item.price.toFixed(2)}
          </span>
        </div>
        {/* Info */}
        <div className="p-5">
          <h3 className="font-bold text-primary text-lg leading-tight group-hover:text-primary-light transition-colors">
            {item.name}
          </h3>
          {item.featured_tagline && (
            <p className="text-primary/50 text-sm italic mt-1">{item.featured_tagline}</p>
          )}
          <p className="text-accent text-sm mt-2 leading-relaxed line-clamp-2">{item.description}</p>
          <div className="mt-4 flex items-center gap-2 text-primary/60 group-hover:text-primary transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider">Try it today</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PhotoSlideshow() {
  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState<string[]>([])

  // Preload images and track which ones exist
  useEffect(() => {
    const results: string[] = []
    let done = 0
    GALLERY_IMAGES.forEach((src) => {
      const img = new window.Image()
      img.onload = () => {
        results.push(src)
        done++
        if (done === GALLERY_IMAGES.length) setLoaded([...results])
      }
      img.onerror = () => {
        done++
        if (done === GALLERY_IMAGES.length) setLoaded([...results])
      }
      img.src = src
    })
  }, [])

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (loaded.length <= 1) return
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % loaded.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [loaded.length])

  if (loaded.length === 0) {
    return (
      <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-secondary to-secondary-dark/30 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-primary/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-accent/60 text-sm">Photo gallery coming soon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
      {loaded.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`Moonbeam Cafe photo ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === active ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {/* Subtle gradient at bottom for dots visibility */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      {/* Navigation dots */}
      {loaded.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {loaded.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'bg-white w-8' : 'bg-white/50 w-2 hover:bg-white/70'}`}
              aria-label={`View photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon, title, line1, line2, href }: {
  icon: React.ReactNode
  title: string
  line1: string
  line2?: string
  href?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-secondary-dark/10 hover:shadow-lg transition-shadow">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/[0.08] rounded-xl text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-primary mb-2">{title}</h3>
      {href ? (
        <a href={href} className="text-accent text-sm hover:text-primary transition-colors block">{line1}</a>
      ) : (
        <p className="text-accent text-sm">{line1}</p>
      )}
      {line2 && <p className="text-accent text-sm">{line2}</p>}
    </div>
  )
}
