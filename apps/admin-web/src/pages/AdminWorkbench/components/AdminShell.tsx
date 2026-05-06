import type { PropsWithChildren, ReactElement } from 'react'

import {
  BookMarked,
  FolderHeart,
  Palette,
  SwatchBook,
  Tags,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { navigationSections } from '../navigation'

function resolveNavigationIcon(to: string) {
  if (to.startsWith('/dictionaries/')) {
    return Tags
  }

  if (to === '/base-colors') {
    return Palette
  }

  if (to === '/palettes') {
    return SwatchBook
  }

  if (to === '/collections') {
    return FolderHeart
  }

  return BookMarked
}

// 管理台壳层组件，负责渲染固定侧边导航和当前激活页面内容。
export function AdminShell({ children }: PropsWithChildren): ReactElement {
  return (
    <div className="min-h-screen bg-[var(--dp-bg-page)] text-foreground">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[var(--dp-sidebar-width)] flex-col border-r border-[var(--dp-outline-variant)]/30 bg-[var(--dp-bg-page)] py-6 lg:flex">
        <div className="mb-10 px-6">
          <h1 className="display-font text-2xl font-bold text-foreground">DayPalette</h1>
          <p className="mt-1 label-caps text-[var(--dp-text-muted)]/70">资产管理系统</p>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-6 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-6 label-caps text-[var(--dp-text-muted)]/70">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  (() => {
                    const ItemIcon = resolveNavigationIcon(item.to)

                    return (
                      <NavLink
                        key={item.to}
                        className={({ isActive }) =>
                          [
                            'flex items-center border-r-2 px-6 py-3 text-[var(--dp-text-muted)] transition-colors duration-200',
                            isActive
                              ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-surface-soft)] font-semibold text-foreground'
                              : 'border-transparent hover:bg-[var(--dp-surface-soft)] hover:text-foreground',
                          ].join(' ')
                        }
                        to={item.to}
                      >
                        <ItemIcon className="mr-3 size-5 shrink-0" />
                        <span className="truncate text-sm leading-6">{item.label}</span>
                      </NavLink>
                    )
                  })()
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-h-screen lg:ml-[var(--dp-sidebar-width)]">
        <div className="mx-auto min-h-screen max-w-[1600px] px-5 pb-10 pt-8 sm:px-8 sm:pt-10 lg:px-[var(--dp-page-margin)] lg:pt-[var(--dp-page-margin)]">
          {children}
        </div>
      </main>
    </div>
  )
}