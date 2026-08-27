/**
 * Engine context (dependency injection). Every agent takes a `Ctx` so the
 * model provider and knowledge loader are swappable without touching agent
 * code — multi-model generation, mocked tests, and a reloaded knowledge
 * base all flow through here.
 */
import type { LanguageModel } from "ai"

import { loadKnowledge, type Knowledge } from "../knowledge/loader"
import { model as defaultModel } from "../config"

export type Ctx = {
  /** The language model to call. */
  model: LanguageModel
  /** Loaded knowledge base (single source of truth). */
  knowledge: Knowledge
  /** Job-scoped logger that writes into the job's stage logs. */
  log: (stage: string, line: string) => void
}

export function defaultCtx(log?: (stage: string, line: string) => void): Ctx {
  return {
    model: defaultModel(),
    knowledge: loadKnowledge(),
    log: log ?? (() => {}),
  }
}