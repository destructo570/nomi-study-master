import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { BlogShell } from "@/components/blog/blog-shell"
import { PostBody } from "@/components/blog/post-body"
import { formatPublishedDate, getPostBySlug, listAllSlugs } from "@/lib/blog"

const SITE_URL = "https://www.nomistudy.com"

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: "Not found" }

  const url = `${SITE_URL}/blog/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      tags: post.tags,
      ...(post.coverImage
        ? {
            images: [
              { url: post.coverImage, alt: post.coverAlt ?? post.title },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const url = `${SITE_URL}/blog/${post.slug}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: post.author, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "nomi",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/nomi-logo.svg` },
    },
    ...(post.coverImage ? { image: [post.coverImage] } : {}),
    keywords: post.tags.join(", "),
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: post.title,
        item: url,
      },
    ],
  }

  const faqLd =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null

  const howToLd = post.howTo
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: post.howTo.name,
        step: post.howTo.steps.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: text.split("—")[0]?.trim() ?? `Step ${i + 1}`,
          text,
        })),
      }
    : null

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      {howToLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      )}

      <nav
        aria-label="Breadcrumb"
        className="text-[13px] text-muted-foreground"
      >
        <Link href="/blog" className="hover:text-foreground">
          ← All articles
        </Link>
      </nav>

      <article className="mt-8">
        <header className="border-b border-border pb-10">
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
            <time dateTime={post.publishedAt.toISOString()}>
              {formatPublishedDate(post.publishedAt)}
            </time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] tracking-wider uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-[36px] leading-[1.1] font-light tracking-[-0.02em] sm:text-[52px]">
            {post.title}
          </h1>
          {/* <p className="mt-5 max-w-2xl text-[16px] leading-[1.6] text-muted-foreground sm:text-[18px]">
            {post.description}
          </p> */}
          <div className="mt-6 text-[13px] text-muted-foreground">
            By <span className="text-foreground">{post.author}</span>
          </div>
        </header>

        {post.coverImage && (
          <figure className="mt-10 overflow-hidden rounded-3xl border border-border bg-muted">
            <Image
              src={post.coverImage}
              alt={post.coverAlt ?? post.title}
              width={1600}
              height={900}
              priority
              className="h-auto w-full"
            />
          </figure>
        )}

        <div className="mt-2">
          <PostBody content={post.content} />
        </div>
      </article>

      <aside className="mt-16 rounded-3xl border border-border bg-muted/40 px-6 py-10 sm:px-10 sm:py-12">
        <div className="grid items-center gap-8 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-10">
          <div className="flex justify-center sm:justify-start">
            <Image
              src="/images/tiger-learning.webp"
              alt="Tiger studying on a couch with a laptop"
              width={420}
              height={420}
              className="h-auto w-[160px] sm:w-[180px]"
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Try nomi
            </p>
            <h2 className="mt-4 font-display text-[26px] leading-[1.15] font-light tracking-[-0.02em] sm:text-[32px]">
              Turn your next PDF into a study deck in under a minute.
            </h2>
            <div className="mt-7">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-full px-6 text-sm"
                )}
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </BlogShell>
  )
}
