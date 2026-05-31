import { useEffect, useState } from 'react'

interface DatePickerProps {
  value: string | null
  onChange: (iso: string | null) => void
  onClose: () => void
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ value, onChange, onClose }: DatePickerProps) {
  const today = new Date()
  const initial = value ? new Date(value) : today

  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  const selectedDate = value ? new Date(value) : null

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  function handleDayClick(year: number, month: number, day: number) {
    const iso = new Date(year, month, day).toISOString()
    onChange(iso)
    onClose()
  }

  function handleToday() {
    const iso = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    onChange(iso)
    onClose()
  }

  function handleClear() {
    onChange(null)
    onClose()
  }

  // Build calendar grid
  const daysInCurrent = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)

  // Days from previous month to fill leading slots
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  )

  interface CalendarDay {
    year: number
    month: number
    day: number
    currentMonth: boolean
  }

  const cells: CalendarDay[] = []

  // Leading days from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      month: viewMonth === 0 ? 11 : viewMonth - 1,
      day: prevMonthDays - i,
      currentMonth: false,
    })
  }

  // Current month days
  for (let d = 1; d <= daysInCurrent; d++) {
    cells.push({ year: viewYear, month: viewMonth, day: d, currentMonth: true })
  }

  // Trailing days from next month
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      month: viewMonth === 11 ? 0 : viewMonth + 1,
      day: d,
      currentMonth: false,
    })
  }

  function isToday(year: number, month: number, day: number): boolean {
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    )
  }

  function isSelected(year: number, month: number, day: number): boolean {
    if (!selectedDate) return false
    return (
      year === selectedDate.getFullYear() &&
      month === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    )
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-3 shadow-xl w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm font-medium"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-text-primary select-none">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-sm font-medium"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-xs text-text-muted text-center py-1 select-none"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, idx) => {
          const selected = isSelected(cell.year, cell.month, cell.day)
          const todayCell = isToday(cell.year, cell.month, cell.day)

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDayClick(cell.year, cell.month, cell.day)}
              className={[
                'h-8 w-full flex items-center justify-center text-xs rounded-full transition-colors',
                selected
                  ? 'bg-accent text-white font-semibold'
                  : todayCell
                    ? 'ring-1 ring-accent text-text-primary font-medium hover:bg-bg-hover'
                    : !cell.currentMonth
                      ? 'text-text-muted opacity-40 hover:opacity-60'
                      : 'text-text-primary hover:bg-bg-hover',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                selected
                  ? { backgroundColor: '#5b9bd5' }
                  : todayCell && !selected
                    ? { outlineColor: '#5b9bd5' }
                    : undefined
              }
            >
              {cell.day}
            </button>
          )
        })}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="text-xs font-medium transition-colors"
          style={{ color: '#5b9bd5' }}
        >
          Today
        </button>
      </div>
    </div>
  )
}
