# 配色模特试色预览图片生成工具技术方案

> 创建日期：2026-05-13
> 状态：技术方案草案
> 作用域：`daypalette-color-admin`
> 维护位置：`packages/` 目录下的新工具包

## 1. 文档定位

本文用于规划一个面向内部研发使用的“图片生成实验工具”，目标是用火山引擎与阿里百炼的免费文生图额度，提升配色模特试色预览的素材探索效率。

这份文档解决的问题不是“如何直接得到最终 SVG”，而是先建立一条更高效的实验流水线，用较低成本产出更稳定的参考图与模板候选。

当前文档只规划工具本身，不涉及：

1. `apps/admin-web` 中的正式页面接入。
2. `apps/admin-api` 中的服务端生产能力。
3. 最终 SVG 自动清稿或自动矢量化。

## 2. 为什么放在 `packages/`

当前建议把工具维护在 `packages/` 下，而不是 `apps/` 下，原因如下：

1. 这是一个研发辅助工具，不属于 `admin-web` 或 `admin-api` 的线上运行时能力。
2. 它需要复用 monorepo 的 TypeScript、pnpm workspace 和现有工程规范。
3. 它天然更像一个可独立演进的内部 CLI 包，后续也可能被别的图像实验或素材筛选流程复用。
4. 放在 `packages/` 下可以避免把图片实验逻辑、密钥管理和运行产物污染到业务应用层。

当前建议包名：

```text
packages/outfit-preview-lab/
```

对应 package name 建议为：

```text
@daypalette-color-admin/outfit-preview-lab
```

## 3. 总体目标

该工具的第一阶段目标是完成下面四件事：

1. 用统一的本地命令行方式调用火山和阿里的文生图接口。
2. 支持人物母版、短袖、长裤、中长连衣裙这几类 prompt 的稳定复用。
3. 支持保存参考图、请求参数、返回结果、图片文件和人工评分，避免试错过程不可追溯。
4. 支持小规模 prompt 矩阵实验，提高收敛效率。

第一阶段明确不做：

1. 不做 Web 控制台。
2. 不做数据库持久化。
3. 不做自动 SVG 转换。
4. 不做全自动美学评分模型。

## 4. 推荐实施策略

当前推荐把两家 provider 分工使用，而不是只押一家：

### 4.1 火山引擎的角色

火山优先用于“交互式收敛”，适合下面这些场景：

1. 双参考图融合。
2. 单图快速试错。
3. 人物母版第二轮、第三轮收敛。
4. 短袖模板这种对姿态、风格、轻微五官都敏感的高价值目标。

当前文档基于公开文档确认到的事实：

1. 图片生成接口为 `POST https://ark.cn-beijing.volces.com/api/v3/images/generations`。
2. 使用 API Key Bearer 鉴权。
3. 支持文生图、单图生图、多图生图。
4. 支持 `response_format=url` 或 `response_format=b64_json`。
5. `doubao-seedream-5.0-lite` 支持设置 `output_format=png`。
6. 可关闭水印：`watermark=false`。

### 4.2 阿里百炼的角色

阿里优先用于“批量跑矩阵”，适合下面这些场景：

1. 同一个 prompt 跑多个变体。
2. 同一个模板跑多组 style / negative prompt 组合。
3. 晚上挂批量任务，第二天集中筛图。

当前文档基于公开文档确认到的事实：

1. 文生图 HTTP 接口为异步任务制。
2. 创建任务接口：`POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis`。
3. 查询结果接口：`GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}`。
4. 鉴权方式为 Bearer API Key。
5. HTTP 调用必须带 `X-DashScope-Async: enable`。
6. 结果图 URL 仅短时保留，需要立即下载。

## 5. 技术路线选择

由于该工具明确要落在 `packages/` 下，第一阶段推荐采用 **TypeScript + Node.js CLI**，而不是 Python 脚本，原因如下：

1. 该仓已经是 pnpm + TypeScript monorepo。
2. `packages/*` 当前都是 TypeScript 包，保持一致更利于维护。
3. Node 18+ 已具备原生 `fetch`，无需为 HTTP 调用额外引入复杂依赖。
4. 后续若要把 prompt、评分、结果检索能力接回前端，也更容易复用 TypeScript 类型。

第一阶段建议尽量少引依赖：

1. 运行时优先只用 Node 原生能力。
2. 只有在参数校验和命令行体验明显不足时，再考虑补充轻量依赖。

## 6. 包内目录建议

建议目录结构如下：

```text
packages/outfit-preview-lab/
  package.json
  tsconfig.json
  src/
    cli.ts
    index.ts
    config/
      env.ts
    core/
      run-job.ts
      run-batch.ts
      download-result.ts
      save-run-record.ts
      load-profile.ts
      score-run.ts
    providers/
      provider.ts
      volcengine.ts
      aliyun.ts
    prompts/
      base/
      variants/
    profiles/
      croquis/
      short-sleeve/
      trousers/
      midi-dress/
    refs/
      pose/
      style/
    types/
      job.ts
      provider.ts
      run-record.ts
  .local/
    runs/
    downloads/
```

目录职责建议：

1. `src/cli.ts`：命令行入口。
2. `src/config/env.ts`：读取环境变量与 provider 配置。
3. `src/core/`：调度、下载、保存记录、批量运行。
4. `src/providers/`：封装火山与阿里的 API 差异。
5. `src/prompts/`：存放结构化 prompt 片段。
6. `src/profiles/`：存放可直接运行的实验配置。
7. `src/types/`：共享类型定义。
8. `.local/runs/`：保存本地运行产物，默认不提交。

## 7. 运行产物管理

该工具必须把“结果图”和“元数据”一起保存，不能只存图片。

建议每次运行都落到这样的结构：

```text
.local/runs/2026-05-13/
  croquis-volc-v2-001/
    request.json
    response.json
    resolved-prompt.txt
    images/
      01.png
    score.json
    notes.md
```

每次运行至少保存：

1. provider 名称。
2. model 名称。
3. prompt 版本。
4. negative prompt 版本。
5. 参考图路径。
6. request body。
7. 原始 response。
8. 本地下载后的图片文件名。
9. 人工评分。

## 8. `.gitignore` 调整建议

当前根 `.gitignore` 还没有忽略这个工具未来会产生的运行目录，因此后续落地代码时应补充至少以下规则：

```text
packages/outfit-preview-lab/.local
packages/outfit-preview-lab/.env.local
packages/outfit-preview-lab/.env.*
!packages/outfit-preview-lab/.env.example
```

注意：这一步是后续开始写代码时再改；当前文档只先把规则写清楚。

## 9. 配置设计

建议全部采用环境变量，模型名和 API Key 留空，由你后续自行填写。

建议环境变量如下：

```text
VOLC_API_KEY=
VOLC_MODEL=
VOLC_BASE_URL=https://ark.cn-beijing.volces.com

ALI_API_KEY=
ALI_MODEL=
ALI_BASE_URL=https://dashscope.aliyuncs.com
ALI_WORKSPACE_ID=

DEFAULT_IMAGE_SIZE=
DEFAULT_OUTPUT_DIR=
DEFAULT_WATERMARK=false
```

说明：

1. `VOLC_MODEL`、`ALI_MODEL` 均不在文档中写死。
2. `ALI_WORKSPACE_ID` 作为可选项保留。
3. 后续可以再加 `DEFAULT_PROVIDER`、`DEFAULT_NEGATIVE_PROMPT_PROFILE` 等配置项。

## 10. 统一任务模型

该工具需要先定义自己的“统一任务结构”，然后再由 provider adapter 映射到各家 API。

建议最小任务结构如下：

```ts
interface ImageLabJob {
  id: string
  provider: 'volcengine' | 'aliyun'
  model: string
  prompt: string
  negativePrompt?: string
  size?: string
  referenceImages?: string[]
  tags?: string[]
  outputFormat?: 'png' | 'jpeg'
  metadata?: Record<string, string>
  providerOptions?: Record<string, unknown>
}
```

这样设计的原因：

1. 上层不关心火山还是阿里具体字段名。
2. `providerOptions` 用来承载不同模型的专有参数。
3. 参考图列表可以统一定义成字符串数组，后续由 provider adapter 做具体转换。

## 11. Provider 适配层设计

建议为两家 provider 统一一个接口：

```ts
interface ImageProvider {
  submit(job: ImageLabJob): Promise<ProviderSubmission>
  poll?(submission: ProviderSubmission): Promise<ProviderResult>
  normalize(result: ProviderResult): Promise<NormalizedImageResult>
}
```

建议相关结构：

```ts
interface ProviderSubmission {
  provider: 'volcengine' | 'aliyun'
  requestId?: string
  taskId?: string
  raw: unknown
}

interface NormalizedImageResult {
  provider: 'volcengine' | 'aliyun'
  requestId?: string
  taskId?: string
  images: Array<{
    remoteUrl?: string
    b64Json?: string
    size?: string
  }>
  raw: unknown
}
```

### 11.1 火山 provider

第一阶段建议：

1. 默认只跑单图。
2. 默认关闭组图：`sequential_image_generation=disabled`。
3. 默认 `watermark=false`。
4. 优先 `response_format=url`，生成成功后立刻下载。
5. 只在确有需要时才切到 `b64_json`。

### 11.2 阿里 provider

第一阶段建议：

1. HTTP 只走异步任务模式。
2. 提交任务后保存 `task_id`。
3. 用固定轮询间隔查询直到 `SUCCEEDED`、`FAILED` 或超时。
4. 成功后立即下载结果图。
5. 如果后续需要更顺滑的开发体验，再评估是否接入 DashScope SDK。

## 12. Prompt 与 Profile 管理方式

不要把所有 prompt 都硬编码到 CLI 参数里，建议拆成两层：

### 12.1 Prompt 片段层

用于沉淀基础可复用 prompt，例如：

1. 基础风格前缀。
2. 中国女性气质补充句。
3. 轻微五官控制句。
4. 降低写实感补充句。
5. 通用负面约束。

### 12.2 Profile 层

用于定义一次可直接执行的实验配置，例如：

```json
{
  "id": "short-sleeve-volc-round2",
  "provider": "volcengine",
  "model": "",
  "promptFiles": [
    "base/style-prefix.txt",
    "variants/china-female-face.txt",
    "variants/short-sleeve-round2.txt"
  ],
  "negativePromptFiles": [
    "base/common-negative.txt"
  ],
  "referenceImages": [
    "refs/pose/pose-01.png",
    "refs/style/style-01.png"
  ],
  "size": "1024x1024"
}
```

这样做的好处：

1. 一次只改一个变量。
2. 多 provider 可以共用同一批 prompt 片段。
3. 你后续回看时能知道每一轮到底改了什么。

## 13. CLI 能力边界

第一阶段建议只做下面几个命令：

```text
pnpm --filter @daypalette-color-admin/outfit-preview-lab run run --profile <path>
pnpm --filter @daypalette-color-admin/outfit-preview-lab run batch --manifest <path>
pnpm --filter @daypalette-color-admin/outfit-preview-lab run fetch --provider <name> --task-id <id>
pnpm --filter @daypalette-color-admin/outfit-preview-lab run score --run <path>
```

说明：

1. `run`：执行单个 profile。
2. `batch`：执行一组 profile，用于风格矩阵。
3. `fetch`：用于补拉异步任务结果。
4. `score`：把人工评分写入 `score.json`。

第一阶段不建议做的命令：

1. 不做 `watch`。
2. 不做 Web UI。
3. 不做自动批改 prompt。

## 14. 第一阶段默认工作流

建议工作流固定为下面顺序：

1. 先用火山收敛 `croquis` 母版。
2. 母版稳定后，再用火山收敛 `short-sleeve`。
3. 再用阿里对 `short-sleeve` 批量扫风格变体。
4. 选出最佳方向后，再扩到 `trousers` 和 `midi-dress`。

这样做的原因：

1. 人物母版没收敛时，继续扩模板只会扩大噪音。
2. 短袖是最容易暴露“姿态 / 风格 / 五官 / 三分区”问题的模板。
3. 两家 provider 的优势不同，分工更有效率。

## 15. 人工评分机制

当前阶段不建议做自动评分模型，而是先把人工评分结构固定下来。

建议维度：

1. 姿态自然度：40%
2. 平面矢量感：25%
3. 五官与人物气质：15%
4. 服装结构可拆分性：15%
5. 后续 SVG 清理成本：5%

建议评分结果保存在：

```json
{
  "pose": 8,
  "vectorFlatness": 7,
  "faceAndAesthetic": 6,
  "structure": 7,
  "svgCleanupCost": 5,
  "overall": 7.1,
  "notes": "姿态对，但仍偏插画成品"
}
```

## 16. 实施阶段建议

### 阶段 1：包骨架与运行记录落地

交付物：

1. `packages/outfit-preview-lab/` 骨架。
2. CLI 入口。
3. profile 读取。
4. 本地结果目录与元数据保存。

### 阶段 2：先接火山 provider

交付物：

1. 单图生成。
2. URL 下载。
3. 双参考图实验能力。
4. `croquis` 与 `short-sleeve` 两个 profile。

### 阶段 3：再接阿里 provider

交付物：

1. 提交异步任务。
2. 轮询查询。
3. 成功结果下载。
4. `short-sleeve` 风格矩阵批量运行。

### 阶段 4：补批量与评分

交付物：

1. batch manifest。
2. score 命令。
3. 统一筛图记录。

## 17. 已确认的关键约束

后续落地时应严格遵守：

1. 先低分辨率试错，只有入围图才升高分辨率。
2. 一次只改一个变量，不同时改姿态、风格、五官和服装结构。
3. 每次生成都必须立即下载结果图。
4. 不把 API Key 写进仓库。
5. 不把实验图片和运行目录提交进 git。
6. 第一阶段只做单图，不先开组图。

## 18. 当前建议的下一步

如果按本文进入实现，最自然的开工顺序是：

1. 先在 `packages/` 下建 `outfit-preview-lab` 包骨架。
2. 先实现火山 provider 的最小闭环。
3. 先做 `croquis` 与 `short-sleeve` 两个 profile。
4. 验证运行产物和元数据保存是否顺手。
5. 再接阿里异步任务制。

当前不建议先做页面，不建议先做 SVG 自动化，也不建议先把 13 套模板都铺开。