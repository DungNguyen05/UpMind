const relativeTimeFormatter = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
  ['second', 1000],
]

export function formatRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const timestamp = date.getTime()
  if (Number.isNaN(timestamp)) return ''

  const diff = timestamp - Date.now()
  const absDiff = Math.abs(diff)
  const [unit, unitMs] = RELATIVE_UNITS.find(([, ms]) => absDiff >= ms) ?? ['second', 1000]

  return relativeTimeFormatter.format(Math.round(diff / unitMs), unit)
}
