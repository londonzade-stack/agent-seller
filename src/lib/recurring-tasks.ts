/**
 * Shared utilities for recurring tasks — schedule computation and task execution
 */

/**
 * Calculate the next run time based on frequency and schedule parameters.
 * All times are computed in UTC.
 */
export function calculateNextRun(
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly',
  timeOfDay: string, // HH:MM format
  dayOfWeek?: number | null, // 0=Sunday through 6=Saturday
  dayOfMonth?: number | null, // 1-28
  afterDate?: Date, // compute next run after this date (defaults to now)
): Date {
  const now = afterDate || new Date()
  const [hours, minutes] = timeOfDay.split(':').map(Number)

  if (frequency === 'hourly') {
    const next = new Date(now)
    next.setUTCMinutes(minutes, 0, 0)
    // If the minute mark has passed this hour, schedule for next hour
    if (next <= now) {
      next.setUTCHours(next.getUTCHours() + 1)
    }
    return next
  }

  if (frequency === 'daily') {
    const next = new Date(now)
    next.setUTCHours(hours, minutes, 0, 0)
    // If the time has already passed today, schedule for tomorrow
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1)
    }
    return next
  }

  if (frequency === 'weekly') {
    const targetDay = dayOfWeek ?? 0 // Default to Sunday
    const next = new Date(now)
    next.setUTCHours(hours, minutes, 0, 0)

    const currentDay = next.getUTCDay()
    let daysUntilTarget = targetDay - currentDay
    if (daysUntilTarget < 0) daysUntilTarget += 7
    if (daysUntilTarget === 0 && next <= now) daysUntilTarget = 7

    next.setUTCDate(next.getUTCDate() + daysUntilTarget)
    return next
  }

  if (frequency === 'monthly') {
    const targetDay = dayOfMonth ?? 1 // Default to 1st
    const next = new Date(now)
    next.setUTCHours(hours, minutes, 0, 0)
    next.setUTCDate(targetDay)

    // If this month's target has passed, schedule for next month
    if (next <= now) {
      next.setUTCMonth(next.getUTCMonth() + 1)
    }
    return next
  }

  // Fallback: tomorrow at the specified time
  const fallback = new Date(now)
  fallback.setUTCDate(fallback.getUTCDate() + 1)
  fallback.setUTCHours(hours, minutes, 0, 0)
  return fallback
}

/**
 * Format a frequency + schedule into a human-readable string.
 */
export function formatSchedule(
  frequency: string,
  timeOfDay: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Convert HH:MM to 12-hour format
  const [h, m] = timeOfDay.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  const timeStr = `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`

  if (frequency === 'hourly') {
    return `Every hour at :${m.toString().padStart(2, '0')}`
  }
  if (frequency === 'daily') {
    return `Daily at ${timeStr}`
  }
  if (frequency === 'weekly') {
    const day = dayNames[dayOfWeek ?? 0]
    return `Weekly on ${day}s at ${timeStr}`
  }
  if (frequency === 'monthly') {
    const d = dayOfMonth ?? 1
    const suffix = d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'
    return `Monthly on the ${d}${suffix} at ${timeStr}`
  }
  return `${frequency} at ${timeStr}`
}

/**
 * Task type labels for display.
 */
export const TASK_TYPE_LABELS: Record<string, string> = {
  archive_by_query: 'Archive emails',
  trash_by_query: 'Trash emails',
  unsubscribe_sweep: 'Unsubscribe sweep',
  inbox_stats: 'Inbox statistics',
  label_emails: 'Label emails',
  custom: 'Custom task',
}
