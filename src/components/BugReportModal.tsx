import { useState } from 'react'
import type { BugReport } from '../lib/api'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (report: BugReport) => Promise<void>
  userId?: string | null
}

export default function BugReportModal({ isOpen, onClose, onSubmit, userId }: BugReportModalProps) {
  const [description, setDescription] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    if (!description.trim()) {
      setError('Please enter a description of the bug.')
      setSubmitting(false)
      return
    }
    try {
      await onSubmit({
        description: description.trim(),
        contact_info: contactInfo.trim() ? contactInfo.trim() : null,
        user_id: userId || undefined
      })
      setSuccess(true)
      setDescription('')
      setContactInfo('')
    } catch (err) {
      setError('Failed to submit bug report. Please try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-6 w-auto relative">
        <button
          className="small-button absolute top-2 right-2 hover:text-white text-xl w-10 h-10"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-2 text-center">Report a Bug</h2>
        <p className="text-sm text-gray-400 mb-4 text-center">
          Found a bug? Please describe it below. Optionally, leave contact info if you want a follow-up.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="bg-gray-800 rounded p-2 text-white resize-vertical min-h-[80px]"
            placeholder="Describe the bug..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            disabled={submitting}
          />
          <input
            className="bg-gray-800 rounded p-2 text-white"
            type="text"
            placeholder="Contact info (optional)"
            value={contactInfo}
            onChange={e => setContactInfo(e.target.value)}
            disabled={submitting}
          />
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          {success && <div className="text-green-400 text-sm text-center">Thank you for your report!</div>}
          <div className="flex gap-2 justify-center mt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
