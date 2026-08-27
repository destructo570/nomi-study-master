import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

function InsetFrame({
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & { innerClassName?: string }) {
  return (
    <div
      data-slot="inset-frame"
      className={cn(
        "rounded-[16px] border border-border bg-muted p-1",
        className,
      )}
      {...props}
    >
      <div
        data-slot="inset-frame-inner"
        className={cn(
          "overflow-hidden rounded-[12px] bg-background",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { InsetFrame }
