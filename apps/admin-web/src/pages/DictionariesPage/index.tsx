import { useEffect, useState, type ReactElement } from 'react'
import { RefreshCcw, Search } from 'lucide-react'

import { DetailDrawer } from '@/components/workbench/DetailDrawer'
import { Button } from '@/components/ui/button'
import { DictionaryEditorPanel } from './components/DictionaryEditorPanel'
import { useDictionariesPageViewModel } from './view-model/useDictionariesPageViewModel'

export interface DictionariesPageProps {
  activeDictionaryKey: string
  onActiveDictionaryKeyChange: (key: string) => void
}

// 字典管理页，负责切换当前字典并承接条目级增删改与恢复流程。
export function DictionariesPage({
  activeDictionaryKey,
  onActiveDictionaryKeyChange,
}: DictionariesPageProps): ReactElement {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const {
    archivedItems,
    createItemDraft,
    deleteCheck,
    deleteReasonByItemId,
    draft,
    errorMessage,
    isCreatingItem,
    isDeleteCheckingItemId,
    isDeletingItemId,
    isLoading,
    isRestoringItemId,
    isSaving,
    model,
    onCheckDeleteRisk,
    onCreateItem,
    onCreateItemFieldChange,
    onDeleteItem,
    onDictionaryFieldChange,
    onDictionaryItemDeleteReasonChange,
    onDictionaryItemFieldChange,
    onRefresh,
    onRestoreItem,
    onSave,
    onSelectDictionary,
    saveMessage,
  } = useDictionariesPageViewModel({ activeDictionaryKey, onActiveDictionaryKeyChange })

  useEffect(() => {
    setIsDrawerOpen(true)
  }, [activeDictionaryKey])

  const filteredCards = (model?.cards ?? []).filter((card) => {
    const keyword = searchValue.trim().toLowerCase()

    if (!keyword) {
      return true
    }

    return [card.key, card.labelZh, card.labelEn, card.scopeSummary, card.selectionModeLabel, card.itemCountLabel]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })

  return (
    <div className="space-y-10 pb-12">
      <section className="max-w-3xl space-y-4">
        <p className="label-caps text-[var(--dp-text-muted)]">Dictionaries</p>
        <h1 className="display-font text-[clamp(3.5rem,7vw,6.25rem)] leading-[0.92] tracking-[-0.05em] text-foreground">
          Dictionaries
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--dp-text-muted)]">
          管理受控词汇与选择模式，避免基础色、Palette 与合集在不同页面里产生不一致的业务口径。
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--dp-text-muted)]">
          <span>{model?.totalLabel ?? '读取中'}</span>
          <span>最近更新：{model?.updatedAtLabel ?? '等待返回'}</span>
          <span>{archivedItems.length} archived items</span>
        </div>
      </section>

      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex w-full max-w-[420px] items-center gap-3 border-b border-[var(--dp-border-subtle)] pb-3 text-sm text-foreground">
          <Search className="size-4 text-[var(--dp-text-muted)]" />
          <input
            className="w-full border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-[var(--dp-text-muted)]"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search dictionaries"
            value={searchValue}
          />
        </label>

        <div className="flex items-center gap-4 self-end lg:self-auto">
          <p className="label-caps text-[var(--dp-text-muted)]">{filteredCards.length} visible</p>
          <Button onClick={() => void onRefresh()} size="sm" variant="ghost">
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <div className="paper-card border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">{errorMessage}</div>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] pb-4">
          <div>
            <p className="label-caps text-[var(--dp-text-muted)]">Dictionary List</p>
            <h2 className="display-font mt-2 text-[2rem] leading-none tracking-[-0.03em] text-foreground">
              Vocabulary View
            </h2>
          </div>
          <p className="text-sm text-[var(--dp-text-muted)]">{draft?.labelZh ?? '选择一条字典记录以编辑'}</p>
        </div>

        <div className="paper-card overflow-hidden bg-white">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_160px_180px_160px_120px] gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-4 lg:grid">
            <span className="label-caps text-[var(--dp-text-muted)]">Dictionary</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Key</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Scope</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Mode</span>
            <span className="label-caps text-[var(--dp-text-muted)]">Items</span>
          </div>

          <div>
            {filteredCards.map((card) => (
              <button
                key={card.key}
                className={[
                  'grid w-full gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5 text-left transition-colors duration-200 lg:grid-cols-[minmax(0,1.2fr)_160px_180px_160px_120px]',
                  draft?.key === card.key && isDrawerOpen ? 'bg-[var(--dp-surface-soft)]' : 'hover:bg-[var(--dp-surface-soft)]',
                ].join(' ')}
                onClick={() => {
                  onSelectDictionary(card.key)
                  setIsDrawerOpen(true)
                }}
                type="button"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{card.labelZh}</p>
                  <p className="mt-1 truncate text-sm text-[var(--dp-text-muted)]">{card.labelEn}</p>
                </div>
                <span className="text-sm text-[var(--dp-text-muted)]">{card.key}</span>
                <span className="text-sm text-foreground">{card.scopeSummary}</span>
                <span className="text-sm text-[var(--dp-text-muted)]">{card.selectionModeLabel}</span>
                <span className="text-sm text-foreground">{card.itemCountLabel}</span>
              </button>
            ))}
          </div>

          {isLoading && !model
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="min-h-[88px] animate-pulse border-b border-[var(--dp-border-subtle)] bg-white" />
              ))
            : null}

          {!isLoading && filteredCards.length === 0 ? (
            <div className="px-8 py-10 text-center text-sm leading-7 text-[var(--dp-text-muted)]">
              没有匹配当前搜索词的字典。调整关键词后重试。
            </div>
          ) : null}
        </div>
      </section>

      <DetailDrawer
        isOpen={isDrawerOpen && Boolean(draft)}
        onClose={() => setIsDrawerOpen(false)}
      >
        <DictionaryEditorPanel
          archivedItems={archivedItems}
          createItemDraft={createItemDraft}
          deleteCheck={deleteCheck}
          deleteReasonByItemId={deleteReasonByItemId}
          draft={draft}
          isCreatingItem={isCreatingItem}
          isDeleteCheckingItemId={isDeleteCheckingItemId}
          isDeletingItemId={isDeletingItemId}
          isRestoringItemId={isRestoringItemId}
          isSaving={isSaving}
          onCheckDeleteRisk={onCheckDeleteRisk}
          onClose={() => setIsDrawerOpen(false)}
          onCreateItem={onCreateItem}
          onCreateItemFieldChange={onCreateItemFieldChange}
          onDeleteItem={onDeleteItem}
          onDictionaryFieldChange={onDictionaryFieldChange}
          onDictionaryItemDeleteReasonChange={onDictionaryItemDeleteReasonChange}
          onDictionaryItemFieldChange={onDictionaryItemFieldChange}
          onRestoreItem={onRestoreItem}
          onSave={onSave}
          saveMessage={saveMessage}
        />
      </DetailDrawer>
    </div>
  )
}