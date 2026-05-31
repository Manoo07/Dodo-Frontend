import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '../../lib/cn'

type MarkdownViewProps = {
  content: string
  className?: string
}

export default function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <div className={cn('markdown-body', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
