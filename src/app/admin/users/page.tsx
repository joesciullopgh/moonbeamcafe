'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile, UserRole } from '@/lib/types/database'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | UserRole>('all')
  const { profile } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        setUsers(data || [])
      } catch {
        // silently handle fetch error
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [supabase])

  async function updateRole(userId: string, role: UserRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    }
  }

  async function toggleActive(userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isActive })
      .eq('id', userId)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
    }
  }

  async function updateStars(userId: string, stars: number) {
    const newStars = Math.max(0, stars)
    const { error } = await supabase
      .from('profiles')
      .update({ stars: newStars })
      .eq('id', userId)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, stars: newStars } : u))
    }
  }

  async function forcePasswordReset(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ force_password_reset: true })
      .eq('id', userId)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, force_password_reset: true } : u))
    }
  }

  async function unlockAccount(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq('id', userId)

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, failed_login_attempts: 0, locked_until: null } : u))
    }
  }

  if (profile?.role !== 'admin') {
    return <div className="text-accent">Only admins can manage users.</div>
  }

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter)

  if (loading) {
    return <div className="text-accent">Loading users...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">User Management</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'customer', 'staff', 'admin'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-secondary'
                : 'bg-secondary text-primary hover:bg-secondary-dark'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1 text-xs opacity-70">
                ({users.filter(u => u.role === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-primary">User</th>
                <th className="text-left px-4 py-3 font-medium text-primary hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Role</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Stars</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Security</th>
                <th className="text-left px-4 py-3 font-medium text-primary hidden sm:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark/10">
              {filteredUsers.map(user => {
                const isLocked = user.locked_until && new Date(user.locked_until) > new Date()
                const passwordAge = user.password_changed_at
                  ? Math.floor((Date.now() - new Date(user.password_changed_at).getTime()) / (1000 * 60 * 60 * 24))
                  : null

                return (
                  <tr key={user.id} className="hover:bg-primary/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-dark">
                        {user.first_name || ''} {user.last_name || ''}
                      </p>
                      <p className="text-xs text-accent md:hidden">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-accent hidden md:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={e => updateRole(user.id, e.target.value as UserRole)}
                        disabled={user.id === profile.id}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:bg-gray-50"
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateStars(user.id, user.stars - 10)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          -
                        </button>
                        <span className="text-accent font-medium w-8 text-center">{user.stars}</span>
                        <button
                          onClick={() => updateStars(user.id, user.stars + 10)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(user.id, user.is_active)}
                        disabled={user.id === profile.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium disabled:opacity-50 ${
                          user.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {/* Lockout status */}
                        {isLocked ? (
                          <button
                            onClick={() => unlockAccount(user.id)}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Locked — Unlock
                          </button>
                        ) : user.failed_login_attempts > 0 ? (
                          <span className="text-xs text-amber-600 font-medium">
                            {user.failed_login_attempts} failed attempt{user.failed_login_attempts !== 1 ? 's' : ''}
                          </span>
                        ) : null}

                        {/* Force password reset */}
                        {user.force_password_reset ? (
                          <span className="text-xs text-red-600 font-medium">Reset pending</span>
                        ) : (
                          <button
                            onClick={() => forcePasswordReset(user.id)}
                            disabled={user.id === profile.id}
                            className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50 w-fit"
                          >
                            Force Reset
                          </button>
                        )}

                        {/* Password age */}
                        {passwordAge !== null && (
                          <span className={`text-xs ${passwordAge > 90 ? 'text-red-500 font-medium' : passwordAge > 60 ? 'text-amber-500' : 'text-gray-400'}`}>
                            PW: {passwordAge}d ago
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-accent text-xs hidden sm:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-accent">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Policy Info */}
      <div className="mt-6 bg-primary/5 rounded-xl p-5 text-sm text-accent space-y-1">
        <p className="font-bold text-primary text-base mb-2">Security Policy</p>
        <p>Accounts lock for <strong>15 minutes</strong> after <strong>5 failed login attempts</strong>.</p>
        <p>Passwords expire after <strong>90 days</strong> and users must set a new one.</p>
        <p>Passwords must be at least <strong>8 characters</strong> with uppercase, lowercase, number, and special character.</p>
        <p><strong>Force Reset</strong> requires the user to change their password on next login.</p>
      </div>
    </div>
  )
}
