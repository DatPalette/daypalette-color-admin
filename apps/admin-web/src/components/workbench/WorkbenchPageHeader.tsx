import type { ReactElement, ReactNode } from 'react'
import { Search } from 'lucide-react'

interface WorkbenchPageHeaderProps {
  actions?: ReactNode
  archivedLabel: string
  description: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  searchValue: string
  title: string
  totalLabel: string
  updatedAtLabel: string
}

export function WorkbenchPageHeader({
  actions,
  archivedLabel,
  description,
  onSearchChange,
  searchPlaceholder,
  searchValue,
  title,
  totalLabel,
  updatedAtLabel,
}: WorkbenchPageHeaderProps): ReactElement {
  return (
    <section className="space-y-4 border-b border-[var(--dp-border-subtle)] pb-5">
      <div className="max-w-3xl space-y-2">
        <h1 className="display-font text-[clamp(1.75rem,2.8vw,2.6rem)] leading-[1] tracking-[-0.03em] text-foreground">
          {title}
        </h1>
        <p className="max-w-2xl text-[13px] leading-5 text-[var(--dp-text-muted)] sm:text-sm sm:leading-6">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-[var(--dp-text-muted)]">
          <span>{totalLabel}</span>
          <span>{archivedLabel}</span>
        </div>

        <div className="flex w-full flex-col gap-3 xl:max-w-[720px] xl:items-end">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <label className="flex min-w-0 flex-1 items-center gap-3 border-b border-[var(--dp-border-subtle)] pb-3 text-sm text-foreground sm:max-w-[380px]">
              <Search className="size-4 shrink-0 text-[var(--dp-text-muted)]" />
              <input
                className="w-full border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-[var(--dp-text-muted)]"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                value={searchValue}
              />
            </label>

            {actions ? <div className="flex items-center justify-end gap-3">{actions}</div> : null}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <p className="text-sm text-[var(--dp-text-muted)]">最近更新：{updatedAtLabel}</p>
      </div>
    </section>
  )
}