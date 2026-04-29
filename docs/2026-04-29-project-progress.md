# DayPalette Color Admin 项目进度

> 记录日期：2026-04-29
> 记录目的：下次继续开发时，先看这份文档，不用重新回忆今天做到了哪里。

## 1. 当前状态一句话

`daypalette-color-admin` 已经完成首轮项目初始化：

- monorepo 骨架已建立
- 前端管理台壳层已起好
- 后端 Nest API 骨架已起好
- 前端 skill 已接入
- 整仓 `pnpm build` 已通过

当前还没有进入“真实数据接通”和“第一个完整 CRUD 页面”的阶段。

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

前端已完成的骨架内容：

- 左侧菜单 + 右侧内容区的 AppShell
- 遵守共享设计语言的首页视觉基线
- 一个 Dashboard 页面骨架
- 页面级模块拆分示例
- 基础 UI 组件 `Button`、`Card`
- Tailwind / alias / components.json 配置

前端当前的模块组织已经不是默认 Vite 页面，而是按后续可扩展结构起步，例如：

```text
apps/admin-web/src/
  app/
  components/
  features/
    dashboard/
      constants/
      models/
      pages/
      services/
      transformers/
  lib/
```

Dashboard 当前还是假数据概览页，不是真实 CRUD。

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
- 各资源接口已存在占位返回
- 还没有接真实文件读写

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
- 根级 `pnpm build`

当前结论：

- 前端能编译
- 后端能编译
- 共享包能编译
- 整仓 build 通过

---

## 3. 还没做的

下面这些都还没开始，或者只停留在骨架层：

### 3.1 真实数据接通还没做

还没有把 `admin-api` 接到 `day_palette` 的真实 JSON 文件。

尤其是这几件事还没做：

- 读取 `base-colors.v1.json`
- 读取 `palettes.v1.json`
- 读取 `collections.v1.json`
- 读取未来的 `dictionaries.v1.json`
- 把接口返回从占位数据改为真实文件数据

### 3.2 `dictionaries.v1.json` 还没创建

共享文档里已经定义了 `dictionaries.v1.json` 的合同和草案结构。

但是当前 `day_palette/entry/src/main/resources/rawfile/palette-data/` 里还没有真的创建这个文件。

也就是说：

- 文档合同已经写了
- 项目路径解析已经预留了
- 真实文件还没落盘

### 3.3 第一个真实 CRUD 页面还没做

前端现在只有 Dashboard 壳层，没有真正的资源列表页。

还没做的包括：

- Base Colors 列表页
- Base Colors 详情抽屉
- Dictionaries 列表页
- 保存动作
- 删除前引用检查的 UI
- 软删除交互

### 3.4 后端真实业务逻辑还没做

还没进入下面这些实现：

- 文件读取 service
- 软删除写回逻辑
- 引用关系检查
- DTO / 校验规则
- 列表过滤
- “默认隐藏 deleted” 的查询行为

### 3.5 质量补充项还没做

今天只验证了 build，没有继续做：

- lint
- test
- e2e 深度扩写
- prettier 统一整理

---

## 4. 当前建议的继续顺序

如果下次继续，推荐按下面顺序推进，不要同时开太多面：

### 第一步：先把 `dictionaries.v1.json` 真文件建出来

理由：

- 这是基础数据管理的真相源
- 后续前后端都会依赖它
- 不先落这个文件，基础数据页面和后端接口都容易返工

建议位置：

- `day_palette/entry/src/main/resources/rawfile/palette-data/dictionaries.v1.json`

### 第二步：让 `admin-api` 先读通 dictionaries 和 base-colors

建议先只做两个列表读取：

- `GET /api/dictionaries`
- `GET /api/base-colors`

理由：

- 范围最小
- 能尽快把文件路径、解析、返回结构跑通
- 也能立刻服务前端第一个页面

### 第三步：前端优先做 Base Colors 列表页

不建议下一步就同时做 palettes / collections / dictionaries 三页。

建议优先：

- Base Colors 列表
- 基础筛选
- 详情抽屉占位

理由：

- 数据可视化最直观
- 能最快验证左侧菜单、列表区、详情区这一套后台主形态

### 第四步：再补保存、引用检查、软删除

不要一开始就把所有 CRUD 全做全。

建议顺序：

1. 先列表读取
2. 再详情读取 / 编辑
3. 再保存
4. 最后补删除前引用检查和软删除

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

- `apps/admin-web/src/app/App.tsx`
- `apps/admin-web/src/app/AppShell.tsx`
- `apps/admin-web/src/features/dashboard/pages/DashboardPage/index.tsx`

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

### 6.3 当前后端接口也不是白做的

虽然现在返回还是 scaffold message，但这些模块分法应该继续保持：

- 每个资源一个 module
- controller 负责路由
- service 负责逻辑
- cross-cutting 放 `common/`

后续只是在各个 service 里补文件读写和校验，不要回退成所有逻辑堆在 `app.service.ts`。

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

**把 `dictionaries.v1.json` 建出来，并让 `admin-api` 先返回真实的 dictionaries 列表。**

这样推进最稳，也最不容易散。