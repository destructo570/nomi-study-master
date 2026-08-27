import type { FlashcardCard, QuizQuestion } from "@workspace/types"

export function sampleFlashcards(): FlashcardCard[] {
  return [
    {
      question: "What is retrieval-augmented generation?",
      answer:
        "A technique where an LLM is grounded in external documents retrieved at query time.",
    },
    {
      question: "What is a vector embedding?",
      answer:
        "A dense numerical representation of text that captures semantic meaning.",
    },
    {
      question: "Why chunk documents before embedding?",
      answer: "To fit within context windows and improve retrieval precision.",
    },
  ]
}

export function sampleQuiz(): QuizQuestion[] {
  return [
    {
      question: "Which data structure is typically used for fast vector search?",
      options: ["B-tree", "HNSW graph", "Hash map", "Linked list"],
      correctAnswer: "HNSW graph",
    },
    {
      question: "What does a reranker do in a RAG pipeline?",
      options: [
        "Generates final answer",
        "Reorders retrieved results by relevance",
        "Creates embeddings",
        "Splits documents",
      ],
      correctAnswer: "Reorders retrieved results by relevance",
    },
  ]
}
