'use client'

import dynamic from 'next/dynamic'

type MarkdownProps = {
  children: string
  className?: string
}

const Markdown = dynamic<MarkdownProps>(
  () => import('react-markdown').then((mod) => mod.default),
  {
    loading: () => <div className="markdown-skeleton skeleton" />,
  }
)

export default function LazyMarkdown(props: MarkdownProps) {
  return <Markdown {...props} />
}
