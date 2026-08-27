import { isValidElement, type ReactNode } from "react"
import Link from "next/link"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

// react-markdown wraps top-level images in <p>, which is invalid HTML once
// we render them as <figure>. If a paragraph contains only a media node,
// unwrap to a plain fragment to keep the markup valid.
function isMediaOnlyChild(child: ReactNode): boolean {
  if (!isValidElement(child)) return false
  const type = (child as { type?: { name?: string } | string }).type
  if (typeof type === "string") return type === "img" || type === "figure"
  if (typeof type === "function") {
    const name = (type as { name?: string }).name
    return name === "img" || name === "figure"
  }
  return false
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="font-display mt-12 mb-5 text-[36px] font-light leading-[1.12] tracking-[-0.02em] text-foreground"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="font-display mt-12 mb-4 text-[28px] font-light leading-[1.15] tracking-[-0.02em] text-foreground"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mt-9 mb-3 text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => {
    const arr = Array.isArray(children) ? children : [children]
    const onlyMedia =
      arr.filter((c) => c !== "" && c !== "\n").every(isMediaOnlyChild)
    if (onlyMedia) return <>{children}</>
    return (
      <p className="my-5 text-[17px] leading-[1.7] text-foreground/85">
        {children}
      </p>
    )
  },
  ul: ({ children }) => (
    <ul className="my-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.7] text-foreground/85">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-5 list-decimal space-y-2 pl-6 text-[17px] leading-[1.7] text-foreground/85">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-7 border-l-2 border-foreground/30 pl-5 text-[17px] italic leading-[1.7] text-foreground/75">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    const url = href ?? "#"
    const isInternal = url.startsWith("/") || url.startsWith("#")
    if (isInternal) {
      return (
        <Link
          href={url}
          className="text-foreground underline decoration-foreground/40 underline-offset-4 transition hover:decoration-foreground"
        >
          {children}
        </Link>
      )
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline decoration-foreground/40 underline-offset-4 transition hover:decoration-foreground"
      >
        {children}
      </a>
    )
  },
  code: ({ children }) => (
    <code className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-2xl border border-border bg-muted p-5 font-mono text-[14px] leading-[1.6]">
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-8 overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full border-collapse text-[15px]" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3.5 text-left text-[13px] font-semibold uppercase tracking-wider text-foreground/60 first:pl-6 last:pr-6"
      {...props}
    >
      {children}
    </th>
  ),
  tr: ({ children, ...props }) => (
    <tr
      className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/50"
      {...props}
    >
      {children}
    </tr>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-4 py-3 text-foreground/85 first:pl-6 last:pr-6"
      {...props}
    >
      {children}
    </td>
  ),
  hr: () => <hr className="my-12 border-border" />,
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null
    return (
      <figure className="my-10 overflow-hidden rounded-2xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} loading="lazy" className="h-auto w-full" />
        {alt && (
          <figcaption className="px-5 py-3 text-[13px] text-muted-foreground">
            {alt}
          </figcaption>
        )}
      </figure>
    )
  },
}

export function PostBody({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
