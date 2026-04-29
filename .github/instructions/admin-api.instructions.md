---
applyTo: "apps/admin-api/src/**/*.ts"
description: "Use when editing the admin-api NestJS service. Keep standard Nest module, controller, and service boundaries."
---

When working in `apps/admin-api`:

- Follow standard NestJS structure with explicit `module`, `controller`, and `service` files.
- Keep controllers thin: routing, request parsing, and response shaping only.
- Keep business logic, orchestration, and file-backed access in services or shared providers, not in controllers.
- Group resource code under `src/modules/<resource>/` with module-local DTOs when inputs grow.
- Put cross-cutting helpers under `src/common/`.
- Avoid mixing ad hoc scripts or Express-style inline handlers into Nest modules.