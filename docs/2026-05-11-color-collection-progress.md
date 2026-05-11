# 配色采集双模式 — 进度记录

> 记录日期：2026-05-11
> 记录目的：收口配色采集双模式（LLM 批量生成 + 图片取色）的当前落地状态，便于跨设备接力开发。
> 方案文档：[`color-collection-feature-plan.md`](./color-collection-feature-plan.md)

## 1. 当前状态一句话

配色采集双模式（Mode A: LLM 批量生成 + Mode B: 图片取色）的基础功能已全部落地，前后端 TypeScript 编译通过、Vite 构建通过，但尚未进行端到端功能验证（需启动后端 + 前端实际跑通流程）。

## 2. 已完成内容

### 2.1 共享契约层

- `packages/contracts/src/index.ts` 新增：
  - `SamplingRunOperationType` 增加 `'llm-batch-generate'`
  - `SamplingRunEventType` 增加 `'llm-generation-started'`, `'llm-record-generated'`, `'llm-generation-finished'`
  - 新增 `LlmBatchGenerateParams`, `ImageExtractionParams`, `ExtractedColor` 接口

### 2.2 Mode A 后端（LLM 批量生成）

- 新增 `LlmBatchGenerationService`（`apps/admin-api/src/modules/sampling-batches/llm-batch-generation.service.ts`）
  - 核心方法 `generateLlmBatch(params, onProgress?)` 调 LLM API 分批生成配色记录
  - 每次 LLM 调用生成 ~10 条记录（`RECORDS_PER_LLM_CALL = 10`），超过时分批调用
  - 使用 `response_format: { type: 'json_object' }`，temperature 0.7
  - System prompt 包含字典值约束（品类、channelType、seasonHint、styleSignals 示例）
  - 输出直接写入 `SamplingBatchDocument` 格式，保存到 `data/palette-sampling/`
- 扩展 `SamplingRunsService`：
  - `supportedOperationTypes` 新增 `'llm-batch-generate'`
  - `executeRun()` 新增分支，调用 `LlmBatchGenerationService`
  - `createRun()` 对 `llm-batch-generate` 类型不要求预先存在 batch
  - 新增 `executeLlmBatchGenerate()` 私有方法，处理 SSE 事件发射
- 扩展 `CreateSamplingRunDto`：新增可选字段 `llmBatchGenerate?: LlmBatchGenerateParams`
- 注册：`SamplingBatchesModule` providers/exports 新增 `LlmBatchGenerationService`

### 2.3 Mode A 前端

- 新增 `/color-collection` 路由和「色彩采集」导航项
- `ColorCollectionPage`：Tab 切换「LLM 批量生成」/「图片取色」
- `LlmGenerationForm`：场景选择（workday/weekend/outdoor/dinner）、主题多选、数量滑块（5-50）、风格约束输入
- `GenerationProgressPanel`：SSE 实时进度展示（进度条、事件日志、状态指示）
- `useColorCollectionPageViewModel`：管理 SSE 连接生命周期、事件去重、状态更新
- `color-collection.service.ts`：`createSamplingRun()` 封装，复用现有 SSE 订阅
- 完成后展示「前往审阅台查看」按钮，跳转 `/sampling-batches?batchId=xxx`

### 2.4 Mode B 后端（图片取色）

- 新增 `ImageExtractionModule`（独立 NestJS 模块）
- `ImageExtractionController`：
  - `POST /api/image-extraction/from-urls` — 接收图片 URL 数组
  - `POST /api/image-extraction/upload` — multipart 文件上传（FilesInterceptor）
- `ImageExtractionService`：
  - `extractDominantColors(sharp, buffer, numColors)` — sharp 缩放 + K-means 聚类
  - K-means 算法：k=5，maxIterations=20，过滤近白/近黑
  - `matchSemanticLabel(hex)` — 基于 HSL 色相的语义标签映射
  - `extractFromUrls()` / `extractFromBuffers()` — 批量处理并写入 batch 文件
- `package.json` 新增 `sharp` 依赖（需 `pnpm approve-builds`）

### 2.5 Mode B 前端

- `ImageExtractionForm`：URL 输入 / 文件上传双模式切换、场景和主题选择
- `useColorCollectionPageViewModel` 扩展：新增 `startImageExtractionFromUrls` / `startImageExtractionFromFiles` actions
- `color-collection.service.ts`：新增 `extractColorsFromUrls()` / `extractColorsFromFiles()` 函数

### 2.6 共享工具

- 新增 `semantic-color-mapper.ts`（`apps/admin-api/src/common/utils/`）
  - 从 `sampling-candidate-generation.service.ts` 提取的语义色彩桶定义和匹配逻辑
  - 导出：`resolveSemanticColorBucket()`, `isSemanticColorBucket()`, `pickSemanticBucketLabel()`, `getAllSemanticBuckets()`

## 3. 构建状态

- `pnpm run build:packages` — 通过
- `admin-api` TypeScript (`npx tsc --noEmit`) — 通过
- `admin-web` TypeScript (`npx tsc --noEmit`) — 通过
- `admin-web` Vite 构建 (`npx vite build`) — 通过（431KB JS, 33KB CSS）

## 4. 待验证项

以下功能已编码完成但尚未实际运行验证：

### 4.1 Mode A 端到端验证

1. 启动 admin-api (`pnpm run start:dev`)
2. 确认 LLM 环境变量已配置（`DAYPALETTE_LLM_API_KEY`, `DAYPALETTE_LLM_MODEL`, `DAYPALETTE_LLM_BASE_URL`）
3. 前端打开「色彩采集」页面，选择场景和主题，点击「开始生成」
4. 观察 SSE 进度事件是否正常推送
5. 完成后检查 `data/palette-sampling/` 下是否生成了新的 batch 文件
6. 点击「前往审阅台查看」，确认新 batch 在审阅台中可见且可审阅

### 4.2 Mode B 端到端验证

1. 确认 sharp 已正确安装（`pnpm approve-builds sharp` + `pnpm install`）
2. 前端切换到「图片取色」Tab
3. 输入测试图片 URL 或上传本地图片
4. 点击「提取配色」，确认返回的色块和记录正确
5. 检查 batch 文件是否生成

### 4.3 审阅台集成验证

1. 从「色彩采集」生成的 batch 能否在审阅台正常显示
2. 审阅台的「通过」/「驳回」功能是否正常
3. URL 参数 `?batchId=xxx` 能否自动选中对应 batch

## 5. 已知问题与注意事项

1. **sharp 原生依赖**：首次安装需 `pnpm approve-builds sharp`，否则 sharp 不会编译。在新设备克隆项目后需重新执行。
2. **LLM 输出质量**：生成的配色质量取决于 LLM 的时尚知识。当前 prompt 中已约束了品类、风格、季节等字典值，但仍可能需要人工筛选。
3. **Mode B 的 Vision 分析**：`enableVisionAnalysis` 参数已预留，但实际 Vision API 调用未实现。当前只做纯色彩提取。
4. **审阅台 batchId 参数**：ColorCollectionPage 完成后跳转 `/sampling-batches?batchId=xxx`，但需确认审阅台是否读取此 URL 参数来自动选中 batch。
5. **sampling-runs 的 batchId**：Mode A 创建 run 时 batchId 为临时占位值（`llm-pending-xxx`），生成完成后会更新为真实 batchId。需确认前端 SSE 处理逻辑正确获取最终 batchId。

## 6. 后续迭代方向

1. **浏览器插件**：Chrome 插件一键采集小红书/Pinterest 穿搭图
2. **批量图片 URL 导入**：支持从 Pinterest Board API 批量获取
3. **LLM Vision 增强**：接入 Vision 模型分析穿搭图片
4. **转写到 production**：审阅通过的记录自动转写到 `palettes.v1.json`
5. **配色趋势参考**：定期获取 Pantone/WGSN 流行色作为 LLM 约束
