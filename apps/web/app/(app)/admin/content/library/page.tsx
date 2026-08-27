import Link from "next/link"

import { contentApi } from "@/lib/api/admin-content"

export const dynamic = "force-dynamic"
export const metadata = { title: "Content Library" }

type Row = { id: string; type: string; slug: string; title: string; status: string; score: number | null; createdAt: string; kind: string }

export default async function ContentLibraryPage() {
  let posts: Row[] = []
  let seoPages: Row[] = []
  try {
    const lib = await contentApi.library()
    posts = (lib.posts as unknown[]).map((r) => {
      const x = r as { id: string; slug: string; title: string; published: boolean; createdAt: string }
      return { id: x.id, type: "blog", slug: x.slug, title: x.title ?? x.slug, status: x.published ? "published" : "draft", score: null, createdAt: x.createdAt, kind: "post" }
    })
    seoPages = (lib.seoPages as unknown[]).map((r) => {
      const x = r as { id: string; type: string; slug: string; title: string; published: boolean; createdAt: string; score: number | null }
      return { id: x.id, type: x.type, slug: x.slug, title: x.title, status: x.published ? "published" : "draft", score: x.score, createdAt: x.createdAt, kind: "seopage" }
    })
  } catch {
    // backend unreachable
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Link href="/admin/content" className="hover:text-foreground">Content</Link>
          <span>/</span>
          <span className="text-foreground">Library</span>
        </div>
        <h1 className="font-display text-[28px] font-light tracking-[-0.02em] md:text-[32px]">
          Content library
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {posts.length} blog posts · {seoPages.length} generated SEO pages.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">SEO pages</h2>
        {seoPages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
            No generated pages yet.{" "}
            <Link href="/admin/content/generate" className="underline hover:text-foreground">Generate one</Link>.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {seoPages.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2 font-mono text-[12px]">{r.slug}</td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.score ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">Blog posts</h2>
        {posts.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No blog posts.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-[12px]">{r.slug}</td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2 text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}