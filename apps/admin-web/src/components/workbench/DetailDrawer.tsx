import { useEffect, useState, type PropsWithChildren, type ReactElement } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils/cn'

interface DetailDrawerProps extends PropsWithChildren {
  isOpen: boolean
  onClose: () => void
}

export function DetailDrawer({ children, isOpen, onClose }: DetailDrawerProps): ReactElement | null {
  const [isMounted, setIsMounted] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let enterFrameId: number | undefined
    let settleFrameId: number | undefined
    let timeoutId: number | undefined

    if (isOpen) {
      setIsMounted(true)
      setIsVisible(false)

      enterFrameId = window.requestAnimationFrame(() => {
        settleFrameId = window.requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })

      return () => {
        if (enterFrameId !== undefined) {
          window.cancelAnimationFrame(enterFrameId)
        }

        if (settleFrameId !== undefined) {
          window.cancelAnimationFrame(settleFrameId)
        }
      }
    } else {
      setIsVisible(false)

      timeoutId = window.setTimeout(() => {
        setIsMounted(false)
      }, 560)
    }

    return () => {
      if (enterFrameId !== undefined) {
        window.cancelAnimationFrame(enterFrameId)
      }

      if (settleFrameId !== undefined) {
        window.cancelAnimationFrame(settleFrameId)
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isMounted) {
      return
    }

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMounted])

  if (!isMounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] overflow-hidden">
      <button
        aria-label="Close drawer"
        className={cn(
          'absolute inset-0 cursor-pointer bg-[rgba(28,27,27,0.14)] backdrop-blur-[3px] transition-opacity duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          'absolute inset-y-0 right-0 h-full w-full max-w-[480px] border-l border-[var(--dp-outline-variant)]/30 bg-white shadow-[0_32px_80px_-24px_rgba(0,0,0,0.3)] transition-[transform,opacity] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0',
        )}
      >
        {children}
      </aside>
    </div>,
    document.body,
  )
}