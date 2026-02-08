'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setAttemptsRemaining(null)
    setLoading(true)

    // Check lockout status via RPC
    const { data: lockoutData } = await supabase.rpc('check_login_lockout', {
      p_email: email,
    })

    if (lockoutData?.locked) {
      setError(
        `Account is temporarily locked due to too many failed attempts. Please try again in ${lockoutData.remaining_minutes} minute${lockoutData.remaining_minutes === 1 ? '' : 's'}.`
      )
      setLoading(false)
      return
    }

    // Attempt sign in
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // Record the failed attempt
      const { data: failData } = await supabase.rpc('record_failed_login', {
        p_email: email,
      })

      if (failData?.locked) {
        setError(
          `Account locked for ${LOCKOUT_MINUTES} minutes due to ${MAX_ATTEMPTS} failed login attempts. Use "Forgot password?" to reset your password, or wait and try again.`
        )
      } else if (failData?.attempts_remaining != null) {
        setAttemptsRemaining(failData.attempts_remaining)
        setError('Invalid email or password.')
      } else {
        setError('Invalid email or password.')
      }

      setLoading(false)
      return
    }

    // Success — reset failed attempts
    await supabase.rpc('reset_login_attempts', { p_email: email })

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
          <p className="text-accent mt-2">Sign in to your Moonbeam Cafe account</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-sm border border-secondary-dark/20 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <p className="mt-1 font-semibold">
                  {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining before lockout.
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              placeholder="Your password"
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-accent hover:text-primary transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-accent">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          After {MAX_ATTEMPTS} failed attempts your account will be locked for {LOCKOUT_MINUTES} minutes.
        </p>
      </div>
    </div>
  )
}
