import { useState } from 'react'
import { X } from 'lucide-react'
import { MARKDOWN_HINTS, MARKDOWN_HINT_DISMISSED_KEY } from './markdownEditorExtensions'

export default function MarkdownHintBar() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(MARKDOWN_HINT_DISMISSED_KEY) === '1',
  )

  if (dismissed) return null

  function dismiss() {
    localStorage.setItem(MARKDOWN_HINT_DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="markdown-hint-bar">
      <p className="markdown-hint-bar__title">Markdown shortcuts</p>
      <div className="markdown-hint-bar__items">
        {MARKDOWN_HINTS.map((hint) => (
          <span key={hint.syntax} className="markdown-hint-bar__item">
            <code>{hint.syntax}</code>
            <span>{hint.label}</span>
          </span>
        ))}
      </div>
      <button type="button" onClick={dismiss} className="markdown-hint-bar__dismiss" aria-label="Dismiss hints">
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  )
}
