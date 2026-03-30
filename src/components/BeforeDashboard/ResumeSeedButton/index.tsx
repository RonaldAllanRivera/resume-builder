'use client'

import React, { Fragment, useCallback, useState } from 'react'
import { toast, useAuth } from '@payloadcms/ui'

import './index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Resume data seeded! You can now{' '}
    <a target="_blank" href="/">
      visit your website
    </a>
  </div>
)

export const ResumeSeedButton: React.FC = () => {
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
        toast.info('Resume data already seeded.')
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
              fetch('/api/seed-resume', { method: 'POST', credentials: 'include' })
                .then((res) => {
                  if (res.ok) {
                    resolve(true)
                    setSeeded(true)
                  } else {
                    reject('An error occurred while seeding resume data.')
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
            loading: 'Seeding resume data...',
            success: <SuccessMessage />,
            error: 'An error occurred while seeding resume data.',
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
        Seed resume data
      </button>
      {message}
    </Fragment>
  )
}
