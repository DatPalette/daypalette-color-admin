# 配色模特试色预览 — 进度记录

> 记录日期：2026-05-13
> 记录目的：收口 `outfit-preview-lab` 图片实验工具、shape-first 叠合验证原型与当前已确认结论，便于下次直接接着做。
> 方案文档：[`palette-outfit-preview-plan.md`](./palette-outfit-preview-plan.md)
> 技术方案：[`palette-outfit-preview-image-lab-technical-plan.md`](./palette-outfit-preview-image-lab-technical-plan.md)
> 资产执行手册：[`palette-outfit-preview-asset-generation-guide.md`](./palette-outfit-preview-asset-generation-guide.md)

## 1. 当前状态一句话

`outfit-preview-lab` 本地实验包已经建成，火山 / 阿里双 provider 调用链、prompt/profile/manifest、运行结果落盘与评分能力都已可用；配色展示路线也已经从“让模型直接决定最终颜色”切换为“基础模特 + 中性结构层 + 程序控色 + 局部贴合”，当前主要瓶颈已明确收口到局部 warp 粒度和 neutral-layer 源结构稳定性。

## 2. 本轮已完成内容

### 2.1 图片实验工具包落地

- 已新增 `packages/outfit-preview-lab/` 独立 CLI 包。
- 已完成能力：
  - `run`：单 profile 实验运行。
  - `batch`：manifest 批量实验。
  - `fetch`：阿里异步任务补拉。
  - `score`：人工评分写回 run record。
- 已完成 provider 适配：
  - 火山引擎 Ark 文生图 / 参考图实验。
  - 阿里百炼 DashScope 异步图像任务。
- 已完成运行产物落盘：
  - `resolved-profile.json`
  - `resolved-prompt.txt`
  - `request.json`
  - `submit-response.json`
  - `response.json`
  - `run-record.json`
  - `images/`
  - `score.json`

### 2.2 文档与使用流补齐

- 已补 `packages/outfit-preview-lab/.env.example` 中文注释。
- 已补 `packages/outfit-preview-lab/README.md` 的完整使用流程。
- 已新增并补充：
  - `docs/palette-outfit-preview-image-lab-technical-plan.md`
  - `docs/palette-outfit-preview-doubao-prompt-pack-temp.md`
- 已把叠合验证原型说明同步到当前真实状态，不再误写成“4 点仿射”单次对位。

### 2.3 shape-first 资产路线收口

- 当前架构已明确切换为：
  1. 基础模特只保留短抹胸和内裤。
  2. 上装 / 下装单独生成 neutral layer。
  3. 最终展示色由程序按 Hex 控制，而不是交给模型临场决定。
- 已冻结当前阶段稳定参考资产：
  - `packages/outfit-preview-lab/refs/style/base-mannequin-best.jpeg`
  - `packages/outfit-preview-lab/refs/style/short-sleeve-neutral-layer-best.jpeg`
  - `packages/outfit-preview-lab/refs/style/trousers-neutral-layer-best.jpeg`
- 已补齐当前关键 profile 与 prompt 片段：
  - `short-sleeve-volc-pose-locked-neutral-layer.json`
  - `trousers-volc-pose-locked-neutral-layer.json`
  - `pose-locked-top-*`
  - `pose-locked-bottom-*`
  - `neutral-structure-*`
  - `visible-body-removal-negative.txt`

### 2.4 叠合验证原型收口

- 已落地 `packages/outfit-preview-lab/examples/overlay-prototype/`。
- 原型当前已完成：
  - 手工 silhouette 蒙版。
  - 内部 cutout 镂空。
  - 主色 / 辅色分区控色。
  - 多锚点三角网格局部贴合。
- 已完成浏览器内验证：
  - neutral-layer 输入明显优于早期 garment-only 商品图输入。
  - 上衣和裤装都已经能落到正确的大区域，而不是整体角度完全错位。
  - 继续只调单组 target points 的收益已经开始下降。

## 3. 本轮验证结论

### 3.1 已确认成立的判断

1. “模型负责形体，程序负责最终颜色” 这条路线成立。
2. shape-first 的 neutral-layer 比早期 garment-only 资产更适合作为叠合底稿。
3. 从单次全局 affine 升级到多锚点三角网格后，已经足以证明方向没错。

### 3.2 已确认的当前瓶颈

1. 当前上衣源图仍然偏近景、偏箱体，导致即便 target mesh 收紧后，仍像一整块躯干面板。
2. 当前裤装已经比上衣更接近可用，但骨盆到外侧髋部、裆部过渡仍然偏硬。
3. 当前问题已经不再是“提示词方向完全错了”，而是：
   - 局部 warp 粒度还不够细。
   - neutral-layer 源结构本身还需要继续稳定。

## 4. 当前建议

今天确认后的建议如下，这部分是下次继续时应直接照做的优先顺序。

### 4.1 第一优先级：先做语义分块，不再继续微调同一组点

下一步不要继续在一整件衣服上反复挪同一批 mesh points，而是直接把服装拆成更符合穿着语义的局部块：

1. 上衣拆成：`torso + left sleeve + right sleeve + hem`
2. 长裤拆成：`pelvis + left leg + right leg`

每一块都应有自己独立的：

1. silhouette / cutout
2. source points
3. target points
4. triangles

原因：

1. 当前最大误差已经不是全局角度，而是局部结构一起被硬拉导致的发板和折线感。
2. 继续微调同一整块 mesh，已经开始进入低收益阶段。

### 4.2 第二优先级：如果分块后仍然发硬，再回到生成侧只重做上衣 neutral-layer

如果完成分块后，上衣仍然像一块僵硬的躯干面板，而不是贴体服装结构，就不要继续在前端贴合上消耗时间，直接回到生成端，只重做更贴体的 short-sleeve neutral-layer：

1. 保持 pose-locked 路线不变。
2. 保持“中性、低饱和、便于后续程序上色”的策略不变。
3. 目标只收敛一件事：让上衣源结构更贴体、更像服装层，而不是近景箱体块面。

## 5. 下次开工直接做什么

为避免再发散，下次直接按这个顺序继续：

1. 先改 `packages/outfit-preview-lab/examples/overlay-prototype/index.html`，把上衣和裤装做语义分块贴合。
2. 浏览器里只验证三张图：上衣、裤装、完整合成，不再重新烧 prompt。
3. 只有当“分块后仍然发硬”成立时，才回去重跑 short-sleeve neutral-layer。
4. 如果分块方向成立，再考虑把这套贴合思路整理成后续可复用的运行时方案。

## 6. 交接备注

当前最重要的不是继续扩更多模板，也不是继续让模型直接上色，而是先把“基础模特 + 独立中性结构层 + 程序控色 + 分块贴合”这条主路线打实。

今天下班前的建议已经明确：

1. 先做分块贴合。
2. 再决定是否需要重做上衣 neutral-layer。
3. 不要回头再把主要精力投到“让模型直接给最终色”这条路上。