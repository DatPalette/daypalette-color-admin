import * as React from 'react'

import { cn } from '@/utils/cn'

type ButtonVariant = 'ghost' | 'outline' | 'primary'
type ButtonSize = 'default' | 'lg' | 'sm'

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-primary-foreground hover:opacity-92',
  ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-white/70 hover:text-foreground',
  outline: 'border-border bg-card text-foreground hover:bg-[var(--dp-surface-soft)]',
}

const sizeClassMap: Record<ButtonSize, string> = {
  default: 'h-11 px-5 py-2',
  sm: 'h-9 px-4 text-xs',
  lg: 'h-12 px-6',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize
  variant?: ButtonVariant
}

export function Button({
  className,
  size = 'default',
  variant = 'primary',
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  )
}