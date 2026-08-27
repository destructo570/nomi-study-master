"use client"

import Image from "next/image"

const logos = [
  { name: "Harvard", src: "/icons/uni_logos/harvard.webp" },
  { name: "University of Chicago", src: "/icons/uni_logos/chicago.webp" },
  { name: "Stanford", src: "/icons/uni_logos/stanford.webp" },
  { name: "University of Michigan", src: "/icons/uni_logos/michigan.webp" },
  { name: "MIT", src: "/icons/uni_logos/mit.webp" },
  { name: "UCLA", src: "/icons/uni_logos/ucla.webp" },
  { name: "Princeton", src: "/icons/uni_logos/princeton.webp" },
  {
    name: "Michigan State University",
    src: "/icons/uni_logos/michigan-state.webp",
  },
  { name: "University of Pennsylvania", src: "/icons/uni_logos/penn.webp" },
]

export function TrustStrip() {
  const loop = [...logos, ...logos]
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 px-5 py-20 sm:px-8 sm:py-24">
        <p className="text-center text-[20px] text-muted-foreground">
          Trusted by top students from
        </p>

        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
          <div className="marquee-track gap-16 sm:gap-20 md:gap-24">
            {loop.map((logo, i) => (
              <Image
                key={`${logo.name}-${i}`}
                src={logo.src}
                alt={logo.name}
                width={80}
                height={80}
                className="h-14 w-auto shrink-0 opacity-80 [filter:grayscale(1)] transition duration-300 hover:opacity-100 hover:[filter:grayscale(0)] sm:h-16"
                priority={false}
                unoptimized
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
