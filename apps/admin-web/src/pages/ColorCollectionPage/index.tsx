import { type ReactElement } from 'react'
import { ArrowRight, ImageIcon, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { WorkbenchPageHeader } from '@/components/workbench/WorkbenchPageHeader'
import { workbenchPaths } from '@/pages/AdminWorkbench/navigation'
import { useColorCollectionPageViewModel } from './view-model/useColorCollectionPageViewModel'
import { LlmGenerationForm } from './components/LlmGenerationForm'
import { ImageExtractionForm } from './components/ImageExtractionForm'
import { GenerationProgressPanel } from './components/GenerationProgressPanel'
import type { ColorCollectionTab } from './view-model/useColorCollectionPageViewModel'

const TAB_ITEMS: Array<{ key: ColorCollectionTab; label: string; icon: ReactElement }> = [
  { key: 'llm', label: 'LLM 批量生成', icon: <Sparkles size={15} /> },
  { key: 'image', label: '图片取色', icon: <ImageIcon size={15} /> },
]

export function ColorCollectionPage(): ReactElement {
  const navigate = useNavigate()
  const vm = useColorCollectionPageViewModel()

  return (
    <div className="space-y-6 pb-10">
      <WorkbenchPageHeader
        description="通过 LLM 批量生成配色候选，或从真实穿搭图片中提取配色"
        title="色彩采集"
      />

      {/* Error / Success messages */}
      {vm.errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {vm.errorMessage}
        </div>
      )}
      {vm.successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {vm.successMessage}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-[var(--dp-fill-subtle)] p-1">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              vm.activeTab === tab.key
                ? 'bg-[var(--dp-fill-surface)] text-[var(--dp-text-primary)] shadow-sm'
                : 'text-[var(--dp-text-secondary)] hover:text-[var(--dp-text-primary)]'
            }`}
            disabled={vm.isGenerating}
            onClick={() => vm.setActiveTab(tab.key)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left: form */}
        <div className="rounded-xl border border-[var(--dp-border-subtle)] bg-[var(--dp-fill-surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--dp-text-primary)]">
            {vm.activeTab === 'llm' ? '生成参数' : '图片上传'}
          </h3>

          {vm.activeTab === 'llm' && (
            <LlmGenerationForm
              isDisabled={vm.isGenerating}
              onSubmit={vm.startLlmGeneration}
            />
          )}

          {vm.activeTab === 'image' && (
            <ImageExtractionForm
              isDisabled={vm.isGenerating}
              onSubmitUrls={vm.startImageExtractionFromUrls}
              onSubmitFiles={vm.startImageExtractionFromFiles}
            />
          )}
        </div>

        {/* Right: progress / result */}
        <div className="rounded-xl border border-[var(--dp-border-subtle)] bg-[var(--dp-fill-surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--dp-text-primary)]">
            生成进度
          </h3>

          {!vm.samplingRun && !vm.isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles size={48} className="mb-3 text-[var(--dp-text-tertiary)]" />
              <p className="text-sm text-[var(--dp-text-secondary)]">
                填写参数后点击「开始生成」
              </p>
              <p className="mt-1 text-xs text-[var(--dp-text-tertiary)]">
                LLM 将自动生成符合场景的穿搭配色记录
              </p>
            </div>
          )}

          {(vm.samplingRun || vm.isGenerating) && (
            <GenerationProgressPanel
              events={vm.samplingRunEvents}
              samplingRun={vm.samplingRun}
            />
          )}

          {/* Navigate to review */}
          {vm.generatedBatchId && !vm.isGenerating && (
            <div className="mt-4">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--dp-border-subtle)] bg-[var(--dp-fill-surface)] px-4 py-2.5 text-sm font-medium text-[var(--dp-text-primary)] transition-colors hover:bg-[var(--dp-fill-hover)]"
                onClick={() => navigate(`${workbenchPaths.samplingBatches}?batchId=${vm.generatedBatchId}`)}
                type="button"
              >
                前往审阅台查看
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
