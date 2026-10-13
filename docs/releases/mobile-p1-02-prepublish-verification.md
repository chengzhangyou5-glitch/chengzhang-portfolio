# P1-02 修复与验证

分支：`fix/mobile-works-height-20261013`。Worktree：`C:/Users/31954/Documents/chengzhang-portfolio-worktrees/mobile-audit-20261013`。

仅修复手机精选项目在 800px 高度断点处切换模式、定位及返回的问题。未合并、未部署；正式主线保持干净，四个详情页 HTML、设计样式和 PDF 阅读器未修改。

## 修复方式

1. 手机首次进入时，根据当时高度选择原有列表或吸顶舞台。在同一标签页、同一宽度下保持此模式，并通过 sessionStorage 在详情返回后沿用。
2. CSS、项目定位、滚动动画和返回就绪检查共用这一决定，不再分别读取实时 800px 断点。
3. 高度改变时保留列表当前行的屏幕位置，或舞台的连续滚动进度，校正前面使用视口单位的区域带来的偏移。
4. 所有舞台定位使用实际舞台高度。缩至 740px 时，原有 800px 最小舞台仍在，最后一个项目不会再因错误的行程计算卡在返回遮罩下。
5. 列表项目定位和原有返回检查统一为 90px；避免元素目标的 CSS scroll-margin 再次叠加。列表不参与舞台吸附。
6. 高屏封面沿用进入时的高度参考，防止缩屏后封面上移盖住日期；原始视口下的字号、尺寸、配色、标签、舞台构图和动画参数未改。

宽度或横竖方向真正改变时仍按原有响应式布局适配。分别检查两套模式时使用独立标签页，避免同一标签页已经保存的模式影响比较。

## 浏览器结果

使用现有 Playwright / Chrome，390px 宽、触屏模拟、DPR 3。手机系统地址栏/Safari 仍需真机审核；下面为实际模拟结果。

| 场景 | 实测结果 |
|---|---|
| 首次 390×740 | 列表保留 |
| 740→844→740→844→740 | 始终列表，AIGC 当前行 top 从 90.234px 到 90.563px，变化约 0.33px |
| 首次 390×844 | 吸顶舞台保留 |
| 844→740→844→740 | 始终舞台，当前 AIGC 保持不变，舞台 top=0，封面 top 变化约 0.07px |
| 两模式 × 四项目进入/返回 | 8/8 通过；详情中改变高度后，仍恢复正确项目与正确模式 |
| 列表返回位置 | 四页 row top 约 89.56～89.81px，均在原有 90px 目标的 1px 内 |
| 舞台返回位置 | 四页舞台 top 约 -0.31～0.02px；返回遮罩最终数量 0 |
| 浏览器后退 | 列表、舞台均恢复 AIGC 与对应位置 |
| 高屏缩至 740px 后触屏滑动 | AIGC→飞猪→乐心，动画及吸附仍正常 |
| 短屏触屏滚动 | 封面入口角度从约 -1.86deg 变为 3.97deg，原有轻量动态仍在 |
| 桌面 1707×932 | 三栏 grid、sticky 舞台保留，无手机模式覆盖，无横向溢出 |
| 页面运行错误 | 两模式四页回归均为 0 |

高度变动时可用画面仍会正常适应新视口；正文区域按原有 dvh 规则调整，不把所有内容冻结成固定高度。修复的是布局模式切换和当前阅读/选中项目丢位。

数据：[高度往返](output/playwright/p1-02/height-cycles.json)、[高屏四项目及浏览器后退](output/playwright/p1-02/all-projects-844.json)、[短屏四项目及浏览器后退](output/playwright/p1-02/all-projects-740.json)。

## 构建与检查

- `node tools/build-works-layout.mjs`：通过；连续执行产物哈希不变。
- `node --test tests/works-layout.test.mjs`：4/4 通过。
- `node tools/build-production.mjs --check`：通过，383 个资源 / 5 个主页面引用校验；未导出或部署。
- `git diff --check`：通过。
- `git diff -- projects ...`：详情 HTML、详情设计样式及 reader 未改。

## 修改文件

- `tools/works-layout-runtime.js`、`portfolio-works-layout.js`：新增稳定模式初始化与实际舞台高度接口。
- `index.html`：viewport meta 后、CSS 前挂载模式初始化。
- `portfolio-works.css`：原手机舞台样式改由稳定模式属性控制，使用 `:where` 保持原有选择器优先级。
- `tools/selected-works-runtime.js`：项目定位、连续进度、尺寸变化校正。
- `tools/page-readiness-runtime.js`、`tools/return-readiness-runtime.js`：返回检查沿用同一布局模式。
- `_next/static/chunks/1ed7a178f7acd3df.js`、`e553ef8ae208a000.js`、`portfolio-project-entry.js`：对应构建产物。
- `tools/build-works-layout.mjs`：只生成上述功能的局部构建入口，不重建四详情页。
- `tests/works-layout.test.mjs`：模式、高度变化、跨页面延续、宽度变化和最小舞台高度的行为验证。

## 预览与截图

[支线预览](http://127.0.0.1:8783/?feedback=off)，刷新后生效。

[截图对照页](output/playwright/p1-02/review.html)。图中手机模式不等于真实设备验收。

未处理弱网、封面放大、字体、颜色、Footer 重叠或 PDF 阅读建议，也未覆盖正在开发的详情页支线。
