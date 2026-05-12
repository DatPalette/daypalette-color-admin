# 配色模特试色预览 — 进度记录

> 记录日期：2026-05-12
> 记录目的：收口配色模特试色预览在 Web 管理台中的当前落地状态、已确认问题与后续待办。
> 方案文档：[`palette-outfit-preview-plan.md`](./palette-outfit-preview-plan.md)
> 资产执行手册：[`palette-outfit-preview-asset-generation-guide.md`](./palette-outfit-preview-asset-generation-guide.md)

## 1. 当前状态一句话

采样工作台审阅抽屉里的模特试色预览 Web MVP 已落地，组件与页面适配已经完成，但当前高质量基础画稿仍未解决，后续主路线已调整为“优先寻找已授权、可编辑的矢量人物资产”，而不是继续依赖在线文生图。

## 2. 已完成内容

### 2.1 共享组件与页面接线

- 新增共享组件目录 `apps/admin-web/src/components/outfit-preview/`
- 已落地文件：
  - `OutfitPreview.tsx`
  - `OutfitPreviewControls.tsx`
  - `OutfitPreviewLegend.tsx`
  - `outfit-preview.types.ts`
  - `outfit-preview.templates.ts`
  - `outfit-preview.utils.ts`
  - `index.ts`
- `SamplingBatchesPage` 审阅抽屉已接入模特试色预览，可切换：
  - 分体 / 连衣模式
  - 上装模板
  - 下装模板
  - 连衣模板

### 2.2 采样页本地适配层

- 新增 `apps/admin-web/src/pages/SamplingBatchesPage/view-model/outfit-preview.ts`
- 已完成能力：
  - 采样记录语义色摘要 -> 试色预览颜色槽位映射
  - 基于 `itemCategory` 的轻量默认模板推断
  - 预览模型构造与页面本地 UI 状态分离

### 2.3 模特与模板第一版

- 已完成 `female-line-v1` 的第一版 SVG 轮廓
- 已完成第一批模板的 SVG path 基线：
  - 上装：`long-sleeve`、`short-sleeve`、`camisole`、`shirt`、`outerwear`
  - 下装：`trousers`、`shorts`、`mini-skirt`、`midi-skirt`、`maxi-skirt`
  - 连衣：`mini-dress`、`midi-dress`、`maxi-dress`
- 已完成一轮模板 path 打磨，使其比最初的几何块面更接近女装编辑稿轮廓

### 2.4 文档与方案收口

- 已新增 `docs/palette-outfit-preview-plan.md`
- 已将阶段状态更新为：
  - 阶段 1 已完成
  - 阶段 2 已完成（采样工作台抽屉 Web MVP）
- 已新增 `docs/palette-outfit-preview-asset-generation-guide.md`
- 当前资产获取主路线已明确切换为：
  - 优先寻找已授权、可编辑的矢量人物与服装资产
  - 在线文生图不再作为主路线

## 3. 已验证内容

- `apps/admin-web/src/components/outfit-preview/` 相关文件已做文件级诊断，无错误
- `apps/admin-web/src/pages/SamplingBatchesPage/index.tsx` 已做文件级诊断，无错误
- 采样工作台抽屉中模特预览的页面接线已完成

## 4. 当前问题与结论

### 4.1 当前问题

1. 手工微调 SVG path 已经能完成功能闭环，但很难再获得显著的视觉跃升。
2. 在线文生图工具（包括本轮试过的 Recraft）成本高、风格不稳，容易生成场景插画而不是单人物可编辑母版。
3. 当前真正的瓶颈不是前端接线，而是“高质量、可编辑、可分区”的基础矢量资产。

### 4.2 当前结论

后续优先级已明确调整为：

1. 先获取合适的矢量基础资产。
2. 先跑通 `short-sleeve`、`trousers`、`midi-dress` 三个试运行模板。
3. 路线成立后，再扩到全部模板并推进配色盘详情页接入。

## 5. 待做事项

### 5.1 资产获取

1. 在 Figma Community、Blush、Humaaans、DrawKit、Storyset、Icons8 Ouch 等渠道建立候选 shortlist。
2. 至少收集 `8` 到 `12` 个候选矢量人物资产。
3. 用“可编辑、单人女性、风格合适、服装可分区、授权明确”五项硬条件完成第一轮筛选。

### 5.2 试运行模板

1. 基于最终选中的母版，先整理 `short-sleeve`。
2. 基于最终选中的母版，先整理 `trousers`。
3. 基于最终选中的母版，先整理 `midi-dress`。
4. 为这三个模板确认 `main / secondary / accent` 区域映射。

### 5.3 代码后续

1. 待基础资产明确后，替换 `outfit-preview.templates.ts` 中当前手写 path。
2. 评估是否需要把当前 `female-line-v1` 改成更贴近最终资产的结构。
3. 进入阶段 3：接入 `PalettesPage` 详情视图。

## 6. 当前建议

当前不建议继续把时间投入到在线文生图试错上。最有效的下一步是严格按 [`palette-outfit-preview-asset-generation-guide.md`](./palette-outfit-preview-asset-generation-guide.md) 执行：先做矢量资产 shortlist，再只跑三个试运行模板，验证路线后再扩展范围。