import type { ReactElement } from 'react'
import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DictionaryCard } from './components/DictionaryCard'
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

  return (
    <div className="space-y-6 lg:space-y-8">
      <Card className="overflow-hidden border-[var(--dp-border-hairline)] bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(214,224,216,0.58))]">
        <CardContent className="grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.2fr)_320px] xl:items-end">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Dictionaries</p>
            <div className="space-y-3">
              <h2 className="display-font max-w-[10ch] text-5xl leading-none tracking-[-0.05em] text-foreground md:text-6xl">
                Dictionaries 已经补到条目级增删恢复与删除保护。
              </h2>
              <p className="max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">
                当前已支持单个字典的标题、说明编辑保存，以及条目新增、删除前引用检查、软删除和恢复，为后续 Palettes、Collections 的编辑链路打底。
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-white/80 bg-white/70 p-5 backdrop-blur-md">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Dataset</p>
              <p className="text-lg font-medium text-foreground">{model?.totalLabel ?? '读取中'}</p>
              <p className="text-sm text-muted-foreground">最近更新时间：{model?.updatedAtLabel ?? '等待返回'}</p>
            </div>
            <Button className="w-full" onClick={() => void onRefresh()} variant="primary">
              <RefreshCcw className="size-4" />
              刷新字典
            </Button>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-red-200 bg-red-50/80 text-red-700">
          <CardContent className="p-5 text-sm leading-6">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Grid</p>
            <h3 className="display-font text-3xl tracking-[-0.04em] text-foreground">基础字典列表</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(model?.cards ?? []).map((card) => (
              <DictionaryCard
                key={card.key}
                isSelected={draft?.key === card.key}
                model={card}
                onSelect={onSelectDictionary}
              />
            ))}

            {isLoading && !model
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="min-h-[220px] animate-pulse bg-white/60" />
                ))
              : null}
          </div>
        </section>

        <section className="xl:sticky xl:top-8 xl:self-start">
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
        </section>
      </div>
    </div>
  )
}