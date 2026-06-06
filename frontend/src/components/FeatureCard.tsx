import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  isLast?: boolean
}

export function FeatureCard({ title, description, icon: Icon, isLast }: FeatureCardProps) {
  return (
    <div
      className={`flex min-h-[5.5rem] flex-col items-center gap-3 border-b border-white/10 px-3 py-5 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left sm:px-6 sm:py-6 lg:px-4 lg:py-7 xl:py-8 ${!isLast ? 'lg:border-r lg:border-r-white/10' : ''}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-black shadow-[0_0_15px_rgba(175,232,5,0.15)] md:h-14 md:w-14">
        <Icon className="h-6 w-6 text-primary md:h-7 md:w-7" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wide text-foreground md:text-base">
          {title}
        </p>
        <p className="mt-1.5 text-xs leading-5 text-foreground/70 text-pretty md:text-sm md:leading-6">
          {description}
        </p>
      </div>
    </div>
  )
}
