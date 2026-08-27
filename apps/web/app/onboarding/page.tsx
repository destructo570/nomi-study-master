"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@workspace/ui/lib/utils"
import { useOnboarding, useSaveOnboarding } from "@/lib/hooks/use-onboarding"
import { ComparisonLineChart } from "@/components/comparison-line-chart"
import { PricingPanel } from "@/components/upgrade/plan-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon } from "@hugeicons/core-free-icons"
import type { OnboardingAnswers } from "@workspace/types"

/* ------------------------------------------------------------------ */
/* Step definitions                                                    */
/* ------------------------------------------------------------------ */

type StepConfig = {
  question: string
  subtitle?: string
  type: "single" | "multi"
  options: { value: string; label: string; icon?: string }[]
  field: keyof OnboardingAnswers
}

const STEPS: StepConfig[] = [
  {
    question: "What are you mainly learning for?",
    type: "single",
    field: "goal",
    options: [
      { value: "school", label: "School", icon: "🏫" },
      { value: "college", label: "College", icon: "🎓" },
      { value: "competitive-exams", label: "Competitive Exams", icon: "📝" },
      { value: "job-interviews", label: "Job Interviews", icon: "💼" },
      { value: "career-growth", label: "Career Growth", icon: "📈" },
      { value: "learning-new-skills", label: "Learning New Skills", icon: "🛠️" },
      { value: "personal-projects", label: "Personal Projects", icon: "🚀" },
      { value: "personal-curiosity", label: "Personal Curiosity", icon: "🔍" },
    ],
  },
  {
    question: "Which best describes you?",
    type: "single",
    field: "identity",
    options: [
      { value: "student", label: "Student", icon: "📚" },
      { value: "college-student", label: "College Student", icon: "🎒" },
      { value: "working-professional", label: "Working Professional", icon: "💻" },
      { value: "developer", label: "Developer", icon: "👨‍💻" },
      { value: "creator", label: "Creator", icon: "🎨" },
      { value: "entrepreneur", label: "Entrepreneur", icon: "💡" },
      { value: "freelancer", label: "Freelancer", icon: "🧑‍💻" },
      { value: "other", label: "Other", icon: "✨" },
    ],
  },
  {
    question: "What topics are you currently learning?",
    subtitle: "Select all that apply",
    type: "multi",
    field: "topics",
    options: [
      { value: "programming", label: "Programming", icon: "💻" },
      { value: "ai-machine-learning", label: "AI & Machine Learning", icon: "🤖" },
      { value: "web-development", label: "Web Development", icon: "🌐" },
      { value: "business", label: "Business", icon: "💼" },
      { value: "finance", label: "Finance", icon: "💰" },
      { value: "marketing", label: "Marketing", icon: "📢" },
      { value: "design", label: "Design", icon: "🎨" },
      { value: "medicine", label: "Medicine", icon: "🩺" },
      { value: "languages", label: "Languages", icon: "🗣️" },
      { value: "science", label: "Science", icon: "🔬" },
      { value: "mathematics", label: "Mathematics", icon: "📐" },
      { value: "other", label: "Other", icon: "✨" },
    ],
  },
  {
    question: "What slows down your learning the most?",
    subtitle: "Select all that apply",
    type: "multi",
    field: "struggles",
    options: [
      { value: "forgetting-concepts", label: "Forgetting concepts quickly", icon: "🧠" },
      { value: "staying-consistent", label: "Staying consistent", icon: "📅" },
      { value: "taking-notes", label: "Taking notes", icon: "📝" },
      { value: "long-boring-content", label: "Long boring content", icon: "😴" },
      { value: "information-overload", label: "Information overload", icon: "🌊" },
      { value: "procrastination", label: "Procrastination", icon: "⏳" },
      { value: "difficult-concepts", label: "Understanding difficult concepts", icon: "🤯" },
      { value: "organizing-material", label: "Organizing study material", icon: "🗂️" },
      { value: "revising-effectively", label: "Revising effectively", icon: "🔄" },
    ],
  },
  {
    question: "How do you learn best?",
    subtitle: "Select all that apply",
    type: "multi",
    field: "learningStyle",
    options: [
      { value: "flashcards", label: "Flashcards", icon: "🃏" },
      { value: "quizzes", label: "Quizzes", icon: "❓" },
      { value: "audio-lessons", label: "Audio Lessons", icon: "🎧" },
      { value: "visual-diagrams", label: "Visual Diagrams", icon: "📊" },
      { value: "step-by-step", label: "Step-by-Step Explanations", icon: "🪜" },
      { value: "summaries-notes", label: "Summaries & Notes", icon: "📋" },
      { value: "practice-questions", label: "Practice Questions", icon: "✏️" },
      { value: "interactive-learning", label: "Interactive Learning", icon: "🎮" },
    ],
  },
  {
    question: "What type of content do you usually learn from?",
    subtitle: "Select all that apply",
    type: "multi",
    field: "contentSources",
    options: [
      { value: "youtube-videos", label: "YouTube Videos", icon: "▶️" },
      { value: "pdfs", label: "PDFs", icon: "📄" },
      { value: "blogs-articles", label: "Blogs & Articles", icon: "📰" },
      { value: "online-courses", label: "Online Courses", icon: "🖥️" },
      { value: "podcasts", label: "Podcasts", icon: "🎙️" },
      { value: "documentation", label: "Documentation", icon: "📖" },
      { value: "lecture-recordings", label: "Lecture Recordings", icon: "🎥" },
      { value: "books", label: "Books", icon: "📚" },
    ],
  },
  {
    question: "How long can you usually stay focused while studying?",
    type: "single",
    field: "focusSpan",
    options: [
      { value: "less-than-15", label: "Less than 15 mins", icon: "⚡" },
      { value: "15-30", label: "15\u201330 mins", icon: "⏱️" },
      { value: "30-60", label: "30\u201360 mins", icon: "🕐" },
      { value: "1-2-hours", label: "1\u20132 hours", icon: "📖" },
      { value: "2-plus-hours", label: "2+ hours", icon: "🚀" },
    ],
  },
  {
    question: "How organized are your study materials right now?",
    type: "single",
    field: "organizationLevel",
    options: [
      { value: "complete-chaos", label: "Complete chaos", icon: "🌪️" },
      { value: "somewhat-organized", label: "Somewhat organized", icon: "📋" },
      { value: "mostly-organized", label: "Mostly organized", icon: "📁" },
      { value: "very-organized", label: "Very organized", icon: "🗂️" },
    ],
  },
  {
    question: "What would success with Nomi look like for you?",
    subtitle: "Select all that apply",
    type: "multi",
    field: "desiredOutcome",
    options: [
      { value: "learn-faster", label: "Learn faster", icon: "⚡" },
      { value: "understand-deeply", label: "Understand concepts deeply", icon: "🧠" },
      { value: "save-time", label: "Save time", icon: "⏰" },
      { value: "improve-grades", label: "Improve grades", icon: "🏆" },
      { value: "crack-interviews", label: "Crack interviews", icon: "🎯" },
      { value: "build-consistency", label: "Build consistency", icon: "🔥" },
      { value: "reduce-procrastination", label: "Reduce procrastination", icon: "✅" },
      { value: "retain-longer", label: "Retain information longer", icon: "💪" },
      { value: "build-projects-faster", label: "Build projects faster", icon: "🏗️" },
    ],
  },
  {
    question: "How serious are you about improving your learning this year?",
    type: "single",
    field: "commitmentLevel",
    options: [
      { value: "just-exploring", label: "Just exploring", icon: "👀" },
      { value: "motivated", label: "Motivated", icon: "💪" },
      { value: "very-serious", label: "Very serious", icon: "🔥" },
      { value: "extremely-committed", label: "Extremely committed", icon: "🏆" },
    ],
  },
]

const TOTAL_QUESTION_STEPS = STEPS.length

/* ------------------------------------------------------------------ */
/* Final screen                                                        */
/* ------------------------------------------------------------------ */

function FinalScreen() {
  return (
    <div className="flex flex-col items-center gap-8 px-6 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-2"
      >
        <Image
          src="/images/tiger-learning.webp"
          alt="Ready"
          width={240}
          height={240}
          className="object-contain"
        />
      </motion.div>

      <h2 className="font-heading text-3xl text-center tracking-tight">
        All set! 🥳<br />
        Ready to save hours and learn more effectively?
      </h2>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Onboarding page                                                     */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter()
  const { data, isLoading } = useOnboarding()
  const saveMutation = useSaveOnboarding()

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({})
  const [direction, setDirection] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const totalSteps = TOTAL_QUESTION_STEPS + 2 // questions + loader + final

  const currentConfig: StepConfig | null =
    step < TOTAL_QUESTION_STEPS ? (STEPS[step] ?? null) : null

  const isLastQuestionStep = step === TOTAL_QUESTION_STEPS - 1

  const canProceed = currentConfig
    ? currentConfig.type === "single"
      ? typeof answers[currentConfig.field] === "string" && answers[currentConfig.field] !== ""
      : Array.isArray(answers[currentConfig.field]) && (answers[currentConfig.field] as string[]).length > 0
    : true

  const handleSingleSelect = useCallback(
    (field: keyof OnboardingAnswers, value: string) => {
      setAnswers((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const handleMultiToggle = useCallback(
    (field: keyof OnboardingAnswers, value: string) => {
      setAnswers((prev) => {
        const current = (prev[field] as string[]) ?? []
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value]
        return { ...prev, [field]: next }
      })
    },
    [],
  )

  const handleNext = useCallback(async () => {
    if (!canProceed) return
    setDirection(1)

    if (isLastQuestionStep) {
      setIsSaving(true)
      try {
        await saveMutation.mutateAsync(answers as OnboardingAnswers)
        setStep(step + 1)
      } catch {
        // proceed anyway
        setStep(step + 1)
      } finally {
        setIsSaving(false)
      }
    } else {
      setStep(step + 1)
    }
  }, [canProceed, isLastQuestionStep, step, answers, saveMutation])

  const handleBack = useCallback(() => {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }, [])

  const handleFinish = useCallback(() => {
    setShowPaywall(true)
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-6 animate-pulse rounded-full bg-muted-foreground/30" />
      </div>
    )
  }

  const isLoaderStep = step === TOTAL_QUESTION_STEPS
  const isFinalStep = step === TOTAL_QUESTION_STEPS + 1

  return (
    <>
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center px-4 py-8">
      {/* Progress */}
      {!isFinalStep && (
        <div className="flex-none w-full max-w-lg mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {isLoaderStep
                  ? "Analyzing..."
                  : `Step ${step + 1} of ${TOTAL_QUESTION_STEPS}`}
            </span>
            {!isLoaderStep && (
              <span className="text-xs text-muted-foreground">
                Takes less than 2 minutes
              </span>
            )}
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isLoaderStep ? "bg-[#b8d8b8]" : "bg-primary",
              )}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait" custom={direction}>
          {isLoaderStep ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: direction * 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -direction * 20 }}
              transition={{ duration: 0.25 }}
            >
              <LoaderScreenWrapper onComplete={() => setStep(step + 1)} />
            </motion.div>
          ) : isFinalStep ? (
            <motion.div
              key="final"
              initial={{ opacity: 0, y: direction * 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -direction * 20 }}
              transition={{ duration: 0.25 }}
            >
              <FinalScreen />
              <div className="flex justify-center mt-2">
                <button
                  onClick={handleFinish}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-pill hover:opacity-90 transition-opacity"
                >
                  Let&apos;s Go!
                </button>
              </div>
            </motion.div>
          ) : currentConfig ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: direction * 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -direction * 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
               {/* Question */}
              <div className="text-center">
                <h2 className="font-heading text-2xl tracking-tight">
                  {currentConfig.question}
                </h2>
                {currentConfig.subtitle && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currentConfig.subtitle}
                  </p>
                )}
              </div>

              {/* Options */}
              <div
                className={cn(
                  step === 2
                    ? "grid grid-cols-2 gap-2"
                    : "space-y-2",
                )}
              >
                {currentConfig.options.map((opt) => {
                  const isSelected =
                    currentConfig.type === "single"
                      ? answers[currentConfig.field] === opt.value
                      : ((answers[currentConfig.field] as string[]) ?? []).includes(
                          opt.value,
                        )
                  return (
                    <motion.button
                      key={opt.value}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.05 * currentConfig.options.indexOf(opt),
                      }}
                      onClick={() =>
                        currentConfig.type === "single"
                          ? handleSingleSelect(currentConfig.field, opt.value)
                          : handleMultiToggle(currentConfig.field, opt.value)
                      }
                      className={cn(
                        "text-left text-sm transition-all duration-150",
                        step === 2
                          ? "rounded-xl border px-3 py-2.5"
                          : "w-full rounded-xl border px-4 py-3",
                        isSelected
                          ? "border-[#b8d8b8] bg-[#f2faf2] text-[#2d5a2d]"
                          : "border-border bg-card text-foreground hover:border-foreground/30 hover:bg-muted/50 shadow-hairline",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {currentConfig.type === "multi" && (
                          <div
                            className={cn(
                              "size-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ring-1 ring-inset",
                              isSelected
                                ? "ring-[#5a9a5a] bg-[#5a9a5a]"
                                : "ring-border",
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="size-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        )}
                        <span className={isSelected ? "font-medium" : ""}>
                          {opt.icon && <span className="mr-2">{opt.icon}</span>}
                          {opt.label}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all shadow-hairline"
                >
                  <svg
                    className="size-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed || isSaving}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-pill hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  {isSaving ? (
                    <>
                      <div className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {isLastQuestionStep ? "Submit" : "Next"}
                      <svg
                        className="size-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
    <Dialog open={showPaywall} onOpenChange={(open) => { if (!open) router.push("/home") }}>
      <DialogContent
        className="!max-w-[1040px] sm:!max-w-[1040px]"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-display text-[22px] font-light tracking-[-0.02em]">
              Choose your plan
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] text-muted-foreground">
              Pick the cadence that fits how you study.
            </DialogDescription>
          </div>
        </div>
        <PricingPanel
          ctaLabel="Select Plan"
          className="mt-2"
          footnote="Cancel anytime - billing stops at the end of the period."
        />
      </DialogContent>
    </Dialog>
    </>
  )
}

function LoaderScreenWrapper({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 5000)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <h2 className="font-heading text-2xl text-center tracking-tight">
          Personalizing your experience
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full mt-4"
      >
        <ComparisonLineChart />
      </motion.div>
    </div>
  )
}
