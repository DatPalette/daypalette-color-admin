# 配色模特试色预览矢量资产获取执行手册

> 创建日期：2026-05-12
> 适用范围：`daypalette-color-admin` 模特试色预览基础资产准备
> 当前目标：用**已授权、可编辑的矢量人物资产**替代高成本、低稳定性的在线文生图方案

## 1. 这份文档解决什么问题

本文不再把重点放在 Recraft、Midjourney 这类在线文生图上，而是收口为一条当前最稳的执行路线：

1. 先找**已授权、可编辑、风格合适**的女性全身矢量人物母版。
2. 再优先选择**自带可分层服装结构**的矢量素材。
3. 先跑通 `short-sleeve`、`trousers`、`midi-dress` 三个模板。
4. 路线成立后，再扩到全部 `13` 个模板。

这份文档适合现在的你，因为：

1. 你不想继续烧在线生成点数。
2. 你没有绘图能力，不适合依赖大幅手工清稿。
3. 你真正需要的是**工程可落地的 SVG 资产**，不是“看起来不错”的概念图。

## 2. 当前结论

### 2.1 主路线

当前推荐主路线只有一条：

1. 去找现成的、可编辑的、已授权的矢量人物资产。
2. 优先选择 Figma / SVG / AI 可编辑格式。
3. 优先选择服装和身体本来就分层的素材。

### 2.2 后备路线

如果最后确实找不到合适的矢量基础资产，再考虑本地生成路线，例如：

1. Draw Things
2. ComfyUI
3. 本地 Flux / SDXL 工作流

但这条现在不是主路线。

### 2.3 不再作为主路线的方案

下面这些方案，当前不再作为主路线：

1. Recraft 在线文生矢量
2. Midjourney / 通用在线图像生成
3. 先大量生成位图，再强行向量化

原因：

1. 成本高。
2. 风格容易跑偏。
3. 一致性差。
4. 最终依然需要大量清稿。

## 3. 你最终要交付什么

最终不是交“几张图”，而是交下面这些工程资产：

1. `1` 个女性母版人物 SVG。
2. `13` 个服装模板 SVG，对应当前前端模板集合：
   - 上装：`long-sleeve`、`short-sleeve`、`camisole`、`shirt`、`outerwear`
   - 下装：`trousers`、`shorts`、`mini-skirt`、`midi-skirt`、`maxi-skirt`
   - 连衣：`mini-dress`、`midi-dress`、`maxi-dress`
3. 每个模板都能映射到 `main / secondary / accent` 三个区域。
4. `1` 份 manifest 清单，写明每个模板的文件、类型、中文名和区域映射。

## 4. 先准备什么工具

你现在需要准备的不是图像生成器，而是这些：

1. `Figma`
2. 一个本地文件夹，用来收资产
3. 可访问的素材来源：
   - Figma Community
   - Blush
   - Humaaans
   - DrawKit
   - Storyset
   - Icons8 Ouch
   - 其他支持商业使用或明确授权的 SVG / Figma 插画库

注意：

1. 每个平台的授权范围不完全一样。
2. 真正下载前，要确认是否允许当前项目使用。
3. 如果素材只有 PNG，没有编辑源文件，直接降级处理，优先不选。

## 5. 建议文件夹结构

建议你先建一个本地文件夹：

```text
palette-outfit-preview-assets/
  01-shortlist/
  02-master-base/
  03-trial-templates/
  04-final-svg/
  05-manifest/
```

每一层的用途：

1. `01-shortlist/`：存候选素材截图、链接和筛选记录。
2. `02-master-base/`：存最终选中的女性母版。
3. `03-trial-templates/`：先做 3 个试运行模板。
4. `04-final-svg/`：放最终通过筛选的 SVG。
5. `05-manifest/`：放映射清单。

## 6. Step 1：先搜素材，不要急着下载

### 6.1 搜什么类型

你要搜的不是“时尚海报插画”，而是：

1. 成年女性全身站姿矢量人物。
2. 可编辑。
3. 扁平、简洁、现代。
4. 最好带服装分层。
5. 构图干净，背景少。

### 6.2 推荐搜索关键词

英文关键词：

```text
editable female vector character full body
female fashion vector full body svg
modular female character outfit figma
flat woman standing vector editable
fashion avatar female full body svg
women outfit creator figma vector
isolated female character svg editable
```

中文关键词：

```text
女性 全身 矢量 插画 可编辑
女性 人物 SVG Figma 可编辑
女性 穿搭 插画 矢量 分层
时尚 女性 站姿 矢量 人物
可换装 女性 矢量 人物
```

### 6.3 每个平台优先看什么

#### Figma Community

优先找：

1. `editable`
2. `character system`
3. `modular`
4. `avatar builder`
5. `fashion illustration`

#### Blush / Humaaans / Ouch / Storyset / DrawKit

优先看：

1. 能否下载 SVG 或 Figma。
2. 服装是否本来就由多个矢量形状组成。
3. 有没有单人站姿女性角色，而不是整套场景图。

## 7. Step 2：做 shortlist，不要凭印象选

### 7.1 你要记录什么

在 `01-shortlist/shortlist.md` 里给每个候选记这几项：

```md
# Outfit Preview Vector Shortlist

## Candidate 01
- source: Figma Community
- name: xxx
- link: xxx
- format: SVG / Figma / AI
- editable: yes / no
- female full body: yes / no
- clothing layered: yes / no
- commercial use: yes / unclear / no
- style fit: high / medium / low
- notes: xxx
```

### 7.2 shortlist 至少收多少个候选

不要只看 1 到 2 个就决定。建议：

1. 至少收 `8` 到 `12` 个候选。
2. 最后保留 `3` 个进入深筛。

## 8. Step 3：先用硬条件筛掉大部分

下面这些条件，只要有一条不满足，就优先淘汰：

1. 不是可编辑源文件，只是位图。
2. 不是单人女性全身站姿。
3. 背景、道具、场景过多。
4. 人物是儿童卡通或过度 Q 版。
5. 服装和身体全部焊死成一个不可拆的大轮廓。
6. 授权不清楚。

## 9. Step 4：真正要留下来的标准

最终能进下一轮的候选，最好同时满足：

1. 风格接近现代平面时尚插画。
2. 人物比例偏修长，但仍自然。
3. 面部简化，不抢服装。
4. 头、手、脚都完整。
5. 服装至少能拆出两到三块主要结构。
6. 即使你不会画，也能通过简单隐藏/复制/重命名完成整理。

这条很重要：

如果素材需要你自己重新画袖子、裙摆、领口，直接放弃，不要选。

## 10. Step 5：先只做 3 个试运行模板

不要一开始就想凑齐 13 个。

第一轮只需要跑通：

1. `short-sleeve`
2. `trousers`
3. `midi-dress`

为什么是这三个：

1. 覆盖上装、下装、连衣三类。
2. 足够判断整条路线是否成立。
3. 如果这三个都很难收口，后面 10 个也不会顺。

## 11. Step 6：在 Figma 里检查“真可编辑性”

### 11.1 打开候选文件后先看什么

先不要改颜色，先看图层：

1. 身体是不是独立图层。
2. 头发是不是独立图层。
3. 上衣、袖子、下装、裙摆是不是至少部分分层。
4. 背景是不是可以一键删掉。

### 11.2 什么情况说明这个素材不适合

1. 所有人物和衣服是一个大扁平 path。
2. 服装没有结构分层。
3. 背景和人物粘在同一层，难以拆开。
4. 文件导入后其实只是嵌入图片。

### 11.3 这一步的目标

不是做精修，而是判断：

1. 这个素材能不能成为 `master base`
2. 这个素材能不能产出试运行模板

## 12. Step 7：如何做 main / secondary / accent 三分区

### 12.1 最理想情况

最理想的素材是：

1. 上衣本来就分成大身、袖子、领口或门襟。
2. 裤装本来就分成左右腿、腰头或中片。
3. 连衣裙本来就分成 bodice、skirt、waistline。

这种素材最适合你，因为几乎不需要新画，只要：

1. 重命名图层。
2. 合并同类区域。
3. 删除无关装饰。

### 12.2 可接受情况

如果没有天然三分区，但能通过很小的整理得到三分区，也可以接受，例如：

1. 上衣有主体和袖子，领口可以当 accent。
2. 裙子有主体和腰线，边缘有独立包边。
3. 外套有外层、内层、门襟。

### 12.3 不可接受情况

直接淘汰：

1. 完全没有可分区结构。
2. 想分 main / secondary / accent 就必须重画大块轮廓。
3. 必须依赖复杂钢笔工具重建。

## 13. Step 8：如何命名试运行文件

试运行阶段建议命名如下：

```text
02-master-base/
  croquis-master-v1.svg

03-trial-templates/
  top-short-sleeve-v1.svg
  bottom-trousers-v1.svg
  dress-midi-v1.svg
```

如果你想顺便保存一个整理前版本，可以再加：

```text
top-short-sleeve-source.svg
bottom-trousers-source.svg
dress-midi-source.svg
```

## 14. Step 9：manifest 要怎么写

在 `05-manifest/outfit-preview-assets-manifest.md` 里写：

```md
# Outfit Preview Assets Manifest

## short-sleeve
- type: top
- labelZh: 短袖上衣
- file: 03-trial-templates/top-short-sleeve-v1.svg
- slotMapping:
  - main: body
  - secondary: sleeve
  - accent: trim

## trousers
- type: bottom
- labelZh: 长裤
- file: 03-trial-templates/bottom-trousers-v1.svg
- slotMapping:
  - main: panel
  - secondary: leg
  - accent: waistband

## midi-dress
- type: dress
- labelZh: 中长连衣裙
- file: 03-trial-templates/dress-midi-v1.svg
- slotMapping:
  - main: skirt
  - secondary: bodice
  - accent: waistline
```

## 15. Step 10：什么时候才能扩到全部 13 个模板

只有当下面三件事都成立，才继续扩：

1. 你已经找到一个合适的女性母版。
2. `short-sleeve`、`trousers`、`midi-dress` 三个模板都能稳定输出 SVG。
3. 这三个模板都能映射 `main / secondary / accent`。

如果三件事中任何一件做不到，不要继续扩模板数量，先回头换资产来源。

## 16. 如果主路线失败，再看这个后备路线

如果你找了一轮素材后，仍然没有找到合适的：

1. 可编辑
2. 单人女性
3. 风格合适
4. 服装可分区

这时再考虑本地生成路线，例如：

1. Draw Things
2. ComfyUI
3. 本地 Flux / SDXL

但这一步不在当前文档的执行范围里。当前文档只负责主路线。

## 17. 你完成后要返回给我什么

第一轮先只需要返回下面这些：

1. `croquis-master-v1.svg`
2. `top-short-sleeve-v1.svg`
3. `bottom-trousers-v1.svg`
4. `dress-midi-v1.svg`
5. `outfit-preview-assets-manifest.md`
6. 如果有 shortlist，也把 `shortlist.md` 一并给我

你把这五类文件给我后，我来继续做：

1. 判断哪组资产最适合当前产品。
2. 清理多余 path 和命名。
3. 接回 [../apps/admin-web/src/components/outfit-preview/outfit-preview.templates.ts](../apps/admin-web/src/components/outfit-preview/outfit-preview.templates.ts)。

## 18. 一句话版本

现在不要再优先想“用 AI 直接生完整矢量模板”。

现在最稳的做法是：

1. 先找可编辑矢量人物母版。
2. 先跑通 3 个试运行模板。
3. 路线成立后再扩到 13 个。

只要你把这 3 个试运行模板跑通，后面的工程接线我就能继续接上。