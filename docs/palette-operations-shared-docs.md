# 配色资产运营共享文档入口

本文是 `daypalette-color-admin` 仓库内的本地入口，用于把“市场参考驱动的配色资产运营”统一指向共享文档仓，而不是在本仓重复维护第二份规则。

## 共享真相源

以下文档位于 `daypalette-docs`，后续涉及首轮 160 个 palette 重建、旧 17 个归档、月更节奏、后台溯源字段和审核字段时，都以这些共享文档为准：

1. 运营方案：[`../../daypalette-docs/operations/color-asset-operations/palette-market-reference-production-plan.md`](../../daypalette-docs/operations/color-asset-operations/palette-market-reference-production-plan.md)
2. 首轮矩阵：[`../../daypalette-docs/operations/color-asset-operations/palette-phase-1-target-matrix.md`](../../daypalette-docs/operations/color-asset-operations/palette-phase-1-target-matrix.md)
3. 采样台账模板：[`../../daypalette-docs/operations/color-asset-operations/palette-market-sampling-ledger-template.md`](../../daypalette-docs/operations/color-asset-operations/palette-market-sampling-ledger-template.md)
4. `workday` 来源白名单与搜索词矩阵：[`../../daypalette-docs/operations/color-asset-operations/workday-source-whitelist-and-query-matrix.md`](../../daypalette-docs/operations/color-asset-operations/workday-source-whitelist-and-query-matrix.md)
5. 数据合同：[`../../daypalette-docs/architecture/color-asset-admin-data-contract.md`](../../daypalette-docs/architecture/color-asset-admin-data-contract.md)

## 本仓执行计划

采样助手的本仓分步执行计划见：[`./palette-sampling-assistant-phased-plan.md`](./palette-sampling-assistant-phased-plan.md)

采样批次的当前存储与合同草案见：[`./palette-sampling-assistant-storage-contract.md`](./palette-sampling-assistant-storage-contract.md)

## 本仓的落地含义

对应到 `daypalette-color-admin`，后续实现应以这些共享判断为边界：

1. `admin-api` 和 `admin-web` 需要支持 `palette` 的市场参考溯源字段、审核字段和归档字段。
2. 首轮内容工作不是直接手写 160 个 palette，而是先支持采样、溯源、批次和审核链路。
3. 月更阶段不应无限累加活跃 palette，而应支持等量归档和固定库容运营。

## 当前建议的实现顺序

1. 先把 `packages/contracts`、`packages/validation` 和 `admin-api` 的 `palette` 合同补齐。
2. 再补 `admin-web` 的 palette 编辑页、列表筛选和详情视图，让运营能看到与维护这些元数据。
3. 最后再进入首轮 160 个 palette 的实际录入与归档操作。