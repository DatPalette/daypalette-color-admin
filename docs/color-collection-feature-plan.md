# 配色采集双模式方案

> 创建日期：2026-05-11
> 状态：Mode A + Mode B 基础功能已落地，待端到端验证
> 关联进度：[`2026-05-11-color-collection-progress.md`](./2026-05-11-color-collection-progress.md)

## 1. 背景与动机

DayPalette 需要大量真实、高质量的女性穿搭配色数据。现有采集助手的候选生成是规则引擎合成的（品牌配置文件 × 主题配置文件组合），并非来自真实穿搭场景，数据缺乏可信度。

需要两种互补的采集模式：
- **Mode A：LLM 批量生成** — 前期快速拿到结构化配色数据，直接调 LLM 生成
- **Mode B：图片取色** — 后期月度更新，从真实穿搭图片中提取配色

两种模式都输出到现有的 `SamplingBatchDocument` 格式，复用现有审阅台，审阅台本身零改动。

## 2. 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                   ColorCollectionPage (前端)                  │
│     Tab 1: LLM 批量生成        Tab 2: 图片取色               │
└────────┬───────────────────────────────┬────────────────────┘
         │ POST /api/sampling-runs       │ POST /api/image-extraction/*
         │ (operationType:               │
         │  'llm-batch-generate')        │
         ▼                               ▼
┌────────────────────┐    ┌──────────────────────────┐
│ SamplingRunsService│    │ ImageExtractionController │
│   ↓                │    │   ↓                      │
│ LlmBatchGeneration │    │ ImageExtractionService   │
│   Service          │    │   (sharp + K-means)      │
└────────┬───────────┘    └──────────┬───────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│            SamplingBatchDocument (JSON 文件)                 │
│            data/palette-sampling/*.v1.json                  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│            SamplingBatchesPage (审阅台)                      │
│            已有功能，无需修改                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Mode A：LLM 批量生成

**流程：** 前端表单 → `POST /api/sampling-runs` (operationType: `llm-batch-generate`) → SSE 流式进度 → LlmBatchGenerationService 调 LLM API 分批生成 → 写入 batch 文件 → 审阅台

**关键设计决策：**
- 复用现有 `sampling-runs` SSE 基础设施，新增 operation type 而非新建端点
- LLM 调用使用 `response_format: { type: 'json_object' }`，每次生成 ~10 条（避免 token 超限）
- 环境变量复用 `DAYPALETTE_LLM_*`（与现有规则引擎增强共用）

### 2.2 Mode B：图片取色

**流程：** 前端上传/URL → `POST /api/image-extraction/upload` 或 `/from-urls` → sharp 缩放 → K-means 聚类提色 → 语义标签映射 → 写入 batch 文件 → 审阅台

**关键设计决策：**
- 独立 NestJS 模块（引入 sharp 原生依赖 + multipart 上传）
- K-means 聚类 (k=5) 提取主色，过滤近白/近黑
- 可选 LLM Vision 分析（预留接口，当前未实现）

## 3. 新增/修改的 API 端点

### 3.1 Mode A — 扩展 sampling-runs

```
POST /api/sampling-runs
Body: {
  batchId?: string,                    // 可选，不传则自动生成
  operationType: 'llm-batch-generate',
  llmBatchGenerate: {
    occasionId: string,                // 'workday' | 'weekend' | 'outdoor' | 'dinner'
    titleZh: string,                   // 批次标题
    themeKeys: string[],               // 主题 key 列表
    targetCount: number,               // 5-50
    styleConstraints?: string,         // 可选风格约束
    sourceWhitelistIds?: string[]      // 可选来源白名单
  }
}
Returns: SamplingRunSummary { runId, batchId, status, ... }

SSE: GET /api/sampling-runs/:runId/stream
事件类型新增: 'llm-generation-started', 'llm-record-generated', 'llm-generation-finished'
```

### 3.2 Mode B — 新增 image-extraction

```
POST /api/image-extraction/from-urls
Body: {
  imageUrls: string[],
  occasionId: string,
  themeKey: string,
  themeLabelZh: string,
  batchId?: string,
  enableVisionAnalysis?: boolean
}
Returns: { batchId, records: SamplingRecord[], extractedColors: ExtractedColor[][] }

POST /api/image-extraction/upload
Content-Type: multipart/form-data
Fields: files[] (图片), occasionId, themeKey, themeLabelZh, batchId?, enableVisionAnalysis?
Returns: 同上
```

## 4. 数据结构变更

### 4.1 contracts 新增类型

```typescript
// SamplingRunOperationType 新增
| 'llm-batch-generate'

// SamplingRunEventType 新增
| 'llm-generation-started'
| 'llm-record-generated'
| 'llm-generation-finished'

// 新增接口
interface LlmBatchGenerateParams {
  occasionId: string
  titleZh: string
  themeKeys: string[]
  targetCount: number
  styleConstraints?: string
  sourceWhitelistIds?: string[]
}

interface ImageExtractionParams {
  imageUrls?: string[]
  occasionId: string
  themeKey: string
  themeLabelZh: string
  batchId?: string
  enableVisionAnalysis?: boolean
}

interface ExtractedColor {
  hex: string
  percentage: number
  semanticLabel?: string
}
```

### 4.2 SamplingRecord 无变更

两种模式都复用现有 `SamplingRecord` 结构，无需修改。LLM 生成的记录通过 `brandName`、`platform` 等字段标识来源；图片提取的记录通过 `sourceUrl` 存原始图片地址。

## 5. 文件清单

### 5.1 后端新增文件

| 文件 | 用途 |
|------|------|
| `apps/admin-api/src/modules/sampling-batches/llm-batch-generation.service.ts` | Mode A 核心：LLM 批量生成服务 |
| `apps/admin-api/src/modules/image-extraction/image-extraction.module.ts` | Mode B 模块注册 |
| `apps/admin-api/src/modules/image-extraction/image-extraction.controller.ts` | Mode B REST 端点 |
| `apps/admin-api/src/modules/image-extraction/image-extraction.service.ts` | Mode B 核心：sharp + K-means 提色 |
| `apps/admin-api/src/modules/image-extraction/dto/extract-image-colors.dto.ts` | Mode B 请求 DTO |
| `apps/admin-api/src/common/utils/semantic-color-mapper.ts` | 共享语义色彩映射工具 |

### 5.2 后端修改文件

| 文件 | 变更 |
|------|------|
| `packages/contracts/src/index.ts` | 新增 operation type、event type、接口 |
| `apps/admin-api/src/modules/sampling-runs/sampling-runs.service.ts` | 新增 `llm-batch-generate` 执行分支 |
| `apps/admin-api/src/modules/sampling-runs/dto/create-sampling-run.dto.ts` | 新增 `llmBatchGenerate` 字段 |
| `apps/admin-api/src/modules/sampling-batches/sampling-batches.module.ts` | 注册 LlmBatchGenerationService |
| `apps/admin-api/src/app.module.ts` | 注册 ImageExtractionModule |
| `apps/admin-api/package.json` | 新增 sharp 依赖 |

### 5.3 前端新增文件

| 文件 | 用途 |
|------|------|
| `apps/admin-web/src/pages/ColorCollectionPage/index.tsx` | 采集页面（Tab 切换） |
| `apps/admin-web/src/pages/ColorCollectionPage/view-model/useColorCollectionPageViewModel.ts` | 状态管理 + SSE 订阅 |
| `apps/admin-web/src/pages/ColorCollectionPage/components/LlmGenerationForm.tsx` | Mode A 表单 |
| `apps/admin-web/src/pages/ColorCollectionPage/components/ImageExtractionForm.tsx` | Mode B 表单 |
| `apps/admin-web/src/pages/ColorCollectionPage/components/GenerationProgressPanel.tsx` | SSE 进度面板 |
| `apps/admin-web/src/services/color-collection/color-collection.service.ts` | API 调用封装 |

### 5.4 前端修改文件

| 文件 | 变更 |
|------|------|
| `apps/admin-web/src/pages/AdminWorkbench/navigation.ts` | 新增 `/color-collection` 路径和导航项 |
| `apps/admin-web/src/pages/AdminWorkbench/index.tsx` | 新增路由 |
| `apps/admin-web/src/services/sampling-runs/sampling-runs.service.ts` | 新增 SSE 事件类型、`llmBatchGenerate` 字段 |

## 6. 环境变量

Mode A 复用现有 LLM 环境变量，无需新增：

```
DAYPALETTE_LLM_API_KEY=...
DAYPALETTE_LLM_MODEL=...
DAYPALETTE_LLM_BASE_URL=...
```

Mode B 无额外环境变量。sharp 为原生依赖，需 `pnpm approve-builds` 后重新安装。

## 7. 已知限制与后续迭代

### 7.1 当前限制

1. **Mode B 的 LLM Vision 分析**：接口已预留（`enableVisionAnalysis` 参数），但实际调用逻辑未实现。当前只做纯色彩提取，不调 Vision API。
2. **Mode B 的 sharp 构建**：sharp 需要原生编译，首次安装需 `pnpm approve-builds sharp`。在 CI/CD 环境需额外配置。
3. **Mode A 的 LLM 输出质量**：依赖 LLM 的时尚知识，生成的配色可能需要人工筛选。prompt 中已包含字典值约束。
4. **审阅台的批次选择**：当前审阅台通过 URL 参数 `?batchId=xxx` 选中新批次，但现有代码可能不读取此参数，需验证。

### 7.2 后续可迭代方向

1. **浏览器插件采集**：Chrome 插件一键从小红书/Pinterest 采集穿搭图 → 调 Mode B 提色
2. **批量图片 URL 导入**：支持从 Pinterest Board API 批量获取图片 URL
3. **LLM Vision 增强**：接入 Vision 模型分析穿搭图片，自动标注品类、风格、场景
4. **配色趋势报告**：定期从 Pantone/WGSN 获取流行色趋势，作为 LLM 生成的参考约束
5. **转写到 production**：审阅通过的采样记录自动转写到 `palettes.v1.json`（当前未实现）
