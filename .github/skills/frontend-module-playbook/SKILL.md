---
name: frontend-module-playbook
description: Design, implement, review, comment on, document, and organize React or TypeScript page modules with stable boundaries across page, view-model, transformer, service, and repository layers.
license: MIT
metadata:
  author: wuxinbo
  distribution: public-skill-repo
  version: "0.2.0"
---

# Frontend Module Playbook

Use this skill when working on a page-level frontend module in React or TypeScript.

Apply it when you need to:

- design a new module or refactor an existing page module
- decide the correct landing layer for logic across page, view-model, transformer, service, and repository
- implement a scoped change without leaking product rules into the wrong layer
- review a module change for behavior risk, boundary drift, and missing downgrade paths
- organize comments, docs, commit messages, or code-organization work around a module

## Required Inputs

Gather these facts first when they exist:

- task type: architecture, implementation, comments, review, docs, or commit preparation
- current module structure and affected files
- confirmed product rules, backend constraints, and URL or state assumptions
- whether the work stays inside one page, one module, or a shared cross-page flow

If product rules are still unclear, use the smallest safe fallback instead of inventing a larger workflow.

## Working Procedure

1. Classify the task before editing anything.
   - For module structure and boundaries, start with [module architecture](references/module-architecture.md).
   - For code changes, start with [implementation workflow](references/implementation-workflow.md).
   - For comments, use [comment workflow](references/comment-workflow.md).
   - For reviews, use [review workflow](references/review-workflow.md).
   - For documentation or clarification output, use [doc workflow](references/doc-workflow.md).
   - For commit preparation, use [commit workflow](references/commit-workflow.md).

2. Choose the correct layer before writing code.
   - Layout and rendering composition belong in page components and page-local style files or style directories.
   - Page-specific state, submit actions, routing timing, polling, and error handling belong in the view-model.
   - DTO to page-model mapping and display-field derivation belong in transformers.
   - Request adaptation and backend-protocol handling belong in services.
   - Cross-page retained intermediate state belongs in repositories.

3. Keep the change minimal and local.
   - Do not mix unrelated refactors into the same task.
   - Do not silently move product-specific rules into the generic playbook.
   - If the problem is outside the current module, state the boundary clearly.

4. Produce output in the shape the task needs.
   - Architecture: recommend a directory split and responsibility boundary.
   - Implementation: identify the landing layer and make the smallest coherent change.
   - Review: list findings first, sorted by severity, then open questions.
   - Documentation: separate facts, differences, risks, and open questions.
   - Commit prep: suggest a short commit subject centered on one intent.

## Reference Files

- [module architecture](references/module-architecture.md)
- [implementation workflow](references/implementation-workflow.md)
- [comment workflow](references/comment-workflow.md)
- [review workflow](references/review-workflow.md)
- [doc workflow](references/doc-workflow.md)
- [commit workflow](references/commit-workflow.md)

## Expected Behavior

- Prefer target-repo facts over generic playbook rules when the target repo already has stronger conventions.
- Treat this skill as a reusable rule base, then adapt it to the target repository.
- Do not copy these rules blindly into product-specific logic.

## Example Invocations

- `/frontend-module-playbook 为一个新的报表页设计模块目录和职责边界`
- `/frontend-module-playbook 这个页面的导出逻辑应该落在组件还是 view-model`
- `/frontend-module-playbook review 这个 React 模块改动有没有流程回归风险`
- `/frontend-module-playbook 给这个页面补职责注释并统一纯逻辑文件的 region 标题`
- `/frontend-module-playbook 整理这个模块的实现说明、差异点和待确认项`
- `/frontend-module-playbook 为这次改动建议一条提交信息，并判断应使用哪种提交类型`
- `/frontend-module-playbook 这个页面的辅助逻辑应该拆到 helpers 还是继续留在主 hook`