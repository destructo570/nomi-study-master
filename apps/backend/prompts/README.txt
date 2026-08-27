Single source of truth for every system prompt the backend uses.

Loader:  apps/backend/src/lib/ai/prompts.ts  →  loadPrompt(name, vars?)
Syntax:  {{varname}} placeholders are substituted at call time.

File index:
  chat.txt                       Notebook chat (fenn). Vars: notebookTitle
  chat-title.txt                 Auto-name a chat session. No vars.
  summary-concise.txt            Summary feature, depth=concise. No vars.
  summary-detailed.txt           Summary feature, depth=detailed. No vars.
  flashcards.txt                 Flashcards generator. Vars: count
  quizzes.txt                    Multiple-choice quiz generator. Vars: count
  mindmap.txt                    Mindmap generator. Vars: depthLabel
  llm-test-document.txt          /llm-test document mode. Vars: docTitle, notebookTitle
  llm-test-raw.txt               /llm-test raw input mode. Vars: sourceLabel
  course-tail.txt                Appended after tutor preset for course generation. No vars.
  tutor-preset-eli5.txt          Tutor preset: ELI5.
  tutor-preset-academic.txt      Tutor preset: Academic Scholar.
  tutor-preset-socratic.txt      Tutor preset: Socratic Tutor.

Editing:
  Edit the .txt file and restart the backend (or rely on bun --watch).
  Prompts are cached in memory after first read.
