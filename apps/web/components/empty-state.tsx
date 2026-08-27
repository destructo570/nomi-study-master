import Image from "next/image"
import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

type EmptyStateProps = {
  image: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  imageClassName?: string
  imageOpacity?: number
  title?: string
  description?: ReactNode
  children?: ReactNode
  className?: string
}

export function EmptyState({
  image,
  imageAlt = "",
  imageWidth = 1024,
  imageHeight = 1024,
  imageClassName,
  imageOpacity,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <Image
        src={image}
        alt={imageAlt}
        width={imageWidth}
        height={imageHeight}
        className={cn("h-auto w-80 grayscale sm:w-96", imageClassName)}
        style={imageOpacity !== undefined ? { opacity: imageOpacity } : undefined}
        aria-hidden={imageAlt ? undefined : true}
      />
      {title ? (
        <p className="mt-4 text-base font-medium text-foreground">{title}</p>
      ) : null}
      {description ? (
        <p
          className={cn(
            "max-w-sm text-sm text-muted-foreground",
            title ? "mt-1" : "mt-4",
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
