import { useState, type ReactElement } from 'react'
import { Plus, RefreshCcw } from 'lucide-react'

import { DetailDrawer } from '@/components/workbench/DetailDrawer'
import { WorkbenchPageHeader } from '@/components/workbench/WorkbenchPageHeader'
import { Button } from '@/components/ui/button'
import { BaseColorCard } from './components/BaseColorCard'
import { BaseColorDetailPanel } from './components/BaseColorDetailPanel'
import { useBaseColorsPageViewModel } from './view-model/useBaseColorsPageViewModel'

// 基础色管理页，负责组装列表、详情编辑和归档恢复三个页面区块。
export function BaseColorsPage(): ReactElement {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const {
    archivedBaseColors,
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
    onSelectBaseColor,
    saveMessage,
  } = useBaseColorsPageViewModel()

  const filteredCards = (model?.cards ?? []).filter((card) => {
    const keyword = searchValue.trim().toLowerCase()

    if (!keyword) {
      return true
    }

    return [card.id, card.nameZh, card.nameEn, card.hex, card.colorFamily, card.tagSummary]
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
              Refresh
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
              添加颜色
            </button>
          </>
        }
        archivedLabel={`${archivedBaseColors.length} archived`}
        description="定义品牌与内容系统的基础色资产，先把单色样本整理准确，再把它们拼成可复用的三色结构。"
        onSearchChange={setSearchValue}
        searchPlaceholder="Search base colors"
        searchValue={searchValue}
        title="Base Colors"
        totalLabel={model?.totalLabel ?? '读取中'}
        updatedAtLabel={model?.updatedAtLabel ?? '等待返回'}
      />

      {errorMessage ? (
        <div className="paper-card border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">{errorMessage}</div>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] pb-4">
          <div>
            <p className="label-caps text-[var(--dp-text-muted)]">Color Grid</p>
            <h2 className="display-font mt-2 text-[2rem] leading-none tracking-[-0.03em] text-foreground">
              Catalog View
            </h2>
          </div>
          <p className="text-sm text-[var(--dp-text-muted)]">{draft?.nameZh ?? '选择一张色卡以编辑'}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredCards.map((card) => (
            <BaseColorCard
              key={card.id}
              isSelected={draft?.id === card.id && isDrawerOpen && !isCreating}
              model={card}
              onSelect={(id) => {
                onSelectBaseColor(id)
                setIsDrawerOpen(true)
              }}
            />
          ))}

          {isLoading && !model
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="paper-card min-h-[320px] animate-pulse bg-white" />
              ))
            : null}

          {!isLoading && filteredCards.length === 0 ? (
            <div className="paper-card md:col-span-2 xl:col-span-3 2xl:col-span-4 px-8 py-10 text-center text-sm leading-7 text-[var(--dp-text-muted)]">
              没有匹配当前搜索词的基础色。调整关键词后重试。
            </div>
          ) : null}
        </div>
      </section>

      <DetailDrawer
        isOpen={isDrawerOpen && Boolean(draft && editorOptions)}
        onClose={() => setIsDrawerOpen(false)}
      >
        <BaseColorDetailPanel
          archivedBaseColors={archivedBaseColors}
          deleteCheck={deleteCheck}
          deleteReason={deleteReason}
          draft={draft}
          editorOptions={editorOptions}
          isDeleteChecking={isDeleteChecking}
          isCreating={isCreating}
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