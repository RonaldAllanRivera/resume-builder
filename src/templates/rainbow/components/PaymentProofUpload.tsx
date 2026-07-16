'use client'

import { useState } from 'react'

interface PaymentProofUploadProps {
  token: string
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function PaymentProofUpload({ token }: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setError('')

    if (selected && !ACCEPTED_TYPES.includes(selected.type)) {
      setFile(null)
      setError('Please choose a PNG, JPEG, or WebP image.')
      return
    }

    setFile(selected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please choose a screenshot to upload.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('file', file)

      const res = await fetch('/api/bookings/proof', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Failed to upload your screenshot. Please try again.')
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
        <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Receipt Uploaded</h2>
        <p className="text-white/70 max-w-md mx-auto">
          Thanks &mdash; your receipt is under review. I&rsquo;ll confirm by email once
          I&rsquo;ve checked it against my account.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Upload Payment Proof</h1>
      <p className="text-white/60 text-sm mb-8">
        Upload a screenshot of your payment (PNG, JPEG, or WebP, up to 10 MB).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="proof-file" className="block text-sm font-medium text-white/80 mb-1">
            Payment screenshot <span className="text-red-400">*</span>
          </label>
          <input
            id="proof-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:font-semibold file:text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            required
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !file}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-[0_0_20px_rgba(100,180,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Uploading…' : 'Upload Receipt'}
        </button>

        <p className="text-white/40 text-xs">
          This submits a claim of payment for review &mdash; it does not settle your payment.
          I&rsquo;ll check it against my own bank/GCash records and follow up by email.
        </p>
      </form>
    </div>
  )
}
