"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  api,
  type LlmTestDocument,
  type LlmTestRating,
  type LlmTestResponse,
} from "@/lib/api"
import { useMe } from "@/lib/hooks/use-me"

const RATING_BUTTONS: Array<{
  rating: LlmTestRating
  label: string
  variant: "default" | "secondary" | "outline" | "destructive"
}> = [
  { rating: "correct", label: "✅ Correct", variant: "default" },
  { rating: "partial", label: "⚠️ Partial", variant: "secondary" },
  { rating: "wrong", label: "❌ Wrong", variant: "outline" },
  { rating: "hallucination", label: "🚫 Hallucination", variant: "destructive" },
]

const DOCS_KEY = ["llm-test", "documents"] as const
const RAW_MAX_CHARS = 50_000
const RAW_INPUT_STORAGE_KEY = "llm-test:raw-input"
const RAW_PLACEHOLDER = `Paste raw text or JSON. Example:
{ "pages": [{ "page": 1, "text": "..." }] }`

type Mode = "document" | "raw"

function formatPreview(text: string, n = 150) {
  const cleaned = text.replace(/\s+/g, " ").trim()
  return cleaned.length <= n ? cleaned : `${cleaned.slice(0, n)}…`
}

function formatLatency(ms: number) {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function StatusBadge({ status }: { status: string }) {
  const variant: "default" | "secondary" | "destructive" | "outline" =
    status === "ready"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary"
  return <Badge variant={variant}>{status}</Badge>
}

type RawValidation = {
  valid: boolean
  format: "structured" | "plain" | "empty" | "invalid"
  error?: string
}

function validateRawInput(input: string): RawValidation {
  if (input.length === 0) {
    return { valid: false, format: "empty", error: "Input is empty" }
  }
  if (input.length > RAW_MAX_CHARS) {
    return {
      valid: false,
      format: "invalid",
      error: `Input is too long (${input.length.toLocaleString()} > ${RAW_MAX_CHARS.toLocaleString()} chars)`,
    }
  }
  const trimmed = input.trim()
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { pages?: unknown }
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return { valid: true, format: "structured" }
      }
      return { valid: true, format: "plain" }
    } catch {
      return { valid: true, format: "plain" }
    }
  }
  return { valid: true, format: "plain" }
}

export default function LlmTestPage() {
  const meQuery = useMe()
  const me = meQuery.data
  if (meQuery.isLoading) return null
  if (!me || me.role !== "admin") {
    return (
      <div className="p-8 text-sm text-gravel">
        This page is only available to admin users.
      </div>
    )
  }
  return <LlmTestPageInner />
}

function LlmTestPageInner() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<Mode>("document")
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [rawInput, setRawInput] = useState("")
  const [skipRetrieval, setSkipRetrieval] = useState(false)
  const [result, setResult] = useState<LlmTestResponse | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const resultsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.sessionStorage.getItem(RAW_INPUT_STORAGE_KEY)
    if (stored) setRawInput(stored)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.sessionStorage.setItem(RAW_INPUT_STORAGE_KEY, rawInput)
  }, [rawInput])

  const docsQuery = useQuery<LlmTestDocument[]>({
    queryKey: DOCS_KEY,
    queryFn: () => api.llmTestListDocuments(),
    enabled: mode === "document",
  })

  const documents = docsQuery.data ?? []
  const selectedDoc = useMemo(
    () => documents.find((d) => d.id === selectedDocId) ?? null,
    [documents, selectedDocId],
  )

  const canRunDocument =
    mode === "document" &&
    !!selectedDoc &&
    selectedDoc.status === "ready" &&
    selectedDoc.chunkCount > 0

  const rawValidation = useMemo(() => validateRawInput(rawInput), [rawInput])
  const canRunRaw = mode === "raw" && rawValidation.valid

  const queryMutation = useMutation({
    mutationFn: async (variables: { kind: "query" | "no-answer" }) => {
      if (mode === "document") {
        if (!selectedDocId) throw new Error("Select a document first")
        if (variables.kind === "query") {
          return api.llmTestQuery({
            docId: selectedDocId,
            query: query.trim(),
          })
        }
        return api.llmTestNoAnswer({ docId: selectedDocId })
      }
      if (!rawValidation.valid) {
        throw new Error(rawValidation.error ?? "Invalid input")
      }
      return api.llmTestRaw({
        input: rawInput,
        query: variables.kind === "query" ? query.trim() : undefined,
        skipRetrieval,
        noAnswer: variables.kind === "no-answer",
      })
    },
    onSuccess: (data) => {
      setResult(data)
      setExpanded(new Set())
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Test failed")
    },
  })

  const evalMutation = useMutation({
    mutationFn: (rating: LlmTestRating) => {
      if (!result) throw new Error("No result to evaluate")
      const docId = mode === "document" ? selectedDocId : "__raw__"
      if (!docId) throw new Error("Missing target")
      return api.llmTestEval({
        docId,
        query: result.query,
        rating,
        answer: result.answer,
      })
    },
    onSuccess: (_data, rating) => {
      toast.success(`Recorded: ${rating}`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Eval failed")
    },
  })

  const isPending = queryMutation.isPending
  const pendingKind = isPending ? queryMutation.variables?.kind : undefined

  const runTest = () => {
    if (isPending) return
    if (mode === "document") {
      if (!canRunDocument || !query.trim()) return
    } else {
      if (!canRunRaw || !query.trim()) return
    }
    queryMutation.mutate({ kind: "query" })
  }

  const runNoAnswer = () => {
    if (isPending) return
    if (mode === "document") {
      if (!canRunDocument) return
    } else {
      if (!canRunRaw) return
    }
    queryMutation.mutate({ kind: "no-answer" })
  }

  useEffect(() => {
    setResult(null)
    setExpanded(new Set())
  }, [selectedDocId])

  const handleModeChange = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    setResult(null)
    setExpanded(new Set())
    setQuery("")
  }

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const citedSet = useMemo(
    () => new Set(result?.metrics.citedIndices ?? []),
    [result],
  )

  const citedPages = useMemo(() => {
    if (!result) return []
    return result.metrics.citedIndices
      .map((i) => result.chunks[i - 1]?.page)
      .filter((p): p is number => typeof p === "number")
  }, [result])

  const canRun = mode === "document" ? canRunDocument : canRunRaw

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">LLM Test</h1>
          <p className="text-sm text-muted-foreground">
            Internal RAG inspection - not user-facing.
          </p>
        </div>
        {mode === "document" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: DOCS_KEY })}
            disabled={docsQuery.isFetching}
          >
            {docsQuery.isFetching ? "Refreshing…" : "Refresh documents"}
          </Button>
        )}
      </header>

      <Tabs value={mode} onValueChange={(v) => handleModeChange(v as Mode)}>
        <TabsList>
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="raw">Raw Input</TabsTrigger>
        </TabsList>

        <TabsContent value="document" className="flex flex-col gap-6 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Document</CardTitle>
              <CardDescription>
                Pick a source. Testing is disabled until status is{" "}
                <code>ready</code> and chunks &gt; 0.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {docsQuery.isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents found. Upload sources in a notebook first.
                </p>
              ) : (
                <Select
                  value={selectedDocId ?? undefined}
                  onValueChange={(v) => setSelectedDocId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a document…" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="truncate">
                            {d.title}{" "}
                            <span className="text-muted-foreground">
                              · {d.notebookTitle}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {d.status} · {d.chunkCount} chunks
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedDoc && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={selectedDoc.status} />
                  <Badge variant="outline">
                    {selectedDoc.chunkCount} chunks
                  </Badge>
                  {selectedDoc.mimeType && (
                    <Badge variant="outline">{selectedDoc.mimeType}</Badge>
                  )}
                  <span className="text-muted-foreground">
                    notebook: {selectedDoc.notebookTitle}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="flex flex-col gap-6 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Raw Input</CardTitle>
              <CardDescription>
                Paste raw text or JSON{" "}
                <code>{`{ "pages": [{ "page": 1, "text": "..." }] }`}</code>.
                Embeddings are computed in-memory; nothing is persisted.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                placeholder={RAW_PLACEHOLDER}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                disabled={isPending}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {rawValidation.format === "structured" && (
                    <Badge variant="secondary">structured (pages)</Badge>
                  )}
                  {rawValidation.format === "plain" && rawInput.length > 0 && (
                    <Badge variant="outline">plain text</Badge>
                  )}
                  {rawValidation.error && (
                    <span className="text-destructive">
                      {rawValidation.error}
                    </span>
                  )}
                </div>
                <span
                  className={
                    rawInput.length > RAW_MAX_CHARS
                      ? "font-mono text-destructive"
                      : "font-mono text-muted-foreground"
                  }
                >
                  {rawInput.length.toLocaleString()} /{" "}
                  {RAW_MAX_CHARS.toLocaleString()} chars
                </span>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={skipRetrieval}
                  onCheckedChange={(v) => setSkipRetrieval(v === true)}
                  disabled={isPending}
                />
                <Label className="cursor-pointer">
                  Skip retrieval (use first 5 chunks as context)
                </Label>
              </label>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Query</CardTitle>
          <CardDescription>
            Press{" "}
            <kbd className="rounded bg-muted px-1 py-0.5 text-xs">Enter</kbd>{" "}
            to run.{" "}
            <kbd className="rounded bg-muted px-1 py-0.5 text-xs">
              Shift+Enter
            </kbd>{" "}
            for a newline.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            placeholder={
              mode === "document"
                ? "Ask a question about this document..."
                : "Ask a question about the raw input..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                runTest()
              }
            }}
            rows={3}
            disabled={!canRun || isPending}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={runTest}
              disabled={!canRun || !query.trim() || isPending}
            >
              {isPending && pendingKind === "query" ? "Running…" : "Run Test"}
            </Button>
            <Button
              variant="outline"
              onClick={runNoAnswer}
              disabled={!canRun || isPending}
            >
              {isPending && pendingKind === "no-answer"
                ? "Running…"
                : "Run No-Answer Test"}
            </Button>
            {!canRun && mode === "document" && selectedDoc && (
              <span className="self-center text-xs text-muted-foreground">
                Document is not indexed yet.
              </span>
            )}
            {!canRun && mode === "raw" && (
              <span className="self-center text-xs text-muted-foreground">
                {rawValidation.error ?? "Paste some input above to enable."}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div ref={resultsRef} className="flex flex-col gap-6">
        {isPending && (
          <Card>
            <CardContent className="flex flex-col gap-3 py-6">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        )}

        {!isPending && !result && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No results yet. {mode === "document" ? "Pick a document" : "Paste input"}{" "}
              and run a test.
            </CardContent>
          </Card>
        )}

        {result && !isPending && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  total {formatLatency(result.metrics.totalLatencyMs)}
                </Badge>
                <Badge variant="outline">
                  embed {formatLatency(result.metrics.embeddingMs)}
                </Badge>
                <Badge variant="outline">
                  retrieve {formatLatency(result.metrics.retrievalMs)}
                </Badge>
                <Badge variant="outline">
                  generate {formatLatency(result.metrics.generationMs)}
                </Badge>
                <Badge variant="outline">
                  chunks {result.metrics.chunksUsed}
                </Badge>
                <Badge variant="outline">
                  context {result.metrics.contextChars.toLocaleString()} chars
                </Badge>
                <Badge variant="outline">
                  ~{result.metrics.contextTokensApprox.toLocaleString()} tokens
                </Badge>
                {result.noAnswer && (
                  <Badge variant="destructive">no-answer mode</Badge>
                )}
                {mode === "raw" && skipRetrieval && (
                  <Badge variant="destructive">skip-retrieval</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retrieval Results</CardTitle>
                <CardDescription>
                  Top {result.chunks.length} chunks. Click a row to expand.
                  Highlighted rows were cited in the answer.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {result.chunks.length === 0 ? (
                  <p className="px-6 text-sm text-muted-foreground">
                    No chunks retrieved.
                  </p>
                ) : (
                  <div className="max-h-[480px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead className="w-20">Score</TableHead>
                          <TableHead className="w-16">Page</TableHead>
                          <TableHead>Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.chunks.map((c, i) => {
                          const rank = i + 1
                          const cited = citedSet.has(rank)
                          const isOpen = expanded.has(c.id)
                          return (
                            <Fragment key={c.id}>
                              <TableRow
                                className={
                                  cited
                                    ? "cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
                                    : "cursor-pointer"
                                }
                                onClick={() => toggleExpanded(c.id)}
                              >
                                <TableCell className="font-mono text-xs">
                                  {rank}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {c.score.toFixed(3)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {c.page}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatPreview(c.text)}
                                </TableCell>
                              </TableRow>
                              {isOpen && (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="bg-muted/40"
                                  >
                                    <div className="whitespace-pre-wrap text-xs text-muted-foreground">
                                      {c.text}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prompt Inspector</CardTitle>
                <CardDescription>
                  Exact system + user prompt sent to the model.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion>
                  <AccordionItem value="system">
                    <AccordionTrigger>System prompt</AccordionTrigger>
                    <AccordionContent>
                      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                        {result.systemPrompt}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="full">
                    <AccordionTrigger>Full prompt (system + user)</AccordionTrigger>
                    <AccordionContent>
                      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                        {result.finalPrompt}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LLM Response</CardTitle>
                {citedPages.length > 0 && (
                  <CardDescription>
                    Cited pages:{" "}
                    {Array.from(new Set(citedPages))
                      .sort((a, b) => a - b)
                      .map((p) => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="mr-1"
                        >
                          p.{p}
                        </Badge>
                      ))}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">{result.answer}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluation</CardTitle>
                <CardDescription>
                  Saved to <code>apps/backend/debug/llm-test-evals.jsonl</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {RATING_BUTTONS.map((b) => (
                  <Button
                    key={b.rating}
                    variant={b.variant}
                    onClick={() => evalMutation.mutate(b.rating)}
                    disabled={evalMutation.isPending}
                  >
                    {b.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
