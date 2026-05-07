# 配色候选审阅台存储与合同草案

> 状态：草案 v0.2（2026-05-07）
> 分步计划：[`./palette-sampling-assistant-phased-plan.md`](./palette-sampling-assistant-phased-plan.md)
> 共享运营方案：[`../../daypalette-docs/operations/color-asset-operations/palette-market-reference-production-plan.md`](../../daypalette-docs/operations/color-asset-operations/palette-market-reference-production-plan.md)

## 1. 文档定位

本文用于收口候选审阅台当前阶段的两个核心判断：

1. 采样批次和采样记录到底存在哪里。
2. 这些记录与现有 `palette.referenceSources[]` 怎么对齐。

本文只约束 `daypalette-color-admin` 内部的实现，不把采样批次提升为 `day_palette` 的运行时真相源。

---

## 2. 一句话结论

候选批次首版应存放在 `daypalette-color-admin/data/palette-sampling/` 下，以**每个批次一个 JSON 文件**的方式保存；这些文件属于后台 monorepo 的工具层草稿数据，不写回 `day_palette/rawfile/palette-data/`；当某条候选记录被审阅通过时，只把映射后的 `referenceSources[]` 和运营摘要转写进正式 `palette` 记录。

---

## 3. 存储边界

### 3.1 为什么不放进 `day_palette`

当前不把采样批次直接放进 `day_palette`，原因如下：

1. `day_palette` 当前仍是 App 运行时原始内容的真相源。
2. 采样批次属于运营研究草稿，不是终端消费数据。
3. 首版采样批次会包含大量尚未采用的候选链接和备注，不应混进移动端原始数据目录。

### 3.3 自动生成与审阅边界

当前这套 JSON 文件既要承接程序自动生成的候选结果，也要承接主理人的审阅动作。

因此边界应明确为：

1. 文件可以保存程序自动发现的候选来源、品牌、平台、品类、颜色摘要和候选判断。
2. 文件可以保存主理人的通过 / 驳回 / 修订结论。
3. 文件仍不直接等于正式 palette 数据；它只是候选研究与审阅层。

### 3.2 当前推荐目录

首版推荐目录：

`daypalette-color-admin/data/palette-sampling/`

文件命名规则建议：

`<batchId>.v1.json`

示例：

`phase1-workday-batch01.v1.json`

---

## 4. 文件结构

每个采样批次文件建议包含：

1. 批次级元数据。
2. 采样记录列表。
3. 基础统计字段，减少页面端重复计算。

推荐结构：

```json
{
  "version": 1,
  "updatedAt": "2026-05-07T00:00:00Z",
  "batch": {
    "id": "phase1-workday-batch01",
    "titleZh": "Workday 首批 24 条采样",
    "occasionId": "workday",
    "status": "draft",
    "themeKeys": [
      "polished-light-commute",
      "urban-minimal-foundation"
    ],
    "sourceWhitelistIds": [
      "brand-site",
      "brand-flagship-store"
    ],
    "notes": "用于试运行采样链路。"
  },
  "summary": {
    "recordCount": 24,
    "completedCount": 0,
    "uniquePlatformCount": 0,
    "uniqueBrandCount": 0
  },
  "items": []
}
```

---

## 5. 批次状态合同

批次状态首版建议使用：

1. `draft`
2. `collecting`
3. `clustering`
4. `readyForTransfer`
5. `archived`

语义：

1. `draft`：刚创建批次，可能只有骨架。
2. `collecting`：正在补链接、品牌、颜色摘要。
3. `clustering`：开始从样本提炼候选关系。
4. `readyForTransfer`：可以转写到 `palette.referenceSources[]` 或候选 palette 草稿。
5. `archived`：该批次只保留历史记录，不再继续编辑。

---

## 6. 采样记录字段合同

采样记录应包含两层字段：

### 6.1 候选生成与审阅专属字段

1. `samplingId`
2. `productionBatchId`
3. `occasionId`
4. `themeKey`
5. `themeLabelZh`
6. `seasonHint`
7. `primaryColorSummary`
8. `secondaryColorSummary`
9. `accentColorSummary`
10. `styleSignals`
11. `marketSignals`
12. `candidatePaletteIds`
13. `finalPaletteIds`
14. `digestionStatus`

其中 `digestionStatus` 当前可继续承担“待审 / 已归纳 / 已采用 / 已驳回”的工作流语义；若后续审阅动作继续增多，再补独立的 review decision 字段。

### 6.2 与 `referenceSources[]` 对齐字段

以下字段应直接与 `palette.referenceSources[]` 对齐，避免后续转写时重复变换：

1. `sourceId`
2. `platform`
3. `channelType`
4. `brandName`
5. `sourceUrl`
6. `observedAt`
7. `itemCategory`
8. `colorSummary`
9. `notes`

---

## 7. 转写规则

当一条采样记录被正式采用时，首版建议按以下规则转写：

1. 采样记录中的对齐字段直接映射到 `palette.referenceSources[]`。
2. `marketSignals` 聚合后可转写到 `palette.marketSignalSummary`。
3. `productionBatchId` 直接映射到 `palette.productionBatchId`。
4. `themeKey` 和 `themeLabelZh` 当前先保留在采样批次，不强行写进正式 `palette`。
5. `candidatePaletteIds` 与 `finalPaletteIds` 仍留在采样助手侧，作为研究链路记录。

---

## 8. 当前阶段结论

采样批次首版已经可以按“工具层草稿数据”来处理，不必挤进 `day_palette`。这意味着下一步可以直接在 `packages/contracts` 和 `packages/file-store` 里补共享类型与路径解析，再由 `admin-api` 读取 `data/palette-sampling/*.json` 提供本地接口。