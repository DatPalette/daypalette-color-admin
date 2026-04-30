# DayPalette Color Admin 项目进度

> 初始记录日期：2026-04-29
> 最近更新：2026-04-30
> 记录目的：下次继续开发时，先看这份文档，不用重新回忆今天做到了哪里。

## 1. 当前状态一句话

`daypalette-color-admin` 已经从“两个真实编辑闭环已跑通”进入到“四类资源都已接上真实编辑链路，且前端按 skill 做了两轮局部收口”：

- monorepo 骨架已建立
- 前端管理台壳层已起好
- 后端 Nest API 骨架已起好
- 前端 skill 已接入
- `dictionaries.v1.json` 已落盘
- `admin-api` 已能读取真实 dictionaries / base-colors
- `admin-api` 已能读取真实 palettes / collections
- `admin-api` 已能校验并回写 `base-colors.v1.json`
- `admin-api` 已能校验并回写 `dictionaries.v1.json`
- `admin-api` 已支持 Base Colors 新增、恢复与 `includeDeleted` 读取
- `admin-api` 已支持 Dictionaries 条目新增、恢复与 `includeDeleted` 读取
- `admin-api` 已能对 Base Colors 做删除前引用检查与软删除回写
- `admin-api` 已能对 Dictionaries 条目做删除前引用检查与软删除回写
- `admin-api` 已支持 Palettes 新增、更新、恢复、`includeDeleted` 读取、删除前引用检查与软删除回写
- `admin-api` 已支持 Collections 更新、恢复、`includeDeleted` 读取、删除前引用检查与软删除回写，并约束 `coverPaletteId` 必须属于 `paletteIds`
- 前端 Base Colors 页面已支持读取、编辑、保存、新增、软删除和恢复
- 前端 Dictionaries 页面已支持字典保存，以及条目新增、软删除和恢复
- 前端 Palettes 页面已支持读取、编辑、保存、新增、软删除和恢复
- 前端 Collections 页面已支持读取、编辑、成员排序、封面调整、保存、软删除和恢复
- 前端已把重复的 admin API helper、格式化函数与 UI 原子组件收口到 `src/api`、`src/utils`、`src/components`
- 前端已把 Palettes / Collections 的表单控件收口到各自页面内的 page-local component
- 前端已把 Palettes / Collections 中主要联动字段的 raw id 展示收口为可读标签
- 前端已把管理台外壳收口到 `src/workbench/` 模块，并为各业务模块补齐稳定的 `index.ts` 公共出口
- 前端已清掉跨模块直连 `pages/` 的深路径引用，并把 Dashboard 的展示派生 helper 收回 transformer 层
- 前端已按 `apps/admin-web/.agents/skills/frontend-module-playbook/` 的模块架构，把各 feature 的 `models/` 拆成 DTO / editor / page-model / index 四层接口
- 前端已清掉未使用的根级 Vite 脚手架样式入口，避免旧模板文件继续干扰目录判断

当前还没有进入“Collections 更细粒度的拖拽 / 批量编排”阶段；Palettes / Collections 的联动展示已经完成第一轮名称化收口，但更强的运营编排展示仍未开始。

---

## 2. 今天已经做完的

### 2.1 项目骨架

已建立一个新的独立项目目录：

- `daypalette-color-admin/`

已完成 pnpm workspace 基础配置：

- 根 `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `.gitignore`
- 根 `README.md`

当前结构：

```text
daypalette-color-admin/
  .github/
    instructions/
    skills/
  apps/
    admin-api/
    admin-web/
  docs/
  packages/
    contracts/
    file-store/
    validation/
```

### 2.2 前端 skill 和规则接入

已把 `frontend-module-playbook` 安装到项目里。

实际采用的是项目级手动复制 fallback，而不是 `skills` CLI 直连安装，原因是当时 GitHub 网络不可达。

当前已存在：

- `.github/skills/frontend-module-playbook/`
- `.github/instructions/admin-web.instructions.md`
- `.github/instructions/admin-api.instructions.md`
- `apps/admin-web/.agents/skills/frontend-module-playbook/`

约束已经明确：

- 前端按 page / view-model / transformer / service 的模块边界继续写。
- 后端按 Nest 的 module / controller / service 规范继续写。

### 2.3 前端当前已完成内容

技术栈已经接好：

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui 基础准备

前端已完成的内容：

- 左侧菜单 + 右侧内容区的 AdminShell
- 遵守共享设计语言的首页视觉基线
- 一个 Dashboard 页面骨架
- 一个真实读取 `GET /api/base-colors` 的 Base Colors 页面
- Base Colors 网格列表
- Base Colors 右侧详情面板
- Base Colors 编辑表单
- Base Colors 新增入口
- Base Colors 保存动作
- Base Colors 删除前引用检查
- Base Colors 软删除动作
- Base Colors 恢复动作
- 一个真实读取 `GET /api/dictionaries` 的 Dictionaries 页面
- Dictionaries 列表与右侧编辑面板
- Dictionaries 保存动作
- Dictionaries 条目新增入口
- Dictionaries 条目删除前引用检查
- Dictionaries 条目软删除动作
- Dictionaries 条目恢复动作
- 一个真实读取 `GET /api/palettes` 的 Palettes 页面
- Palettes 列表与可编辑详情面板
- 一个真实读取 `GET /api/collections` 的 Collections 页面
- Collections 列表与可编辑详情面板
- 页面级模块拆分示例
- 基础 UI 组件 `Button`、`Card`
- Tailwind / alias / components.json 配置
- `src/api/admin-api.ts` / `src/utils/format-updated-at-label.ts` 共享 helper 收口
- `PalettesPage/components/PaletteEditorControls.tsx` page-local 表单控件收口
- `CollectionsPage/components/CollectionEditorControls.tsx` page-local 表单控件收口
- `src/workbench/pages/AdminWorkbench/view-model/useAdminWorkbenchViewModel.ts` 入口层状态收口
- 各业务模块根目录 `index.ts` 公共接口收口
- Dashboard 展示派生逻辑已从 page-local view-model 移回 transformer
- 各 feature 的 `models/` 已从单文件拆为 DTO / editor / page-model / index 的稳定接口
- 根级 `App.css` 脚手架样式已移除

- 前端当前的模块组织已经不再沿用默认 Vite 壳层，而是收口成更接近本地 skill 的“直接业务模块 + 通用公共目录 + workbench 模块”结构，例如：

```text
apps/admin-web/src/
  api/
  components/
  styles/
  utils/
  workbench/
  base-colors/
  dashboard/
  dictionaries/
  palettes/
  collections/
```

目前 Dashboard 仍保留为骨架页示例，但默认首页入口已经切到 Base Colors。

Base Colors 当前状态：

- 已真实读取后端数据
- 已支持列表点击切换详情
- 已支持编辑并保存
- 已支持新增基础色
- 已支持删除前引用检查
- 已支持软删除并默认从列表隐藏已删除项
- 已支持从归档区恢复已软删除项

Dictionaries 当前状态：

- 已真实读取后端数据
- 已支持在侧栏和列表中切换 dictionary
- 已支持编辑单个 dictionary 的标题、说明、条目标签、启用状态与排序并保存
- 已支持新增字典项
- 已支持条目删除前引用检查与软删除
- 已支持恢复已软删除字典项

Palettes 当前状态：

- 已真实读取后端数据
- 已支持列表切换、新增、编辑保存、删除前引用检查、软删除与恢复
- 已把 occasion、状态和 trio 基础色从 raw id 转成可读标签展示

Collections 当前状态：

- 已真实读取后端数据
- 已支持列表切换、成员排序、封面调整、编辑保存、删除前引用检查、软删除与恢复
- 已把 theme type、状态、release mode、cover palette 等主要联动字段从 raw id 转成可读标签展示

### 2.4 后端当前已完成内容

NestJS 默认 Hello World 已经替换掉。

已完成：

- `main.ts` 改为管理台 API 入口
- 开启 CORS
- 默认端口改为 `3100`
- 增加 `common/` 目录
- 增加资源模块骨架

当前已存在的模块：

- `health`
- `dictionaries`
- `base-colors`
- `palettes`
- `collections`

当前后端接口状态：

- 根路由 `/` 返回 API 概览对象
- `GET /api/dictionaries` 已读取真实 `dictionaries.v1.json`
- `GET /api/dictionaries?includeDeleted=true` 已支持返回包含归档项的完整字典
- `PUT /api/dictionaries/:key` 已支持校验并回写单个 dictionary node
- `POST /api/dictionaries/:key/items` 已支持新增字典项
- `GET /api/dictionaries/:key/items/:id/delete-check` 已支持条目引用检查
- `DELETE /api/dictionaries/:key/items/:id` 已支持字典项软删除与冲突拦截
- `POST /api/dictionaries/:key/items/:id/restore` 已支持字典项恢复
- `GET /api/base-colors` 已读取真实 `base-colors.v1.json`
- `GET /api/base-colors?includeDeleted=true` 已支持返回包含归档项的完整列表
- `POST /api/base-colors` 已支持新增基础色
- `GET /api/base-colors/:id/delete-check` 已支持返回 palette 引用检查结果
- `PUT /api/base-colors/:id` 已支持字典校验和文件回写
- `DELETE /api/base-colors/:id` 已支持软删除与冲突拦截
- `POST /api/base-colors/:id/restore` 已支持基础色恢复
- `GET /api/palettes` 已读取真实 `palettes.v1.json`
- `GET /api/palettes?includeDeleted=true` 已支持返回包含归档项的完整列表
- `POST /api/palettes` 已支持新增 Palette
- `GET /api/palettes/:id/delete-check` 已支持返回 collection 引用检查结果
- `PUT /api/palettes/:id` 已支持字典 / base-color / collection 校验和文件回写
- `DELETE /api/palettes/:id` 已支持软删除与冲突拦截
- `POST /api/palettes/:id/restore` 已支持 Palette 恢复
- `GET /api/collections` 已读取真实 `collections.v1.json`
- `GET /api/collections?includeDeleted=true` 已支持返回包含归档项的完整列表
- `GET /api/collections/:id/delete-check` 已支持返回 palette 来源引用检查结果
- `PUT /api/collections/:id` 已支持字典 / palette 校验和文件回写，并校验 `coverPaletteId` 属于 `paletteIds`
- `DELETE /api/collections/:id` 已支持软删除与冲突拦截
- `POST /api/collections/:id/restore` 已支持 Collection 恢复
- `base-colors` 默认已过滤 `status=deleted`
- `dictionaries` 默认已过滤 `isDeleted=true`
- `palettes` / `collections` 默认已过滤 `status=deleted`

另外，`admin-api` 新增了一个通用文件读取辅助，用于从 sibling repo `day_palette` 解析 rawfile 真相源目录。

### 2.5 共享包当前已完成内容

已建立三个共享包骨架：

- `packages/contracts`
- `packages/file-store`
- `packages/validation`

当前状态：

- `contracts` 里只有很轻的共享类型占位
- `file-store` 里已经有 DayPalette 原始文件路径解析函数
- `validation` 里只有 issue 结构和占位函数

这三个包现在属于“骨架已在，后面继续补实逻辑”。

### 2.6 已完成验证

今天已经实际跑过：

- `pnpm install`
- `pnpm --dir apps/admin-web build`
- `pnpm --dir apps/admin-api build`
- `pnpm --dir apps/admin-api test:e2e`
- 根级 `pnpm build`

当前结论：

- 前端能编译
- 后端 e2e 已覆盖根路由、dictionaries 读取 / 新增 / 保存 / 条目删除检查 / 条目软删除 / 条目恢复、base-colors 读取 / 新增 / 保存 / 删除检查 / 软删除 / 恢复、palettes 读取 / 新增 / 保存 / 删除检查 / 软删除 / 恢复，以及 collections 读取 / 保存 / 删除检查 / 软删除 / 恢复
- 共享包能编译
- 真实 dictionaries / base-colors / palettes / collections 读取已验证可用
- Base Colors 新增与恢复已验证会写回临时副本中的 JSON 文件
- Base Colors 保存已验证会写回临时副本中的 JSON 文件
- Base Colors 软删除已验证会写入 `status=deleted`、`previousStatus`、`deletedAt`、`deleteReason`
- Dictionaries 保存已验证会写回临时副本中的 JSON 文件
- Dictionaries 条目新增与恢复已验证会写回临时副本中的 JSON 文件
- Dictionaries 条目软删除已验证会写入 `isDeleted=true`、`isActive=false`、`deletedAt`、`deleteReason`
- Palettes 新增、保存与恢复已验证会写回临时副本中的 JSON 文件
- Palettes 软删除已验证会写入 `status=deleted`、`previousStatus`、`deletedAt`、`deleteReason`
- Collections 保存与恢复已验证会写回临时副本中的 JSON 文件
- Collections 软删除已验证会写入 `status=deleted`、`previousStatus`、`deletedAt`、`deleteReason`
- Collections 非法封面成员关系已验证会被 `400` 拦截

---

## 3. 还没做的

下面这些都还没开始，或者只停留在骨架层：

### 3.1 Palettes / Collections 还缺更完整的运营交互

虽然 palettes 和 collections 已经进入真实编辑、删除保护与写回阶段，但还没有进入更完整的运营交互阶段。

尤其是这几件事还没做：

- 为 collections 补更细粒度的拖拽 / 批量编排交互
- 给 palettes / collections 做更强的标签、引用和运营关系展示（当前只完成第一轮名称化）

### 3.2 `dictionaries.v1.json` 已进入编辑与删除保护链路，但还没有进入完整 CRUD

共享文档里定义的数据合同现在已经落成真实文件。

当前已存在：

- `day_palette/entry/src/main/resources/rawfile/palette-data/dictionaries.v1.json`

但还没做的是：

- dictionaries aliases / appliesTo 等高级字段维护
- dictionaries 批量维护能力
- dictionaries 更细的排序与批量校验体验

### 3.3 真正还没补完的是 Collections 更细粒度的编排交互和更深的资产联动

前端已经有 Base Colors、Dictionaries、Palettes 的新增 / 编辑 / 软删除 / 恢复，也已经有 Collections 的真实编辑、软删除与恢复页。

还没做的包括：

- Collections 拖拽排序与批量编排
- Collections 封面 palette 与成员 palette 的更强关系可视化与批量操作
- Palettes / Collections 与 Base Colors / Dictionaries 的更强联动展示增强（当前仅完成可读标签化）

### 3.4 后端还没补完的是更复杂的运营规则

基础的软删除写回、引用关系检查、DTO / 校验规则和删除预检查接口都已经进入真实实现。

还没进入下面这些实现：

- Collections 拖拽排序与更细粒度编排写回
- 更复杂的跨资源批量校验与联动约束
- 更接近运营工作台的组合操作接口

### 3.5 质量补充项还没做

当前虽然已经有 build 和一小段 e2e，但还没有继续做：

- lint
- 前端测试
- e2e 深度扩写
- prettier 统一整理

---

## 4. 当前建议的继续顺序

如果下次继续，推荐按下面顺序推进，不要同时开太多面：

### 第一步：把 Base Colors 的删除保护模式复制到 Dictionaries

理由：

- Base Colors 的删除前检查和软删除已经打通，做法已验证可用
- Dictionaries 同样受“先检查引用、再软删除”的合同约束
- 现在补 Dictionaries 删除保护，复用当前模式最省返工

建议优先补：

- dictionaries 条目引用检查
- dictionaries 条目停用 / 软删除写回
- Dictionaries 页面里的确认提示和风险列表

### 第二步：让 palettes / collections 至少先读通真实文件

建议至少补：

- `GET /api/palettes`
- `GET /api/collections`
- Palettes / Collections 的第一页真实列表

理由：

- 读通 palettes / collections 之后，整个信息架构就都能落到真实数据上
- 到这一步再做跨资源引用判断会更完整

### 第三步：再把 dictionaries 做到完整 CRUD

不建议现在就同时做 palettes / collections / dictionaries 三页的完整 CRUD。

建议顺序：

- 先补 dictionaries 新增条目
- 再补 dictionaries 删除条目
- 最后再补更细的停用 / 软删除策略

理由：

- dictionaries 的新增 / 删除会直接影响其他表单项，适合放在 palettes / collections 之前彻底跑顺

---

## 5. 继续开发时优先看的文件

如果回家继续做，建议先看这些：

### 项目文档

- `README.md`
- `docs/2026-04-29-project-progress.md`

### 共享方案文档

在 `daypalette-docs/` 里优先回看：

- `product/color-asset-admin-prd.md`
- `architecture/color-asset-admin-technical-architecture.md`
- `architecture/color-asset-admin-data-contract.md`

### 前端入口

- `apps/admin-web/src/main.tsx`
- `apps/admin-web/src/workbench/pages/AdminWorkbench/index.tsx`
- `apps/admin-web/src/workbench/pages/AdminWorkbench/components/AdminShell.tsx`
- `apps/admin-web/src/base-colors/pages/BaseColorsPage/index.tsx`
- `apps/admin-web/src/base-colors/pages/BaseColorsPage/view-model/useBaseColorsPageViewModel.ts`

### 后端入口

- `apps/admin-api/src/app.module.ts`
- `apps/admin-api/src/app.controller.ts`
- `apps/admin-api/src/modules/`

### 共享包入口

- `packages/file-store/src/index.ts`
- `packages/contracts/src/index.ts`
- `packages/validation/src/index.ts`

---

## 6. 当前已知事实和注意点

### 6.1 skill 安装方式

`frontend-module-playbook` 当前是手动复制到项目里的，不是通过在线拉取安装完成的。

这不是问题，当前项目里已经可以正常作为项目级 skill 使用。

### 6.2 当前前端首页不是白做的

虽然 Dashboard 现在只是骨架，但它不是临时废页。

它已经把这些关键约束先落下了：

- 共享设计语言基线
- 左侧菜单形态
- 页面级模块目录结构
- shadcn-ready 的基础组件方式

后续是在这个壳层上加页面，不是推倒重来。

现在 Base Colors 页面已经把第一批真实数据读通，所以接下来应该延续这套分层，而不是回退成把请求、状态和视图都堆在一个页面文件里。

### 6.3 当前后端接口也不是白做的

虽然 palettes / collections 现在还没接通，但这些模块分法应该继续保持：

- 每个资源一个 module
- controller 负责路由
- service 负责逻辑
- cross-cutting 放 `common/`

后续只是在各个 service 里补文件读写、回写和校验，不要回退成所有逻辑堆在 `app.service.ts`。

---

## 7. 下次开工时最小启动命令

在 `daypalette-color-admin/` 根目录：

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

如果只是快速确认当前状态：

```bash
pnpm build
```

---

## 8. 建议的下次开工目标

下次继续时，建议把目标只定成这一个：

**把 Base Colors 这套删除保护模式复制到 Dictionaries 条目上。**

这样推进最稳，也最不容易散。