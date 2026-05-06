import type { ReactElement } from 'react'
import { Bell, Moon, Search, UserCircle } from 'lucide-react'

export function TopBar(): ReactElement {
  return (
    <header className="glass-header fixed left-[var(--dp-sidebar-width)] right-0 top-0 z-40 hidden h-[var(--dp-header-height)] items-center justify-between px-10 lg:flex">
      <div className="relative flex max-w-xl flex-1 items-center">
        <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-[var(--dp-text-muted)]" />
        <input
          className="w-full border-none bg-transparent pl-8 text-sm text-foreground outline-none placeholder:text-[var(--dp-outline)]"
          placeholder="搜索资产关键词..."
          readOnly
          value=""
        />
      </div>

      <div className="flex items-center gap-6">
        <nav className="mr-8 flex items-center gap-8">
          <button className="label-caps border-b border-[var(--dp-fill-inverse)] py-1 text-foreground" type="button">
            概览
          </button>
          <button className="label-caps py-1 text-[var(--dp-text-muted)] transition-colors hover:text-foreground" type="button">
            历史记录
          </button>
          <button className="label-caps py-1 text-[var(--dp-text-muted)] transition-colors hover:text-foreground" type="button">
            设置项
          </button>
        </nav>

        <div className="flex items-center gap-4 text-[var(--dp-text-muted)]">
          <button className="transition-colors hover:text-foreground" type="button">
            <Bell className="size-5" />
          </button>
          <button className="transition-colors hover:text-foreground" type="button">
            <Moon className="size-5" />
          </button>
          <div className="flex size-8 items-center justify-center overflow-hidden border border-[var(--dp-outline-variant)]/70">
            <UserCircle className="size-6" />
          </div>
        </div>
      </div>
    </header>
  )
}