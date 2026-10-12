# Typography V1 第二阶段 · 视觉审核记录

日期：2026-10-06。基于已通过的第一阶段实施，本阶段只调整文字层级，等待视觉审核后再进入下一阶段。

## 前后对比截图

[打开交互对比页](http://127.0.0.1:8767/output/playwright/typography-v2/review.html)：15组修改前/后截图，包含1707×932桌面与390×844移动。可切换About、精选项目、工作经历、移动菜单、详情与阅读章节；点击图片查看原始分辨率。

对比页文件：[review.html](output/playwright/typography-v2/review.html)。截图来自实际浏览器；背景和漂浮元素所在动画帧不同，动画本身未改。

| 核心截图 | 修改前 | 修改后 |
| --- | --- | --- |
| About桌面 | [前](output/playwright/typography-v2/before-1707-about.png) | [后](output/playwright/typography-v2/after-1707-about.png) |
| About移动 | [前](output/playwright/typography-v2/before-390-about.png) | [后](output/playwright/typography-v2/after-390-about.png) |
| 精选项目桌面 | [前](output/playwright/typography-v2/before-1707-works.png) | [后](output/playwright/typography-v2/after-1707-works.png) |
| 精选项目移动 | [前](output/playwright/typography-v2/before-390-works.png) | [后](output/playwright/typography-v2/after-390-works.png) |
| 移动菜单 | [前](output/playwright/typography-v2/before-390-menu.png) | [后](output/playwright/typography-v2/after-390-menu.png) |
| 乐心阅读章节移动 | [前](output/playwright/typography-v2/before-390-lexin-health-app-chapter.png) | [后](output/playwright/typography-v2/after-390-lexin-health-app-chapter.png) |

## 当前层级与使用场景

以下数字为 **字号 / 行高 / 字重**，单位CSS px。新增层级变量集中在`portfolio-fonts.css`的Stage 2区域；没有更改第一阶段已有Token和字体面。

| 角色 | 桌面1707×932 | 移动390×844 | 实际使用场景 |
| --- | --- | --- | --- |
| Profile Heading | 32 / 43.2 / 500 | 24 / 32.4 / 500 | About学校与设计方向，同一层级；姓名仍保留原规格 |
| Section Label | 18 / 27 / 600 | 16 / 24 / 600 | 精选项目模块标题：较小的栏目识别，不承担Display角色；以Semibold与普通正文区分 |
| Body Large | 20 / 33 / 400 | 18 / 28 / 400 | About中文介绍、精选项目简介、工作经历展开正文 |
| Body | 16 / 28 / 400 | 同桌面 | 四个详情信息卡正文、Contact弹窗说明；沿用第一阶段Token |
| Small | 14 / 21 / 400；强调500 | 同桌面 | 工作经历岗位、时间及辅助标题；详情副标题；精选项目桌面元信息 |
| Caption | 12 / 18 / 400；选择状态500 | 同桌面 | 眉题、计数、精选项目移动时间与类型说明；不承担主要阅读内容 |
| Content Heading | 18 / 27 / 600 | 同桌面 | 四个详情页信息卡小标题，与16px正文拉开层级 |
| Reading Heading | 24 / 36 / 600 | 同桌面 | 四个详情页“完整项目”阅读章节标题，收敛原21px/22px差异 |
| Menu Display | 平板40 / 56 / 500 | 36 / 50.4 / 500 | 移动全屏菜单；五项入口一致，不使用普通Navigation尺寸 |

Body Large在桌面低高度窗口使用18/28紧凑变体；About Profile Heading在平板使用24/32.4、桌面低高度使用28/37.8。它们属于有明确用途的响应式变体。

首页顶部短简介仍保留原16/24紧凑展示形式；About英文翻译保留原字号、行高及50%颜色alpha，继续处于中文介绍之下。没有将所有正文机械替换成一个规格。

## 主要前后差异

- About学校/方向：桌面32.10与32.78统一32；移动23统一24，原各自margin保留。
- About中文介绍：桌面22.20/36.62收敛20/33；移动17/28.05变为18/28。移动初版曾使用30px行高，复查后收敛28，避免将译文推近固定页脚。
- 精选项目标题：桌面18/400改为18/600；移动12/400改为16/600。标题保持克制，项目名称仍沿用第一阶段字号。
- 精选项目简介：桌面23.05/40.34/500收敛20/33/400；移动15/27.75变为18/28/400。
- 工作经历展开正文：桌面20/33不变；移动16/27.2变为18/28。辅助标题、岗位与日期使用14/21，与公司名称明确区分。
- 精选项目桌面元信息19px收敛14px；移动10px说明/时间及9px计数收敛到12px辅助规格。
- 详情卡片小标题：桌面16、移动14统一18/27/600；正文继续16/28/400。
- 四个阅读章节标题：桌面保持24/36，移动21/31.5或22/33统一24/36。
- 移动菜单：390px下39/58.5收敛36/50.4；Home及中文入口统一500。保留原居中方式及交互，不改变菜单布局声明。

字号、行高变化会产生正常的文本重排和自然高度变化；没有通过改padding、gap、margin或卡片尺寸来实现效果。

## 修改文件

仅修改8个CSS文件：

- [portfolio-fonts.css](portfolio-fonts.css)：新增层级角色变量，不改字体栈、字重面及第一阶段Token。
- [portfolio-about.css](portfolio-about.css)：统一学校/方向，映射中文介绍至Body Large。
- [portfolio-works.css](portfolio-works.css)：Section Label、Body Large及辅助信息层级。
- [portfolio-experience.css](portfolio-experience.css)：展开正文与岗位/时间/辅助标题分层。
- [portfolio-project-hero.css](portfolio-project-hero.css)：Content Heading和Small副标题。
- [portfolio-projects.css](portfolio-projects.css)、[portfolio-canvasflow.css](portfolio-canvasflow.css)：阅读章节标题统一。
- [portfolio-navigation.css](portfolio-navigation.css)：全屏菜单展示规格。

## 验证与保留项

- 实际浏览器检查1707×932与390×844；四个详情页均检查。
- 8个CSS文件经esbuild CSS编译检查，0 warnings。
- CSSOM比较确认：没有非文字属性变化，没有第一阶段已有Token变化。宽度、定位、padding、margin、gap、颜色、opacity、卡片、动画声明未修改。
- 修改前后computed样式比较：WELCOME、About姓名、公司名称、大序号、Skill Label、About英文翻译和Contact已采样特殊文字的字体规格/颜色均一致。
- Tag、Button、Navigation、Brand Token保留；Contact CSS、设置CSS、所有JS/HTML、图片及PDF资源哈希未变。
- 所检查可见文字未发现新增横向溢出。1px的“项目时间”无障碍隐藏label不计入可见文字溢出。
- 移动About继续使用既有纵向阅读流，没有缩照片或压缩间距强塞成一屏。

证据：[verification.json](output/playwright/typography-v2/verification.json)、[computed-styles.csv](output/playwright/typography-v2/computed-styles.csv)、[CSSOM差异](output/playwright/typography-v2/diff.json)、[CSS编译与修改文件](output/playwright/typography-v2/source-validation.json)。

本轮没有提交或部署，未自动进入下一阶段。请先审核上述桌面/移动对比结果。
