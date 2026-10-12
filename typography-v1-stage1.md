# Typography V1 · 第一阶段实施记录

日期：2026-10-06。项目：`C:\Users\31954\Documents\chengzhang-portfolio-prototype`。

本阶段基于 [typography-audit-v1.md](typography-audit-v1.md) 实施字体语言、字重面、公共文字 Token、普通 Tag、公共操作及详情页外壳文字。只修改10个CSS文件；JS、HTML、图片、PDF、路由、动画、阅读交互与部署均未修改。

## 1. 修改文件

| 文件 | 修改内容 |
| --- | --- |
| [portfolio-fonts.css](portfolio-fonts.css) | 公共Token；新增指向本机已有PingFangSC-Semibold的600本地字体面；没有新字体文件 |
| [portfolio-navigation.css](portfolio-navigation.css) | 主站Brand、常规Navigation；移动大菜单及底部中文入口使用混排栈 |
| [portfolio-settings.css](portfolio-settings.css) | 设置弹窗标题、行操作与状态徽标引用公共文字规格 |
| [portfolio-experience.css](portfolio-experience.css) | 关联项目Tag统一13/500/18；移除移动端12px字号覆盖 |
| [portfolio-works.css](portfolio-works.css) | 能力Tag引用Token；项目标题按语言使用DIN/PingFang；查看入口和悬停提示使用操作规格 |
| [portfolio-contact.css](portfolio-contact.css) | 复制、下载、弹窗说明与Caption引用Token；署名数字走DIN；Display和大CTA保留 |
| [portfolio-project-hero.css](portfolio-project-hero.css) | 650改为中文600，英文标题仍700；共用Tag、正文、元信息与Caption |
| [portfolio-projects.css](portfolio-projects.css) | 三个静态详情的Brand、返回、下载、Footer操作与辅助文字 |
| [portfolio-canvasflow.css](portfolio-canvasflow.css) | CanvasFlow独立外壳使用相同Brand、返回与页码Token，保留其占位阅读形式 |
| [portfolio-fliggy-reading.css](portfolio-fliggy-reading.css) | 取消飞猪独立20/15px下载文字；Footer及上下文入口复用操作Token |

## 2. 新增Token

集中定义在`portfolio-fonts.css`，组件通过局部选择器引用，不对全站`h1/h2/p/button`进行统一覆盖。

下表顺序为 **字号 / 行高 / 字重**。

| 角色 | 桌面 | ≤767px | 尺寸Token | 字重Token |
| --- | --- | --- | --- | --- |
| Body | 16 / 28 / 400 | 同桌面 | `--type-body-size` / `--type-body-leading` | `--type-weight-body` |
| Small | 14 / 21 / 400 | 同桌面 | `--type-small-size` / `--type-small-leading` | `--type-weight-body` |
| Caption | 12 / 18 / 400 | 同桌面 | `--type-caption-size` / `--type-caption-leading` | `--type-weight-body` |
| Label / Tag | 13 / 18 / 500 | 同桌面 | `--type-tag-size` / `--type-tag-leading` | `--type-weight-label` |
| Button Standard | 16 / 24 / 500 | 14 / 21 / 500 | `--type-button-size` / `--type-button-leading` | `--type-weight-label` |
| Button Compact | 14 / 21 / 500 | 同桌面 | `--type-compact-size` / `--type-compact-leading` | `--type-weight-label` |
| Navigation | 16 / 24 / 500 | 同桌面 | `--type-navigation-size` / `--type-navigation-leading` | `--type-weight-label` |
| Brand | 16 / 24 / 700 | 14 / 21 / 700 | `--type-brand-size` / `--type-brand-leading` | `--type-weight-title-en` |

其他基础Token：

- `--type-weight-title-zh:600`、`--type-weight-title-en:700`、`--type-weight-contact-display:900`。
- `--type-tracking-default:normal`。
- `--type-color-primary:currentColor`。
- `--type-color-secondary` / `--type-color-muted` / `--type-color-label-strong` / `--type-color-translation`：分别为currentColor的74% / 60% / 90% / 50%。这些是供逐步采用的语义入口，**没有批量替换现有颜色**。

Small的元信息强调变体复用14/21，但字重引用500；Caption状态徽标也复用12/18与500。Body本阶段用于详情信息卡、Contact弹窗说明；不强行覆盖About双语介绍及展示性大正文。

移动全屏菜单继续保留原有`10svw`展示尺寸和行高，仅改语言字体栈与500字重。常规导航使用16/24；没有将全屏大菜单压缩成普通小导航，避免改变其构图。

## 3. 主要修改前后差异

| 区域 | 修改前 | 修改后 |
| --- | --- | --- |
| 精选项目CanvasFlow AI标题 | PingFangSC-Medium；600声明 | **DIN-Bold，700**；原字号/行高保持 |
| 移动菜单中文 | EN栈，实际Noto Sans SC，400 | 混排栈，实际**PingFangSC-Medium，500**；英文Home走DIN |
| 普通中文重要标题600 | alias只提供Regular/Medium，实际Medium | alias补全600，实际**PingFangSC-Semibold** |
| 混排详情标题 | 650；中文Medium / 英文Bold | 中文600实际Semibold；拉丁字符实际DIN-Bold，纯英文700 |
| 工作经历项目Tag | 桌面14/21/500、移动12/18/500 | 两端13/18/500 |
| 精选项目Tag | 已为13/18/500 | 引用Token；宽度自适应、Flex Wrap、8px间距和34px胶囊高度保留 |
| 详情Tag | 桌面12/16.8/400、移动11/15.4/400 | 两端13/18/500；保留原padding、圆角、材质 |
| 查看项目 | 桌面24/33.6/400、移动11/16.5/400 | 桌面16/24/500、移动14/21/500 |
| 详情Brand | 15或17；移动12，行高不一致 | 四页统一16/24/700；移动14/21/700 |
| 返回 / PDF下载 / Footer操作 | 11–20px，多套行高/字重 | 统一Button Standard；Footer辅助label为Caption |
| 飞猪PDF下载 | 桌面20、移动15 | 桌面16、移动14，行高24/21，字重500 |
| Contact复制 / 已复制 | 桌面13、移动12 | 14/21/500；实际复制与反馈检查通过 |
| Contact下载 | 桌面21、移动14，行高29.4/19.6 | 桌面16/24/500、移动14/21/500 |
| 详情信息卡正文 | 桌面16/28、移动14/24.5 | 两端16/28/400；自然行数变化，没有修改卡片宽度或padding |
| 详情元信息 | label13、value17；移动12/14 | label12/18/400；value14/21/500 |

字体宽度变化会带来自适应标签的自然宽度变化、正文自然行数变化；没有新增固定标签宽度、重做网格或修改间距来补偿。

本机真实命中证据：[platform-fonts.json](output/playwright/typography-v1/platform-fonts.json)。未下载或打包字体。Contact两个英文Display仍命中DIN Black；About姓名原生PingFang Semibold路径未改。

## 4. 验收结果

- 实际浏览器：Windows Chrome154。桌面1707×932；移动390×844、375×844；平板/断点768×844、1023×844、1024×844。
- 主站、四个详情页均覆盖上述六个宽度；四个精选项目另外逐项切换检查。
- 94份文字状态采样、2250条文本节点记录；包括修改前参考、重复状态和离屏文字，并非独立文案数量。
- 152条普通Tag采样均为**13px / 18px / 500**；没有混入About的Skill Label。
- 被检查的主要操作没有保留11px规格；标签、按钮、项目标题未发现新增横向溢出；截图核对标题没有异常断词。
- 375px实测“已复制”：按钮宽64px，clientWidth与scrollWidth均63px；图标及三字反馈均位于按钮边界内。浏览器剪贴板实际读回YCZZMAX。
- Footer另行滚动到底部检查；上一层/下一项目操作使用14/21/500，辅助label使用12/18/400，没有挤出页面。
- 主站全部六个宽度复查深/浅主题，CanvasFlow补拍深/浅桌面及移动。**其他三个静态详情页原有外壳固定深色，没有可用的主题切换入口，本轮没有新增主题逻辑。**
- 10个修改CSS均经esbuild CSS编译检查，0 warnings。CSS直接由现有页面加载；没有运行会重写HTML/JS的模块生成脚本。
- 浏览器CSSOM对修改前后规则比较：除font、字号、字重、行高、字距及新增`--type-*`变量外，没有发现变化。原宽度、padding、gap、圆角、颜色、opacity、定位和动画声明保持一致。
- About、3D、背景/隧道、滚动、导航JS、PDF资源和阅读JS的源码哈希未变。

完整证据：[verification.json](output/playwright/typography-v1/verification.json)、[computed-styles.csv](output/playwright/typography-v1/computed-styles.csv)、[CSS范围比较](output/playwright/typography-v1/diff.json)、[编译及修改文件](output/playwright/typography-v1/source-validation.json)。移动布局使用Windows浏览器viewport检查，未声称已验证真实iOS/Android字体。

## 5. 实际截图

### 桌面1707×932

![精选项目桌面](output/playwright/typography-v1/after-1707-works-project-1.png)

![项目详情桌面](output/playwright/typography-v1/after-1707-lexin-health-app.png)

### 移动390×844 / 375×844

![项目详情移动390](output/playwright/typography-v1/after-390-lexin-health-app.png)

![移动菜单390](output/playwright/typography-v1/after-390-menu.png)

![复制反馈与下载375](output/playwright/typography-v1/after-375-copy-feedback.png)

更多：[CanvasFlow桌面](output/playwright/typography-v1/after-1707-canvasflow-art-preview.png)、[AIGC桌面](output/playwright/typography-v1/after-1707-aigc-design-efficiency.png)、[飞猪桌面](output/playwright/typography-v1/after-1707-fliggy-lele-run.png)、[CanvasFlow浅色](output/playwright/typography-v1/after-1707-canvasflow-light.png)、[平板768](output/playwright/typography-v1/after-768-lexin-health-app.png)、[1024断点](output/playwright/typography-v1/after-1024-canvasflow-art-preview.png)。

## 6. 留待第二阶段

以下未套用普通Token重新改变字号或层级：

- 首页WELCOME、三阶段隧道Display。
- Contact主标题、LET'S CONNECT.、展示级“查看联系方式”CTA。
- About姓名、中文/英文介绍的大小与透明度主次、圆形Skill Label的16/24/500。
- 工作经历公司名称、经历/精选大序号。
- 精选项目模块标题的现有小标题视觉层级。
- 展示性大正文、About学校/设计方向尺寸合并、阅读章节标题21/22px的小差异、移动全屏菜单展示尺寸。

工作经历`.82/.64/1`状态、About英文弱化、既有文字颜色和阴影均保留。主要中文标题600的**字体面修复**已实施，但未借此重新调整标题字号。

本地预览：[http://127.0.0.1:8767/?feedback=off](http://127.0.0.1:8767/?feedback=off)。本轮没有提交、合并或部署。
