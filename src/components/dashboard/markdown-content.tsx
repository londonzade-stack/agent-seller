'use client'

import React, { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Fullscreen table modal
function TableModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Modal */}
      <div
        className="relative w-full max-w-[90vw] max-h-[85vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-stone-200 dark:border-zinc-700 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/50">
          <span className="text-xs font-medium text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Table View</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            title="Close (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        {/* Table content */}
        <div className="overflow-auto flex-1 p-4">
          <table className="w-full border-collapse text-sm">
            {children}
          </table>
        </div>
      </div>
    </div>
  )
}

// Interactive table wrapper with expand button
function ExpandableTable({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), [])

  return (
    <>
      <div className="group/table relative my-3 -mx-1 rounded-lg border border-stone-200 dark:border-zinc-800">
        {/* Expand button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white/80 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-200 opacity-0 group-hover/table:opacity-100 transition-all shadow-sm hover:shadow backdrop-blur-sm"
          title="Expand table"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 1.5H12.5V5.5" />
            <path d="M5.5 12.5H1.5V8.5" />
            <path d="M12.5 1.5L8 6" />
            <path d="M1.5 12.5L6 8" />
          </svg>
        </button>
        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full border-collapse text-sm" {...props}>{children}</table>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <TableModal onClose={toggleFullscreen}>
          {children}
        </TableModal>
      )}
    </>
  )
}

export const markdownComponents = {
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
    <ExpandableTable {...props}>{children}</ExpandableTable>
  ),
  thead: ({ children, ...props }: React.ComponentPropsWithoutRef<'thead'>) => (
    <thead className="bg-stone-50 dark:bg-zinc-800/50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b border-stone-200 dark:border-zinc-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-500" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-stone-100 dark:border-zinc-800/50 px-3 py-2 text-sm" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) => (
    <tr className="even:bg-stone-50/50 dark:even:bg-zinc-800/20 hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors" {...props}>{children}</tr>
  ),
  p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="my-1.5 leading-relaxed" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-stone-900 dark:text-white" {...props}>{children}</strong>
  ),
  a: ({ children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a {...props} className="text-stone-900 dark:text-white underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  ul: ({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-1.5 ml-4 list-disc space-y-0.5" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-1.5 ml-4 list-decimal space-y-0.5" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="text-sm" {...props}>{children}</li>
  ),
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="text-lg font-semibold mt-3 mb-1.5" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-base font-semibold mt-3 mb-1.5" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-sm font-semibold mt-2 mb-1" {...props}>{children}</h3>
  ),
  code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    const isInline = !className
    return isInline
      ? <code className="bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
      : <code className={className} {...props}>{children}</code>
  },
  pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-2 bg-stone-100 dark:bg-zinc-800 rounded-lg p-3 overflow-x-auto text-xs max-w-full" {...props}>{children}</pre>
  ),
  blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-2 border-l-2 border-stone-300 dark:border-zinc-600 bg-stone-50 dark:bg-zinc-900/30 pl-3 py-1 text-sm" {...props}>{children}</blockquote>
  ),
  hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-3 border-stone-200 dark:border-zinc-800" {...props} />
  ),
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="max-w-none text-sm break-words overflow-hidden [&>*]:max-w-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  )
}
