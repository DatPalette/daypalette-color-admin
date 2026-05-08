# DayPalette Color Admin 项目进度

> 记录日期：2026-05-08
> 记录目的：收口本轮采样助手重构、工作日批次重建与后续建议，便于晚些时候继续开发。

## 1. 当前状态一句话

采样助手本轮已经从“逐条 record 审阅”进一步推进到“色盘簇优先 + 流式任务透明 + 可重建目标条数”的阶段，且 `workday` 批次已实际重建为 40 条、色盘签名 40 条全唯一。

## 2. 本轮已落地内容

### 2.1 采样运行与透明日志

已完成：

1. 在共享 contracts 中新增 `SamplingRunOperationType`、`SamplingRunStatus`、`SamplingRunEventType`、`SamplingRunSummary`、`SamplingRunEvent` 等任务合同。
2. 在 `admin-api` 中新增 `sampling-runs` 模块，支持创建任务、读取任务、读取历史事件和 SSE 流式输出。
3. 在 `admin-web` 中新增采样运行模型和服务，页面现在通过 `SamplingRun` 发起生成，而不是直接静默调用生成接口。
4. 候选审阅台现在固定展示运行台与流式日志，能看到当前阶段、进度、警告、错误和完成摘要。

### 2.2 候选审阅台结构性重排

已完成：

1. `SamplingBatchesPage` 首屏从旧的“批次大卡 + 逐条列表”切到“批次轻量横条 + 色盘簇网格 + 右侧审阅侧栏”。
2. 页面主展示对象从单条 `SamplingRecord` 切到前端聚类后的色盘簇，先看色盘，再进入来源证据。
3. 右侧审阅区新增“证据时间线”，把来源入口、观察时间、回溯链接、市场判断和审阅备注压成单列可读结构。
4. 页面残留的主视角英文标签已清理，首屏体验改成更明确的中文工作台语义。

### 2.3 候选生成能力升级

已完成：

1. `GenerateSamplingCandidatesDto` 现在支持 `resetExisting` 和 `targetCount`。
2. 后端候选生成现在不只会覆盖既有 `items`，也能按目标条数预生成骨架记录，再统一跑候选填充。
3. 本轮把“批内重复色盘”的约束前移到了主题变体选择阶段，而不是生成后再做表层清洗。
4. `SamplingRun` 日志会明确写出本次是“刷新现有记录”“扩容到目标条数”还是“完全重建”。

### 2.4 工作日批次数据重建

已完成：

1. `data/palette-sampling/phase1-workday-batch01.v1.json` 已从旧的 24 条批次重建为 40 条。
2. 批次标题已更新为“工作日场景首批 40 条采样”。
3. 批次备注已更新为“由工作日场景重建为 40 条女装通勤采样候选，供总览审阅与后续上架筛选。”
4. 最新批次版本已提升到 `version: 13`。

## 3. 这次确认的关键根因

本轮最重要的确认不是 UI，而是数据约束：

1. 之前“数据没变”的根因不是缓存，而是协议根本不支持“重建到目标条数”，原先只能在已有 `items` 上做覆盖。
2. 之前“前几个色盘又重复”的根因不是单次去重失效，而是 **每个 workday 主题只有 5 组变体**。
3. 当 `workday` 扩到 40 条时，5 个主题平均要分到 8 条记录，如果主题池仍然只有 5 组色盘，就会在第 6 条以后必然重复。

所以这轮不是简单改了去重逻辑，而是同时做了两件事：

1. 让批次可以真正重建到目标条数。
2. 把 `workday` 各主题的候选色盘变体池扩到至少 8 组，保证 40 条时仍然能做到每条唯一。

## 4. 当前验证结果

本轮未主动跑整仓 build 或 dev server，按当前协作习惯只做了窄验证。

已确认：

1. 本轮改动的前后端 TypeScript 文件均通过编辑器错误检查。
2. `phase1-workday-batch01` 已实际落盘为 40 条记录。
3. 对重建后批次执行色盘签名检查，结果为：
   - `count = 40`
   - `uniquePaletteSignatures = 40`
   - `duplicatePaletteSignatureCount = 0`

说明：当前 `workday` 这 40 条不是“数量变了但色盘还在撞”，而是已经达到批内唯一。

## 5. 建议的下一步

优先级建议如下：

1. 把同样的“重建到目标条数”能力扩到 `weekend`、`holiday` 等场景批次，而不是只停留在 `workday`。
2. 在扩新场景前，先按“目标条数 / 主题数”预估每个主题至少需要多少组候选变体，提前把各场景主题池容量配平，避免重演 `workday 40 条 > 每主题只有 5 组变体` 的重复问题。
3. 为不同场景建立各自的主题组合与品类矩阵，不要让 `workday` 的品牌池、色路和品类分布直接外溢到 `weekend`、`holiday`。
4. 给页面补一个更明确的批次重建参数入口，例如目标条数、是否完全清空旧候选、是否只扩容不重置，减少每次都改固定值的成本。
5. 后续如果要继续往“Agent 化采样助手”推进，优先补的不是更复杂的生成文本，而是 `SourceEvidence -> PaletteCluster -> ListingDraft` 的真实数据层落地。

### 5.1 为什么要优先做 weekend / holiday

原因不是简单扩容，而是为了验证本轮新增能力是不是“只对 workday 特调”还是已经具备通用性：

1. `weekend` 会更容易暴露柔和提气色、轻都市色和更松弛场景的主题池是否足够。
2. `holiday` 会更容易暴露高明度、中低饱和暖色、旅行和轻户外场景下的主题分布是否失衡。
3. 如果在新场景中仍然沿用不够宽的主题池，重复会再次出现，说明当前能力还只是局部可用。

## 6. 晚点继续开发时建议先看的文件

如果之后要继续接着做，建议优先从这些文件开始：

1. `apps/admin-api/src/modules/sampling-batches/dto/generate-sampling-candidates.dto.ts`
2. `apps/admin-api/src/modules/sampling-batches/sampling-candidate-generation.service.ts`
3. `apps/admin-api/src/modules/sampling-runs/sampling-runs.service.ts`
4. `apps/admin-web/src/pages/SamplingBatchesPage/view-model/useSamplingBatchesPageViewModel.ts`
5. `apps/admin-web/src/pages/SamplingBatchesPage/index.tsx`
6. `data/palette-sampling/phase1-workday-batch01.v1.json`
7. `apps/admin-web/docs/2026-05-08-sampling-assistant-revamp-proposal.md`

## 7. 当前结论

到这一轮为止，采样助手已经不再只是“能生成一些候选”的状态，而是具备了下面三个可以继续扩展的基础：

1. 任务执行过程可见。
2. 批次可以按目标条数重建。
3. 批内重复可以通过“目标条数 + 主题池容量”联动约束真正控制住。

接下来最值得做的，不是继续给 `workday` 小修小补，而是验证这套能力能否稳定复制到 `weekend`、`holiday` 等场景上。