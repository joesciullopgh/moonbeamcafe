'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

export default function ProfilePage() {
  const { user, profile, loading, setProfile } = useAuthStore()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
      setAddressLine1(profile.billing_address_line1 || '')
      setAddressLine2(profile.billing_address_line2 || '')
      setCity(profile.billing_city || '')
      setState(profile.billing_state || '')
      setZip(profile.billing_zip || '')
    }
  }, [user, profile, loading, router])

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        billing_address_line1: addressLine1,
        billing_address_line2: addressLine2,
        billing_city: city,
        billing_state: state,
        billing_zip: zip,
      })
      .eq('id', user!.id)
      .select()
      .single()

    if (error) {
      setMessage('Error updating profile: ' + error.message)
    } else {
      setProfile(data)
      setMessage('Profile updated successfully!')
    }

    setSaving(false)
  }

  if (loading || !user || !profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-8">My Profile</h1>

      {/* Stars Display */}
      <div className="bg-primary rounded-xl p-6 mb-8 text-center">
        <p className="text-secondary/70 text-sm mb-1">Your Rewards Stars</p>
        <p className="text-4xl font-bold text-secondary">{profile.stars}</p>
        <p className="text-secondary/70 text-sm mt-1">
          {profile.stars < 50
            ? `${50 - profile.stars} more stars until your next free drink!`
            : 'You have enough for a free drink!'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Personal Info */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-dark/20 p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-bold text-primary">Personal Information</h2>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-text-dark mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-text-dark mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-dark mb-1">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(412) 555-1234"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">Required for order notifications and payment verification</p>
          </div>
        </div>

        {/* Billing Address */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-dark/20 p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">Billing Address</h2>
            <p className="text-sm text-accent mt-0.5">Required for credit card payments</p>
          </div>

          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-text-dark mb-1">
              Street Address <span className="text-red-400">*</span>
            </label>
            <input
              id="addressLine1"
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="123 Main Street"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="addressLine2" className="block text-sm font-medium text-text-dark mb-1">
              Apt, Suite, Unit <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="addressLine2"
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apt 4B"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-text-dark mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Pittsburgh"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-text-dark mb-1">
                State <span className="text-red-400">*</span>
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors bg-white"
              >
                <option value="">--</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-text-dark mb-1">
                ZIP <span className="text-red-400">*</span>
              </label>
              <input
                id="zip"
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="15224"
                maxLength={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-dark/20 p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-bold text-primary">Account</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Role</label>
              <input
                type="text"
                value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Member Since</label>
              <input
                type="text"
                value={new Date(profile.created_at).toLocaleDateString()}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {profile.accepted_terms_at && (
            <p className="text-xs text-gray-400">
              Terms accepted on {new Date(profile.accepted_terms_at).toLocaleDateString()}
            </p>
          )}

          {/* Password & Security */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-dark">Password</p>
                {profile.password_changed_at ? (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last changed {new Date(profile.password_changed_at).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Never changed</p>
                )}
              </div>
              <Link
                href="/change-password"
                className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-secondary transition-colors"
              >
                Change Password
              </Link>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-secondary py-3.5 rounded-xl font-bold text-lg hover:bg-primary-light transition-colors disabled:opacity-50 shadow-md shadow-primary/15"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <p className="text-center text-xs text-gray-400">
          By saving your information you agree to our{' '}
          <Link href="/terms" className="text-primary underline">Terms of Service</Link>{' '}and{' '}
          <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  )
}
