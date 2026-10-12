# 项目详情页

> 详情页统一（2026-10-12）：四项目复用已验收的中性透明四卡片、文档标题与联系获取入口、连续阅读与缩放、PDF 范围内的顶部羽化、绿色拖尾/两侧切换提示、阅读中返回精选项目，以及两级底部导航。AIGC 沿用最新主项目的两页原稿（SHA-256 `8e526bc35a7deed1e286707ad1d6d8333eec1a67141cc433df9336ffc7b6ecdf`），直接复用五张已验证的 3200px WebP，不重编码、不替换内容；`tools/adapt-native-pdf-reader.py` 只添加共用阅读器需要的清单。四项目各自文案、原 URL 和最后一项的现有目标保持。已在支线通过四项目桌面和移动回归；2026-10-12 经逐项差异比较整合到最新主项目，下方待审核说明属于先前阶段记录。

> 已验收的 Vibe Coding 完整稿仍为原始一页长画布（SHA-256 `173263b127ec5e8a33ba02db3ce0b34753a225e861f0c06617afaaa873c31ee4`），八段连续资源完整保留。展示名称统一为「Vibe Coding生成产品实践」，CanvasFlow 产品名和原 URL 保留。项目时间以最新主项目的简历同步数据为准；最新简历和 Contact 弹窗原组件未覆盖。

> AIGC 新版 PDF 已替换（2026-10-12）：使用用户本轮提供的 `E:\Figma-导出下载\AIGC提效项目-PDF\合并.pdf`，2 页，SHA-256 `8e526bc35a7deed1e286707ad1d6d8333eec1a67141cc433df9336ffc7b6ecdf`。站内下载文件与源文件字节完全一致。保留 AIGC 现有原生连续阅读方式，按 3200px 宽 / WebP Q92 生成 5 个无重叠高清片段；没有改用缩放阅读器。新版片段使用带源文件 hash 的目录。旧 PDF、旧清单已备份至 `output/pdf/aigc-design-efficiency-replacement/previous/`。源文件及下载核验见 `output/pdf/aigc-new-20261012/`。下文 AIGC「旧作品集第 22 页」「保留既有方案」为历史记录，不再代表当前 PDF 来源。

> 新版PDF资源已验收回迁（2026-10-08）：飞猪改用用户指定的 `E:\Figma-导出下载\飞猪运营活动-PDF\飞猪-合并.pdf`（8页，SHA-256 `59d51c4ee082c48a670cf1d06facb5ea1491081e534a6c395219208fcbf36b8e`），乐心改用 `E:\Figma-导出下载\乐心健康-PDF\合并.pdf`（27页，SHA-256 `47a09abb0890c1b15e6cdb0f20c0dae437970b9fe75b3fcbc9d16ad12c6a4dcd`）。工作区对应 `assets/projects/<项目>/project.pdf` 为源文件的原样副本。复用既有3200px / WebP Q92 / 单段最高4096px流程，分别生成21 / 58个连续段；只更新这两个项目的资源配置与页面产物，阅读器代码和样式不变。AIGC保留既有方案，CanvasFlow保持独立网页。旧压缩版来源表属于历史记录，不能再用于判断当前飞猪和乐心的来源。来源、旧文件备份及回归记录见 `output/pdf-new-source/` 与 `output/playwright/pdf-new-source/`。

> 最新状态（2026-10-05）：本支线截至 `5c87864` 的共用详情页首屏及飞猪阅读交互已按用户授权迁移至主项目。合并前检查无详情页冲突，主线个人世界更新完整保留；在主项目重新构建并完成桌面、移动端和下载/跳转检查。独立 Worktree 与合并前备份继续保留。主项目预览：http://127.0.0.1:8782/projects/fliggy-lele-run/?feedback=off 。下文关于独立支线与待验收的说明为此前开发记录。


当前开发版本：`chengzhang-portfolio-prototype`。本次仅更新四个独立项目详情页及其构建工具；首页与正式 GitHub / Netlify 仓库未改动。

## 共用结构

- `tools/project-detail-hero.mjs`：四项目共用首屏组件，标题与角色、时间、标签在左，完整封面在右，下方四块内容采用 2×2 排列。
- `tools/project-detail-component.mjs`：三个真实 PDF 项目的静态页面组件，首屏调用共用组件，下方保留原有连续阅读区。
- `portfolio-project-hero.css`：仅供详情页加载的共用首屏样式。1707 × 932 下内容宽 1320px，封面宽 280px；小屏将封面与四块内容依次纵向排列。
- `portfolio-projects.css`：保留独立详情页原有背景、导航与阅读区样式。
- `tools/project-detail-background.mjs`：从首页模块 13717 提取的原网格坐标计算，保留原边距、交叉标记、线宽与颜色。点阵延续原页面的 8px 间距及蓝黑色系，以轻量 CSS 呈现；不加载整个首页 3D runtime。
- `tools/project-detail-client.js` → `portfolio-projects.js`：视口变化时更新背景网格，保持原有返回首页的选中项目和滚动位置。
- `tools/build-project-details.mjs`：只生成详情页，不写首页。原 `build:works` 已改为调用此共用构建，避免后续重建时覆盖新版详情页。

```powershell
npm run build:projects
# 单独构建某一页：
npm run build:projects -- --only=canvasflow-art-preview
```

## 统一配置入口

**`tools/project-detail-content.mjs`** 集中管理四个项目的文案、封面、时间、角色、标签及 PDF / 占位状态。

- `cover`：资源路径与原始宽高，图片完整显示，保持原比例。
- `period`：项目时间。CanvasFlow 采用本轮用户草图中的 `2026.08 — 2026.09`，其余项目沿用已有时间记录。
- `background / objective / contributions / outcome`：项目档案正文。
- `reading.kind: "placeholder"`：使用独立项目的占位阅读页；`pages` 设置数量，不虚构项目正文。
- `reading.kind: "pdf"`：使用本地 PDF 与页面清单；`pdf` 是下载路径，`manifest` 是连续阅读图片的清单路径。

提供新 PDF 后，无需修改版式。将新 PDF 按下面的命令处理到对应项目目录，再更新配置并运行 `build:projects` 即可。封面替换也只需修改同一配置中的 `cover`。

```powershell
# 使用带有 pypdf、Pillow 的 Python，以及本地 Poppler 的 pdftoppm。
python tools/prepare-project-pdf.py `
  --project-id canvasflow-art-preview `
  --source 'C:\path\CanvasFlow.pdf' `
  --renderer 'C:\path\pdftoppm.exe'
```

工具只复制所选 PDF 页，源文件保持原样。阅读页预渲染为 1600px 宽 WebP，长页分为连续的图片片段（同页片段间无留白）。页面采用原生纵向滚动和图片懒加载，无 iframe / 独立滚动窗口，无第三方 CDN。PDF 原文件可下载以便放大和搜索。

## 本轮资料来源与素材状态

### 项目档案

主要参考：`E:\Figma-导出下载\简历-2026\V4\改动-V4.pdf`，以及用户此前提供的项目资料和已存在的项目时间信息。正文按背景、目标、核心工作、成果重新整理，未复用首页短简介。

- CanvasFlow：采用简历中需求、流程设计与前端实现信息；按当前可交互原型描述结果，不写未验证的业务数据。使用已有原型截图，3 页明确标注「项目内容待接入」。
- AIGC：简历及真实 PDF 中的 LoRA 训练、ComfyUI 工作流与运营海报内容。
- 飞猪：六一游戏化活动、IP 延展、SD / LoRA 素材及活动页面产出。
- 乐心：用户反馈与竞品分析、课程查找和运动流程、组件及健康数据可视化方案。

其他三个项目时间继续采用原有记录；CanvasFlow 时间来自本轮用户草图。

### 真实 PDF

从现有整本作品集 `E:\SSS-作品集\游承樟-作品集-26.5.09\游承樟-作品集2_压缩 (1).pdf` 提取，并核对章节封面及内容对应关系：

| 项目 | 原文件页码（从 1 开始） | 页面数 | 本地目录 |
| --- | --- | --- | --- |
| AIGC 设计提效 | 22 | 1 个长页面 | `assets/projects/aigc-design-efficiency/` |
| 飞猪乐乐跑 | 17–21 | 5 | `assets/projects/fliggy-lele-run/` |
| 乐心健康 APP | 2–16 | 15 | `assets/projects/lexin-health-app/` |

每个目录都有 `project.pdf`、`pages.json` 与对应的 WebP 页面片段。没有迁入整本作品集、简历、个人联系方式页或其他无关章节。

新版简历与旧飞猪 PDF 的活动目标达成率记录不一致（121.5% / 129.5%），且 UV 的比较口径描述不同。本轮首屏采用可核实的定性产出，不引用这些指标；旧 PDF 内容保持原样，后续可用用户确认的新 PDF 直接替换。

## 本地预览

现有静态服务：`http://127.0.0.1:8767/`

- `/projects/canvasflow-art-preview/`
- `/projects/aigc-design-efficiency/`
- `/projects/fliggy-lele-run/`
- `/projects/lexin-health-app/`

服务关闭后可执行 `npm run preview:works`，默认端口 8772。查看 `design-qa.md` 可找到本轮 1707 × 932 实际截图与验证记录。

## 四项目首屏优化（2026-10-04）

独立工作区为 `C:/Users/31954/Documents/chengzhang-portfolio-worktrees/project-hero-layout`，分支 `codex/project-hero-layout`。本轮以最新主项目快照 `09fd31b` 为基准，没有写入主项目，等待视觉审核。预览为 `http://127.0.0.1:8781/projects/canvasflow-art-preview/?feedback=off`。

四页采用相同的首屏组件：移除项目定位，展示角色与项目时间；扩大标题、缩小并完整保留封面，四块内容横向展开，阅读区在桌面首屏底部露出。封面素材与正文未改写。CanvasFlow 仍用原有首页派生背景，其他三页仍用原独立背景；原背景代码未改动。

CanvasFlow 的文案和素材入口仍为 `tools/canvasflow-detail-content.mjs`，首屏通过共用组件实现；原 `portfolio-canvasflow.css` 与背景衍生方式保留。`build:canvasflow` 可单独重建，`build:projects` 同时生成四页。

验证通过：`build:projects`、源文件语法、共用 CSS 解析、`git diff --check`；四页 1707×932 实际截图；390×844、320×844、768×1024 无内容溢出或横向滚动；阅读锚点正确滚动。AIGC / 飞猪 / 乐心的 1 / 5 / 15 页 PDF 与 4 / 13 / 37 个图片片段顺序匹配原清单，下载实际成功。三页从阅读区开始的 HTML 逐字保持一致，CanvasFlow 占位阅读区逐字保持一致，CanvasFlow 场景入口之外的背景代码逐字保持一致，首页与真实 PDF 资源未改动。CanvasFlow 的真实 PDF 尚未接入，保留原有占位状态。

截图与验证记录位于本工作区 `output/playwright/`，桌面深色截图为各项目 ID 加 `-desktop-dark.png`，CanvasFlow 浅色截图为 `canvasflow-art-preview-desktop.png`；手机截图为各项目 ID 加 `-mobile.png`。`desktop-result.json`、`responsive-result.json`、`reading-result.json`、`scope-result.json` 记录实际检查结果。
