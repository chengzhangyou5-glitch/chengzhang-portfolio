# 像素残影连续性修复

日期：2026-10-07。项目：当前主项目 `chengzhang-portfolio-prototype`。

## 本轮补齐：后三页的动态与绿色拖尾

上一轮只验证了残影保存及恢复，三个轻量详情页仅在加载/缩放时重绘，没有接入鼠标视差和绿色拖尾。这是上轮实现的遗漏。

本轮为 AIGC、飞猪、乐心补齐：

- 使用原场景的视差参数（强度 1.4、lag .18、rotate .12、leave lag .05），让鼠标驱动相机移动、转向与缓动；真实贴纸实例保持原样。
- 构建时直接提取原场景的 `cP` 拖尾类、`#c0fe04` 颜色及指针 shader：同样的 16px 格子、14 个拖尾采样与原有淡出逻辑。
- 原始实例使用 instanced draw；仅在鼠标移动、视差收敛、拖尾淡出或尺寸变化时重绘，避免每帧重新分配纹理。
- 监听保持 passive，不拦截页面滚动；移动端遵循现有小于 1024px 的规则，停用桌面鼠标拖尾。
- CanvasFlow 的原有动画与拖尾组件未修改。

1707×932 实际逐页移动鼠标验证：三页相机随左右移动变化，绿色拖尾达到 14 个有效采样；进入及返回的原粒子矩阵一致。JavaScript 错误 0，每页单次揭幕，空背景提前暴露帧 0。

CanvasFlow 原有效果复测通过。390×844 AIGC 检查：无横向溢出，保持移动端无桌面拖尾的原规则，PDF 区域正常纵向滚动 850px，返回精选项目顶端为 0，残影矩阵一致，错误 0。

新增 `tools/sticker-residue-math.js`、`tools/sticker-residue-motion.generated.js`；修改 `tools/sticker-residue-detail.js`、`tools/build-sticker-residue.mjs` 与生成入口 `portfolio-sticker-residue.js`。

证据：

- [动态测试数据](output/playwright/pixel-continuity/motion-results.json)
- [CanvasFlow 与移动端测试数据](output/playwright/pixel-continuity/motion-responsive-results.json)
- [AIGC 动态/绿色拖尾](output/playwright/pixel-continuity/aigc-design-efficiency-motion-left.png)
- [飞猪动态/绿色拖尾](output/playwright/pixel-continuity/fliggy-lele-run-motion-right.png)
- [乐心动态/绿色拖尾](output/playwright/pixel-continuity/lexin-health-app-motion-left.png)

## 根因

1. 贴纸残影由实时贴纸实例矩阵、图集和圆点遮罩共同形成，状态存在 React refs 与 GPU render target 中。原生跨文档导航销毁场景；返回时重新初始化随机粒子，所以进入前的残影丢失。
2. AIGC、飞猪、乐心三个轻量详情页只挂载固定的 CSS 点阵背景，没有挂载主站的真实贴纸残影。
3. CanvasFlow 使用独立场景，但没有继承原状态，且原 canvas 被压至 `.12` 透明度。其路由适配还会临时把 pathname 改为 `/`，导致仅检查 pathname 的背景和转场识别遗漏该详情页。
4. 最近的返回修复保存了项目选择和滚动位置，但没有保存背景实例与 GPU 状态；没有发现它主动清空残影的代码。

## 修复方式

- 在离开主站前，把真实粒子数据、实例矩阵、UV、模拟时间、相机矩阵、原 shader 参数和背景 GPU 缓冲保存至同一标签页的 `sessionStorage`，键为 `portfolio:sticker-residue:v1`。
- 返回时，在随机初始化之前恢复原实例与背景缓冲。详情页不能覆盖主站的状态。
- 三个轻量详情页使用真实图集、原 shader 与保存矩阵，建立最小 WebGL 渲染层；复用原像素遮罩，未制作静态 PNG 或固定假像素。
- CanvasFlow 恢复原场景状态，并在背景恢复后使用正常 canvas 透明度。路由判断使用适配前保存的真实路径。
- 详情揭幕等待背景恢复；返回揭幕保留原项目、滚动、相机、网格和绘制就绪检查，并增加残影恢复检查。
- 原贴纸运动参数、图集、颜色 shader、像素大小及密度参数保持原样。Typography、详情内容、卡片布局及 PDF 阅读逻辑未调整。

## 文件

新增：

- `tools/sticker-residue-state.js`：会话状态与完整检查点。
- `tools/sticker-residue-scene.js`：原场景捕获/恢复 hooks。
- `tools/sticker-residue-detail.js`：详情页最小实时渲染层和背景就绪。
- `tools/build-sticker-residue.mjs`：可重复构建与派生场景同步。
- `portfolio-sticker-residue.js`：生成的浏览器入口。

修改：

- `tools/project-entry-runtime.js`：识别 CanvasFlow 适配前路径。
- `tools/return-paint-runtime.js`：返回等待真实残影恢复。
- `tools/project-detail-client.js`、`tools/canvasflow-route-runtime.js`：详情揭幕等待背景；检查实际封面选择器。
- `tools/build-project-details.mjs`：详情 HTML 保留背景入口。
- `portfolio-canvasflow.css`：仅恢复已就绪残影 canvas 的正常透明度。
- `package.json`：增加 `build:residue`。
- 生成输出：`index.html`、四个 `projects/*/index.html`、`portfolio-projects.js`、`portfolio-project-entry.js`、原场景 chunk `7758f29a8aeb1c60.js` 和派生 `canvasflow-detail-scene.js`。

## 浏览器验证

Chrome 实际点击导航；桌面 1707×932，深色主题。连续流程为主站 → CanvasFlow → 返回 → 飞猪 → 返回 → 乐心 → 返回 → AIGC → 返回。

| 项目 | 详情真实残影 | 返回实例矩阵一致 | 返回对应项目 | 单次揭幕 / 未提前暴露空背景 |
|---|---|---|---|---|
| CanvasFlow | 通过 | 通过 | 通过 | 通过 |
| AIGC | 通过 | 通过 | 通过 | 通过 |
| 飞猪 | 通过 | 通过 | 通过 | 通过 |
| 乐心 | 通过 | 通过 | 通过 | 通过 |

- 测试中的 50 个渲染实例全部保留，逐项矩阵一致；不是仅比较存储值，还调用原场景捕获函数验证恢复后的实例矩阵。
- 最终四个详情背景状态均 `ready`，canvas 透明度为 1，浏览器 JavaScript 错误 0。
- 逐帧观察到每个新文档只揭幕一次，未记录到残影未就绪而页面无遮罩的帧。
- 返回后舞台顶端误差为 0–0.136px，选择保持对应项目，未发现跳位。
- 移动端 390×844：飞猪进入/返回通过，同样 50 个实例、矩阵一致、舞台顶端 0、单次揭幕、空背景暴露帧 0。
- `npm run build:residue` 通过；重复构建输出 hash 不变。新增运行时与原场景补丁通过语法检查。
- 修改前后 hash 清单核对：字体资源、其他页面样式、项目资料与 PDF 资源未改变。

## 证据

- [桌面结果](output/playwright/pixel-continuity/desktop-results.json)
- [最终返回与移动结果](output/playwright/pixel-continuity/final-results.json)
- [构建结果](output/playwright/pixel-continuity/build-results.json)
- [已有文件变更清单](output/playwright/pixel-continuity/changed-existing-files.json)
- [CanvasFlow 详情](output/playwright/pixel-continuity/canvasflow-art-preview-detail.png)
- [AIGC 详情](output/playwright/pixel-continuity/aigc-design-efficiency-detail.png)
- [飞猪详情](output/playwright/pixel-continuity/fliggy-lele-run-detail.png)
- [乐心详情](output/playwright/pixel-continuity/lexin-health-app-detail.png)
- [最终返回精选项目](output/playwright/pixel-continuity/aigc-final-return.png)
- [移动详情](output/playwright/pixel-continuity/mobile-fliggy-detail.png)
- [移动返回](output/playwright/pixel-continuity/mobile-fliggy-return.png)

本次测试针对同一标签页中由主站生成残影后的进入/返回流程。状态随该标签页会话保留。
