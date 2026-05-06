import { useState, type ReactElement } from 'react'
import { RefreshCcw } from 'lucide-react'

import { DetailDrawer } from '@/components/workbench/DetailDrawer'
import { WorkbenchPageHeader } from '@/components/workbench/WorkbenchPageHeader'
import { Button } from '@/components/ui/button'
import { CollectionDetailPanel } from './components/CollectionDetailPanel'
import { useCollectionsPageViewModel } from './view-model/useCollectionsPageViewModel'

// 合集管理页，负责组装列表、成员编排面板和归档恢复区块。
export function CollectionsPage(): ReactElement {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const {
    archivedCollections,
    deleteCheck,
    deleteReason,
    draft,
    editorOptions,
    errorMessage,
    isDeleteChecking,
    isDeleting,
    isLoading,
    isRestoringId,
    isSaving,
    model,
    onAddPaletteMember,
    onCheckDeleteRisk,
    onDelete,
    onDeleteReasonChange,
    onDraftFieldChange,
    onDraftTagToggle,
    onMovePaletteMember,
    onRemovePaletteMember,
    onRefresh,
    onRestore,
    onSave,
    onSelectCollection,
    onSetCoverPalette,
    saveMessage,
  } = useCollectionsPageViewModel()

  const filteredCards = (model?.cards ?? []).filter((card) => {
    const keyword = searchValue.trim().toLowerCase()

    if (!keyword) {
      return true
    }

    return [card.id, card.nameZh, card.nameEn, card.themeType, card.coverPaletteSlug, card.paletteCountLabel]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })

  return (
    <div className="space-y-10 pb-12">
      <WorkbenchPageHeader
        actions={
          <Button onClick={() => void onRefresh()} size="sm" variant="ghost">
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
        }
        archivedLabel={`${archivedCollections.length} archived`}
        description="以列表方式整理合集封面、主题方向与成员顺序，快速判断哪些结构已经适合进入正式发布流。"
        onSearchChange={setSearchValue}
        searchPlaceholder="Search collections"
        searchValue={searchValue}
        title="Collections"
        totalLabel={model?.totalLabel ?? '读取中'}
        updatedAtLabel={model?.updatedAtLabel ?? '等待返回'}
      />

      {errorMessage ? (
        <div className="paper-card border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">{errorMessage}</div>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] pb-4">
          <div>
            <p className="label-caps text-[var(--dp-text-muted)]">Collection List</p>
            <h2 className="display-font mt-2 text-[2rem] leading-none tracking-[-0.03em] text-foreground">
              Curation View
            </h2>
          </div>
          <p className="text-sm text-[var(--dp-text-muted)]">{draft?.nameZh ?? '选择一条合集记录以编辑'}</p>
        </div>

        <div className="paper-card overflow-hidden bg-white">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_180px_180px_140px_120px] gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-4 lg:grid">
            <span className="label-caps text-[var(--dp-text-muted)]">Collection</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Theme</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Cover Palette</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Members</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Status</span>
          </div>

          <div>
            {filteredCards.map((card) => (
              <button
                key={card.id}
                className={[
                  'grid w-full gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5 text-left transition-colors duration-200 lg:grid-cols-[minmax(0,1.4fr)_180px_180px_140px_120px]',
                  draft?.id === card.id && isDrawerOpen ? 'bg-[var(--dp-surface-soft)]' : 'hover:bg-[var(--dp-surface-soft)]',
                ].join(' ')}
                onClick={() => {
                  onSelectCollection(card.id)
                  setIsDrawerOpen(true)
                }}
                type="button"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 grid-cols-3 overflow-hidden border border-[var(--dp-border-subtle)]">
                    {card.coverPreviewHexes.map((color, index) => (
                      <div key={`${card.id}-${index}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{card.nameZh}</p>
                    <p className="mt-1 truncate text-sm text-[var(--dp-text-muted)]">{card.nameEn}</p>
                  </div>
                </div>
                <span className="text-sm text-foreground">{card.themeType}</span>
                <span className="text-sm text-[var(--dp-text-muted)]">{card.coverPaletteSlug}</span>
                <span className="text-sm text-[var(--dp-text-muted)]">{card.paletteCountLabel}</span>
                <span className="text-sm text-foreground">{card.status}</span>
              </button>
            ))}
          </div>

          {isLoading && !model
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="min-h-[96px] animate-pulse border-b border-[var(--dp-border-subtle)] bg-white" />
              ))
            : null}

          {!isLoading && filteredCards.length === 0 ? (
            <div className="px-8 py-10 text-center text-sm leading-7 text-[var(--dp-text-muted)]">
              没有匹配当前搜索词的 Collection。调整关键词后重试。
            </div>
          ) : null}
        </div>
      </section>

      <DetailDrawer
        isOpen={isDrawerOpen && Boolean(draft && editorOptions)}
        onClose={() => setIsDrawerOpen(false)}
      >
        <CollectionDetailPanel
          archivedCollections={archivedCollections}
          deleteCheck={deleteCheck}
          deleteReason={deleteReason}
          draft={draft}
          editorOptions={editorOptions}
          isDeleteChecking={isDeleteChecking}
          isDeleting={isDeleting}
          isRestoringId={isRestoringId}
          isSaving={isSaving}
          onAddPaletteMember={onAddPaletteMember}
          onCheckDeleteRisk={onCheckDeleteRisk}
          onClose={() => setIsDrawerOpen(false)}
          onDelete={onDelete}
          onDeleteReasonChange={onDeleteReasonChange}
          onDraftFieldChange={onDraftFieldChange}
          onDraftTagToggle={onDraftTagToggle}
          onMovePaletteMember={onMovePaletteMember}
          onRemovePaletteMember={onRemovePaletteMember}
          onRestore={onRestore}
          onSave={onSave}
          onSetCoverPalette={onSetCoverPalette}
          saveMessage={saveMessage}
        />
      </DetailDrawer>
    </div>
  )
}