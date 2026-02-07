'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export default function ProfilePage() {
  const { user, profile, loading, setProfile } = useAuthStore()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
    }
  }, [user, profile, loading, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data, error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
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

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-secondary-dark/20 p-8 space-y-5">
        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

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
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-text-dark mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
            />
          </div>
        </div>

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

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
