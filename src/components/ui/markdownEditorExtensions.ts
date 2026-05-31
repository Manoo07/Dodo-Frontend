import { BulletList, TaskItem } from '@tiptap/extension-list'
import { wrappingInputRule } from '@tiptap/core'

/** Wait for text after `- ` so `- [ ]` can become a task list instead of a bullet. */
export const DeferredBulletList = BulletList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*([-+*])\s(?=[^\s\[])/,
        type: this.type,
      }),
    ]
  },
})

/** Support standard markdown `- [ ]` / `- [x]` task syntax at line start. */
export const ExtendedTaskItem = TaskItem.extend({
  addInputRules() {
    const parentRules = this.parent?.() ?? []
    return [
      ...parentRules,
      wrappingInputRule({
        find: /^\s*([-+*])\s+\[( |x)\]\s$/i,
        type: this.type,
        getAttributes: (match) => ({
          checked: match[2]?.toLowerCase() === 'x',
        }),
      }),
    ]
  },
})

export const MARKDOWN_HINTS = [
  { syntax: '#', label: 'H1' },
  { syntax: '##', label: 'H2' },
  { syntax: '###', label: 'H3' },
  { syntax: '**text**', label: 'bold' },
  { syntax: '*text*', label: 'italic' },
  { syntax: '`code`', label: 'code' },
  { syntax: '- item', label: 'list' },
  { syntax: '- [ ]', label: 'checkbox' },
  { syntax: '>', label: 'quote' },
  { syntax: '```', label: 'code block' },
] as const

export const MARKDOWN_HINT_DISMISSED_KEY = 'tasknest-md-hint-dismissed'
