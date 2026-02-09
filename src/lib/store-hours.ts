/**
 * Store Hours — shared utility for determining open/closed status.
 *
 * Data shapes match the `store_hours` and `store_override` DB tables.
 * All time comparisons use the store's configured timezone.
 */

// ── Types ──────────────────────────────────────────────────────

export interface TimeRange {
  open: string   // "HH:MM" 24-hour format
  close: string  // "HH:MM" 24-hour format
}

export interface DaySchedule {
  day_of_week: number  // 0=Sunday … 6=Saturday
  is_closed: boolean
  ranges: TimeRange[]
}

export interface StoreOverride {
  is_forced_closed: boolean
  reason?: string | null
  updated_at?: string | null
}

export interface StoreStatus {
  isOpen: boolean
  isForcedClosed: boolean
  isClosingSoon: boolean
  closesAt: string | null       // "HH:MM" in store tz
  opensAtNext: string | null    // human-readable, e.g. "Monday at 7:00 AM"
  message: string
}

// ── Defaults ───────────────────────────────────────────────────

export const DEFAULT_TIMEZONE = 'America/New_York'
export const DEFAULT_CUTOFF_MINUTES = 0
export const CLOSING_SOON_MINUTES = 30

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export { DAY_NAMES }

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day_of_week: 0, is_closed: false, ranges: [{ open: '09:00', close: '15:00' }] },
  { day_of_week: 1, is_closed: false, ranges: [{ open: '07:00', close: '17:00' }] },
  { day_of_week: 2, is_closed: false, ranges: [{ open: '07:00', close: '17:00' }] },
  { day_of_week: 3, is_closed: false, ranges: [{ open: '07:00', close: '17:00' }] },
  { day_of_week: 4, is_closed: false, ranges: [{ open: '07:00', close: '17:00' }] },
  { day_of_week: 5, is_closed: false, ranges: [{ open: '07:00', close: '17:00' }] },
  { day_of_week: 6, is_closed: false, ranges: [{ open: '07:00', close: '17:00' }] },
]

// ── Helpers ────────────────────────────────────────────────────

/** Parse "HH:MM" into total minutes from midnight. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Format "HH:MM" (24h) to human-friendly "7:00 AM". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
}

/** Get the current time in the store's timezone as { dayOfWeek, hours, minutes }. */
function getStoreLocalTime(timezone: string, now: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const weekday = parts.find(p => p.type === 'weekday')?.value || ''
  const hour = Number(parts.find(p => p.type === 'hour')?.value || 0)
  const minute = Number(parts.find(p => p.type === 'minute')?.value || 0)

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dayOfWeek = dayMap[weekday] ?? 0
  return { dayOfWeek, hour, minute, totalMinutes: hour * 60 + minute }
}

/**
 * Check if `nowMinutes` falls within a time range.
 * Handles overnight ranges (close < open, e.g. 22:00–02:00).
 */
function isWithinRange(nowMinutes: number, range: TimeRange): boolean {
  const openMin = toMinutes(range.open)
  const closeMin = toMinutes(range.close)

  if (closeMin > openMin) {
    // Normal same-day range
    return nowMinutes >= openMin && nowMinutes < closeMin
  } else if (closeMin < openMin) {
    // Overnight range (e.g. 22:00–02:00)
    return nowMinutes >= openMin || nowMinutes < closeMin
  }
  // close === open means 24-hour or empty — treat as always open for that range
  return closeMin === openMin && openMin === 0 ? false : true
}

/**
 * Find the closing time of the currently active range.
 * Returns null if not currently in any range.
 */
function activeRangeCloseTime(nowMinutes: number, ranges: TimeRange[]): string | null {
  for (const range of ranges) {
    if (isWithinRange(nowMinutes, range)) {
      return range.close
    }
  }
  return null
}

/**
 * Find the next opening time from the schedule, starting from the given day/time.
 * Searches up to 7 days ahead.
 */
function findNextOpen(
  schedule: DaySchedule[],
  currentDay: number,
  currentMinutes: number
): string | null {
  for (let offset = 0; offset < 7; offset++) {
    const checkDay = (currentDay + offset) % 7
    const daySched = schedule.find(d => d.day_of_week === checkDay)
    if (!daySched || daySched.is_closed || daySched.ranges.length === 0) continue

    const sorted = [...daySched.ranges].sort((a, b) => toMinutes(a.open) - toMinutes(b.open))
    for (const range of sorted) {
      const openMin = toMinutes(range.open)
      // On the same day (offset 0), only future ranges count
      if (offset === 0 && openMin <= currentMinutes) continue
      const dayName = DAY_NAMES[checkDay]
      const timeStr = formatTime(range.open)
      return offset === 0 ? `today at ${timeStr}`
        : offset === 1 ? `tomorrow at ${timeStr}`
        : `${dayName} at ${timeStr}`
    }
  }
  return null
}

// ── Main Function ──────────────────────────────────────────────

export function getStoreStatus(
  schedule: DaySchedule[],
  override: StoreOverride | null,
  timezone: string = DEFAULT_TIMEZONE,
  cutoffMinutes: number = DEFAULT_CUTOFF_MINUTES,
  now: Date = new Date()
): StoreStatus {
  // 1) Forced closed override
  if (override?.is_forced_closed) {
    const { dayOfWeek, totalMinutes } = getStoreLocalTime(timezone, now)
    const nextOpen = findNextOpen(schedule, dayOfWeek, totalMinutes)
    const reason = override.reason
    const reasonText = reason && reason !== 'other'
      ? ` (${reason})`
      : ''
    return {
      isOpen: false,
      isForcedClosed: true,
      isClosingSoon: false,
      closesAt: null,
      opensAtNext: nextOpen,
      message: `Temporarily closed${reasonText} — new orders paused`,
    }
  }

  // 2) Evaluate scheduled hours
  const { dayOfWeek, totalMinutes } = getStoreLocalTime(timezone, now)
  const todaySchedule = schedule.find(d => d.day_of_week === dayOfWeek)

  // Also check if we're in an overnight range from the previous day
  const prevDay = (dayOfWeek + 6) % 7
  const prevSchedule = schedule.find(d => d.day_of_week === prevDay)

  let currentlyOpen = false
  let closesAt: string | null = null

  // Check today's ranges
  if (todaySchedule && !todaySchedule.is_closed) {
    const close = activeRangeCloseTime(totalMinutes, todaySchedule.ranges)
    if (close !== null) {
      currentlyOpen = true
      closesAt = close
    }
  }

  // Check overnight ranges from yesterday (e.g. Fri 22:00–Sat 02:00 would
  // have close < open, and current time on Sat might fall in the early portion)
  if (!currentlyOpen && prevSchedule && !prevSchedule.is_closed) {
    for (const range of prevSchedule.ranges) {
      const openMin = toMinutes(range.open)
      const closeMin = toMinutes(range.close)
      if (closeMin < openMin && totalMinutes < closeMin) {
        currentlyOpen = true
        closesAt = range.close
        break
      }
    }
  }

  // 3) Apply last-order cutoff
  let isClosingSoon = false
  if (currentlyOpen && closesAt && cutoffMinutes > 0) {
    const closeMin = toMinutes(closesAt)
    const effectiveCloseMin = closeMin - cutoffMinutes
    // Handle overnight: if close is small (e.g. 02:00=120) and we're
    // in the late-night portion, the cutoff applies differently
    if (closeMin > totalMinutes) {
      if (totalMinutes >= effectiveCloseMin) {
        currentlyOpen = false
      }
    }
  }

  // Check closing-soon (within CLOSING_SOON_MINUTES of close)
  if (currentlyOpen && closesAt) {
    const closeMin = toMinutes(closesAt)
    const minutesUntilClose = closeMin > totalMinutes
      ? closeMin - totalMinutes
      : (1440 - totalMinutes) + closeMin  // overnight wrap
    if (minutesUntilClose <= CLOSING_SOON_MINUTES) {
      isClosingSoon = true
    }
  }

  if (currentlyOpen) {
    return {
      isOpen: true,
      isForcedClosed: false,
      isClosingSoon,
      closesAt,
      opensAtNext: null,
      message: isClosingSoon
        ? `Closing soon at ${formatTime(closesAt!)}`
        : `Open until ${formatTime(closesAt!)}`,
    }
  }

  // Closed — find next opening
  const nextOpen = findNextOpen(schedule, dayOfWeek, totalMinutes)
  return {
    isOpen: false,
    isForcedClosed: false,
    isClosingSoon: false,
    closesAt: null,
    opensAtNext: nextOpen,
    message: nextOpen ? `Closed — opens ${nextOpen}` : 'Currently closed',
  }
}

// ── Schedule Summary (for footer / homepage display) ──────────

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Summarise a weekly schedule into compact human-readable lines by
 * grouping consecutive days that share the same hours, e.g.:
 *   ["Mon–Sat: 7:00 AM – 5:00 PM", "Sun: 9:00 AM – 3:00 PM"]
 */
export function formatScheduleSummary(schedule: DaySchedule[]): string[] {
  // Build a map: dayOfWeek → signature string
  const ordered = [1, 2, 3, 4, 5, 6, 0] // Mon-first display order
  const sigMap = new Map<number, string>()
  for (const day of schedule) {
    if (day.is_closed || day.ranges.length === 0) {
      sigMap.set(day.day_of_week, 'CLOSED')
    } else {
      const sig = day.ranges
        .map(r => `${r.open}-${r.close}`)
        .sort()
        .join(',')
      sigMap.set(day.day_of_week, sig)
    }
  }

  // Group consecutive days (in display order) with the same signature
  const groups: { days: number[]; sig: string }[] = []
  for (const d of ordered) {
    const sig = sigMap.get(d) ?? 'CLOSED'
    const last = groups[groups.length - 1]
    if (last && last.sig === sig) {
      last.days.push(d)
    } else {
      groups.push({ days: [d], sig })
    }
  }

  // Format each group into a readable line
  return groups.map(g => {
    const first = DAY_ABBR[g.days[0]]
    const last = DAY_ABBR[g.days[g.days.length - 1]]
    const label = g.days.length === 1 ? first : `${first}–${last}`

    if (g.sig === 'CLOSED') return `${label}: Closed`

    // Parse the ranges back from the signature
    const rangeStrs = g.sig.split(',').map(part => {
      const [open, close] = part.split('-')
      return `${formatTime(open)} – ${formatTime(close)}`
    })
    return `${label}: ${rangeStrs.join(', ')}`
  })
}

// ── Validation Helpers ─────────────────────────────────────────

export function validateTimeRange(range: TimeRange): string | null {
  if (!range.open || !range.close) return 'Both open and close times are required'
  if (!/^\d{2}:\d{2}$/.test(range.open)) return 'Invalid open time format'
  if (!/^\d{2}:\d{2}$/.test(range.close)) return 'Invalid close time format'
  if (range.open === range.close) return 'Open and close times cannot be the same'
  return null
}

export function validateDayRanges(ranges: TimeRange[]): string | null {
  for (const range of ranges) {
    const err = validateTimeRange(range)
    if (err) return err
  }
  // Check for overlapping non-overnight ranges
  if (ranges.length === 2) {
    const [a, b] = ranges
    const aOpen = toMinutes(a.open)
    const aClose = toMinutes(a.close)
    const bOpen = toMinutes(b.open)
    const bClose = toMinutes(b.close)
    // Simple overlap check for same-day ranges
    if (aClose > aOpen && bClose > bOpen) {
      if (aOpen < bClose && bOpen < aClose) {
        return 'Time ranges overlap'
      }
    }
  }
  return null
}
