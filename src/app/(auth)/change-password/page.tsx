'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { validatePassword, isPasswordStrong, PASSWORD_POLICY_TEXT } from '@/lib/password-validation'

export default function ChangePasswordPage() {
  const { user, profile, setProfile } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isForced = profile?.force_password_reset
  const checks = validatePassword(newPassword)

  // Password expiry check — 90 days
  const isExpired = profile?.password_changed_at
    ? Date.now() - new Date(profile.password_changed_at).getTime() > 90 * 24 * 60 * 60 * 1000
    : false

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (!isPasswordStrong(newPassword)) {
      setError(PASSWORD_POLICY_TEXT)
      return
    }

    setLoading(true)

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    })

    if (signInError) {
      setError('Current password is incorrect.')
      setLoading(false)
      return
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError('Failed to update password: ' + updateError.message)
      setLoading(false)
      return
    }

    // Update profile: clear force_password_reset, set password_changed_at
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .update({
        force_password_reset: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', user!.id)
      .select()
      .single()

    if (updatedProfile) {
      setProfile(updatedProfile)
    }

    setSuccess(true)
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading...</div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl shadow-sm border border-secondary-dark/20 p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Password Updated</h2>
            <p className="text-accent mb-6">Your password has been changed successfully.</p>
            <Link
              href="/profile"
              className="inline-block bg-primary text-secondary px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Change Password</h1>
          {isForced ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
              <p className="font-bold">Password change required</p>
              <p className="mt-1">An administrator has required you to change your password before continuing.</p>
            </div>
          ) : isExpired ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm mt-4">
              <p className="font-bold">Password expired</p>
              <p className="mt-1">Your password is older than 90 days. Please set a new password for security.</p>
            </div>
          ) : (
            <p className="text-accent mt-2">Enter your current password and choose a new one</p>
          )}
        </div>

        <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm border border-secondary-dark/20 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-text-dark mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              placeholder="Your current password"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text-dark mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              placeholder="Choose a strong password"
            />

            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {checks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {check.met ? (
                      <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth={2} />
                      </svg>
                    )}
                    <span className={check.met ? 'text-green-700' : 'text-gray-500'}>{check.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-dark mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              placeholder="Re-enter your new password"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordStrong(newPassword) || newPassword !== confirmPassword}
            className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          {!isForced && !isExpired && (
            <p className="text-center text-sm text-accent">
              <Link href="/profile" className="text-primary font-medium hover:underline">
                Back to Profile
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
