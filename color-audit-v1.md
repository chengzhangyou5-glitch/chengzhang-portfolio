# Color System Audit V1

> 项目：`C:\Users\31954\Documents\chengzhang-portfolio-prototype`
> 日期：2026-10-06
> 状态：只读审查及建议，**尚未实施 Color 重构**。

## 审查结论

网站已经具备明确的视觉基础：蓝黑内容背景、深蓝 3D 场景、暖白浅色主题、灰蓝玻璃、细网格和像素装饰。建议保留这些基础，建立可复用的颜色角色和材质配方。

当前最需要处理的是：

1. **主题覆盖不完整**：首页及 CanvasFlow 支持主题继承，另外三个详情页固定深色。从浅色首页进入它们，背景和文字立即切换回深色。
2. **玻璃组件的配方分散**：About 圆形技能、工作经历项目 Tag、精选项目 Tag 已基本一致；详情页 Tag、设置弹窗、Contact 内部操作另外定义了相近配方。
3. **文字和描边的角色不明确**：可见组件存在 `.54 / .56 / .58 / .60 / .62 / .66 / .72 / .74 / .82 / .90 / .92` 等数值，历史详情规则还有 `.78/.94`。一部分服务于明确层级，一部分源于局部迭代。不能全部合成一种透明度。
4. **浅色材质映射不完整**：设置弹窗改了文字，却保留深色半透明底；精选项目封面光标在浅色下混用了浅色 Tag 渐变和深色底衬。
5. **状态需要独立规范**：焦点颜色有多套；复制完成状态与 Hover 存在覆盖关系；下载占位按钮并非 Disabled，没有真实禁用状态可供审查。

推荐先建立公共角色和 Tag 配方，再处理设置及公共操作，之后补齐静态详情页的主题继承。首页 3D、隧道、照片、项目原图和 QR 保留各自的视觉规则。

---

## 0. 方法、范围与证据

### 0.1 实际检查方法

- 运行当前主项目预览：`http://127.0.0.1:8767/?feedback=off`。
- 使用 Chrome 实际渲染，采集 **1707×932**、**390×844** 两种视口。移动端是浏览器模拟视口，不是手机真机测试。
- 通过设置按钮实际切换深浅主题，实际展开经历、切换项目、打开菜单和联系弹窗，检查 Hover、Selected、复制反馈及键盘焦点。
- 读取 `getComputedStyle()`，记录颜色、渐变、四边描边、阴影、文字阴影、`opacity`、祖先透明度、`filter`、`backdrop-filter`、混合模式、SVG fill/stroke 与伪元素。
- 对照 CSS、运行时组件、主题 Provider 和背景渲染代码，区分有效样式、动画中间值和未使用规则。
- 应用内浏览器连接因运行时错误不可用，本次使用此前已授权的 Playwright / Chrome 方式。没有改动页面样式来制造检查状态。

本次保存 **109 组页面/状态采样、4772 条元素样式记录、76 张原始截图**。这些元素记录包含重复组件、非当前视口元素及动画状态，不等于 4772 种颜色。源码清单记录了 **326 条含颜色表达式的 CSS 行**，包含历史规则，也不等于 326 种有效颜色。

### 0.2 覆盖与健康度

| 步骤 | 检查范围 | 实际检查 | 健康度 |
|---|---|---|---|
| 01 | 首页、全局文字、网格、背景 | 桌面/移动、Dark/Light、CSS 与 WebGL 源码 | 视觉基础明确；背景需按渲染层解释 |
| 02 | 工作经历、精选项目、About | 两主题、两视口、展开/未展开、四项目、Tag/Hover | Tag 已接近统一；文字 alpha 和边线仍分散 |
| 03 | Contact、联系弹窗、设置 | 两主题、两视口、打开、Hover、复制反馈、焦点 | Contact 可保留深色特例；设置浅色配方不完整 |
| 04 | 四详情页、阅读区、Footer | 四路由桌面/移动；CanvasFlow 双主题；另外三页从浅色入口验证 | 三个静态详情页有主题覆盖缺口 |
| 05 | 公共导航、移动菜单及状态 | 双主题移动菜单；公共操作、Selected、Focus、占位下载 | 菜单映射清楚；焦点/反馈规则需要收敛 |

### 0.3 证据入口

- [实际截图浏览页](output/playwright/color-audit-v1/screenshots.html)
- [主页面 computed styles](output/playwright/color-audit-v1/main-computed.json)
- [四详情页 computed styles](output/playwright/color-audit-v1/details-computed.json)
- [补充状态 computed styles](output/playwright/color-audit-v1/extra-computed.json)
- [导航及移动菜单外壳 computed styles](output/playwright/color-audit-v1/public-computed.json)
- [源码颜色清单，含文件及行号](output/playwright/color-audit-v1/source-color-inventory.json)
- [采样清单](output/playwright/color-audit-v1/manifest.json)
- [源码未修改验证](output/playwright/color-audit-v1/source-verification.json)

JSON 中每组都有 `name / url / viewport / theme / selector / inViewport / effectiveOpacity`。阅读时先确定主题和状态，再查看对应 selector。边框颜色只有在实际存在边框宽度时才构成可见描边；浏览器给普通文字返回的默认 `borderColor` 不算设计色。

**只读校验**：审查前的 231 个已有文件 SHA-256 校验未发现改变。新增内容仅为报告和 `output/playwright/color-audit-v1/` 审查产物；没有运行生成页面的 build、重构或部署。

---

## A. 当前颜色使用现状

### A1. 全局基础及背景

| 角色 | Dark 实际值 | Light 实际值 | 来源 / 说明 |
|---|---|---|---|
| 文档背景 | `#0F1111` | `#FBFAF4` | 原始全局 CSS，body computed 验证 |
| Elevated 基础 | `#191B1B` | `#EFEDE7` | `--background-elevated`；移动菜单呈现此层级 |
| 主文字通道 | `--label:255,255,255` | `--label:0,0,0` | 大多数主页面继承纯白/纯黑 |
| 次文字原始通道 | `--label-d:230,232,232` | `--label-d:54,54,48` | 旧 `--label-2/3/4` 的基色 |
| 旧次文字阶 | `rgba(230,232,232,.60/.32/.16)` | `rgba(54,54,48,.60/.32/.18)` | 与后来局部 `rgba(var(--label),…)` 并存 |
| 旧细线 | `rgba(230,232,232,.08)` | `rgba(54,54,48,.10)` | `--line`；不是所有新版组件使用它 |
| 文字选区 | `#C0FE04`，黑字 | 同左 | 浏览器可返回等价 Lab 表达式 |
| 九宫格源图 | 白线 `.10`，白色交点 `.40` | 同一源图经 difference 合成 | 背景渲染层的装饰规则，不能直接当 UI divider |

**文档背景不等于截图最终背景。** 首页与 Contact 的深蓝，以及浅色中的奶白/浅蓝云状效果，由 WebGL 输出、材质和合成生成。About、工作经历与精选项目又叠加像素遮罩及背景场景。body computed 的 `#0F1111` 无法单独描述这些画面。

相关代码：

- `_next/static/chunks/635eb04122aa774f.css`：原始基础主题、selection、背景和 label 通道。
- `_next/static/chunks/7758f29a8aeb1c60.js`：场景、shader 与背景输出；像素遮罩基色 `#0F1111 / #FBFAF4`。
- `tools/background-grid-source.js`：网格源图白线 `.10`、交点 `.40`。
- `tools/background-grid-runtime.js`：网格进入背景 pass；shader 在 sRGB 中做 difference，再回到渲染工作空间。
- `portfolio-canvasflow.css`：详情场景 canvas 另设 `.12` 透明度，并有独立 DOM grid 的 difference 路径。
- `portfolio-projects.css`：三个静态详情页固定底色与静态像素。

因此“统一背景”应统一背景角色、主题数据及合成边界，不能简单把所有 `background` 改成同一 HEX。也不应把动态深蓝场景改成普通卡片底色。

### A2. 主页面文字与透明度

下表 `label@x` 表示 Dark 白色 / Light 黑色通道的颜色 alpha，不是元素整体 opacity。

| 页面 / 组件 | 实际使用 | 判断 |
|---|---|---|
| 首页 WELCOME、主导航、品牌及介绍 | 主通道 100% | 展示文字与背景需要高对比；Display 保留 |
| About 姓名 / 学校 / 方向 | 主通道 100% | 已有明确视觉层级，颜色本身统一 |
| About 两段中文介绍 | `label@.74` | 较弱正文，适合归为 Secondary |
| About Skill Label | `label@.90` | 标签文字，比正文更醒目 |
| 工作经历标题 / 公司 / 正文 | 主通道；trigger 整体 `.82 / .64 / 1` | 分组状态是有意义的特例 |
| 经历说明标题、时间、eyebrow | `label@.66` | 辅助层级 |
| 经历未激活大序号 | `label@.72` 再叠 trigger opacity | 需要看最终合成，不可只看 `.72` |
| 精选项目标题、项目名、大序号、操作 | 主通道 100% | 主信息 |
| 精选项目简介 | 桌面 `label@.92`；移动呈现随媒体规则变化 | 可归为正文，当前桌面较重 |
| 精选项目时间值 | `label@.72` | 和同页时间标签层级不同 |
| 精选项目时间标签、总数、未选索引 | 桌面 `.54`，基础/部分移动 `.56` | 非必要近似规格候选 |
| 精选项目 Tag | `label@.90` | 与经历 Tag、Skill Label 接近 |
| Contact Display | Dark `#FFFFFF` / Light `#111D46` | 应保留 Display 例外 |
| Contact CTA | Dark `#F5F7FC` / Light `#111D46` | 强操作文字，与普通按钮有层级区别 |
| Contact 职业信息 | Dark `#F4F6FF` / Light `#111D46` | 另有局部 ink 通道 |
| 底部坐标 / 时间 / 署名 | 主通道或局部 Contact ink | 背景上的固定信息，不能直接当低对比 Disabled |

**实际透明度合成例子**：工作经历全部收起时，序号 `.72 × .82 ≈ .5904`，日期 `.66 × .82 ≈ .5412`。展开 02 后，01/03 公司文字整体 `.64`，未激活序号约 `.72 × .64 ≈ .4608`。未激活日期有 `color:inherit` 状态覆盖，因此并非 `.66 × .64`。报告建议保留 `.82 / .64 / 1` 状态，不把它当作重复色值删除。

About 英文翻译已经在最新主项目中移除。`--about-english` 和相关旧规则仍能在源码看到，但不属于当前可见文字，不能据此恢复或调整英文。

### A3. Tag / Chip / Skill 的现有材质

#### 已经形成统一基础的一组

| 配方部分 | Dark | Light |
|---|---|---|
| 渐变上层 | `rgb(69 99 166 / 24%)` | `rgb(255 255 255 / 42%)` |
| 渐变下层 | `rgb(24 39 85 / 14%)` | `rgb(148 186 240 / 12%)` |
| 边框 | `rgb(168 196 255 / 28%)` | `rgb(75 110 172 / 28%)` |
| 内高光 | `rgb(217 232 255 / 25%)` | `rgb(255 255 255 / 80%)` |
| Blur | `8px` | `8px` |
| 文本 | 白 `.90` | 黑 `.90` |
| 技能 / 标签箭头图标 | `#B6D2FF` | `#4268A6` |

使用组件：`.about-skill-orb`、`.experience-project-tag`、`.portfolio-works .works-tags li`。

区别主要是圆形/胶囊几何、是否有外阴影、是否可操作。这些区别可以保留，不应为了统一颜色改变尺寸、圆角和排版。

经历关联 Tag 的 Hover 实测：文字升为主通道 100%，边框变为图标色，外阴影 alpha 从 `.10` 增至 `.16`；底部渐变不变。精选项目能力 Tag 是信息标签，不需要为了“统一 Hover”伪装成按钮。

#### 详情页另有一组

当前四页真正挂载的是 **`.project-overview-tags li`**，不是旧 `.project-tags` 或 `.canvasflow-tags`。

| 项目详情 Tag | Dark / 固定深色 | Light（CanvasFlow 可实际进入） |
|---|---|---|
| 上 / 下渐变 alpha | `.20 / .12` | 白 `.42` / 浅蓝 `.12` |
| 边框 | 浅蓝 `.26` | 灰蓝 `.28` |
| 内高光 | 浅蓝 `.12` | 白 `.65` |
| `backdrop-filter` | `none` | `none` |
| 文字 | 继承父级 100% | 继承父级 100% |

它与主页面 Tag 非完全一致：数值更弱、没有 Blur，但文字更实。此差异没有明显内容语义，可优先统一配方，保留各自几何和 Typography Token。

### A4. Button / Link / Focus

| 组件 | Default | Hover / Focus 实际规则 |
|---|---|---|
| 精选项目“查看项目”文字入口 | 主通道；桌面下划分隔线 `label@.60` | 保持文字入口；封面还存在独立跟随光标 |
| 封面光标 | `#F5F8FF`，Tag 渐变 + `rgb(12 22 48 / 48%)` 底衬，Blur 10 | 出现在原图上；Light 仍白字/深底，但渐变却跟随浅色 Tag |
| 静态详情 PDF 下载 | `#F3F5F8`；边线 `rgba(169,191,232,.19)` | Hover 字与边线 `#A8C4FF` |
| 静态详情 Footer / 返回 | `#F3F5F8` | Footer Hover `#A8C4FF`；返回箭头主要做位移 |
| CanvasFlow 返回 / 品牌 | 继承主题主色 | Hover `opacity:.75` |
| Contact CTA | 三段灰蓝渐变，边框 `.48` / 底边 `.32`，Blur 18 + saturation 115% | Hover 明亮一档，边框 `.66`，阴影 `.18 → .22` |
| 联系弹窗复制 | `#DDE6F7`，两段渐变 `.12/.07`，边框 `.18` | Hover `.17` 填色 / `.32` 边框 |
| 复制完成 | `#C7DCFF`，蓝填色 `.18`、边框 `.38` | 实际状态记录见 `copy-rest-feedback` |
| 联系弹窗下载 | `#F0F4FC`；第一项渐变 `.34/.35`，第二项 `.21/.24` | Hover 填色 `.35` / 边框 `.48` |
| 设置行按钮 | 白填色 `.03`、白边框 `.10` | Hover 白填色 `.07`；Pressed badge 为蓝 `.12/.28` |

焦点规则目前分散：

- Contact 弹窗：`#BDD5FC` 实测 2px 实线，Dark/Light 都一样，因为面板始终深色。
- CanvasFlow 及共享 overview：`#93B7FF`。
- 静态详情公共链接：`#A8C4FF`。
- 设置：Dark `#BCC9DF` / Light `#2F4E7A`。
- 经历及部分链接：使用 `currentColor` 的虚线/实线。

选中态也不是一种蓝色：顶部导航是当前文字色细线，静止复查 `::after` opacity 为 `.9`；经历是分组透明度 + 蓝色序号/箭头；精选项目是索引文字强化；设置 badge 是浅蓝填色。这些行为可以保留，应统一的是颜色来源和状态优先级。滚动状态刚切换时伪元素会处于透明度过渡帧，不能把瞬时 0 当作缺失选中态。

### A5. 设置弹窗

`portfolio-settings.css` 中有局部变量，是一个较完整但主题映射不完整的组件。

| 属性 | Dark computed | Light computed |
|---|---|---|
| Panel 背景 | `rgba(22,23,25,.24)` | **同左** |
| Panel 边框 | 白 `.18` | 白 `.30` |
| 主文字 | `#F0F1F3` | `#172033` |
| 次文字 | `#B8BCC4` | `#34425A` |
| 强调 | `#B6D2FF` | `#2F4E7A` |
| 行底色 / Hover | 白 `.03 / .07` | **同左** |
| Blur / saturation | `24px / 110%` | 同左 |

实际截图中浅色设置面板偏灰暗，和 About/精选项目的浅玻璃不同。没有证据说明它必须改为不透明白卡；建议补齐 Light 配方的灰蓝描边、浅玻璃底和行状态，而非只增加整体 opacity。

### A6. Contact 联系弹窗

这是当前全站最强的阅读型玻璃面板。**它在两种主题中都使用同一深色配方**，不是“完全没有 Light 页面的可用弹窗”。实际 Light 背景下仍有清楚的白色文字和 QR。

| 层级 | 实际值 |
|---|---|
| 大面板渐变 | `rgb(43 50 66 / 73%) → rgb(17 23 37 / 72%) → rgb(20 28 46 / 75%)` |
| 顶 / 普通 / 底描边 | `rgb(232 240 254 / 55%)` / `rgb(215 227 248 / 32%)` / `rgb(176 196 230 / 24%)` |
| 内高光 / 外阴影 | 白 `.17` 内高光；深蓝黑 `.16 / .42` 外阴影 |
| Blur / saturation | `28px / 80%` |
| Backdrop | `rgb(3 7 18 / 22%)` + `blur(5px)` |
| 标题 / 强文字 | `#F5F7FB` |
| 说明 | `#C1C9D7` |
| 字段标签 / QR 辅助 | `#AEB8CA` |
| 字段值 | `#F0F3F9` |
| 字段图标 | `#D5DEEC` |
| 信息行 | 渐变 `.06 / .03`、边框 `.13`、内高光 `.04` |
| QR 纸面 | `#F4F2EB`，边框 `#E1E0DA`；不透明浅纸材质 |

移动端保持上述颜色，关闭按钮额外使用 `rgb(30 38 56 / 88%)`，利于按钮与内容区分。长面板可滚动，下载区并非始终出现在首个视口内；本次已检查对应元素样式和滚动后的截图，不把屏外内容误判为未实现。

### A7. 四个项目详情页

| 页面 | 背景 / 主题 | 主文字 | 卡片及阅读区 |
|---|---|---|---|
| CanvasFlow AI | 首页场景派生背景，读取主题偏好 | Dark 白 / Light 黑 | Overview 共享卡片；文档占位页当前使用 label `.03` 背景、`.12` 边线、文字 `.58` |
| AIGC 设计提效 | 固定 `#0F1111`；不读取主题 | `#F3F5F8` | 共享 Overview；原 PDF 图片连续阅读 |
| 飞猪乐乐跑 | 同上 | 同上 | 共享 Overview；额外跟随阅读光标为深色玻璃 |
| 乐心健康 APP | 同上 | 同上 | 共享 Overview；原 PDF 图片连续阅读 |

共享 `.project-overview-note`：`currentColor@.04` 背景、`@.14` 边框、Blur 8；小标题 `@.82`、正文 `@.92`、元信息 `@.62`。结构是共用的，但父级主色不同，最终颜色仍有差异。

三个静态页阅读区的辅助色为 **不透明 `#9BA8BC`**，与首屏 `currentColor@.62` 接近却不相同。阅读区分隔线是蓝色通道 `.19`，首屏卡片是文字通道 `.14`，全站旧细线又是另一套 `.08/.10`。

静态背景像素：`rgba(78,116,215,.19)`，8px 点阵，并使用两块区域 mask。CanvasFlow 的派生背景是动态场景并附带 `.12` canvas 透明度。两者即使 body HEX 相同，像素密度、网格可见程度、空间氛围仍不同；浅色 CanvasFlow 的网格比主页面更淡。

`tools/project-detail-client.js` 只处理网格尺寸和返回位置，没有读取 `localStorage.theme` 或 Theme Provider。实际从浅色入口进入三页，`html` 没有 `light` 状态，body 仍为深色。共享 CSS 中存在 `.light` Tag 分支，不代表这些静态页已经支持浅色。

### A8. 特殊视觉与历史遗留

| 类别 | 处理判断 |
|---|---|
| 3D Hello / Contact 主视觉、折射及彩色边缘 | 场景材质色，不应映射成 Button Accent |
| 隧道蓝紫青星轨、中央环形装置 | 独立场景调色与运动叙事，保留 |
| 像素、掉落贴纸、原始照片 | 图像/Shader 的颜色，不参与普通 UI 去重 |
| lime `#C0FE04`、字母扰动浅绿及浅色深绿 | 装饰/selection 色，保留，与“成功”状态分开 |
| QR 黑白与浅纸面、Contact 手绘装饰 | 保留原色，防止扫码质量和视觉性格下降 |
| 项目封面及 PDF 内容 | 保留原图；PDF 内颜色不属于网站控件 Token |
| 老 Contact 中文标题、四张底卡、旧 `.contact-copy` | 当前 DOM 未挂载，属于历史规则；不要混入有效组件清单 |
| 老 `.works-project-page`、`.project-archive`、`.project-tags`、`.canvasflow-note` | 部分旧版详情布局已由共享 Overview 替代；按 DOM 使用情况处理 |
| `--type-color-*` | 已定义基础语义，但大多数局部颜色没有接入，暂不能视为已完成统一 |
| Leva 调试色、色彩解析库中的 CSS 色名表、code syntax 色 | 不计为当前公共组件色板；不要扫描库代码后声称网站用了数百种蓝 |

---

## B. 当前存在的问题

### B1. 问题与修复优先级

| ID | 问题 / 证据 | 影响范围 | 优先级 | 修改风险 |
|---|---|---|---|---|
| C01 | 三个静态详情页忽略主页面浅色偏好；实测入口仍输出固定深色 | AIGC / 飞猪 / 乐心，桌面及移动 | 高 | 中：需主题启动逻辑及所有页面色系配套，不能只加 class |
| C02 | 同角色文字存在 `.54/.56/.58/.60/.62/.66` 等近似规格；主色又有纯白与多种偏白 | 公共说明、元信息、详情阅读说明 | 中高 | 低至中：继承和状态 opacity 会改变最终对比 |
| C03 | 主页面 Tag 配方相同却复制在三个文件；详情页 Tag 是弱化版本且无 Blur | Experience / Works / About / 四详情 | 高，易先做 | 低：仅提取/接入材质，不改几何和字体 |
| C04 | 设置 Light 只更换部分文字，面板/行仍使用深色底和白色状态层 | 设置弹窗，两种背景和移动 | 高 | 低至中：动态背景合成需实际审核 |
| C05 | Focus 使用 `#93B7FF/#BDD5FC/#A8C4FF/#BCC9DF/#2F4E7A` 等规则 | 公共操作、Tag、详情、设置 | 中高 | 低：保持现有线宽/位置，替换语义色源 |
| C06 | 复制成功与 Hover 都声明背景/边框，Hover 可覆盖成功配方 | Contact 复制按钮 | 中 | 低：不改复制功能，明确状态优先级即可 |
| C07 | 浅色封面光标混用 Light Tag 渐变 + 深底白字 | Works 封面跟随光标 | 中 | 低：明确独立的深色图像覆盖控件配方 |
| C08 | 文档底色一致但背景实现、透明度和像素分布不同 | CanvasFlow 与三个静态详情 | 中 | 中至高：涉及合成路径；单独阶段处理 |
| C09 | 导航在浅色首页仍继承深色的黑影 `.55/.30` | 主导航/品牌桌面与移动 | 中 | 低：主题化阴影；保留背景可读性 |
| C10 | 废弃局部变量与新规则同时保留，使颜色清单难以反映实际页面 | CSS 维护及后续实施 | 中 | 低至中：先建有效 selector 清单，再删除历史规则 |

### B2. 不应误判为问题的差异

- 工作经历 `.82 / .64 / 1` 是用户已确定的状态层级，不应取消。
- 静态能力 Tag、可交互项目 Tag、按钮可以共享蓝色材质基础，但不能共享完全相同的 Hover 行为。
- 强阅读弹窗应比 Tag 更有遮蔽能力。统一材质不等于统一透明度。
- Contact 的深色联系面板可以作为浅色页面中的“深色面板特例”保留；应明确作用域，而非强行反成白色。
- 图像上的跟随光标可以一直使用深底白字，保证跨图片可读性；问题是当前配方混合了两种主题，而非深底本身。
- 网格与分隔线不同：前者装饰整个场景，后者表达内容边界，不能合为同一透明度。

### B3. 状态和证据边界

**复制成功**：移动鼠标离开按钮后，实测 `data-copied=true` 为 `#C7DCFF`、背景 `rgba(90,128,196,.18)`、边框 `rgba(154,190,251,.38)`。鼠标停留时，Hover 可把背景/边框改成另一组值。文字和勾仍能表达成功，但建议将“成功 + Hover”视为独立状态组合。

**Disabled**：下载简历与作品集 PDF 当前资源为 `href:null`，点击展示“准备中”反馈，按钮并没有 `disabled`。工作经历项目 Tag 也保留 Hover，但暂未链接真实项目。这是现有占位行为，不能从灰蓝外观推断为 Disabled。本次未发现可代表全站禁用规范的实际控件样本，因此 Disabled 规范属于新增建议，不声称已通过现状验收。

**动态可读性**：像素层和照片会随着滚动/时间改变背景，半透明 UI 的 computed 值不是最终合成像素。移动深色工作经历的补充截图出现更强的蓝色背景，展示了同一组文字在动态背景下的压力。不能仅凭 CSS 对比度或单张截图宣布全站可读性合格；后续实施须在静止、滚动及背景高亮时分别检查。

---

## C. 推荐 Color V1 方案

### C1. 建议结构

采用三个层次，避免所有组件直接引用散落的 RGBA：

1. **基础颜色角色**：普通页面背景、前景、交互蓝、材质的蓝/灰通道。
2. **材质配方**：轻玻璃标签、操作控件、阅读面板；每种配方同时定义填色、边线、高光、阴影和 blur。
3. **组件状态**：Default / Hover / Pressed / Selected / Focus / Feedback / Disabled；引用上述角色，不再逐个生成新的相近蓝色。

场景与图像保留独立配置。先为现有颜色建立别名，再分阶段调整值；不要一次替换所有 HEX 和 opacity。

### C2. 普通 UI 的建议色阶

以下是**待审核建议值**，不是当前页面已经使用的值。选用已有色为主，保留蓝黑与暖白对照，新增少量文字阶。

| 角色 | Dark 建议 | Light 建议 | 场景 |
|---|---|---|---|
| Page Base | `#0F1111` | `#FBFAF4` | 文档基础，沿用 |
| Page Elevated | `#191B1B` | `#EFEDE7` | 纯色菜单、低层背景，沿用 |
| Text Primary | `#F3F5F8` | `#172033` | 普通标题、正文重点、公共操作；Display 可仍白/黑 |
| Text Secondary | `#B8C2D4` | `#34425A` | About 正文、普通说明、字段标签 |
| Text Muted | `#9BA8BC` | `#5C687B` | 时间、Caption、页码、辅助说明 |
| Label Strong | `#E1E8F5` | `#172033` | 普通 Tag、较强信息 Label |
| Action / Active Blue | `#7CA5FF` | `#416FC3` | 可交互文字、状态强调，沿用经历强调蓝 |
| Soft Blue / Icon | `#B6D2FF` | `#4268A6` | 技能图标、轻量状态、材质视觉细节 |
| Focus Ring | `#B6D2FF` | `#416FC3` | 键盘焦点统一色源；深色面板使用 Dark 值 |
| Image-overlay Text | `#F5F8FF` | `#F5F8FF` | 深色图像覆盖控件，独立于页面主题 |
| Feedback Confirm | Soft Blue + 勾 / “已复制” | 同角色的主题映射 | 不必新增绿色成功色 |

建议普通阅读文字使用稳定、不透明的语义色，降低“文字 alpha × 父级 opacity”反复叠乘。不要把 `--label` 立即从黑白改成这套色阶，否则会同时改变背景边线、卡片 currentColor 和保护特例。普通组件先局部接入；Display、序号和经历状态后续逐块审核。

已有 `--type-color-*` 应作为同一颜色系统的语义别名接入，不再并行维护两套 Primary / Secondary / Muted 值。颜色定义应由公共 Color 配置负责，字体文件只保留引用关系。

### C3. Divider / Border 建议

| 角色 | Dark 建议起点 | Light 建议起点 | 使用规则 |
|---|---|---|---|
| Divider Subtle | `rgb(230 232 232 / 10%)` | `rgb(54 54 48 / 12%)` | 阅读区、Footer、弱分隔 |
| Divider Content | `rgb(230 232 232 / 18%)` | `rgb(54 54 48 / 18%)` | 工作经历横线、内容组边界 |
| Surface Border | `rgb(168 196 255 / 20%)` | `rgb(75 110 172 / 20%)` | 普通卡片、控件 |
| Glass Tag Border | 现有浅蓝 `.28` | 现有灰蓝 `.28` | Tag/Skill 已形成的材质，不必降为普通卡片线 |
| Control Hover Border | 浅蓝 `.36` | 灰蓝 `.36` | 操作强化；避免 Hover 边框直接跳为 100% 实心 |
| Focus | Focus Ring 不透明 | Focus Ring 不透明 | 独立于 Hover，保持现有轮廓几何 |

这些是有语义的强度档，而不是让 10%、18%、20%、28%、36% 全部合成一个数值。网格 `.10/.40` 合成规则另行保留；其数值恰好与 Divider 接近也不能合并。

### C4. 三类玻璃材质

#### 1. Light Glass：Tag / Skill

以 A3 的现有配方作为基准：Dark 蓝 `.24 → .14`，Light 白 `.42 →` 浅蓝 `.12`，Border `.28`，Blur 8。将它提取为共享配方，优先替换详情页 `.20/.12/.26/.12` 版本。

- 普通 Tag 使用 Label Strong；技能图标使用 Soft Blue。
- 圆形 Skill、胶囊 Tag 的几何保持现状。
- 信息 Tag 保持静态；可操作 Tag 的 Hover 引用统一 Action/Border/Shadow 状态。
- 外阴影是可选的组件层级，不是每个 Tag 都必须增加；保留轻量感。

#### 2. Control Glass：按钮 / 设置行 / 复制

统一蓝灰填色通道、边线和高光来源，保留强弱两档：

| 规格 | Dark 建议起点 | Light 建议起点 |
|---|---|---|
| Quiet 控件填色 | `rgb(116 142 185 / 12%) → rgb(46 65 99 / 8%)` | 白 `.50 → rgb(148 186 240 / 10%)` |
| Standard 控件填色 | `rgb(116 142 185 / 22%) → rgb(46 65 99 / 20%)` | 白 `.64 → rgb(148 186 240 / 16%)` |
| Hover | 同通道提高到 `.32/.28` | 同通道提高到 `.76/.20` |
| Border | Surface Border，Hover 使用 Hover Border | 同角色映射 |
| 内高光 | 白 `.12` | 白 `.80` |
| 外阴影通道 | `rgb(3 7 18 / 12%)` | `rgb(40 65 112 / 10%)` |

这些起点须对真实动态背景校验。复制是 Quiet，普通下载是 Standard；文字返回/查看入口继续透明背景。Contact 展示级 CTA 仍使用现有更强的三段材质，不强制套普通 Button 配方。

#### 3. Panel Glass：设置 / 阅读弹窗

- **设置 Dark**：建议灰蓝底衬 `rgb(17 23 37 / 64%)`，上层 `rgb(43 50 66 / 52%)`，Blur 24，低强度白高光。比当前 `.24` 底色更稳定，但仍保留通透感。
- **设置 Light**：建议白 `.72 → rgb(238 244 254 / 60%)`，灰蓝边框 `.20`，白高光 `.80`，文字使用 Light Primary/Secondary。不要继续用深灰 `.24` + 深色文字的组合。
- **Contact 阅读面板**：保留现有 `.73/.72/.75`、Blur 28、saturation 80% 的深色配方，将它明确为 **Dark Inset** 组件变体。在 Light 页也使用 Dark Text / Control / Border 的完整作用域。
- 详情页信息卡保留中性轻 Surface 和轻 Blur；不将全部阅读卡片改成强蓝玻璃。
- Glass 要定义不支持 blur 时的底衬方案，仍使用同一色系保证阅读；不能仅依靠 blur 去压制背景。

统一的是配方结构和色源。Tag、按钮、Popover、Modal 的遮蔽强度、blur 和投影应该随层级增加，不能完全相同。

### C5. 状态规则建议

| 状态 | 颜色行为 | 保留边界 |
|---|---|---|
| Default | 使用组件本身角色 | 静态 Tag 不伪装成按钮 |
| Hover | 字色 / Border / Surface 轻量升一档 | 只对可交互元素；不改布局和动画 |
| Pressed | 保持可读字色，底色/内高光适度变化 | 避免整个按钮 opacity 变低导致文字也变暗 |
| Selected | 使用现有状态结构引用 Action 或 Primary | 导航细线、经历状态、项目索引各自保留 |
| Focus-visible | 统一 Focus 色源 | 与 Hover 可同时出现，保持现有 outline 几何 |
| Copied / Feedback | Confirm 色 + 勾 + 文案 | 明确 `Copied + Hover`，反馈不能被普通 Hover 抹掉 |
| Disabled | 普通控件使用 Muted 与低强度 Surface/Border | 需真实业务禁用状态；不要把资源占位按钮自动改禁用 |

建议级联优先级：**组件默认 → 可交互 Hover → Pressed → 业务反馈/Selected 组合 → 独立 Focus-visible**。经历的组透明度是单独叙事状态，不参与普通按钮 Disabled 规则。

### C6. Dark / Light 的关系

应建立三种清晰映射，避免“全局主题一切反色”：

1. **普通 UI 随主题映射**：正文、Tag、设置、详情外壳、Footer、Border。
2. **深色阅读/图片覆盖变体**：Contact 弹窗和图片跟随光标，在 Light 页面可继续深色；但内部所有文字、线条、控件都明确使用完整 Dark 变体，避免一半变白一半变深。
3. **场景及原始资源保持自身色彩**：3D、隧道、照片、QR、封面、PDF。浅色场景采用已有艺术调色，而不是普通 UI 色板替换。

静态详情页后续应在绘制前读取主题偏好，和首页的 `theme=light/dark/system` 规则一致，避免先显示一套颜色再切换。先使用公共 CSS 色阶补齐 Light 文档背景、文字、卡片、分隔线、像素和焦点，再评估是否需要改背景挂载逻辑。**不建议第一轮把三个详情页改成完整首页 WebGL 应用**，这会扩大资源、路由和生命周期风险。

### C7. 应统一 / 应保留

| 优先统一 | 保留为特例 |
|---|---|
| 普通文字 Primary / Secondary / Muted / Label Strong | WELCOME、隧道、Contact Display 的高对比文字 |
| 普通 Tag 的材质色源 | About 圆形技能的形状、漂浮和标签层级 |
| Button / Link 的交互色、Focus、复制反馈 | Contact 展示 CTA 的更强材质 |
| 设置和详情外壳的主题映射 | Contact 深色联系面板、QR 纸面与原始装饰 |
| UI Divider / Border 的明确强度 | 背景网格合成、像素与贴纸颜色 |
| 公共材质高光与投影通道 | 3D 折射、隧道星轨、个人照片和 PDF 原图 |
| 相近无语义的局部 alpha | 经历 `.82 / .64 / 1`，滚动转场和图像远近透明度 |

---

## D. 推荐实施顺序、文件与风险

本表是建议排期，**本轮没有执行**。

| 阶段 | 具体工作 | 涉及文件 | 风险 / 验收 |
|---|---|---|---|
| 1. 公共定义 | 建立单一 Color 角色及材质配置；先映射已有值，接入 Typography 语义别名 | 新公共颜色文件；`portfolio-fonts.css` 的颜色别名关系 | 低；初次接入应基本无视觉差异 |
| 2. Tag 与状态 | 统一三个主模块及详情 Tag；收敛 Focus，明确复制反馈优先级 | `portfolio-about.css`、`portfolio-experience.css`、`portfolio-works.css`、`portfolio-project-hero.css`、`portfolio-contact.css` | 低；保持几何/字体；比对 Dark/Light 默认与 Hover |
| 3. 设置与公共操作 | 补齐设置 Light 配方；公共控件分 Quiet/Standard；光标明确深色覆盖变体 | `portfolio-settings.css`、`portfolio-contact.css`、`portfolio-works.css`、`portfolio-fliggy-reading.css` | 低至中；高亮背景、滚动、桌面/移动都检查 |
| 4. 详情主题补齐 | 静态详情加入同规则主题启动，完整 CSS 对应；不动 PDF 内容/交互 | `tools/project-detail-client.js`、`tools/build-project-details.mjs`、`portfolio-projects.css`、`portfolio-project-hero.css` | 中；首次加载闪色、返回偏好、system 跟随都需验证 |
| 5. 普通文字 / 分隔线 | 按角色接入色阶，收敛 `.54/.56/.58/.62/.66` 等近似数值 | 各模块局部 CSS；共享外壳 | 中；经历状态及 currentColor 继承要单独对比 |
| 6. 背景连续性与清理 | 评估 CanvasFlow `.12` 与静态像素的差异；清理经 DOM 证明未用的规则 | `portfolio-canvasflow.css`、`portfolio-projects.css`、背景 runtime / 构建工具 | 背景中至高，清理低至中；单独审核，不与公共颜色绑定上线 |

实施时不要：

- 对全局 `h1/p/button/a` 强制同色。
- 全局重写 `--label` 后顺带改变所有 currentColor Surface。
- 将所有 `.18/.20/.24/.28` 粗暴替换成一个 alpha。
- 改原始照片、封面、PDF 的 filter 或反相规则来“配合主题”。
- 因颜色收敛顺带改变文字系统、布局、动画、路由或 PDF 阅读方式。

### 建议验收矩阵

- 1707×932、390×844；实施阶段再补 375/768/1024 断点。
- Dark / Light；详情从两主题进入、刷新、返回；system 偏好单独检查。
- Tag 静态/交互；按钮 Default/Hover/Pressed/Focus；复制反馈及组合态。
- 经历收起、当前展开与其他弱化条目；分隔线始终保持规定角色。
- 设置分别叠在蓝黑内容、深蓝 Contact、浅色背景上。
- Contact Dark Inset 在两主题内的字段、QR、下载、关闭和 backdrop。
- 字体、尺寸、布局、动画、图片和 PDF 资源不因颜色改动发生变化。

---

## E. 代表性实际截图

以下均为本次审查新捕获的页面，**不是 Color V1 改稿**。掉落物体、光标扰动及背景动画使不同截图帧不能严格像素一一比较。

### E1. 首页：深蓝场景与浅色场景

![首页 Dark · 1707×932](output/playwright/color-audit-v1/1707-dark-home.png)

![首页 Light · 1707×932](output/playwright/color-audit-v1/1707-light-home.png)

### E2. Tag 材质基础：About 与工作经历

![About Dark · 1707×932](output/playwright/color-audit-v1/1707-dark-about.png)

![工作经历 Light 展开 · 1707×932](output/playwright/color-audit-v1/1707-light-experience-expanded.png)

### E3. 设置浅色映射与 Contact 深色特例

![设置 Light · 1707×932](output/playwright/color-audit-v1/1707-light-settings.png)

![Contact 深色面板放在 Light 页面 · 1707×932](output/playwright/color-audit-v1/1707-light-contact-modal.png)

### E4. 详情页主题范围

![CanvasFlow Light · 1707×932](output/playwright/color-audit-v1/1707-light-canvasflow-art-preview.png)

![乐心详情固定 Dark · 1707×932](output/playwright/color-audit-v1/1707-fixed-dark-lexin-health-app.png)

从浅色入口进入静态详情的 computed 样本分别为 `1707-from-light-* / 390-from-light-*`。它们仍输出相同固定深色，未通过添加不存在的浅色 class 伪造截图。

### E5. 移动端

| 移动 Light 菜单 | 移动 Light 设置 |
|---|---|
| ![菜单 Light](output/playwright/color-audit-v1/390-light-menu.png) | ![设置 Light](output/playwright/color-audit-v1/390-light-settings.png) |

| 移动深色经历背景压力 | 移动 Contact Light 中的深色面板 |
|---|---|
| ![经历 Dark](output/playwright/color-audit-v1/390-dark-experience-expanded-confirmed.png) | ![联系面板](output/playwright/color-audit-v1/390-light-contact-modal.png) |

其余各模块、四详情页首屏/阅读区/Footer、四项目切换、键盘焦点截图保存在证据文件夹，原始尺寸没有裁切或调色。

---

## F. 本轮交付与限制

- 交付：本报告、原始截图、computed JSON、源码颜色清单及未修改校验。
- 未执行：颜色重构、主题接入、历史 CSS 清理、代码 build、合并、提交和部署。
- 当前预览是最新本地主项目，不把线上部署状态作为本次报告的事实源。
- 未进行跨浏览器、真机和所有动画时刻的完整对比度认证；截图、CSS 采样能证明这里列出的状态和缺口，不能替代后续实施验收。
- 报告中建议色值需要用户审核后逐阶段接入；没有将建议当作现状，也没有自动将 Contact 特例改成 Light 白色弹窗。

**推荐审核重点**：普通文字使用稳定色阶、主页面 Tag 作为共享材质基准、设置 Light 改为真正浅玻璃、Contact 保留 Dark Inset、静态详情补主题但暂不重构背景应用。
