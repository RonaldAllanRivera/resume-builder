'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Package } from '@/payload-types'

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface SlotsResponse {
  slots: TimeSlot[]
  timezone?: string
  message?: string
}

interface BookingFlowProps {
  pkg: Package
}

type Step = 'date' | 'time' | 'details' | 'confirm'

export function BookingFlow({ pkg }: BookingFlowProps) {
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsMessage, setSlotsMessage] = useState<string>('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [notes, setNotes] = useState('')

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Generate available dates (7 days to 60 days from now)
  const getAvailableDates = () => {
    const dates: string[] = []
    const now = new Date()
    for (let i = 7; i <= 60; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const availableDates = getAvailableDates()

  const fetchSlots = useCallback(
    async (date: string) => {
      setSlotsLoading(true)
      setSlotsMessage('')
      setSlots([])
      setSelectedSlot(null)

      try {
        const res = await fetch(`/api/availability/slots?date=${date}&packageSlug=${pkg.slug}`)
        const data: SlotsResponse = await res.json()

        if (data.slots) {
          setSlots(data.slots)
        }
        if (data.message) {
          setSlotsMessage(data.message)
        }
      } catch {
        setSlotsMessage('Failed to load available times. Please try again.')
      } finally {
        setSlotsLoading(false)
      }
    },
    [pkg.slug],
  )

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate, fetchSlots])

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100)
  }

  const handleSubmit = async () => {
    if (!selectedSlot || !customerName || !customerEmail) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageSlug: pkg.slug,
          startAt: selectedSlot.start,
          endAt: selectedSlot.end,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || undefined,
            company: customerCompany || undefined,
            timezone,
          },
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit booking. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">Booking Request Submitted!</h2>
        <p className="text-white/70 mb-2 max-w-md mx-auto">
          Your booking request has been received. You will receive a confirmation email within 24
          hours.
        </p>
        <p className="text-white/50 text-sm mb-8">
          A confirmation email has been sent to {customerEmail}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/20"
        >
          Back to Pricing
        </Link>
      </div>
    )
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'details', label: 'Details' },
    { key: 'confirm', label: 'Confirm' },
  ]

  return (
    <div>
      {/* Package Summary */}
      <div className="bg-white/5 backdrop-blur rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">{pkg.name}</h2>
            <p className="text-white/70 text-sm">{pkg.shortDescription}</p>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {formatPrice(pkg.price, pkg.currency)}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <button
              onClick={() => {
                const currentIndex = steps.findIndex((st) => st.key === step)
                if (i < currentIndex) setStep(s.key)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                step === s.key
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                  : i < steps.findIndex((st) => st.key === step)
                    ? 'bg-white/10 text-white cursor-pointer hover:bg-white/20'
                    : 'bg-white/5 text-white/40'
              }`}
              disabled={i > steps.findIndex((st) => st.key === step)}
            >
              <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs">
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className="w-8 h-px bg-white/20" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Date Selection */}
      {step === 'date' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Select a Date</h3>
          <p className="text-white/60 text-sm mb-6">
            Bookings require at least 7 days advance notice. Your timezone: {timezone}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {availableDates.slice(0, 28).map((date) => (
              <button
                key={date}
                onClick={() => {
                  setSelectedDate(date)
                  setStep('time')
                }}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  selectedDate === date
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="text-xs text-white/50">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div>
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Time Selection */}
      {step === 'time' && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Select a Time</h3>
          <p className="text-white/60 text-sm mb-6">
            {formatDate(selectedDate)} &middot; {timezone}
          </p>

          {slotsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slotsMessage && slots.filter((s) => s.available).length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <p>{slotsMessage}</p>
              <button
                onClick={() => setStep('date')}
                className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
              >
                Choose a different date
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots
                .filter((s) => s.available)
                .map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => {
                      setSelectedSlot(slot)
                      setStep('details')
                    }}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      selectedSlot?.start === slot.start
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                        : 'bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
            </div>
          )}

          <button
            onClick={() => setStep('date')}
            className="mt-6 text-white/50 hover:text-white/80 text-sm font-semibold"
          >
            &larr; Back to dates
          </button>
        </div>
      )}

      {/* Step 3: Customer Details */}
      {step === 'details' && (
        <div>
          <h3 className="text-lg font-semibold mb-6">Your Details</h3>
          <div className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">
                Phone (optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-white/80 mb-1">
                Company (optional)
              </label>
              <input
                id="company"
                type="text"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-1">
                Project Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                placeholder="Briefly describe your project or requirements..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setStep('time')}
              className="text-white/50 hover:text-white/80 text-sm font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={() => {
                if (!customerName || !customerEmail) {
                  setError('Please fill in your name and email.')
                  return
                }
                setError('')
                setStep('confirm')
              }}
              disabled={!customerName || !customerEmail}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-[0_0_20px_rgba(100,180,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirm' && selectedSlot && (
        <div>
          <h3 className="text-lg font-semibold mb-6">Confirm Your Booking</h3>

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 space-y-4 max-w-lg">
            <div className="flex justify-between">
              <span className="text-white/60">Package</span>
              <span className="font-semibold">{pkg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Date</span>
              <span className="font-semibold">{formatDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Time</span>
              <span className="font-semibold">
                {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Timezone</span>
              <span className="font-semibold">{timezone}</span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="text-white/60">Name</span>
                <span className="font-semibold">{customerName}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-white/60">Email</span>
                <span className="font-semibold">{customerEmail}</span>
              </div>
              {customerCompany && (
                <div className="flex justify-between mt-2">
                  <span className="text-white/60">Company</span>
                  <span className="font-semibold">{customerCompany}</span>
                </div>
              )}
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between">
              <span className="text-white/60">Total</span>
              <span className="text-xl font-bold text-cyan-400">
                {formatPrice(pkg.price, pkg.currency)}
              </span>
            </div>
          </div>

          <p className="text-white/40 text-xs mt-4 max-w-lg">
            By submitting this booking request, you agree that you will receive a confirmation email
            within 24 hours. Payment will be collected after the booking is accepted.
          </p>

          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setStep('details')}
              className="text-white/50 hover:text-white/80 text-sm font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-8 py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-[0_0_20px_rgba(100,180,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
