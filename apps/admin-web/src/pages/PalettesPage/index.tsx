import { useState, type ReactElement } from 'react'
import { Plus, RefreshCcw } from 'lucide-react'

import { DetailDrawer } from '@/components/workbench/DetailDrawer'
import { WorkbenchPageHeader } from '@/components/workbench/WorkbenchPageHeader'
import { Button } from '@/components/ui/button'
import { PaletteCard } from './components/PaletteCard'
import { PaletteDetailPanel } from './components/PaletteDetailPanel'
import { usePalettesPageViewModel } from './view-model/usePalettesPageViewModel'

// 配色盘管理页，负责组装列表、新增编辑面板和归档恢复区块。
export function PalettesPage(): ReactElement {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const {
    archivedPalettes,
    deleteCheck,
    deleteReason,
    draft,
    editorOptions,
    errorMessage,
    isCreating,
    isDeleteChecking,
    isDeleting,
    isLoading,
    isRestoringId,
    isSaving,
    model,
    onCreateDraft,
    onCheckDeleteRisk,
    onDelete,
    onDeleteReasonChange,
    onDraftFieldChange,
    onDraftTagToggle,
    onRefresh,
    onRestore,
    onSave,
    onSelectPalette,
    saveMessage,
  } = usePalettesPageViewModel()

  const filteredCards = (model?.cards ?? []).filter((card) => {
    const keyword = searchValue.trim().toLowerCase()

    if (!keyword) {
      return true
    }

    return [card.id, card.slug, card.occasionLabel, card.status, card.trioSummary, card.sourceCountLabel]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })

  return (
    <div className="space-y-10 pb-12">
      <WorkbenchPageHeader
        actions={
          <>
            <Button onClick={() => void onRefresh()} size="sm" variant="ghost">
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 border border-transparent bg-[var(--dp-fill-inverse)] px-5 label-caps text-[var(--dp-text-on-inverse)] transition-opacity hover:opacity-92"
              onClick={() => {
                onCreateDraft()
                setIsDrawerOpen(true)
              }}
              type="button"
            >
              <Plus className="size-4" />
              新增配色盘
            </button>
          </>
        }
        archivedLabel={`${archivedPalettes.length} 项已归档`}
        description="组合三色关系，校验场景、来源与状态，再把可用结构投放到合集与后续内容编排里。"
        onSearchChange={setSearchValue}
        searchPlaceholder="搜索配色盘"
        searchValue={searchValue}
        title="配色盘"
        totalLabel={model?.totalLabel ?? '读取中'}
        updatedAtLabel={model?.updatedAtLabel ?? '等待返回'}
      />

      {errorMessage ? (
        <div className="paper-card border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">{errorMessage}</div>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] pb-4">
          <div>
            <p className="label-caps text-[var(--dp-text-muted)]">配色盘列表</p>
            <h2 className="display-font mt-2 text-[2rem] leading-none tracking-[-0.03em] text-foreground">关系视图</h2>
          </div>
          <p className="text-sm text-[var(--dp-text-muted)]">{draft?.slug ?? '选择一组配色盘以编辑'}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredCards.map((card) => (
            <PaletteCard
              key={card.id}
              isSelected={draft?.id === card.id && isDrawerOpen && !isCreating}
              model={card}
              onSelect={(id) => {
                onSelectPalette(id)
                setIsDrawerOpen(true)
              }}
            />
          ))}

          {isLoading && !model
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="paper-card min-h-[280px] animate-pulse bg-white" />
              ))
            : null}

          {!isLoading && filteredCards.length === 0 ? (
            <div className="paper-card md:col-span-2 xl:col-span-3 2xl:col-span-4 px-8 py-10 text-center text-sm leading-7 text-[var(--dp-text-muted)]">
              没有匹配当前搜索词的配色盘。调整关键词后重试。
            </div>
          ) : null}
        </div>
      </section>

      <DetailDrawer
        isOpen={isDrawerOpen && Boolean(draft && editorOptions)}
        onClose={() => setIsDrawerOpen(false)}
      >
        <PaletteDetailPanel
          archivedPalettes={archivedPalettes}
          deleteCheck={deleteCheck}
          deleteReason={deleteReason}
          draft={draft}
          editorOptions={editorOptions}
          isCreating={isCreating}
          isDeleteChecking={isDeleteChecking}
          isDeleting={isDeleting}
          isRestoringId={isRestoringId}
          isSaving={isSaving}
          onCheckDeleteRisk={onCheckDeleteRisk}
          onClose={() => setIsDrawerOpen(false)}
          onCreateDraft={() => {
            onCreateDraft()
            setIsDrawerOpen(true)
          }}
          onDelete={onDelete}
          onDeleteReasonChange={onDeleteReasonChange}
          onDraftFieldChange={onDraftFieldChange}
          onDraftTagToggle={onDraftTagToggle}
          onRestore={onRestore}
          onSave={onSave}
          saveMessage={saveMessage}
        />
      </DetailDrawer>
    </div>
  )
}