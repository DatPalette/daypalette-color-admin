---
applyTo: "apps/admin-web/**/*.{ts,tsx,css}"
description: "Use when editing the admin-web React app. Follow frontend-module-playbook boundaries across page, view-model, transformer, and service layers."
---

When working in `apps/admin-web`:

- Use the installed `frontend-module-playbook` skill as the default rule base for module architecture, implementation, review, comments, docs, and commit prep.
- Keep rendering composition in page components.
- Keep page state, load actions, submit actions, and retry flow in page-local view-model files.
- Keep DTO-to-page-model mapping in `transformers/`.
- Keep backend protocol adaptation in `services/`.
- Add `repositories/` only when state must be retained across pages or sessions.
- Prefer the smallest local module change over cross-module refactors.