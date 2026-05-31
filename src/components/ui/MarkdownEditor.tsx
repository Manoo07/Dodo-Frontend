import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Underline from '@tiptap/extension-underline'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import { TableKit } from '@tiptap/extension-table'
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'
import { cn } from '../../lib/cn'
import MarkdownHintBar from './MarkdownHintBar'
import { DeferredBulletList, ExtendedTaskItem } from './markdownEditorExtensions'

const lowlight = createLowlight(common)

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  editorKey: string
  className?: string
  placeholder?: string
}

export default function MarkdownEditor({
  value,
  onChange,
  onBlur,
  editorKey,
  className,
  placeholder = 'Write something, or type / for blocks…',
}: MarkdownEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!value.trim())

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          bulletList: false,
          heading: { levels: [1, 2, 3, 4] },
        }),
        DeferredBulletList,
        Underline,
        Typography,
        Highlight.configure({ multicolor: false }),
        Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
        TaskList,
        ExtendedTaskItem.configure({ nested: true }),
        CodeBlockLowlight.configure({ lowlight }),
        TableKit.configure({ resizable: false }),
        Placeholder.configure({ placeholder }),
        Markdown.configure({
          html: false,
          transformPastedText: true,
          transformCopiedText: true,
          breaks: true,
        }),
      ],
      content: value || '',
      editorProps: {
        attributes: {
          class: 'outline-none min-h-[80px] py-0.5',
        },
        handleDOMEvents: {
          focus: () => {
            setIsFocused(true)
            return false
          },
          blur: () => {
            setIsFocused(false)
            onBlur?.()
            return false
          },
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.storage.markdown.getMarkdown())
        setIsEmpty(ed.isEmpty)
      },
    },
    [editorKey],
  )

  return (
    <div
      className={cn(
        'markdown-editor flex-1 min-h-20 w-full mt-3 flex flex-col',
        className,
      )}
      onClick={() => editor?.commands.focus()}
    >
      {isEmpty && !isFocused && <MarkdownHintBar />}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
