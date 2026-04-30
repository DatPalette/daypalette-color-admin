# DayPalette Color Admin

DayPalette 配色资产管理后台 monorepo。

## 当前进度

- 当前已经完成四类资源的真实读取，并把 Base Colors / Dictionaries / Palettes / Collections 都推进到真实写链路：`admin-api` 已可读取、更新、软删除、恢复四类真实 JSON 资源，其中 Base Colors、Dictionaries 与 Palettes 额外支持创建，并且 Base Colors / Dictionaries / Palettes / Collections 都支持 `includeDeleted` 读取归档项。`admin-web` 已能在侧栏切换四个真实页面，其中 Base Colors、Palettes 已支持新增，Dictionaries 已支持条目新增，Collections 已支持成员排序与封面调整，Palettes / Collections 也都已支持编辑、删除保护、软删除和恢复。
- 按当前 frontend skill 已完成两轮有边界的前端重构：先把重复的 admin API 基址 / 错误解析和 `updatedAt` 文案格式化抽到 `src/lib/` 共享 helper，再把 Palettes / Collections 的编辑表单控件收口为各自页面内的 local component，维持 page / view-model / transformer / service 边界。
- 今日进度与后续待办见 [docs/2026-04-29-project-progress.md](docs/2026-04-29-project-progress.md)。

## 结构

```text
apps/
  admin-api/
  admin-web/
packages/
  contracts/
  file-store/
  validation/
```

## 约束

- 前端使用 `Vite + React + TypeScript + Tailwind CSS + shadcn/ui`。
- 前端模块边界按 `.github/skills/frontend-module-playbook/` 约束执行。
- 后端使用 `NestJS` 标准 module / controller / service 组织方式。
- 当前项目是本地优先的管理后台，不引入数据库。