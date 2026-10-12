# Design Foundation · Stage A

本阶段采用已确认的主题方案 A：四详情页的站点外壳跟随 light / dark / system；PDF、项目封面和作品图片保持原色。当前内容宽度、Tag 密度、各组件圆角与间距不变。

## 统一入口

- 字体及字号：`portfolio-fonts.css` 继续维护既有 V1 / Stage 2，不新增字体资源。
- 公共参数：`portfolio-tokens.css`，由字体样式导入，覆盖首页及四详情。
- 主题控制：`portfolio-theme.js` 使用原有 localStorage `theme` 键；首屏同步应用，处理系统主题、跨标签页同步和原生历史返回。
- React 保持既有 ThemeModeProvider / useThemeMode API，通过 `tools/theme-provider-runtime.js` 订阅同一控制器。详情页不挂载另一个 React 应用。
- GPU 背景快照与当前主题不同时，仅将背景反馈场和调色参数映射到原有主页主题色；原始贴纸 atlas、位置、视差、shader、PDF / 项目图片不改。

## Token 角色

| 角色 | 当前基础值 / 边界 |
| --- | --- |
| Font | font.body / latin / chinese 引用原有 mixed / en / zh；字号、字重继续用既有 type tokens |
| Space | 4、8、12、16、20、24、28、32、40、48、64、80；仅等值替换，未统一不同页面的容器 |
| Radius | control8、media12、contact-row13、cover18/14、card22/18、reader22/14、dialog26/22、pill999、orb50%；保留已有变体 |
| Semantic color | page、reading-ink、muted、line、accent、reader-accent、focus；普通内容与 inverse 浮层分开 |
| Glass | soft8、control10、CTA18、popover24、dialog28；compact Tag 保留无 blur、低高光的现有参数 |
| State | disabled opacity .4；unavailable .64；preparing .72；Focus 2px，偏移按现有组件角色保留 |
| Scene | 使用原主页浅色 #ffead6 / #6196ff / #acffb9、深色 #2c4bd5 / #00000d / #00344c；不替换项目品牌色 |

## 可用性语义

- 移动菜单使用原生按钮、动态名称、aria-expanded / controls，可通过 Enter / Space 打开，Escape 关闭并返回焦点。
- 菜单底部主题名称显示浅色 / 深色 / 自动；声音名称显示开启 / 关闭。菜单打开时隐藏重复的固定设置齿轮，避免覆盖这些入口。
- 已配置文件的下载仍为下载链接；未配置项显示“准备中”，取消下载箭头和 Hover 承诺。准备中按钮保留焦点与说明提示，不执行文件下载。
- 工作经历中没有配置 href 的 Chip 显示“暂不可用”、使用原生 disabled，取消箭头与 Hover；可用分支保留链接语义。此阶段未新增项目跳转。
- 飞猪 / 乐心 Reader 继续使用原有 JS、资源、缩放、收窄、局部平移、胶囊光标与导航；只为外壳及控件提供主题颜色。

## 构建与验证

执行 `npm run build:stage-a`，按基础主题 → 导航 → 经历 → 联系 → 四详情顺序使用项目构建入口。`npm run test:theme` 检查首屏偏好、系统变化、跨标签页同步及存储不可用回退。

现有生成文件混合 LF / CRLF；构建写回保留未变行的原始格式，避免把局部修改扩大为无关代码差异。

实际前后截图与验收记录位于 `output/playwright/stage-a-20261008/`。本 Worktree 保留待人工验收，未合并、未部署。
