# Typography 审查与 V1 规范建议

审查日期：2026-10-05。对象：`C:\Users\31954\Documents\chengzhang-portfolio-prototype` 当前主项目。状态：**仅审查与建议，未执行字体重构、代码修改或部署。**

## A. 当前字体使用现状

### A1. 方法、范围与证据

实际运行本地预览：`http://127.0.0.1:8767/?feedback=off`。浏览器为 Windows Chrome 154；桌面视口 **1707×932**，移动布局视口 **390×844**。移动检查是同一 Windows 浏览器调整 viewport，不能代表 iOS / Android 的实际字体命中情况。

检查首页、三条工作经历的收起与展开、四个精选项目的切换、About、三段隧道标题、Contact 结束页与联系弹窗、设置弹窗、移动菜单，以及四个项目详情页的首屏和连续阅读区域。补查深色/浅色主站、复制反馈、项目悬停提示。通过 DOM 文本节点采集 `getComputedStyle()`，并以 Chrome DevTools Protocol 的 `CSS.getPlatformFontsForNode` 验证代表性节点实际使用的字体。

共保存 **46 份页面/状态采样、1685 条文本节点记录**。节点数包含重复访问、循环标签副本、逐字动画节点及离屏挂载内容，**不是全站独立文案数量**。在有效 opacity ≥ 0.45、排除齿轮等符号后的记录中，观察到 224 种样式组合；这个数字包含主题和交互状态，**不是应当保留的 224 个设计 Token**。

证据文件：

- [逐节点完整清单 CSV](output/playwright/typography-node-inventory.csv)：页面、状态、选择器、文案、语言、全部文字属性、是否在视口内。
- [实际字体命中 JSON](output/playwright/typography-platform-fonts.json)：字体 family / PostScript name / glyph count。
- [统计与采样来源](output/playwright/typography-audit-statistics.json)。
- [只读校验结果](output/playwright/typography-readonly-verification.json)：审查前后对234个已有源码/资源文件进行SHA-256比较，没有变化；本报告及审查输出单独新增。
- 原始 computed 数据：[主站桌面](output/playwright/typography-desktop-home-stable.json)、[精选项目与隧道](output/playwright/typography-works-stable.json)、[移动布局](output/playwright/typography-mobile.json)、[详情页桌面](output/playwright/typography-details-desktop.json)、[详情页移动](output/playwright/typography-details-mobile.json)、[状态补查](output/playwright/typography-extra.json)、[加载后复查](output/playwright/typography-final.json)、[移动菜单](output/playwright/typography-menu.json)、[菜单字体确认](output/playwright/typography-menu-confirm.json)。

统计约定：下表 `字号 / 字重 / 行高` 均为 CSS px，字重为 computed 声明值；小数保留两位。`normal` 保留浏览器原值，不能当成固定行高。除表中特别说明，字距为 `normal`、元素自身 opacity 为 1。

颜色与透明度必须分开读：例如 `rgba(255,255,255,.66)`、元素 opacity `.64`、父级 opacity `.64` 是三种不同实现。表中 α 表示颜色 alpha 与祖先 opacity 的乘积，便于描述实际减弱程度；它不包含背景合成、阴影或遮挡，**不等于实测对比度**。逐字入场动画的临时 opacity=0 不列为永久文字规范。

本轮只评估可由 CSS 控制的实时文字。3D 模型字、艺术字 SVG 轮廓、封面和 PDF 阅读页图片中的文字属于资源内容，不具备可验证的 DOM 字体属性；不把它们混入字号清单，也不建议用 CSS 改写。

### A2. 字体栈与真实命中

完整栈定义来自 [portfolio-fonts.css](portfolio-fonts.css)：

```css
/* EN */
"Portfolio DIN", "DIN", "DIN Alternate", "DIN Condensed", Arial, sans-serif
/* ZH */
"Portfolio PingFang", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif
/* MIX：英文、数字先走 DIN，中文按字符回退至 PingFang */
"Portfolio DIN", "DIN", "DIN Alternate", "DIN Condensed",
"Portfolio PingFang", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif
```

下文用 EN / ZH / MIX 引用这些完整栈；这是语言组合方式，不是把中英文强行用同一字体。

| 使用方式 | 浏览器实际命中 | 结论 |
| --- | --- | --- |
| EN 400 / 500 / 700 | DIN-Regular / DIN-Medium / DIN-Bold | **本机已实际命中 DIN**，常规英文没有回退到 Arial |
| Contact 原生 `DIN` 优先、900 | DIN Black / DIN-Black | 900 是实际 Black 字体；与 alias 仅提供到 700 的路径不同 |
| ZH alias 400 / 500 | PingFangSC-Regular / PingFangSC-Medium | 常规中文确实命中 PingFang SC |
| ZH alias 声明 600 | PingFangSC-Medium | alias 只声明 400、500，600 未命中真实 Semibold 面 |
| About 姓名原生 `PingFang SC` 优先、600 | PingFangSC-Semibold | 同样声明 600，与其他中文标题的实际字体面不同 |
| MIX 声明 650 的详情页标题 | 中文 PingFangSC-Medium，英文 DIN-Bold | 非统一的实际字体面；没有验证出 650 可变字重字体 |
| 精选项目 `CanvasFlow AI`，ZH 栈、600 | PingFangSC-Medium，13 个字符 | 英文项目名没有走 DIN |
| 移动菜单中文，EN 栈、400 | **Noto Sans SC / Noto-Sans-SC** | DIN 不含这些汉字，栈中没有中文字体，浏览器自行回退 |
| 返回箭头 / 设置齿轮 | ArialMT / SegoeUISymbol | 符号回退是合理例外，不作为英文正文违规 |

注意：命中 Medium 不证明浏览器绝对没有合成加粗；computed `font-synthesis` 允许合成。能确认的是 **600 的真实字体面路径不一致**，不能仅依据声明数字说标题都已使用 Semibold。

运行时 `document.fonts` 还可见原站 `tiktok`、`mono`、`tronica-mono`。本轮代表性普通文本实际命中 DIN/PingFang，而不是这些旧名称。是否还有模型或未采样状态依赖旧字体需要单独资源审查，不建议本轮据此删除字体。

### A3. 首页、导航、Footer、公共弹窗

| 页面 / 组件 | 字体 | 桌面：字号 / 字重 / 行高 | 移动：字号 / 字重 / 行高 | 字距；颜色 / opacity |
| --- | --- | --- | --- | --- |
| 首页品牌 CHENGZHANG YOU | EN | 16 / 700 / 24 | 同桌面 | normal；深色白、浅色黑，α1 |
| 桌面四项导航 | ZH | 16 / 500 / 24 | 桌面导航隐藏 | normal；白/黑，α1；当前项横线另行绘制 |
| 移动全屏菜单 | **EN 栈，中文实际 Noto Sans SC** | 不显示 | 39 / 400 / 58.5 | normal；白，α1；字号来自 10svw |
| 移动菜单底部“关于我 / 联系我” | 同上 | 不显示 | 16 / 400 / 24 | normal；白，α1 |
| 首页 Product & / AIGC UI/UX | EN | 30 / 500 / 37.5 | 隐藏 | normal；白/黑，α1 |
| 首页 Thinking… / I moved… 简介 | EN | 16 / 400 / 24 | I moved… 保留 16 / 400 / 24；Thinking… 隐藏 | normal；白/黑，α1 |
| WELCOME 三行展示标题 | EN | 85.37 / 700 / 85.37 | 28.08 / 700 / 28.08 | normal；白/黑，α1；逐字入场独立状态 |
| 时钟 / 坐标 | EN | 16 / 400 / 24 | 时钟 16 / 400 / 24；坐标隐藏 | normal；白/黑，α1 |
| Contact 时固定 HUD 署名 | MIX | 16 / 400 / 24 | 本地署名见下一行 | .64px；白/黑，α1 |
| Contact 本地署名 | ZH | 桌面通常由固定 HUD 替代 | 14 / 400 / 21 | .56px；白/黑，α1；数字也走 ZH 栈 |
| 设置弹窗标题 | MIX | 12 / 600 / 18 | 同桌面 | .72px；深色 #b8bcc4、浅色 #34425a |
| 设置“声音 / 主题” | ZH | 14 / 500 / 20 | 同桌面 | normal；深色 #f0f1f3、浅色 #172033 |
| 设置状态徽标 | ZH | 12 / 500 / 18 | 同桌面 | normal；深色声音 #b6d2ff，浅色 #2f4e7a；其他状态用组件色 |

品牌、Home 与隧道某些节点仍有 `font-variation-settings: "wght" 700, "wdth" 120`。实际命中的是 DIN-Bold；不能假定 wdth 已产生原站可变字体的扩宽效果。字号和字重判断仍以 computed 与实际字体面为准。

### A4. 工作经历

| 文字角色 | 字体 | 桌面：字号 / 字重 / 行高 | 移动：字号 / 字重 / 行高 | 字距；颜色 / opacity |
| --- | --- | --- | --- | --- |
| 工作经历模块标题 | ZH | 34 / 600 / 42.5 | 26 / 600 / 32.5 | normal；主色 α1；600 实际为 Medium |
| WORK EXPERIENCE | EN | 12 / 400 / 18 | 9 / 400 / 13.5 | 5.28px → 1.98px；主色 α.66 |
| EXPERIENCE / 01—03 辅助索引 | EN | 14 / 400 / 21 | 10 / 400 / 15 | .84px → normal；主色 α.66 |
| 01 / 02 / 03 | EN | 68 / 700 / 68 | 38 / 700 / 38 | normal；默认颜色 α.72；激活 #7ca5ff |
| 公司名称 | ZH | 38.93 / 500 / 52.55 | 21 / 500 / 31.5 | normal；主色，随条目状态减弱 |
| 岗位 | MIX | 20 / 400 / 28 | 14 / 400 / 19.6 | normal；主色，随条目状态减弱 |
| 时间 | EN | 19 / 400 / 26.6 | 13 / 400 / 18.2 | normal；颜色及条目 opacity 共同作用 |
| 展开“工作内容 / 工作产出” | ZH | 20 / 400 / 33 | 16 / 400 / 27.2 | normal；主色 α.66 |
| 展开正文 | MIX | 20 / 400 / 33 | 16 / 400 / 27.2 | normal；主色 α1 |
| 关联项目 Tag | MIX | 14 / 500 / 21 | 12 / 500 / 18 | normal；主色 α.90 |

交互状态已实测：全部收起时 trigger 父级 opacity 为 **.82**；一项展开后，未展开条目 opacity 为 **.64**，展开项为 **1**。因此默认编号 α=.72×.82=.5904，非激活编号 α=.72×.64=.4608。公司/岗位跟随 .82/.64/1；时间还叠加颜色规则。此减弱逻辑是已确定的视觉意图，不能把 .64 状态当成加载错误。

三家公司展开内容均检查；中国电子云没有关联项目 Tag，飞猪有两个，乐心有一个。当前差异来自文字规格与状态规则，不是统一组件内容串用。

### A5. 精选项目：四个项目共用样式

当前实际标题为 CanvasFlow AI（另有两行中文副标题）、AIGC 设计提效项目、飞猪乐乐跑运营活动、乐心健康运动 APP。四个项目切换后的样式一致；下表不把未激活副本的 opacity=0 算作正文规范。

| 文字角色 | 字体 | 桌面：字号 / 字重 / 行高 | 移动：字号 / 字重 / 行高 | 字距；颜色 / opacity |
| --- | --- | --- | --- | --- |
| 精选项目模块标题 | ZH | 18 / 400 / 25.2 | 12 / 400 / 15 | normal；主色 α1 |
| SELECTED WORKS | EN | 隐藏 | 8 / 400 / 12 | 1.2px；主色 α.56 |
| 项目名及中文副标题 | **ZH** | 32.01 / 600 / 41.62 | 20 / 400 / 28 | normal；主色 α1 |
| 能力 Tag | MIX | 13 / 500 / 18 | 同桌面 | normal；主色 α.90 |
| 左侧元信息 label / value | MIX | 19 / 400 / 28.5 | label 隐藏；时间 10 / 400 / 15 | normal；桌面 label α.54、value α.72；移动时间 α1 |
| 大序号 | EN | 133.17 / 400 / 109.2 | 64 / 400 / 52.48 | -7.99px → -3.84px（-.06em）；主色 α1 |
| / 04 | MIX | 15 / 400 / 22.5 | 9 / 400 / 13.5 | normal；α.54 → .56 |
| 四项数字切换按钮 | EN | 12 / 400 / normal | 9 / 400 / normal | normal；激活 α1，未激活 .54/.56 |
| 右侧简介 | MIX | 23.05 / 500 / 40.34 | 15 / 400 / 27.75 | normal；α.92 → 1 |
| 查看项目 | MIX | 24 / 400 / 33.6 | 11 / 400 / 16.5 | normal；主色 α1 |
| 自定义悬停提示 | MIX | 24 / 500 / 33.6 | 不作为触屏入口 | normal；#f5f8ff，α1 |
| 隐藏图片入口的焦点文字 | MIX | 12 / 400 / 18 | 同桌面 | 默认 opacity0；属于焦点反馈而非常驻标签 |
| 移动项目类型辅助文字 | MIX | 不显示 | 10 / 400 / 15 | .8px；α.56 |
| 底部 SCROLL TO EXPLORE | EN | 8 / 400 / normal | 隐藏 | .16px；α.54 |

Tag 排版已为内容自适应、Flex Wrap，文字 13/500/18、间距 8px；本轮不建议重新调整其几何排版。项目名使用 ZH 栈的问题是实际字体问题，不是标签布局问题。

### A6. About 与隧道

| 文字角色 | 字体 | 桌面：字号 / 字重 / 行高 | 移动：字号 / 字重 / 行高 | 字距；颜色 / opacity |
| --- | --- | --- | --- | --- |
| 游承樟 | 原生 PingFang SC 优先 | 42 / 600 / 50.4 | 32 / 600 / 38.4 | normal；主色 α1，真实 Semibold |
| 福州大学 · 211 | MIX | 32.10 / 500 / 43.33 | 23 / 500 / 31.05 | normal；主色 α1 |
| UI/UX & 产品设计 & AIGC | MIX | 32.78 / 500 / 44.25 | 23 / 500 / 31.05 | normal；主色 α1 |
| 中文介绍两段 | MIX | 22.20 / 400 / 36.62 | 17 / 400 / 28.05 | normal；主色 α.74 |
| 英文介绍两段 | EN | 17.07 / 400 / 29.02 | 15 / 400 / 25.5 | normal；主色 α.50 |
| 全部能力/个人特质文字 | MIX | 16 / 500 / 24 | 同桌面 | normal；主色 α.90；循环副本一致 |
| 三阶段隧道英文标题 | EN | 116.10 / 700 / 133.51 | 28.08 / 700 / 32.29 | normal；白，最终 α1；阶段过渡逐字改变 opacity |

三阶段标题分别为 `BEYOND / THE WORK.`、`A GLIMPSE / OF MY / WORLD.`、`FROM MY WORLD / TO YOURS.`。标题共用字号、字重与 1.15 行高；现有明确换行应保留。个人照片扩散段当前没有额外说明标题，不建议为满足文字系统添加文字。

About 中英文强弱关系是已确认的主次意图：英文更小、更淡，属于可保留的双语例外。学校与设计方向的桌面差异仅约 .68px，移动又完全相同，是可合并的同层级规则。

### A7. Contact 结束页与联系弹窗

**以当前页面为准：结束页大标题是 LET'S BUILD / SOMETHING TOGETHER.，联系方式在“查看联系方式”打开的弹窗中。** 旧版“感谢浏览”等样式仍能在源码找到，但没有作为本轮当前可见界面统计。

| 文字角色 | 字体 | 桌面：字号 / 字重 / 行高 | 移动：字号 / 字重 / 行高 | 字距；颜色 / opacity |
| --- | --- | --- | --- | --- |
| Product & / AIGC UI/UX | EN | 30 / 500 / 37.5 | 24 / 500 / 30 | normal；深色 #f4f6ff，浅色 #111d46 |
| 结束页英文 Display | 原生 DIN 优先 | 78.54 / 900 / 90.32 | 23.4 / 900 / 26.91 | normal；白 / #111d46 |
| 查看联系方式 CTA | ZH | 30 / 500 / 42 | 23 / 500 / 32.2 | normal；#f5f7fc / #111d46 |
| 弹窗 LET'S CONNECT. | 原生 DIN 优先 | 64 / 900 / 66.56 | 33.93 / 900 / 37.32 | -.96px → -.51px（-.015em）；#f5f7fb |
| 弹窗介绍 | MIX | 17 / 400 / 25.5 | 14 / 400 / 22.4 | normal；#c1c9d7 |
| 扫码添加微信 | MIX | 17 / 500 / 25.5 | 15 / 500 / 22.5 | normal；#f5f7fb |
| 二维码辅助说明 | MIX | 14 / 400 / 21 | 12 / 400 / 18 | normal；#aeb8ca |
| 联系方式字段 label | MIX | 14 / 400 / 21 | 12 / 400 / 18 | normal；#aeb8ca |
| 微信 / 邮箱 / 电话内容 | EN | 20 / 400 / 27 | 16 / 400 / 21.6 | normal；#f0f3f9 |
| 所在城市内容 | MIX | 20 / 400 / 27 | 16 / 400 / 21.6 | normal；#f0f3f9 |
| 复制 / 已复制 | ZH | 13 / 500 / 19.5 | 12 / 500 / 18 | normal；#dde6f7 |
| 下载简历 / 下载作品集 PDF | MIX | 21 / 500 / 29.4 | 14 / 500 / 19.6 | normal；#f0f4fc |
| 状态通知槽 | MIX | 12 / 400 / 18 | 同桌面 | normal；#c7dcff；没有消息时为空，不算可见正文 |

弹窗这些颜色多为不透明的不同灰蓝色，而非统一 rgba alpha。不能把 #aeb8ca 错读为“opacity 很低”；实际 opacity 为 1。复制反馈实际点击检查，字规格与“复制”相同。

### A8. 四个项目详情页

实际路径：

| 项目 | 路径 | 当前组件特点 |
| --- | --- | --- |
| CanvasFlow AI | `/projects/canvasflow-art-preview/` | EN 标题、主站运行时外壳；完整项目区域为占位页 |
| AIGC 设计提效项目 | `/projects/aigc-design-efficiency/` | MIX 标题、静态详情外壳、连续图片阅读 |
| 飞猪乐乐跑运营活动 | `/projects/fliggy-lele-run/` | 共用首屏；阅读区另有专用覆盖样式 |
| 乐心健康 APP | `/projects/lexin-health-app/` | MIX 标题、静态详情外壳、连续图片阅读 |

#### 共用首屏

| 文字角色 | 字体 | 桌面：字号 / 字重 / 行高 | 移动：字号 / 字重 / 行高 | 字距；颜色 / opacity |
| --- | --- | --- | --- | --- |
| CanvasFlow AI H1 | EN | 72 / 700 / 80.64 | 35.1 / 700 / 39.31 | -2.52px → -1.23px（-.035em）；白 |
| 其余三个 H1 | MIX | 72 / **650** / 80.64 | 35.1 / 650 / 39.31 | -1.8px → -.88px（-.025em）；#f3f5f8 |
| 项目副标题（Canvas 无此行） | MIX | 16 / 400 / 24.8 | 14 / 400 / 21.7 | normal；当前文字色 α.62 |
| 时间 / 角色 / 定位 label | MIX | 13 / 400 / 19.5 | 12 / 400 / 18 | normal；当前文字色 α.62 |
| 元信息 value | MIX | 17 / 500 / 25.5 | 14 / 500 / 21 | normal；当前文字色 α1 |
| 能力 Tag | MIX | 12 / **400** / 16.8 | 11 / 400 / 15.4 | normal；当前文字色 α1 |
| 四张信息卡的小标题 | ZH | 16 / 600 / 24 | 14 / 600 / 21 | normal；当前文字色 α.82 |
| 信息卡正文 | MIX | 16 / 400 / 28 | 14 / 400 / 24.5 | normal；当前文字色 α.92 |
| 向下浏览完整项目 | MIX | 12 / 400 / 18 | 11 / 400 / 16.5 | normal；当前文字色 α.62 |

#### 详情页外壳、连续阅读与 Footer 差异

| 文字角色 | CanvasFlow | AIGC / 乐心 | 飞猪 | 移动差异 |
| --- | --- | --- | --- | --- |
| 品牌，EN | 15 / 700 / 22.5，字距 normal | 17 / 700 / 17，字距 .17px | 同 AIGC | Canvas 12/700/18；其他 12/700/12、.12px |
| 返回精选项目 | MIX 15 / 500 / 22.5 | ZH 14 / 500 / 21 | 同 AIGC | Canvas 12/500/18；其他 11/500/16.5 |
| 完整项目标题 | MIX 24 / 600 / 36 | ZH 24 / 600 / 36 | 同 AIGC | Canvas 22/600/33；其他 21/600/31.5 |
| PROJECT / IN DETAIL | 无独立同规格常驻行 | EN 10 / 400 / normal，字距 1.8px，#9ba8bc | 同 AIGC | 同桌面 |
| 阅读说明 / PDF caption | 占位说明见下一行 | MIX 12 / 400 / normal，#9ba8bc | 同 AIGC | 同桌面 |
| 占位“项目内容待接入” | MIX 18 / 400 / 27，α.58 | 不适用 | 不适用 | 16 / 400 / 24；占位页码 EN 12/400/18、α.58 |
| 下载项目 PDF | 当前占位区域不提供相同真实下载 | MIX 12 / 400 / normal | **MIX 20 / 400 / normal** | AIGC/乐心 11；飞猪 **15**，行高均 normal |
| Footer 返回 / 下一项目名 | 未挂相同三页 Footer | MIX 13 / 400或500 / normal | MIX 14 / 400或500 / 21 | AIGC/乐心 12、normal；飞猪12/18 |
| Footer 辅助 label | 不适用 | MIX 11 / 400 / normal | MIX 11–12 / 400 / 16.5–18 | 基本保留 11；飞猪存在选择器覆盖 |
| 跳至正文 skip link | 外壳不同 | MIX 16 / 400 / normal，焦点时显示 | 同 AIGC | 同桌面 |

同一个详情页首屏组件已经基本统一；差异主要集中在字体语言/650 字重，以及外壳、阅读区和 Footer 的局部覆盖。[portfolio-project-hero.css](portfolio-project-hero.css) 在原详情样式之后加载，审查采用其最终 computed 结果，没有把已被覆盖的旧双栏档案样式当成当前界面。

### A9. 实际截图与视觉检查范围

已查看首页、About 桌面/移动、精选项目移动、工作经历展开、Contact 弹窗、四个详情页桌面、四个详情页移动、移动菜单与隧道标题。CanvasFlow 移动初次截图曾截到加载条，已等待可操作并补拍，以下引用有效截图。

- [首页桌面](output/playwright/typography-desktop-home.png)、[About 桌面](output/playwright/typography-desktop-about.png)、[About 移动](output/playwright/typography-mobile-about.png)。
- [精选项目移动](output/playwright/typography-mobile-works.png)、[移动菜单](output/playwright/typography-mobile-menu-open.png)、[隧道标题](output/playwright/typography-desktop-tunnel-glimpse.png)。
- [CanvasFlow 桌面](output/playwright/typography-desktop-detail-canvasflow-art-preview.png)、[AIGC 桌面](output/playwright/typography-desktop-detail-aigc-design-efficiency.png)、[飞猪桌面](output/playwright/typography-desktop-detail-fliggy-lele-run.png)、[乐心桌面](output/playwright/typography-desktop-detail-lexin-health-app.png)。
- [CanvasFlow 移动加载后](output/playwright/typography-mobile-canvasflow-verified.png)、[Contact 弹窗移动](output/playwright/typography-mobile-connect.png)。

本轮截图用于文字层级与真实显示核查，不对所有滚动过渡、所有宽度和动态背景逐像素验收。未使用截图造成的某一时刻字符透明度推导永久文字颜色。

## B. 当前存在的问题

### B1. 优先处理的问题与定位

| 优先级 | 问题与实际证据 | 涉及文件 / 影响范围 | 建议及修改风险 |
| --- | --- | --- | --- |
| 高 | **字体语言存在遗漏**：精选项目英文 CanvasFlow AI 使用 PingFang；移动菜单中文落到 Noto Sans SC；Contact 本地署名的数字走 ZH 栈 | [portfolio-works.css](portfolio-works.css)、[portfolio-fonts.css](portfolio-fonts.css)、[portfolio-navigation.css](portfolio-navigation.css)、[tools/build-navigation.mjs](tools/build-navigation.mjs)、[portfolio-contact.css](portfolio-contact.css)；标题、菜单、署名 | 修正相应语言栈，保持字号/几何不变。字体宽度仍可能改变换行，需截图复核；不要只改全站默认字体 |
| 高 | **声明字重与真实字体面不一致**：中文标题600命中Medium，About姓名600命中Semibold；详情标题650中文Medium/英文Bold | portfolio-fonts.css、portfolio-about.css、portfolio-experience.css、portfolio-project-hero.css | 先明确中文500/600字体面路径，再减少650。风险为中文标题视觉变粗、宽度改变；先局部样例，不批量替换 |
| 高 | **移动重要操作小于辅助标签**：查看项目11px，返回详情列表11px；首页能力Tag13px、About技能16px却更大 | portfolio-works.css、portfolio-projects.css、portfolio-project-hero.css | 阅读入口/返回操作提高至至少14px文字层级；修改需复核窄栏、点击区域与换行，不能只增加字号 |
| 中 | **Tag 三套以上规格**：工作经历14/500/21→12；精选项目13/500/18不缩小；详情12/400/16.8→11；About技能16/500/24 | portfolio-experience.css、portfolio-works.css、portfolio-project-hero.css、portfolio-about.css | 前三者共用 Label/Tag 规范；About圆形图标下的能力名称保留独立 Skill Label。风险较低，长标签换行需检查 |
| 中 | **同一“下载项目 PDF”被飞猪覆盖为20px**，AIGC/乐心12px；移动15对11 | [portfolio-fliggy-reading.css](portfolio-fliggy-reading.css)、portfolio-projects.css | 统一阅读操作的文本 Token，保留飞猪页面结构；风险低，检查按钮宽度 |
| 中 | **详情页外壳重复规格**：品牌15对17、行高22.5对17；返回15对14；移动正文阅读标题22对21 | portfolio-canvasflow.css、portfolio-projects.css、tools/project-detail-component.mjs、tools/project-detail-hero.mjs | 用共同 Header/Footer文字 Token覆盖这几处，避免重做路由或外壳；风险低至中 |
| 中 | **一级模块标题缺少明确角色**：工作经历34/600；精选项目18/400，移动26对12 | portfolio-experience.css、portfolio-works.css | 先决定精选项目是 Section Heading 还是克制的 Section Label。不能因二者都是h2就自动改同字号；会影响现有构图 |
| 中 | **相邻微小规格可以合并**：About学校32.10/43.33与方向32.78/44.25，移动却同23/31.05；元信息19、20、21分散 | portfolio-about.css、portfolio-experience.css、portfolio-contact.css | About两行共用32/500/1.35；其他元信息按角色收敛为14/16/20，避免逐像素新Token。About风险低，元信息风险中 |
| 中 | **正文分组不清晰**：经验20/33；About22.20/36.62；精选简介23.05/40.34；详情16/28；移动16、17、15、14 | 相关各模块CSS | 前三者可归入大正文/介绍特例，详情是阅读正文；建议角色化而非全部设16。增大移动详情正文可能改变首屏高度 |
| 中 | **行高依赖不同外壳**：数字切换、PDF下载、Footer仍有normal；同类文字其他地方显式1.4/1.5 | portfolio-works.css、portfolio-projects.css、portfolio-fliggy-reading.css | 公共 Label/Button/Footer明确行高，保留Display特殊行距；风险低但要复核垂直居中 |
| 中 | **文字减弱方式分散**：.50/.54/.56/.58/.62/.66/.72/.74/.82/.90/.92、不同灰蓝实色、父级opacity并存 | 各模块CSS | 归类为主文/次文/辅助/禁用或非激活状态；保留About翻译和工作经历状态例外，不把所有alpha改一样 |
| 低 | **展示序号两种风格**：工作经历68/700/68，精选133.17/400/109.2且负字距 | portfolio-experience.css、portfolio-works.css | 记录为 Index Display 两个组件变体；若希望同一视觉权重，单独审核字重与间距，不能直接统一大小 |
| 低 | **装饰辅助文过小**：滚动提示8px、移动英文眉题8–9px、辅助索引9–10px | portfolio-works.css、portfolio-experience.css | 非核心装饰可保留明确例外；涉及时间/数量/操作的信息提升至12，不把8px扩散到公共Caption |

### B2. 重复、冲突与“可以合并”清单

1. **基础尺寸过密**：8、9、10、11、12、13、14、15、16、17、18、19、20、21、22、23、24均有采样使用。其中12/13/14、15/16/17、19/20/21在同类元信息和操作中最值得收敛。不是所有数字都必须删除：13px Tag、12px Caption、14px紧凑操作有独立角色。
2. **流体计算值不是人为新字号**：17.07、22.20、23.05、32.01、38.93等来自vw/clamp。在1707px宽度看到小数合理；规范应该统一表达式或角色，不能为了消除小数把每个值建立一个Token。
3. **字重梯度混用**：400/500/600/650/700/900共存。400/500/700和特殊Display900合理；650缺少明确语义且没有真实650字体面。中文600需要先解决字体别名的覆盖问题。
4. **同类Tag字重不同**：详情Tag400比精选/经历500更轻，字号又更小；因此即使材料、圆角接近，也像另一套文字系统。About技能是图标组标题，可以比Tag大，不应强行缩成胶囊规格。
5. **公共品牌和返回按钮应该是低风险合并目标**，不需要为了统一它们先重构页面路由。
6. **颜色声明与opacity没有统一职责**：详情用currentColor百分比，Contact用灰蓝实色，经历同时用条目opacity与颜色alpha。建议通过语义Token统一来源；交互状态与文本本身层级分别处理。
7. **旧选择器会干扰仅搜索CSS的结论**：Contact旧文案/旧卡片、详情旧双栏样式还在文件中。上述表以实际DOM最终样式为准；后续重构需确认使用关系，但这次不清理死样式。
8. **中英文层级不能机械等值**：About中文主文与英文翻译的不同大小/透明度是合理主次；移动菜单中文回退Noto和英文项目名走PingFang则是明确的语言规范遗漏。两类不能混为一谈。

### B3. 目前应保留的稳定部分

- DIN英文/数字、PingFang中文的基础方向已落地；Windows本机并非全部用fallback。
- 四个详情首屏信息卡共用16/28正文、16/24小标题，主体规格较稳定。
- 精选项目四项Tag文字已一致，About循环标签文字也一致。
- 隧道三阶段字号和行高一致、明确换行；不需要重做动画。
- About英文次级表现、工作经历非激活减弱、Contact Black展示字应作为正式例外记录。

## C. Typography V1 建议方案

### C1. 基础原则

**目标是收敛角色与来源，保留当前深色科技感、页面构图及展示字特征。** 以下都是待审核方案，不代表已修改。

- 英文及数字：DIN；中文：PingFang SC；混排使用DIN在前、PingFang在后的MIX栈。纯中文菜单明确使用ZH，不依赖浏览器自行选汉字字体。
- 常规字重：正文400，导航/Tag/元信息强调500，中文重要标题600，英文重要标题700。900仅用于现有Contact Display。取消不具备明确语义的650。
- 中文600需接入可用的Semibold本地字体面或明确原生字体路径，再做视觉验收；没有合法Webfont时继续系统字体和fallback，不擅自下载或打包。
- `font-size`、`line-height`、`font-weight`、`letter-spacing`与色阶分开Token化；按角色套用，禁止用一个全局`h2/p/button`选择器吞掉组件特例。
- 移动布局保持文字能读、操作能找；不要把主要入口缩到11px来维持原空间。

### C2. 通用层级建议

字体栏“MIX”表示英文DIN、中文PingFang按字形分配；纯英文用EN、纯中文用ZH。

| 层级 | 字体 / 字重 | 桌面字号 / 行高 | 移动字号 / 行高 | 字距 | 建议场景与色阶 |
| --- | --- | --- | --- | --- | --- |
| Display | EN700；Contact专用900 | **沿用组件流体规格** | 沿用各组件专用范围 | 各组件单独定义 | Home、隧道、Contact，主色；见C3 |
| H1 / Project Title | MIX：EN700、ZH600 | clamp(44px,4.25vw,72px) / 1.12 | clamp(32px,9vw,46px) / 1.12 | 英文-.025em，中文normal | 项目详情一级标题；主色。长中文标题需单独换行验证 |
| H2 / Section Heading | MIX：EN700、ZH600 | 32 / 40 | 26 / 32.5 | normal | 普通模块/阅读章节标题；主色 |
| H3 / Content Heading | MIX：EN500、ZH500或600 | 20 / 28 | 18 / 25.2 | normal | 次级内容标题；主色 |
| Body Large | MIX400；简介强调可500 | 20 / 33 | 17 / 28.05 | normal | 经历正文、较重要介绍；次文至主文 |
| Body | MIX400 | 16 / 28 | 16 / 28 | normal | 长文阅读、项目说明；次文。紧凑信息卡保留14/24.5的明确变体 |
| Small | MIX400 | 14 / 21 | 14 / 21 | normal | 元信息、短说明、Footer正文；次文 |
| Caption | MIX400 | 12 / 18 | 12 / 18 | normal | 日期label、数量、阅读提示；辅助色 |
| Label / Tag | MIX500 | 13 / 18 | 13 / 18 | normal | 能力Tag、经历项目Tag、详情Tag；主色约90%。几何统一另用已有规范 |
| Button / Standard | MIX500 | 16 / 24 | 14 / 21 | normal | 下载、查看、返回等主要操作；主色 |
| Button / Compact | MIX500 | 14 / 21 | 14 / 21 | normal | 复制、行内操作；主色，不低于公共Caption |
| Navigation | ZH500、EN500 | 16 / 24 | 16 / 24 | normal | 顶部及小型导航；移动全屏菜单是C3特例 |
| Brand | EN700 | 16 / 24 | 14 / 21 | normal | 主站和详情页品牌共用；是否保留详情移动12px需单独审核 |
| Section Label / Eyebrow | MIX400或500 | 14 / 21 | 12 / 18 | 中文normal；全大写英文 .12em | 精选项目若继续采用克制的小标题，归此角色；不强制升为H2 |

H1中文和英文的字重分别控制，不建议让单个650声明同时作用于两套非可变字体。Body移动16px相对现有详情14px是建议方向；在紧凑首屏信息卡中先保留14px变体，避免一次性破坏信息密度。

### C3. 允许保留的组件特例

| 组件特例 | V1建议 | 保留原因 / 验收要求 |
| --- | --- | --- |
| 首页Display | DIN700，当前桌面85.37、移动28.08，行高1 | 与3D主视觉构图相关；保留明确三行，验证更窄移动宽度 |
| 隧道Display | DIN700，当前桌面116.10、移动28.08，行高1.15 | 滚动叙事舞台标题；保持三阶段同规格和现有换行 |
| Contact结束Display | DIN Black900，当前78.54/23.4，行高1.15 | 已有粗体识别性，不能按普通H1降低权重 |
| Contact弹窗Display | DIN Black900，64/33.93；桌面1.04、移动1.1；-.015em | 弹窗独立构图；保持，不与结束页统一大小 |
| Contact“查看联系方式” | ZH500，30/23，行高1.4 | 展示级主CTA，独立于常规Button Token |
| About姓名 | ZH600，42/32，行高1.2 | 中文个人名展示层级；保留真实Semibold |
| About学校 / 设计方向 | MIX500，**统一桌面32 / 移动23**，行高1.35 | 同层级合并，不影响姓名和介绍 |
| About双语介绍 | 中文约22/17、英文约17/15；保留现有行高1.65/1.7及英文次级色 | 双语主次已明确；不为了统一让翻译抢权重 |
| About Skill Label | MIX500，16/24，两端一致，主色90% | 图标组名称而非信息胶囊，保持现有统一结果 |
| 工作经历公司名 | ZH500，桌面约39/1.35、移动21/1.5 | 横向编号结构和一屏三段依赖其尺寸；不套详情H1 |
| Index Display | DIN，经历68/38、700；精选133/64、400 | 大小与构图耦合；先记录两变体，是否统一字重另审 |
| 移动全屏菜单 | MIX或分别EN/ZH，约39/58.5、500建议；尺寸仍可10svw加边界 | 可以大于常规Navigation；先修字体，字重调整需截图，不强制降为16 |
| 原站极小装饰眉题 | 若保留8–10px，列为Decoration而非Caption | 只能用于不承担主要信息的装饰；日期与交互入口不能引用 |

### C4. 字距、颜色与状态建议

**字距**：中文正文/按钮/Tag/导航统一normal；常规英文正文normal；英文大标题最多保留约-.025em的组件需要。英文全大写眉题建议.12em；现经历WORK EXPERIENCE桌面.44em远高于移动.22em，如要收敛需单独视觉比较。序号-.06em、署名.04em、Contact弹窗-.015em作为命名例外，不传播到正文。

**文字色阶建议**，复用现有主色与灰蓝氛围，不重新设计配色：

| 语义角色 | 默认相对主文字色 | 使用说明 |
| --- | --- | --- |
| Primary | 100%（已有详情正文92%可归为Reading Primary） | 标题、操作、关键联系方式 |
| Secondary | 74% | 正文介绍、次级元信息 |
| Muted | 60% | label、Caption、非关键说明 |
| Translation | 50% | About英文译文专用，不泛化为正文默认 |
| Label Strong | 90% | Tag、技能名称 |
| Row State | 保留现有 .82 / .64 / 1 | 工作经历整体状态单独Token；避免关键元信息再次过度乘alpha |

Contact弹窗可继续使用当前灰蓝实色，但应映射到相同语义角色，不需要把它们全部替换成透明白。深/浅主题分别复用已有currentColor；动态背景上的可读性需截图检查，不能仅凭alpha判断通过。深色文本阴影、浮动指示器、激活蓝色属于组件状态，不作为全站正文色。

### C5. 推荐实施顺序、影响与风险

**阶段1：字体事实与低风险一致性。** 修正精选英文项目名和移动菜单的语言栈；确认PingFang600真实面；收敛650；对齐四详情的品牌/返回/阅读下载文字。先输出局部截图，检查字体宽度导致的换行。主要涉及fonts、navigation、works和详情外壳CSS，不需要调整路由、3D或背景。

**阶段2：公共文字Token。** 统一信息Tag、Compact Button、Footer/Caption行高和主次色角色；保持About技能标签特例。主要涉及experience/works/project-hero/contact/projects/fliggy-reading各组件文字声明。必须同时检查1707×932与390×844，并补375px、768px、1024px附近断点；标签长文、返回按钮、复制反馈、浅色状态都复核。

**阶段3：需视觉审核的层级优化。** 决定精选项目小标题的角色；合并About学校/方向；提升移动主要入口、日期等必要信息的可读尺度。Body Large和移动详情正文变更可能改变首屏高度与换行，应分页面审核，不能一次性全站字号替换。

**阶段4：特殊展示文字。** 当前Display及序号规格先保留，仅在用户明确希望调整时单独比较。隧道逐字动画、主站3D、Contact动画与布局不属于字体重构前置事项。

后续实现需同步可维护源码与当前生成产物：如`tools/*-runtime.js`及构建脚本和`_next/static/chunks/*`、静态详情HTML存在生成关系，不能只改临时浏览器样式或一个压缩产物。执行时先核对项目scripts，再构建并diff；**本轮没有运行会改写产物的build**。

### C6. 本轮结论

全站已有可延续的字体方向和Display特征，主要问题集中在**少量语言栈遗漏、真实字重面路径、公共Tag/操作/详情外壳多套规格，以及移动辅助和操作层级**。建议优先收敛这些公共角色，不以统一为理由重做现有页面构图。

本轮交付为本报告、computed清单、字体命中证据和截图。审查前后234个已有源码/资源文件的SHA-256一致，报告中的本地文件链接全部检查存在。代码、资源、页面内容与部署均未修改；Typography V1等待用户审核后再分阶段实施。
