# Outfit Preview Lab

内部图片生成实验工具，用于在 `daypalette-color-admin` 仓库里统一调用火山引擎与阿里百炼的文生图接口，沉淀 prompt、参考图、运行结果与人工评分。

## 这工具是干什么的

这不是线上服务，也不是页面功能，而是一个本地 CLI 实验工具。你可以用它做四件事：

1. 跑单个图片生成实验。
2. 跑一组批量实验清单。
3. 补拉异步任务结果。
4. 给某次运行结果打人工分。

默认建议的使用顺序是：

1. 先用火山的 `croquis` profile 验证环境和鉴权。
2. 再用火山的 `short-sleeve` profile 跑参考图融合。
3. 再用阿里的 manifest 做风格矩阵扫描。
4. 最后对结果目录打分、记录筛选结论。

## `.env.local` 怎么填

这个包会优先读取 `packages/outfit-preview-lab/.env.local`，仓库里的 `.env.example` 只是模板，不要直接把真实密钥写进去。

可直接按下面这个格式新建 `.env.local`：

```bash
VOLC_API_KEY=你的火山 Ark API Key
VOLC_MODEL=doubao-seedream-4-5-251128
VOLC_BASE_URL=https://ark.cn-beijing.volces.com

ALI_API_KEY=你的阿里 DashScope API Key
ALI_MODEL=qwen-image-2.0-2026-03-03
ALI_BASE_URL=https://dashscope.aliyuncs.com
ALI_WORKSPACE_ID=

DEFAULT_IMAGE_SIZE=
DEFAULT_OUTPUT_DIR=.local/runs
DEFAULT_WATERMARK=false
```

各字段含义和填写建议如下：

1. `VOLC_API_KEY`: 火山引擎 Ark 的 API Key，直接填 key 本身，不要加 `Bearer ` 前缀。
2. `VOLC_MODEL`: 你账号里实际可用的火山图片模型 ID。上面示例里放的是当前模板使用的一组参考值，实际以你自己账号能调用成功的模型为准。
3. `VOLC_BASE_URL`: 火山接口基地址。默认保持 `https://ark.cn-beijing.volces.com` 即可，除非你自己有特殊网关或代理。
4. `ALI_API_KEY`: 阿里百炼 DashScope 的 API Key，同样直接填 key 本身，不要加 `Bearer ` 前缀。
5. `ALI_MODEL`: 你账号里实际可用的阿里图片模型 ID。上面示例里放的是当前模板使用的一组参考值，实际以你自己账号能调用成功的模型为准。
6. `ALI_BASE_URL`: 阿里接口基地址。默认保持 `https://dashscope.aliyuncs.com` 即可。
7. `ALI_WORKSPACE_ID`: 可选。只有你的 DashScope 账号明确要求 workspace 时才填；没有就留空。
8. `DEFAULT_IMAGE_SIZE`: 可选的兜底尺寸，只在 profile 没写 `size` 时生效。常见格式取决于 provider，例如火山常见写法是 `2K`，阿里常见写法是 `1024*1024`。
9. `DEFAULT_OUTPUT_DIR`: 可选的默认输出目录。相对路径会按当前包根目录解析，通常填 `.local/runs` 就够了。
10. `DEFAULT_WATERMARK`: 默认水印开关。只有 profile 自己没覆写时才用这个值，通常实验阶段填 `false`。

建议这样理解填写优先级：

1. API Key 和 model 是必填，否则对应 provider 无法调用。
2. `BASE_URL` 一般不用动，保持默认。
3. `ALI_WORKSPACE_ID`、`DEFAULT_IMAGE_SIZE`、`DEFAULT_OUTPUT_DIR` 都可以先留空，确认需要时再补。
4. 如果某个 profile 已经写死了 `size` 或 `watermark`，就以 profile 为准，不以 `.env.local` 为准。

## 完整使用流程

下面这套流程是按当前仓库里已经存在的示例配置写的，照着做就能完整跑通。

### 1. 安装依赖并进入仓库根目录

所有命令都默认在仓库根目录执行：

注意：下面示例里的独立 `--` 不是笔误，它的作用是把后面的 `run`、`batch`、`fetch`、`score` 子命令继续传给这个包自己的 CLI。

```bash
cd /Users/wuxinbo/Documents/Personal/daypalette-color-admin
pnpm install
```

如果依赖之前已经装过，这一步可以跳过。

### 2. 配好 `.env.local`

在 `packages/outfit-preview-lab/` 下创建 `.env.local`：

```bash
cp packages/outfit-preview-lab/.env.example packages/outfit-preview-lab/.env.local
```

然后至少补这四项：

1. `VOLC_API_KEY`
2. `VOLC_MODEL`
3. `ALI_API_KEY`
4. `ALI_MODEL`

如果你想先最小跑通，只填火山这两项也可以，因为第一步 smoke test 用的是火山 profile。

### 3. 先选你要跑哪种实验

当前仓库里有三类现成入口：

1. `examples/profiles/croquis-volc-round2.json`
作用：火山单次实验，不依赖参考图，最适合先验证 API Key、模型和基本请求链路。
2. `examples/profiles/short-sleeve-volc-round2.json`
作用：火山参考图融合实验，依赖姿态图和风格图。
3. `examples/manifests/short-sleeve-ali-style-scan.json`
作用：阿里风格矩阵批量实验，会基于同一个基础 profile 派生出多组 style 变体。

建议不要一上来就跑 batch，先把单次链路跑通再扩批量。

### 4. 如果要跑参考图融合，先把参考图放对位置

`short-sleeve-volc-round2.json` 这个 profile 依赖两张本地参考图，文件名要和示例保持一致：

1. `packages/outfit-preview-lab/refs/pose/pose-reference.png`
2. `packages/outfit-preview-lab/refs/style/style-reference.png`

也就是说：

1. 姿态参考图放到 `refs/pose/`。
2. 风格参考图放到 `refs/style/`。
3. 文件名分别叫 `pose-reference.png` 和 `style-reference.png`。

如果文件不存在，运行时会直接报 `Missing reference image`。

### 5. 先跑一次最小 smoke test

先用不依赖参考图的 `croquis` 配置确认环境正常：

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- run --profile examples/profiles/croquis-volc-round2.json
```

这条命令会先自动 build，再执行 CLI。终端正常情况下会输出两类关键信息：

1. `Run directory: ...`
2. `Status: completed`

如果这里就失败，优先检查：

1. `.env.local` 里的 `VOLC_API_KEY` 和 `VOLC_MODEL` 是否填了。
2. 模型 ID 是否是你账号当前可用的。
3. `VOLC_BASE_URL` 是否被误改。

### 6. 再跑一次参考图融合实验

确认 smoke test 成功后，再跑短袖融合版：

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- run --profile examples/profiles/short-sleeve-volc-round2.json
```

这次请求会额外读取：

1. `refs/pose/pose-reference.png`
2. `refs/style/style-reference.png`

适合用来验证火山的参考图融合链路是否正常。

### 7. 查看一次运行结果目录

每次运行都会落到 `packages/outfit-preview-lab/.local/runs/` 下面，默认结构大致是：

```text
packages/outfit-preview-lab/.local/runs/
	2026-05-13/
		short-sleeve-volc-round2-xxxx/
			images/
			request.json
			submit-response.json
			response.json
			resolved-profile.json
			resolved-prompt.txt
			resolved-negative-prompt.txt
			run-record.json
```

几个最常用的文件：

1. `images/`: 下载下来的结果图。
2. `resolved-prompt.txt`: 这次实际拼出来的 prompt。
3. `request.json`: 真正发给 provider 的请求体。
4. `response.json`: provider 最终响应。
5. `run-record.json`: 这次运行的摘要记录，后续评分和筛选都看这个。

### 8. 跑阿里的批量实验

当前示例 manifest 会基于 `short-sleeve-ali-base.json` 跑四种 style：

1. `<flat illustration>`
2. `<portrait>`
3. `<sketch>`
4. `<watercolor>`

命令如下：

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- batch --manifest examples/manifests/short-sleeve-ali-style-scan.json
```

正常跑完后，你会看到：

1. `Batch directory: ...`
2. `Summary: .../summary.json`

batch 目录下除了 `manifest.json` 和 `summary.json`，还会有一个 `jobs/` 目录，里面每个子目录对应一次实际运行。

### 9. 什么时候用 `fetch`

如果你将来某个阿里任务是“先提交，后补拉”的模式，就用 `fetch`。典型场景是：

1. 你把 profile 或命令改成不等待完成。
2. 或者任务提交成功后，中途你想稍后再回来拿结果。

命令格式：

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- fetch --provider aliyun --task-id <task-id>
```

如果你想把结果写回某个已有运行目录，可以再补一个 `--run-dir`：

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- fetch --provider aliyun --task-id <task-id> --run-dir packages/outfit-preview-lab/.local/runs/2026-05-13/<run-id>
```

### 10. 给结果打人工分

当你选定某个运行目录后，可以直接写入人工评分：

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- score --run packages/outfit-preview-lab/.local/runs/2026-05-13/<run-id> --pose 8 --vector-flatness 7 --face 7 --structure 8 --cleanup 6 --notes "姿态对，但还偏插画"
```

这条命令会做两件事：

1. 在运行目录里新增 `score.json`。
2. 把评分同步写回 `run-record.json`。

### 11. 如果要继续做新的实验轮次

当前建议的修改入口是：

1. 改 `examples/prompts/` 里的 prompt 片段。
2. 改 `examples/profiles/` 里的单次实验配置。
3. 改 `examples/manifests/` 里的批量组合。

如果只是想换模型，不用改 profile，优先改 `.env.local` 里的 `VOLC_MODEL` 或 `ALI_MODEL`。

如果只是想换姿态图或风格图，也不用改 profile，直接替换 `refs/pose/pose-reference.png` 和 `refs/style/style-reference.png` 即可。

### 11.1 形状优先：先出 pose-locked neutral layer

如果你接下来要优先解决“衣服形状能不能贴住基础模特”，而不是先做最终配色，建议先跑这两组 profile：

1. `examples/profiles/short-sleeve-volc-pose-locked-neutral-layer.json`
2. `examples/profiles/trousers-volc-pose-locked-neutral-layer.json`

这两组配置的目标不是生成最终展示色，而是生成“贴着基础模特姿态的中性服装结构层”：

1. 参考图 1 锁款式和轮廓。
2. 参考图 2 锁基础模特的 3/4 姿态和透视。
3. 输出是已经贴着 invisible body 的独立服装层。
4. 颜色被强制收成单一低饱和暖灰/浅中灰，避免模型在配色上继续漂移。

直接运行：

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- run --profile examples/profiles/short-sleeve-volc-pose-locked-neutral-layer.json
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- run --profile examples/profiles/trousers-volc-pose-locked-neutral-layer.json
```

如果这一步出来的结果在角度和贴合上已经明显稳定，下一步才值得继续做透明层、局部 warp 和程序控色；如果这一步仍然明显脱离基础模特姿态，那就说明问题还在生成阶段，而不是后处理阶段。

## 叠合验证原型

如果你现在不是继续烧 prompt，而是想验证“基础模特 + 独立服装层”这条路线是否能走通，可以直接打开这个静态原型：

1. `packages/outfit-preview-lab/examples/overlay-prototype/index.html`

它使用的是当前冻结下来的三张稳定资产：

1. `refs/style/base-mannequin-best.jpeg`
2. `refs/style/short-sleeve-garment-best-three-quarter.jpeg`
3. `refs/style/trousers-garment-best-three-quarter.jpeg`

原型不是生产方案，它只是做三件事：

1. 用手工 silhouette 保留衣物主体区域。
2. 用 cutout 挖掉领口、袖口、腰口、裤脚开衩等应该透明的内部区域。
3. 用 4 个归一化锚点把短袖和长裤分别仿射贴到基础模特上。

当前原型还额外验证了一件更重要的事：

1. 颜色不必继续交给模型决定。
2. 服装层可以先生成中性结构，再由程序按 Hex 做主色和辅色分区控色。
3. 这更适合服务“色彩展示”，因为最终展示色来自你的数据，而不是模型临场发挥。

这个原型最适合回答两个问题：

1. 当前 3/4 视角服装层和基础模特的角度是不是大体兼容。
2. 接下来应该继续调 prompt，还是该转去做更细的局部 warp / 透明层处理。

如果你打开后发现是“整体方向都错了”，那说明资产本身还不够稳定；如果只是肩线、腰线、裤脚这类局部边界还要再收，那说明路线是成立的，下一步应该进入更精细的对位方案，而不是回去无限重生同一类图。

## 常见工作流建议

如果你只是想先确认工具能用，按下面顺序最省事：

1. 配好 `.env.local` 里的火山配置。
2. 跑 `croquis-volc-round2.json`。
3. 放入两张参考图。
4. 跑 `short-sleeve-volc-round2.json`。
5. 看 `run-record.json` 和 `images/` 选方向。
6. 再补阿里的 `batch` 跑风格矩阵。
7. 最后对入围结果执行 `score`。

## 常用命令

```bash
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- run --profile examples/profiles/short-sleeve-volc-round2.json
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- batch --manifest examples/manifests/short-sleeve-ali-style-scan.json
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- fetch --provider aliyun --task-id <task-id>
pnpm --filter @daypalette-color-admin/outfit-preview-lab start -- score --run packages/outfit-preview-lab/.local/runs/<date>/<run-id> --pose 8 --vector-flatness 7 --face 7 --structure 8 --cleanup 6 --notes "姿态对，但还偏插画"
```

## 目录说明

1. `examples/prompts/`: 示例 prompt 片段。
2. `examples/profiles/`: 单次实验配置。
3. `examples/manifests/`: 批量实验清单。
4. `refs/`: 本地参考图目录。
5. `.local/runs/`: 默认运行结果目录。