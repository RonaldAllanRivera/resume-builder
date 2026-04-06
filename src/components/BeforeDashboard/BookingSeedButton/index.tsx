'use client'

import React, { Fragment, useCallback, useState } from 'react'
import { toast, useAuth } from '@payloadcms/ui'

import './index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Booking data seeded! You can now{' '}
    <a target="_blank" href="/pricing">
      visit the pricing page
    </a>
  </div>
)

export const BookingSeedButton: React.FC = () => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const isAdmin = Array.isArray((user as { roles?: string[] } | null | undefined)?.roles)
    ? ((user as { roles?: string[] }).roles ?? []).includes('admin')
    : false

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (!isAdmin) {
        toast.error('Action forbidden.')
        return
      }

      if (seeded) {
        toast.info('Booking data already seeded.')
        return
      }
      if (loading) {
        toast.info('Seeding already in progress.')
        return
      }
      if (error) {
        toast.error(`An error occurred, please refresh and try again.`)
        return
      }

      setLoading(true)

      try {
        toast.promise(
          new Promise((resolve, reject) => {
            try {
              fetch('/api/seed-booking', { method: 'POST', credentials: 'include' })
                .then(async (res) => {
                  if (res.ok) {
                    const data = await res.json()
                    resolve(data)
                    setSeeded(true)
                  } else {
                    const data = await res.json().catch(() => ({}))
                    reject(data.error || 'An error occurred while seeding booking data.')
                  }
                })
                .catch((error) => {
                  reject(error)
                })
            } catch (error) {
              reject(error)
            }
          }),
          {
            loading: 'Seeding packages & availability rules...',
            success: <SuccessMessage />,
            error: 'An error occurred while seeding booking data.',
          },
        )
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        setError(error)
      }
    },
    [loading, seeded, error, isAdmin],
  )

  if (!isAdmin) return null

  let message = ''
  if (loading) message = ' (seeding...)'
  if (seeded) message = ' (done!)'
  if (error) message = ` (error: ${error})`

  return (
    <Fragment>
      <button className="seedButton" onClick={handleClick}>
        Seed booking data
      </button>
      {message}
    </Fragment>
  )
}
