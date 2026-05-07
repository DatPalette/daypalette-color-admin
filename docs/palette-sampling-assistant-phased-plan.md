# 配色候选审阅台分步执行计划

> 状态：转向审阅优先（2026-05-07）
> 共享运营方案：[`../../daypalette-docs/operations/color-asset-operations/palette-market-reference-production-plan.md`](../../daypalette-docs/operations/color-asset-operations/palette-market-reference-production-plan.md)
> 首轮矩阵：[`../../daypalette-docs/operations/color-asset-operations/palette-phase-1-target-matrix.md`](../../daypalette-docs/operations/color-asset-operations/palette-phase-1-target-matrix.md)
> 采样台账模板：[`../../daypalette-docs/operations/color-asset-operations/palette-market-sampling-ledger-template.md`](../../daypalette-docs/operations/color-asset-operations/palette-market-sampling-ledger-template.md)
> 首批批次骨架：[`../../daypalette-docs/operations/color-asset-operations/workday-market-sampling-batch-01.md`](../../daypalette-docs/operations/color-asset-operations/workday-market-sampling-batch-01.md)

## 1. 文档定位

本文用于把 `daypalette-color-admin` 下一阶段“配色候选自动生成 + 人工审阅”工作流的执行动作拆成可以逐步落地的计划，并记录当前已经做到哪一步。

本文只描述 **admin monorepo 的实现计划**，不替代共享层的运营原则。

---

## 2. 目标与非目标

### 2.1 当前目标

当前阶段的目标不是再继续强化“人工录入采样台账”，而是把工作流转成“系统自动生成候选 -> 主理人做审阅”。

这一阶段至少要做到：

1. 程序先按女装优先的品牌白名单、来源白名单和查询模板自动搜集候选来源。
2. 程序先对候选来源做结构化初筛，生成品牌、链接、品类、颜色摘要和候选 palette 判断。
3. 页面主流程以“通过 / 驳回 / 少量修正”为主，而不是大面积人工手填。
4. 审阅通过的候选结果可以顺滑接到现有 `palette.referenceSources[]` 和后续审核链路。

### 2.2 当前明确不做

当前明确不做：

1. 全自动发布正式 palette。
2. 无限制全网抓取。
3. 自动替代主理人做最终审美判断。
4. 复杂多智能体协作编排平台。
5. 继续投入时间打磨以手工录入为中心的旧采样助手流程。

### 2.3 关键边界：程序自动化 vs AI 分析

新工作流应区分两层能力：

1. 程序自动化层：负责打开来源、抓取候选链接、按品牌/品类/场景做规则筛选。这一层可以不依赖模型 API key。
2. AI 分析层：负责从来源内容中归纳颜色关系、生成候选 palette、输出摘要与置信线索。这一层默认需要模型 API 或本地模型。

结论：如果只做“自动找来源 + 自动初筛”，可以先不要求模型密钥；如果要做到“自动分析出候选配色盘”，则需要把模型接入纳入正式计划。

---

## 3. 分步计划

### 步骤 1：固化来源白名单与搜索词矩阵

目标：先把采样入口稳定下来，避免主流程卡在“去哪找、搜什么”。

交付物：

1. `workday` 场景的来源白名单与搜索词矩阵共享文档。
2. 明确允许的渠道类型、优先采样品类和建议关键词结构。

状态：已完成。

成果链接：[`../../daypalette-docs/operations/color-asset-operations/workday-source-whitelist-and-query-matrix.md`](../../daypalette-docs/operations/color-asset-operations/workday-source-whitelist-and-query-matrix.md)

### 步骤 2：定义采样批次合同与存储落点

目标：明确采样记录在系统里如何存、由谁读写、如何和 `referenceSources[]` 对齐。

计划动作：

1. 确定采样批次和采样记录的共享类型。
2. 决定首版是落 JSON 草稿文件还是先落本地服务端内存/文件视图。
3. 明确与 `palette.referenceSources[]` 的映射关系。

状态：已完成。

成果链接：[`./palette-sampling-assistant-storage-contract.md`](./palette-sampling-assistant-storage-contract.md)

### 步骤 3：补 `admin-api` 的采样批次读写接口

目标：让采样台账不再只存在文档，能进入本地 API 管理链路。

计划动作：

1. 增加采样批次与采样记录读取接口。
2. 增加新增、更新、删除和状态流转接口。
3. 增加最小校验，至少覆盖来源字段完整性和批次字段。

状态：已完成。

当前已完成：

1. `GET /api/sampling-batches`
2. `GET /api/sampling-batches/:id`
3. `PUT /api/sampling-batches/:id`
4. `PATCH /api/sampling-batches/:id/status`
5. `DELETE /api/sampling-batches/:id`
6. 批次与记录的最小结构校验，包括批次状态、主题 key、白名单渠道、`samplingId` 唯一性、`readyForTransfer` 前完整性检查。

### 步骤 4：把 `admin-web` 从录入页改成审阅台

目标：给主理人一个独立于 `PalettesPage` 的候选审阅工作区，而不是继续让主理人在页面里手工录字段。

计划动作：

1. 增加候选批次列表。
2. 增加待审候选队列与主卡片。
3. 把主动作改成“通过 / 驳回 / 需要修订”。
4. 把人工录入收缩到“修正候选”的次级动作。
5. 增加“转写到 referenceSources 草稿”的入口。

状态：进行中。

当前已完成：

1. 工作台已有独立页面与批次文件链路。
2. 采样批次列表、批次摘要和记录载入已经可用。
3. 页面与 API 已经具备保存、状态更新和删除的最小能力。

当前还没做：

1. 审阅优先的主界面与快捷动作。
2. “转写到 `referenceSources[]` 草稿”的专用操作入口。
3. 更细的筛选、搜索和批量操作。

### 步骤 5：补自动候选生成能力

目标：让系统先产出候选来源和候选 palette 判断，减少主理人手工找链接和手工归纳的成本。

计划动作：

1. 先实现女装优先的品牌白名单、来源模板和查询 preset。
2. 增加程序自动抓取候选来源并写入批次文件。
3. 评估引入模型分析，把候选来源进一步归纳为候选 palette 判断。
4. 输出只到候选审阅台，不直接写正式 palette。

状态：进行中。

当前已完成：

1. `admin-api` 已新增 `POST /api/sampling-batches/:id/generate-candidates`，可按女装优先品牌池、主题色路和来源模板自动补候选。
2. `admin-web` 候选审阅台已新增“自动生成女装候选”按钮，生成后会自动定位到第一条待审记录。
3. 后端生成链路已支持“规则生成 + 可选模型深化”两层模式：默认先跑规则生成；若配置模型环境变量，再继续深化颜色摘要和市场信号。

当前还没做：

1. 真正的外部来源抓取与网页内容解析。
2. 模型分析结果的置信度与来源解释卡片。
3. 批量生成、批量重生成与批量驳回。

### 5.1 当前模型环境变量

如果希望自动候选生成继续深化成“AI 颜色分析”，当前后端使用以下环境变量：

1. `DAYPALETTE_LLM_API_KEY`
2. `DAYPALETTE_LLM_MODEL`
3. `DAYPALETTE_LLM_BASE_URL`（可选，默认 `https://api.openai.com/v1`）

说明：

1. 不配置这些变量时，系统仍可自动生成女装候选品牌、平台、候选来源与初步色路。
2. 配置后，系统会继续深化 `primaryColorSummary / secondaryColorSummary / accentColorSummary / colorSummary / marketSignals`。

### 步骤 6：跑通 `workday` 女装首批自动候选 + 审阅

目标：用一个小批次验证“自动生成候选 -> 主理人审阅 -> 转写引用”的整条链路，而不是再让主理人手工填 24 条记录。

计划动作：

1. 先用 `workday` 场景生成首批女装候选来源。
2. 为每条候选输出最小审阅信息：品牌、来源、品类、颜色摘要、候选判断。
3. 在审阅台上完成通过 / 驳回。
4. 评估是否继续扩到 `workday` 全量 120 条。

状态：进行中。

当前已完成：

1. `phase1-workday-batch01.v1.json` 已实体化为 24 条结构化采样记录。
2. 批次状态已进入 `collecting`，可作为自动候选生成与审阅的第一批实验容器。

当前还没做：

1. 让程序自动为这 24 条记录补齐真实市场候选来源。
2. 生成第一轮候选 palette 判断。
3. 在审阅台完成第一轮通过 / 驳回。
4. 基于结果评估是否扩到 `workday` 全量 120 条。

---

## 4. 当前执行顺序

当前按以下顺序推进：

1. 步骤 1、步骤 2、步骤 3 已完成。
2. 步骤 4 当前从“可编辑录入页”转向“审阅优先工作台”。
3. 当前主线转到步骤 5 的自动候选生成能力，为步骤 6 的首批审阅验证做准备。

---

## 5. 当前假设与风险

当前假设：

1. 采样助手首版优先服务 `workday` 场景，而不是四个场景同时开工。
2. 新流程以“程序先产出候选 + 主理人审阅”为主，不再接受主流程建立在大面积手工录入上。
3. `PalettesPage` 当前补的 `referenceSources[]` 足够承接后续审阅结果，但不适合作为候选审阅主工作区。
4. 若要自动输出候选 palette 判断，需要把模型接入列为正式能力，而不是继续回避该问题。

当前风险：

1. 如果来源白名单过散，采样质量会失控。
2. 如果仍沿用手工录入导向的页面与合同，后续 UI 和 API 会继续返工。
3. 如果在没有候选自动生成的前提下直接要求主理人审阅，审阅台会变成空壳。
4. 如果一开始就扩到四个场景，候选生成与审阅成本会同时失控。

---

## 6. 当前结论

当前最重要的不是继续打磨手工录入体验，而是先把 24 条 `workday` 记录接上自动候选生成，并把页面改成主理人只做审阅的工作台。等这条链路稳定后，再扩到更多场景与更强的模型分析能力。