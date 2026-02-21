'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Star, CheckCircle2 } from 'lucide-react'

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    setErrorMsg(null)
  }

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return

    setSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          rating,
          page: window.location.pathname + window.location.search,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2200)
      } else {
        setErrorMsg('Failed to send. Please try again.')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40" ref={modalRef}>
      {/* Modal */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 rounded-xl border border-zinc-200/60 dark:border-white/[0.1] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              {/* Animated green checkmark */}
              <div className="relative mb-3">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" style={{ animationDuration: '1.2s', animationIterationCount: '1' }} />
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700/40 animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500 animate-in zoom-in duration-500" style={{ animationDelay: '150ms' }} />
                </div>
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '200ms' }}>
                Feedback sent!
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
                Thank you for helping us improve
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Send Feedback
                </h3>
                <button
                  onClick={handleClose}
                  className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] transition-colors"
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
                  className="w-full resize-none rounded-lg border border-zinc-200/60 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.04] px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-zinc-300/60 dark:focus:ring-white/[0.12] transition-shadow"
                />
              </div>

              {/* Star rating */}
              <div className="px-4 pb-3 flex items-center gap-1">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-1.5">Rating</span>
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

              {/* Error message */}
              {errorMsg && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-red-500 dark:text-red-400">{errorMsg}</p>
                </div>
              )}

              {/* Submit */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                  className="w-full rounded-lg bg-zinc-900 dark:bg-white/[0.1] text-white dark:text-zinc-200 text-sm font-medium py-2 px-4 border border-transparent dark:border-white/[0.08] hover:bg-zinc-800 dark:hover:bg-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : 'Submit'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/[0.1] shadow-lg backdrop-blur-xl hover:bg-white/90 dark:hover:bg-white/[0.12] hover:border-zinc-300/60 dark:hover:border-white/[0.15] transition-all duration-200"
        aria-label="Send feedback"
      >
        <MessageCircle className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}
