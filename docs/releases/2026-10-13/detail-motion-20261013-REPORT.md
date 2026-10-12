# 四个详情页滚动与顶部遮罩修复

## 根因

1. CanvasFlow 采用捕获页面中的 Lenis 1.3.23，参数为 lerp=.1、smoothWheel=true、syncTouch=true、anchors=true。其他三个静态详情仅依赖浏览器原生滚动；CSS scroll-behavior:smooth 不能提供滚轮惯性。
2. PDF 工具栏 ::before 覆盖整列文档，160px 高、blur(24px)，配合 clip-path 裁剪。PDF 顶部进入时把强遮罩直接裁出一道硬边，出现截图中的暗色横带。修复前浏览器实际读数：PDF top=28，clip=inset(33px 0px 0px)，背景渐变上端 alpha=.42。

## 实际调整

- 从现有捕获 chunk 提取同一版本 Lenis 核心，剔除 React、GPU 等适配部分，不下载其他版本或挂载第二套页面框架。
- 给三个静态详情的现有 document 滚动宿主接入同引擎、同缓动参数，保留其 DOM、sticky 阅读器、背景与历史导航。
- 复用 Contact 的 scrollEnv 接口，PDF 缩放后的位置复位同步 Lenis，避免出现旧惯性目标反拉；尊重 reduced-motion，处理 pagehide/pageshow。
- 移除工具栏整列模糊伪元素及其追踪代码。各按钮自身的玻璃背景、投影、出现状态保留。
- 内容、PDF 资源、首页、详情布局、Typography 和主题 Token 未修改。现有共用阅读器、导航及真实残影 renderer 继续使用。

## 修改文件

- tools/project-detail-client.js
- tools/project-scroll-runtime.js（新增）
- tools/extract-project-scroll-core.mjs（新增）
- tools/lenis-core.generated.mjs（从已存在的 Lenis 1.3.23 生成）
- tools/project-pdf-reader.js
- portfolio-projects.css
- portfolio-project-pdf.css
- portfolio-projects.js、portfolio-project-pdf.js（从上述源码构建）

## 实际检查

- 四个项目 × 1707×932：一次滚轮输入后的连续 24 帧里，四页均有 23 次持续位移；PDF 阅读区均缩至约 751px；放大为 110%，恢复为 100%；文档拖尾采样有 2304 个非透明像素；两侧上下项目光标出现。
- 三个静态详情 × 390×844：无横向溢出，阅读区 358px；移动端保留全宽，工具栏无横带。
- 三个静态详情：联系弹窗锁定位置不变，关闭后滚动恢复；浅色模式无横带；切换 reduced-motion 停用惯性，恢复后参数为 .1。
- 主站 → 四个详情 → 返回：四个目标项目正确；舞台 top=0；完成退场后遮罩数量为 0；原始残影 checkpoint 保留。三个静态详情确认 live-gpu-checkpoint / interactive=true，视差 eye 更新、trailCount=11。
- JS 构建通过；npm run build:production -- --check 通过（377 文件，5 页面）。未部署。

## 证据（同目录）

- detail-motion-20261013-before.png：修复前顶部横带。
- detail-motion-<项目 ID>-top-1707.png：修复后的顶部。
- detail-motion-<项目 ID>-reading-1707.png：缩小阅读及两侧导航。
- detail-motion-<项目 ID>-390.png：移动端。
- detail-motion-<项目 ID>-light-1707.png：浅色。
- detail-motion-<项目 ID>-live-background.png：真实主站残影恢复。
- detail-motion-20261013-results.txt、detail-motion-20261013-flow-results.txt、detail-motion-20261013-dialog-results.txt：最终通过记录。

脚本定位曾遇到隐藏的项目编号按钮和返回遮罩尚未完成退场，最终改用用户实际工作经历标签进入、等待返回状态 stable 后核验；没有据此扩大修改首页导航。
