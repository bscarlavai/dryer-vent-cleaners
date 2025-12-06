'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'

interface ReportProblemModalProps {
  isOpen: boolean
  onClose: () => void
  locationId?: string | null
  isGlobal?: boolean
}

export default function ReportProblemModal({ isOpen, onClose, locationId, isGlobal = false }: ReportProblemModalProps) {
  const [feedbackForm, setFeedbackForm] = useState({ feedback: '', email: '' })
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingFeedback(true)
    setFeedbackMessage('')
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('location_feedbacks')
        .insert({
          location_id: locationId,
          feedback: feedbackForm.feedback,
          email: feedbackForm.email || null
        })
      if (error) {
        setFeedbackMessage('Error submitting feedback. Please try again.')
      } else {
        setFeedbackMessage('Thank you for your feedback!')
        setFeedbackForm({ feedback: '', email: '' })
        setTimeout(() => onClose(), 1500)
      }
    } catch {
      setFeedbackMessage('Error submitting feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto">
        <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Report a Problem</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleFeedbackSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>Note:</strong> {isGlobal
              ? "If you want to leave a review for a specific dryer vent cleaning service, please visit that location's page and use the \"Leave Review\" button."
              : "If you want to leave a review for this dryer vent cleaning service, please use the \"Leave Review\" button."
            }
          </div>
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Problem Description *
            </label>
            <textarea
              id="feedback"
              required
              value={feedbackForm.feedback}
              onChange={e => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
              placeholder={isGlobal 
                ? "Describe the problem you're experiencing..."
                : "Describe the problem you're experiencing with this location..."
              }
            />
          </div>
          <div>
            <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              id="feedback-email"
              value={feedbackForm.email}
              onChange={e => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="If you'd like a reply, enter your email"
            />
          </div>
          {feedbackMessage && (
            <div className="p-3 rounded-lg text-sm text-center "
              style={{ color: feedbackMessage.includes('Thank you') ? '#15803d' : '#dc2626', background: feedbackMessage.includes('Thank you') ? '#f0fdf4' : '#fef2f2' }}>
              {feedbackMessage}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingFeedback}
              className="bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isSubmittingFeedback ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 