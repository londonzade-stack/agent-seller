'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Star } from 'lucide-react'

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    setMessage('')
    setRating(null)
    setHoveredStar(null)
    setSuccess(false)
  }

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          rating,
          page: window.location.pathname,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40" ref={modalRef}>
      {/* Modal */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {success ? (
            <div className="flex items-center justify-center py-10 px-4">
              <p className="text-sm font-medium text-stone-700 dark:text-zinc-300">
                Thanks for your feedback!
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
                  Send Feedback
                </h3>
                <button
                  onClick={handleClose}
                  className="h-6 w-6 flex items-center justify-center rounded-md text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Textarea */}
              <div className="px-4 pb-3">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="What can we improve?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-stone-300 dark:focus:ring-zinc-600 transition-shadow"
                />
              </div>

              {/* Star rating */}
              <div className="px-4 pb-3 flex items-center gap-1">
                <span className="text-xs text-stone-400 dark:text-zinc-500 mr-1.5">Rating</span>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(rating === star ? null : star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-4 w-4 transition-colors ${
                        (hoveredStar !== null ? star <= hoveredStar : rating !== null && star <= rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-none text-stone-300 dark:text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Submit */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                  className="w-full rounded-lg bg-stone-900 dark:bg-zinc-100 text-white dark:text-black text-sm font-medium py-2 px-4 hover:bg-stone-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="h-11 w-11 flex items-center justify-center rounded-full bg-stone-800 dark:bg-zinc-200 text-white dark:text-black shadow-lg hover:bg-stone-700 dark:hover:bg-zinc-300 transition-colors"
        aria-label="Send feedback"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  )
}
