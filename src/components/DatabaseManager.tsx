'use client'

import React, { useState } from 'react'

const DatabaseManager: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isBookingResetting, setIsBookingResetting] = useState(false)
  const [isBookingSeeding, setIsBookingSeeding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleReset = async () => {
    if (
      !confirm(
        '⚠️ This will DELETE ALL resume data (Resume Profile, experiences, projects, education, certifications, and global). Are you sure?',
      )
    ) {
      return
    }

    setIsResetting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Database reset successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset database' })
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Network error: Failed to reset database' })
    } finally {
      setIsResetting(false)
    }
  }

  const handleSeed = async () => {
    if (!confirm('This will seed your resume data. Continue?')) {
      return
    }

    setIsSeeding(true)
    setMessage(null)

    try {
      const response = await fetch('/api/database/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Database seeded successfully!',
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to seed database' })
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Network error: Failed to seed database' })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleResetAndSeed = async () => {
    if (
      !confirm(
        '⚠️ This will DELETE ALL current data and reseed with fresh resume data. Are you sure?',
      )
    ) {
      return
    }

    setIsResetting(true)
    setMessage(null)

    try {
      // First reset
      const resetResponse = await fetch('/api/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!resetResponse.ok) {
        const data = await resetResponse.json()
        setMessage({ type: 'error', text: `Reset failed: ${data.error}` })
        setIsResetting(false)
        return
      }

      // Then seed
      setIsResetting(false)
      setIsSeeding(true)

      const seedResponse = await fetch('/api/database/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const seedData = await seedResponse.json()

      if (seedResponse.ok) {
        setMessage({
          type: 'success',
          text: '✅ Database reset and seeded successfully!',
        })
      } else {
        setMessage({ type: 'error', text: `Seed failed: ${seedData.error}` })
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Network error during reset and seed' })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleBookingSeed = async () => {
    if (!confirm('This will seed booking packages and availability rules. Continue?')) {
      return
    }

    setIsBookingSeeding(true)
    setMessage(null)

    try {
      const response = await fetch('/api/seed-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Booking data seeded successfully!',
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to seed booking data' })
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Network error: Failed to seed booking data' })
    } finally {
      setIsBookingSeeding(false)
    }
  }

  const handleBookingReset = async () => {
    if (
      !confirm(
        '⚠️ This will DELETE ALL booking data (packages, customers, availability rules, bookings). Are you sure?',
      )
    ) {
      return
    }

    setIsBookingResetting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/reset-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Booking data reset successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset booking data' })
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Network error: Failed to reset booking data' })
    } finally {
      setIsBookingResetting(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
        Database Management
      </h2>

      <div
        style={{
          padding: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <p style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
          <strong>Admin-only tools</strong> for managing database content.
        </p>
        <ul style={{ marginLeft: '20px', fontSize: '14px', color: '#6b7280' }}>
          <li>
            <strong>Resume Data:</strong> Reset clears Resume Profile and deletes all experiences,
            projects, education, and certifications. Seed populates complete resume data.
          </li>
          <li>
            <strong>Booking Data:</strong> Reset deletes all packages, customers, availability
            rules, and bookings. Seed creates sample packages and availability rules.
          </li>
        </ul>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '6px',
            backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
          Resume Data
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetAndSeed}
            disabled={isResetting || isSeeding}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: isResetting || isSeeding ? 'not-allowed' : 'pointer',
              backgroundColor: isResetting || isSeeding ? '#9ca3af' : '#3b82f6',
              color: 'white',
              opacity: isResetting || isSeeding ? 0.6 : 1,
            }}
          >
            {isResetting || isSeeding ? '⏳ Processing...' : '🔄 Reset & Seed Resume'}
          </button>

          <button
            onClick={handleReset}
            disabled={isResetting || isSeeding}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              cursor: isResetting || isSeeding ? 'not-allowed' : 'pointer',
              backgroundColor: isResetting || isSeeding ? '#f3f4f6' : 'white',
              color: isResetting || isSeeding ? '#9ca3af' : '#374151',
              opacity: isResetting || isSeeding ? 0.6 : 1,
            }}
          >
            {isResetting ? '⏳ Resetting...' : '🗑️ Reset Resume'}
          </button>

          <button
            onClick={handleSeed}
            disabled={isResetting || isSeeding}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              cursor: isResetting || isSeeding ? 'not-allowed' : 'pointer',
              backgroundColor: isResetting || isSeeding ? '#f3f4f6' : 'white',
              color: isResetting || isSeeding ? '#9ca3af' : '#374151',
              opacity: isResetting || isSeeding ? 0.6 : 1,
            }}
          >
            {isSeeding ? '⏳ Seeding...' : '🌱 Seed Resume'}
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
          Booking Data
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBookingSeed}
            disabled={isBookingSeeding || isBookingResetting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: isBookingSeeding || isBookingResetting ? 'not-allowed' : 'pointer',
              backgroundColor: isBookingSeeding || isBookingResetting ? '#9ca3af' : '#10b981',
              color: 'white',
              opacity: isBookingSeeding || isBookingResetting ? 0.6 : 1,
            }}
          >
            {isBookingSeeding ? '⏳ Seeding...' : '🌱 Seed Booking Data'}
          </button>

          <button
            onClick={handleBookingReset}
            disabled={isBookingSeeding || isBookingResetting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              cursor: isBookingSeeding || isBookingResetting ? 'not-allowed' : 'pointer',
              backgroundColor: isBookingSeeding || isBookingResetting ? '#f3f4f6' : 'white',
              color: isBookingSeeding || isBookingResetting ? '#9ca3af' : '#374151',
              opacity: isBookingSeeding || isBookingResetting ? 0.6 : 1,
            }}
          >
            {isBookingResetting ? '⏳ Resetting...' : '🗑️ Reset Booking Data'}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#92400e',
        }}
      >
        <strong>⚠️ Warning:</strong> Reset operations cannot be undone. Always backup important data
        before resetting.
      </div>
    </div>
  )
}

export default DatabaseManager
