import type { PropsWithChildren, ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { NavLink } from 'react-router-dom'

import { navigationSections } from '../navigation'

// 管理台壳层组件，负责渲染固定侧边导航和当前激活页面内容。
export function AdminShell({ children }: PropsWithChildren): ReactElement {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-[1500px] overflow-hidden rounded-[32px] border border-[var(--dp-border-hairline)] bg-white/75 shadow-paper backdrop-blur-xl lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--dp-border-hairline)] bg-[var(--dp-overlay-glass)] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">DayPalette</p>
            <div>
              <h1 className="display-font text-4xl tracking-[-0.04em] text-foreground">Color Admin</h1>
              <p className="mt-2 max-w-[22ch] text-sm leading-6 text-muted-foreground">
                本地优先的配色资产管理台，先收口口径，再维护数据本身。
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-7">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{section.title}</p>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      className={({ isActive }) =>
                        [
                          'block w-full rounded-[22px] border px-4 py-3 text-left transition-colors',
                          isActive
                            ? 'border-transparent bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]'
                            : 'border-border bg-white/70 text-foreground hover:bg-white',
                        ].join(' ')
                      }
                      to={item.to}
                    >
                      {({ isActive }) => (
                        <>
                          <span className="block text-sm font-medium">{item.label}</span>
                          <span
                            className={[
                              'mt-1 block text-xs leading-5',
                              isActive ? 'text-white/75' : 'text-muted-foreground',
                            ].join(' ')}
                          >
                            {item.description}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-[24px] border border-border bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Skill Ready</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              前端已接入 frontend-module-playbook，后续页面模块按 page / view-model /
              transformer / service 的边界继续扩展。
            </p>
            <Button className="mt-4 w-full" variant="outline">
              查看项目骨架
            </Button>
          </div>
        </aside>

        <main className="min-w-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,248,246,0.96))] p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}