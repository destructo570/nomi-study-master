import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { BlogShell } from "@/components/blog/blog-shell"
import { formatPublishedDate, listPublishedPosts } from "@/lib/blog"

const SITE_URL = "https://www.nomistudy.com"
const PAGE_TITLE = "Blog"
const PAGE_DESCRIPTION =
  "Field notes on AI-assisted studying, spaced repetition, active recall, and how to actually remember what you read. Written by the nomi team."

export const revalidate = 300

export const metadata: Metadata = {
  title: "AI study tips & spaced repetition field notes",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "nomi blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${SITE_URL}/opengraph-image`],
  },
  robots: { index: true, follow: true },
}

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "nomi blog",
    url: `${SITE_URL}/blog`,
    description: PAGE_DESCRIPTION,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.publishedAt.toISOString(),
      author: { "@type": "Organization", name: p.author },
    })),
  }

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="pb-2">
        <h1 className="font-display text-[32px] font-light leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
          {PAGE_TITLE}
        </h1>
      </header>

      {posts.length === 0 ? (
        <p className="mt-10 text-[15px] text-muted-foreground">
          No posts yet - come back soon.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-b border-border">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex items-start gap-5 py-6 transition sm:gap-6"
              >
                {post.coverImage && (
                  <div className="shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image
                      src={post.coverImage}
                      alt={post.coverAlt ?? post.title}
                      width={320}
                      height={320}
                      className="size-[88px] object-cover transition duration-500 group-hover:scale-[1.04] sm:size-[112px]"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] text-foreground transition group-hover:underline group-hover:underline-offset-[6px] sm:text-[28px]">
                    {post.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.55] text-muted-foreground sm:text-[15px]">
                    {post.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                    <time dateTime={post.publishedAt.toISOString()}>
                      {formatPublishedDate(post.publishedAt)}
                    </time>
                    <span aria-hidden>·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlogShell>
  )
}
