"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@workspace/ui/lib/utils"

type FeatureCardProps = {
  title: string
  description: string
  children: React.ReactNode | ((hovered: boolean) => React.ReactNode)
  index?: number
  className?: string
  mediaClassName?: string
}

export function FeatureCard({
  title,
  description,
  children,
  index = 0,
  className,
  mediaClassName,
}: FeatureCardProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: index * 0.06,
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-[16px] border border-border bg-background",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-full aspect-[5/4] sm:aspect-[6/5] bg-[#1f2428]/2",
          mediaClassName,
        )}
      >
        {typeof children === "function" ? children(hovered) : children}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--background) 0%, transparent 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />
        <div className="relative p-5 sm:p-6">
          <h3 className="font-display font-normal tracking-[-0.02em] leading-[1.15] text-[22px] text-foreground sm:text-[24px]">
            {title}
          </h3>
          <p className="mt-2 text-[14px] leading-[1.5] text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
