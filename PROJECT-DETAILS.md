# 项目详情页

当前开发版本：`chengzhang-portfolio-prototype`。本次仅更新四个独立项目详情页及其构建工具；首页与正式 GitHub / Netlify 仓库未改动。

## 共用结构

- `tools/project-detail-component.mjs`：共用 React 静态渲染组件，首屏项目档案 + 原始封面，下面接连续阅读区。
- `portfolio-projects.css`：仅供独立详情页使用的样式。1707 × 932 下内容宽 1320px，双栏扣除 64px 间隙后约为 502 / 754px（40:60）。
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
- `period: null`：完全隐藏项目时间（CanvasFlow 当前如此）。
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

- CanvasFlow：采用简历中需求、流程设计与前端实现信息；按当前可交互原型描述结果，不写未验证的业务数据。使用已有原型截图，时间隐藏，3 页明确标注「项目内容待接入」。
- AIGC：简历及真实 PDF 中的 LoRA 训练、ComfyUI 工作流与运营海报内容。
- 飞猪：六一游戏化活动、IP 延展、SD / LoRA 素材及活动页面产出。
- 乐心：用户反馈与竞品分析、课程查找和运动流程、组件及健康数据可视化方案。

原有项目时间继续采用 `tools/selected-works-runtime.js` 已有记录；CanvasFlow 未填写任何假时间。

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

## CanvasFlow 最新桌面版（2026-10-04）

CanvasFlow 已采用大标题、右上小封面、2×2 项目信息的专用布局。资源与文案入口为 `tools/canvasflow-detail-content.mjs`，样式为 `portfolio-canvasflow.css`。执行 `npm run build:canvasflow` 可单独重建；`build:projects` 和 `build:works` 也会保留此布局。其他三个项目继续使用共用组件及现有真实 PDF。
