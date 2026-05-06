import type { ReactElement } from 'react'

// 字典编辑表单的小标题组件，统一局部表单区的字段标题样式。
export function SectionTitle({ children }: { children: string }): ReactElement {
  return <p className="label-caps text-muted-foreground">{children}</p>
}

// 字典编辑表单的单行文本输入控件。
export function TextInput({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}): ReactElement {
  return (
    <label className="space-y-2">
      <SectionTitle>{label}</SectionTitle>
      <input
        className="w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  )
}

// 字典编辑表单的多行描述输入控件。
export function TextAreaInput({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}): ReactElement {
  return (
    <label className="space-y-2">
      <SectionTitle>{label}</SectionTitle>
      <textarea
        className="min-h-[88px] w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  )
}