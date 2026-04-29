# DayPalette Color Admin

DayPalette 配色资产管理后台 monorepo。

## 当前进度

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