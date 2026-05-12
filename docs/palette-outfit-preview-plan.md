# 配色模特试色预览方案

> 创建日期：2026-05-12
> 状态：方案草案，待确认后进入 Web MVP
> 当前作用域：`daypalette-color-admin` 本仓实现规划

## 1. 文档定位

本文用于收口 `daypalette-color-admin` 中“模特试色预览”能力的本地实现方案，目标是把采样工作台与配色盘页当前的纯色块预览，升级成更接近真实穿着效果的矢量穿搭预览。

本文只描述 **admin monorepo 的实现方案与分阶段落地顺序**，不直接替代共享设计语言。

如果后续确认这套交互会进入 HarmonyOS 移动端，则应把“模板命名、颜色槽位语义、交互基线”提升到 `daypalette-docs` 共享层，再由各端分别完成实现映射。

如果要继续提升基础画稿质量，而不是继续手修当前 SVG，可配合阅读执行手册：[`./palette-outfit-preview-asset-generation-guide.md`](./palette-outfit-preview-asset-generation-guide.md)。

## 2. 当前问题

### 2.1 采样工作台的问题

采样工作台当前已经能展示语义色盘预览，但主要还是色块视图：

1. 颜色推导逻辑集中在 [`../apps/admin-web/src/pages/SamplingBatchesPage/index.tsx`](../apps/admin-web/src/pages/SamplingBatchesPage/index.tsx) 中的 `buildSamplingPreviewSwatches()`。
2. 当前展示组件是同文件内的 `SamplingColorPreview()`，本质上仍是三个到若干个色块的并排展示。
3. 审阅者能看到颜色关系，但很难快速判断“这些颜色落到女装穿搭上是否顺眼”。

### 2.2 配色盘页的问题

配色盘页当前的列表卡片也仍然是三段纯色条：

1. 列表卡片在 [`../apps/admin-web/src/pages/PalettesPage/components/PaletteCard.tsx`](../apps/admin-web/src/pages/PalettesPage/components/PaletteCard.tsx) 中直接渲染 `previewHexes`。
2. `previewHexes` 在 [`../apps/admin-web/src/transformers/palettes/palettes.transformer.ts`](../apps/admin-web/src/transformers/palettes/palettes.transformer.ts) 中已经能从真实基础色 `hex` 映射得到。
3. 这适合快速看三色关系，但不适合判断整体穿着氛围、面积分配与点缀效果。

### 2.3 结论

当前页面缺少一个“把三色放到服装区域里”的中间层，所以：

1. 采样工作台难以判断候选配色是否值得继续审阅。
2. 配色盘页难以判断三色在女装形态上的整体观感。
3. 后续即便想把这一能力移植到移动端，也缺少稳定的预览合同。

## 3. 目标与非目标

### 3.1 当前目标

当前阶段的目标是先做一个 **矢量、可切换模板、可复用的模特试色预览**：

1. 在管理台里用简笔女性模特展示当前三色落到服装上的效果。
2. 支持上装、下装、连衣类模板切换，而不是只有固定一套衣服。
3. 采样工作台与配色盘页都能复用同一套预览组件。
4. 第一阶段不改后端合同，只复用现有颜色数据。
5. 为后续移动端迁移保留清晰的模板和槽位语义。

### 3.2 当前明确不做

当前明确不做：

1. 拟真写实模特或照片级试衣。
2. 身材、肤色、发型、鞋包、饰品的完整造型系统。
3. 自动生成完整搭配建议引擎。
4. 基于拖拽的服装编辑器。
5. 第一阶段就引入新的后端字段或持久化模板设置。

## 4. 设计原则

模特试色预览应遵守这些原则：

1. **先看面积关系，再看细节**：重点是判断主色、辅色、点缀色的视觉分布，而不是做完整时装设计。
2. **矢量优先**：第一阶段使用 SVG 模板，不依赖位图素材。
3. **简笔但不幼稚**：模特应是克制、编辑感的女性轮廓，与当前后台纸质画廊感一致。
4. **模板少而准**：第一阶段宁可只做少量高频模板，也不做十几套质量参差的服装。
5. **交互轻量**：模板切换应是按钮/分段选择，不进入复杂编辑工作流。

## 5. 核心体验模型

### 5.1 统一预览对象

前端应收口一个统一的 `OutfitPreviewModel`，供共享预览组件消费。第一阶段建议至少包含：

```ts
type OutfitPreviewMode = 'separates' | 'dress'

type OutfitTopTemplate =
  | 'long-sleeve'
  | 'short-sleeve'
  | 'camisole'
  | 'shirt'
  | 'outerwear'

type OutfitBottomTemplate =
  | 'trousers'
  | 'shorts'
  | 'mini-skirt'
  | 'midi-skirt'
  | 'maxi-skirt'

type OutfitDressTemplate = 'mini-dress' | 'midi-dress' | 'maxi-dress'

interface OutfitPreviewModel {
  silhouetteId: 'female-line-v1'
  mode: OutfitPreviewMode
  topTemplate?: OutfitTopTemplate
  bottomTemplate?: OutfitBottomTemplate
  dressTemplate?: OutfitDressTemplate
  primaryHex: string
  secondaryHex: string
  accentHex: string
  primaryLabel: string
  secondaryLabel: string
  accentLabel: string
}
```

说明：

1. 第一阶段只定义一个女性轮廓版本：`female-line-v1`。
2. 模板字段用于切换服装形态，不进入后端存储。
3. `primary / secondary / accent` 三色是试色主输入，额外摘要色暂不直接映射到模特主体区域。

### 5.2 第一阶段模板库

建议先控制在以下模板规模：

| 类别 | 第一阶段模板 |
| --- | --- |
| 上装 | 长袖、短袖、吊带、衬衫、轻外套 |
| 下装 | 长裤、短裤、短裙、中长裙、长裙 |
| 连衣 | 短连衣裙、中长连衣裙、长连衣裙 |

说明：

1. `separates` 模式允许用户自由切换上装与下装组合。
2. `dress` 模式允许用户直接看一体式穿着效果。
3. 第一阶段不单独做鞋、包、围巾模板，但允许把点缀色落到领口、袖口、腰线或门襟细节。

### 5.3 颜色槽位规则

所有模板都应遵守统一的颜色槽位语义：

| 槽位 | 作用 | 颜色来源 |
| --- | --- | --- |
| `main` | 最大面积主体面 | `primaryHex` |
| `secondary` | 第二面积区域 | `secondaryHex` |
| `accent` | 小面积点缀 | `accentHex` |

第一阶段建议的映射规则：

1. 主色默认落在服装主体面，例如上衣大身、裙身或裤身。
2. 辅色默认落在袖身、下装主体、内搭或拼接区域。
3. 点缀色默认落在领口、腰线、门襟、袖口、边线等少量区域。
4. 如果当前模板结构不足以明显承载三色，也必须保留一个最小点缀区域，不允许点缀色完全丢失。

### 5.4 页面交互基线

建议的最低交互如下：

1. 模式切换：`分体穿搭 / 连衣穿搭`
2. 上装切换：长袖 / 短袖 / 吊带 / 衬衫 / 外套
3. 下装切换：长裤 / 短裤 / 短裙 / 中长裙 / 长裙
4. 连衣切换：短 / 中长 / 长
5. 颜色信息保留文字标签与 hex，避免只剩图形。

说明：

1. 第一阶段不做拖拽换装。
2. 第一阶段不做模板状态持久化。
3. 第一阶段不做“根据品类自动锁定模板”的强规则，只允许做轻量默认值推断。

## 6. 数据来源与映射策略

### 6.1 采样工作台

采样工作台当前没有真实基础色 ID，只能依赖已有语义色推导，因此第一阶段应定义为 **语义试穿**：

1. 继续复用 [`../apps/admin-web/src/pages/SamplingBatchesPage/index.tsx`](../apps/admin-web/src/pages/SamplingBatchesPage/index.tsx) 里的 `buildSamplingPreviewSwatches()` 结果。
2. 取前三个颜色槽位作为 `primary / secondary / accent` 输入。
3. 如果 `colorSummary` 超过三项，超出部分继续作为补充标签展示，但不直接塞进模特主体区域。
4. 如果颜色摘要为空，仍沿用现有 fallback hex 逻辑。

### 6.2 配色盘页

配色盘页已经拥有真实基础色 hex，可直接定义为 **真实试穿**：

1. 复用 [`../apps/admin-web/src/transformers/palettes/palettes.transformer.ts`](../apps/admin-web/src/transformers/palettes/palettes.transformer.ts) 中的基础色 `hex` 映射。
2. `primaryColorId / secondaryColorId / accentColorId` 分别映射为 `primary / secondary / accent`。
3. 配色盘详情页应优先使用真实 hex，不再回退到语义猜测。

### 6.3 默认模板推断

第一阶段可选做少量默认推断，但不能依赖它做强约束：

1. `dress`、`wrap-dress` 之类品类可默认切到 `dress` 模式。
2. `skirt`、`mini-skirt`、`maxi-skirt` 等可默认切到对应下装模板。
3. 其余未知情况统一落到 `short-sleeve + trousers` 或 `long-sleeve + trousers` 默认组合。

## 7. 组件与模块边界

### 7.1 共享组件层

第一阶段建议新增共享组件目录，例如：

```text
apps/admin-web/src/components/outfit-preview/
  OutfitPreview.tsx
  outfit-preview.types.ts
  outfit-preview.templates.ts
  outfit-preview.utils.ts
```

职责边界：

1. `OutfitPreview.tsx` 只负责渲染 SVG、模板切换 UI 与颜色填充。
2. `types.ts` 定义共享预览模型和模板类型。
3. `templates.ts` 存放模板定义、区域槽位与 SVG path。
4. `utils.ts` 只负责模板解析、槽位着色和 fallback 逻辑。

### 7.2 采样工作台模块边界

采样工作台不应直接把业务数据耦合进共享组件，建议：

1. 在 `SamplingBatchesPage` 模块内新增一个本地 helper，把 `SamplingRecordDto` 转成 `OutfitPreviewModel`。
2. 当前 `buildSamplingPreviewSwatches()` 可继续保留，作为语义色来源适配层。
3. 页面只决定“把模特预览放在哪”，不在 JSX 里写颜色映射规则。

### 7.3 配色盘页模块边界

配色盘页建议优先走 transformer 扩展：

1. 让 `PalettesPage` 的列表或详情模型直接带出试色预览所需的三色输入。
2. `PaletteCard` 与详情摘要区只消费页面模型，不自己拼颜色逻辑。
3. 真实 hex 映射继续留在 transformer，而不是下沉到组件内做二次查询。

## 8. 页面落点建议

### 8.1 第一优先：采样工作台抽屉

第一阶段最适合先接到采样工作台抽屉中，原因：

1. 审阅动作最需要判断“这组颜色落在穿搭上是否成立”。
2. 当前抽屉已经有语义色盘预览，是最自然的替换或并排升级点。
3. 若 MVP 不够直观，也最容易快速迭代而不影响主列表扫描效率。

### 8.2 第二优先：配色盘详情摘要区

第二阶段建议接入配色盘详情页摘要区，作为三色结果的增强视图：

1. 当前摘要区已经有三色信息，但只读感太强，不足以看穿搭效果。
2. 详情面板比列表卡片更适合承载模板切换和交互控件。
3. 先做详情，再考虑是否给列表卡片做迷你版模特预览。

### 8.3 列表卡片的边界

列表卡片第一阶段不建议直接上完整模特预览，原因：

1. 卡片区最重要的是快速扫描，不适合挂复杂模板切换。
2. 若一开始就在卡片里上模特，信息密度会明显上升。
3. 更稳妥的顺序是先做详情版，稳定后再评估列表迷你版。

## 9. 跨端迁移边界

虽然第一阶段只在 Web 管理台实现，但为了后续移动端迁移，当前文档先明确哪些内容未来应提升为共享层：

1. 模板命名：`long-sleeve / short-sleeve / camisole / shirt / outerwear / trousers / mini-skirt / maxi-dress` 等。
2. 颜色槽位语义：`main / secondary / accent`。
3. 默认交互基线：分体/连衣切换、有限模板切换、点缀不丢失。
4. 女性轮廓的抽象层级：简笔、编辑感、低噪声，而不是写实插画。

当前仍保留为本仓实现细节的部分：

1. Web 端 SVG 路径实现。
2. Web 端按钮布局与交互密度。
3. 当前后台页面里的具体落点和 CSS 结构。

如果确认移动端要消费这套预览模式，则应在 `daypalette-docs` 新增共享文档，再由 `day_palette` 和 `daypalette-color-admin` 各自写实现映射。

## 10. 分阶段落地计划

### 阶段 1：定义试色预览合同与 SVG 模板基线

目标：先把“模特 + 服装模板 + 三色槽位”的最小合同稳定下来。

交付物：

1. `OutfitPreviewModel` 类型。
2. `female-line-v1` 轮廓。
3. 第一批 6 到 8 个模板。
4. 三色槽位映射规则与 fallback 逻辑。

状态：已完成。

#### 阶段 1 的实现边界

阶段 1 只解决下面这些问题：

1. 共享预览组件的目录结构如何组织。
2. 试色预览模型、模板定义、区域槽位的 TypeScript 合同如何定义。
3. 第一批 SVG 模板具体做哪几套。
4. 哪些逻辑留在共享组件，哪些逻辑留在页面模块适配层。

阶段 1 仍然**不进入页面接线**，也不开始接入 `SamplingBatchesPage` 或 `PalettesPage`。

#### Step 1.1：建立共享组件目录骨架

目标：先按当前 `admin-web` 的共享组件习惯，给试色预览留出稳定目录，而不是继续把逻辑塞进页面文件。

建议目录：

```text
apps/admin-web/src/components/
  outfit-preview/
    index.ts
    OutfitPreview.tsx
    OutfitPreviewControls.tsx
    OutfitPreviewLegend.tsx
    outfit-preview.types.ts
    outfit-preview.templates.ts
    outfit-preview.utils.ts
```

说明：

1. `src/components/` 当前已经按 `sampling / ui / workbench` 组织共享组件，因此 `outfit-preview/` 适合作为新的共享组件目录。
2. `OutfitPreview.tsx` 负责模特 SVG 与模板切换后的视觉渲染。
3. `OutfitPreviewControls.tsx` 负责模式与模板切换控件，避免主组件过重。
4. `OutfitPreviewLegend.tsx` 负责标签、颜色名、hex 的附属展示。
5. `outfit-preview.templates.ts` 只存模板注册表与区域定义，不放页面业务判断。
6. `outfit-preview.utils.ts` 只处理模板解析、默认值合并与槽位着色。
7. `index.ts` 只做组件与类型导出，方便页面层按模块消费。

阶段 1 不建议再细拆子目录。理由是：

1. 第一阶段模板数量还不大。
2. 先把合同稳定下来，再决定是否需要把 `female-line-v1` 单独拆文件。

#### Step 1.2：定义共享类型合同

目标：让采样工作台与配色盘页未来都只需要输出一个统一模型，而不用各自重新理解模板内部结构。

建议最小类型如下：

```ts
export type OutfitPreviewMode = 'separates' | 'dress'

export type OutfitPreviewTopTemplate =
  | 'long-sleeve'
  | 'short-sleeve'
  | 'camisole'
  | 'shirt'
  | 'outerwear'

export type OutfitPreviewBottomTemplate =
  | 'trousers'
  | 'shorts'
  | 'mini-skirt'
  | 'midi-skirt'
  | 'maxi-skirt'

export type OutfitPreviewDressTemplate =
  | 'mini-dress'
  | 'midi-dress'
  | 'maxi-dress'

export type OutfitPreviewSlot = 'main' | 'secondary' | 'accent'

export interface OutfitPreviewColorToken {
  hex: string
  label: string
}

export interface OutfitPreviewModel {
  silhouetteId: 'female-line-v1'
  mode: OutfitPreviewMode
  topTemplate?: OutfitPreviewTopTemplate
  bottomTemplate?: OutfitPreviewBottomTemplate
  dressTemplate?: OutfitPreviewDressTemplate
  colors: Record<OutfitPreviewSlot, OutfitPreviewColorToken>
}

export interface OutfitPreviewSurface {
  id: string
  slot: OutfitPreviewSlot
  path: string
}

export interface OutfitPreviewTemplateDefinition {
  id: string
  mode: OutfitPreviewMode
  label: string
  surfaces: OutfitPreviewSurface[]
}
```

这套合同要解决的关键点：

1. `OutfitPreviewModel` 是页面输入，不应包含 SVG path。
2. `OutfitPreviewTemplateDefinition` 是模板注册表输入，不应混入业务 DTO。
3. `OutfitPreviewSurface.slot` 明确每个区域吃哪一个颜色槽位。
4. `colors` 建议收口成 `Record<slot, token>`，比散落的 `primaryHex / secondaryHex / accentHex` 更利于后续扩展。

阶段 1 不建议加入下面这些字段：

1. 持久化模板偏好。
2. 自动推荐理由文案。
3. 鞋包、配饰、肤色等附加维度。

#### Step 1.3：定义组件公开接口

目标：让页面层未来接入时只面对一组稳定 props，而不是直接驱动模板内部状态。

建议的主组件接口：

```ts
export interface OutfitPreviewProps {
  model: OutfitPreviewModel
  availableBottomTemplates?: OutfitPreviewBottomTemplate[]
  availableDressTemplates?: OutfitPreviewDressTemplate[]
  availableTopTemplates?: OutfitPreviewTopTemplate[]
  className?: string
  onBottomTemplateChange?: (template: OutfitPreviewBottomTemplate) => void
  onDressTemplateChange?: (template: OutfitPreviewDressTemplate) => void
  onModeChange?: (mode: OutfitPreviewMode) => void
  onTopTemplateChange?: (template: OutfitPreviewTopTemplate) => void
  showControls?: boolean
  showLegend?: boolean
}
```

接口规则：

1. 组件本身不管理持久状态，默认由页面层控制当前模板。
2. 如果页面层不传 `showControls`，默认可先展示只读预览。
3. `available*Templates` 允许不同页面裁剪模板集，例如采样工作台先只开放高频模板。
4. `showLegend` 用于控制是否展示颜色标签与 hex，避免列表卡片未来过重。

#### Step 1.4：定义第一批模板清单

目标：不是先做大量模板，而是确定第一批最值得实现的高频款式。

建议第一批共 8 套：

| 模式 | 模板 ID | 中文标签 | 说明 |
| --- | --- | --- | --- |
| 分体 | `long-sleeve + trousers` | 长袖上衣 / 长裤 | 最稳妥默认款 |
| 分体 | `short-sleeve + trousers` | 短袖上衣 / 长裤 | 日常基础款 |
| 分体 | `camisole + maxi-skirt` | 吊带 / 长裙 | 轻盈女性化款 |
| 分体 | `shirt + mini-skirt` | 衬衫 / 短裙 | 都市感款 |
| 分体 | `outerwear + trousers` | 外套 / 长裤 | 层次感款 |
| 分体 | `short-sleeve + shorts` | 短袖 / 短裤 | 轻夏款 |
| 连衣 | `midi-dress` | 中长连衣裙 | 最通用连衣款 |
| 连衣 | `maxi-dress` | 长连衣裙 | 气质感款 |

暂缓到第二批的模板：

1. `mini-dress`
2. `midi-skirt`
3. `outerwear + mini-skirt`
4. 任何偏礼服或偏运动功能服的专门模板

理由：

1. 第一批先覆盖日常、通勤、轻社交、度假四类直觉场景。
2. 先用较少模板验证颜色槽位效果是否足够稳定。
3. 模板数量一旦过多，后续会迅速把问题从“配色预览”变成“服装系统设计”。

#### Step 1.5：定义 SVG 区域最小标准

目标：确保每套模板都至少能稳定承载三色，而不是只有一块大色面。

每套模板至少应包含：

1. `main` 主体区域：面积最大。
2. `secondary` 次主体区域：能明显形成第二面积关系。
3. `accent` 点缀区域：面积小但稳定可见。

建议的区域分布规则：

1. 上衣模板：大身 = `main`，袖身或内搭 = `secondary`，领口/袖口/门襟 = `accent`。
2. 下装模板：裤身或裙身 = `secondary` 或 `main`，具体取决于当前组合的主视角。
3. 连衣模板：裙身 = `main`，上身拼接或腰部 = `secondary`，领口/腰线 = `accent`。
4. 外套模板：外套大身可承载 `main`，内搭承载 `secondary`，拉链/包边承载 `accent`。

为了控制复杂度，阶段 1 还应固定：

1. `female-line-v1` 轮廓只做一个站姿。
2. 不做面部五官细节，只保留头部、发型轮廓和四肢抽象线面。
3. 不做布料褶皱级 path，只保留关键轮廓与色块分区。

#### Step 1.6：定义共享组件与页面适配边界

目标：先明确未来代码落点，避免阶段 2 接线时边界漂移。

页面侧适配建议：

1. `SamplingBatchesPage/view-model/helpers.ts` 或同级 helper：输出采样记录默认模板与 `OutfitPreviewModel`。
2. `PalettesPage` transformer：输出 Palette 详情页用的真实试色模型。
3. `OutfitPreview` 共享组件不接触 `SamplingRecordDto` 或 `PaletteDto`。

阶段 1 明确禁止：

1. 在 `OutfitPreview` 里直接 import 页面 DTO。
2. 在页面 JSX 里现场拼 SVG 模板定义。
3. 在 transformer 里写 SVG path。

#### Step 1.7：阶段 1 验收标准

阶段 1 完成的判断标准应是：

1. 文档里已经明确共享目录、类型合同、组件 props、模板清单、区域槽位规则。
2. 后续开发者不需要重新讨论“文件放哪、类型怎么命名、第一批模板做哪些”。
3. 阶段 2 可以直接以本文为输入开始编码采样工作台抽屉 MVP。

### 阶段 1 当前结论

当前阶段 1 应先把试色预览收口成一个新的共享组件模块，而不是继续扩写 `SamplingBatchesPage` 或 `PaletteCard` 里的局部视觉逻辑。只要共享合同、模板清单和区域槽位规则先稳定，阶段 2 的页面接线成本会显著下降。

### 阶段 2：接入采样工作台抽屉

目标：让审阅者能先在采样工作台里切模板看效果。

交付物：

1. 采样记录到预览模型的适配层。
2. 抽屉里的模特试色预览组件。
3. 模式、模板切换与 hex/标签展示。

状态：已完成（采样工作台抽屉 Web MVP）。

当前已落地：

1. 在 `apps/admin-web/src/components/outfit-preview/` 建立共享试色预览组件模块。
2. 在 `apps/admin-web/src/pages/SamplingBatchesPage/view-model/outfit-preview.ts` 建立采样记录到预览模型的本地适配层。
3. 在 `SamplingBatchesPage` 审阅抽屉中接入模特试色预览，并支持分体/连衣、上装/下装/连衣模板切换。
4. 继续保留语义色推导前提，不改后端合同。

### 阶段 3：接入配色盘详情页

目标：让正式配色盘能用真实三色做详情级穿搭预览。

交付物：

1. Palette transformer 扩展。
2. 详情页摘要区新增模特试色视图。
3. 保留当前三色信息，同时新增穿搭观感层。

状态：待开始。

### 阶段 4：评估共享层与移动端迁移

目标：在 Web MVP 证明价值后，再决定是否提升为跨端共享能力。

交付物：

1. 提炼共享模板命名与槽位语义。
2. 在 `daypalette-docs` 补共享层说明。
3. 给 `day_palette` 输出 ArkUI 侧实现映射输入。

状态：待开始。

## 11. 风险与待确认项

### 11.1 当前风险

1. 采样工作台的颜色仍有相当一部分来自语义推导，不是真实布料色值，因此只能作为方向判断。
2. 若模板做得过多，维护成本会快速上升，且会削弱后台的扫描效率。
3. 若点缀色落点设计不稳定，用户会误以为色盘本身有问题，而不是模板映射问题。
4. 如果第一阶段同时做列表卡片、详情页、采样页三处落地，范围会明显失控。

### 11.2 当前待确认项

1. 第一阶段是否需要默认根据 `itemCategory` 自动选模板，还是全部交给用户手动切换。
2. 点缀色优先落在服装细节，还是允许落在小配件区域。
3. 配色盘列表卡片是否需要迷你版模特预览，还是只保留详情版。
4. 未来移动端是否只保留少量模板，而不是完整模板库。

## 12. 当前建议

当前建议的执行顺序：

1. 先在本仓确认本文方案，作为 Web MVP 的真相源。
2. 然后只做阶段 1 + 阶段 2，先把采样工作台抽屉跑通。
3. 采样工作台验证有效后，再进入配色盘详情页接入。
4. 等 Web 侧模板和槽位语义稳定后，再决定是否提升到 `daypalette-docs` 共享层。