import { useEffect, useState, type PropsWithChildren, type ReactElement } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils/cn'

interface WorkbenchModalProps extends PropsWithChildren {
  isOpen: boolean
  onClose: () => void
  panelClassName?: string
}

export function WorkbenchModal({ children, isOpen, onClose, panelClassName }: WorkbenchModalProps): ReactElement | null {
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
    } else {
      setIsVisible(false)

      timeoutId = window.setTimeout(() => {
        setIsMounted(false)
      }, 320)
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Close modal"
        className={cn(
          'absolute inset-0 bg-[rgba(28,27,27,0.16)] backdrop-blur-[3px] transition-opacity duration-300 ease-out',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        type="button"
      />

      <div
        aria-modal="true"
        className={cn(
          'paper-card relative z-[1] w-full max-w-[640px] bg-white transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.98] opacity-0',
          panelClassName,
        )}
        role="dialog"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}