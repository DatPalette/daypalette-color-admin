import type { ReactElement } from 'react'

export function WorkbenchInfoRow({
  label,
  value,
}: {
  label: string
  value: string
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] py-3 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  )
}