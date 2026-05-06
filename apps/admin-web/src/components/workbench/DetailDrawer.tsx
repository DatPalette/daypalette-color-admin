import { useEffect, useState, type PropsWithChildren, type ReactElement } from 'react'

import { cn } from '@/utils/cn'

interface DetailDrawerProps extends PropsWithChildren {
  isOpen: boolean
  onClose: () => void
}

export function DetailDrawer({ children, isOpen, onClose }: DetailDrawerProps): ReactElement | null {
  const [isMounted, setIsMounted] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)

      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true)
      })

      return () => window.cancelAnimationFrame(frameId)
    }

    setIsVisible(false)

    const timeoutId = window.setTimeout(() => {
      setIsMounted(false)
    }, 420)

    return () => window.clearTimeout(timeoutId)
  }, [isOpen])

  if (!isMounted) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        aria-label="Close drawer"
        className={cn(
          'flex-1 cursor-default bg-[rgba(26,26,26,0.08)] backdrop-blur-sm transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          'relative h-full w-full max-w-[480px] border-l border-[var(--dp-outline-variant)]/30 bg-white shadow-2xl transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          isVisible ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {children}
      </aside>
    </div>
  )
}