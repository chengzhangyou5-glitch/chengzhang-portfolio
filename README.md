# 游承樟｜设计作品集

2026-10-13 已验收主项目快照，包含首页、工作经历、精选项目、About、个人世界、Contact、四个共用设计外壳的项目详情及当前 PDF 阅读资源。

- 主站：https://youchengzhang.netlify.app/
- 固定 PDF 入口：https://youchengzhang.netlify.app/portfolio
- `/portfolio` 保留原短地址，现打开最新提供的 49 页整本作品集 PDF。联系弹窗的简历和作品集入口均为新标签页查看。
- 浏览器标签页首页为「游承樟｜设计作品集」，详情为「项目名｜游承樟」；图标为蓝色 Y。
- GitHub：chengzhangyou5-glitch/chengzhang-portfolio

## 开发和发布

```sh
npm ci
npm run dev
npm run build
npm run preview
```

开发服务器默认 8772，构建预览默认 8776。生产构建执行 `npm run build`，发布 `dist/`。构建使用最新主项目的生产导出器，只打包当前审核文件、不重新生成页面或 PDF，排除本地开发反馈工具和测试素材。

- 修改 CanvasFlow：`tools/canvasflow-detail-content.mjs`、`portfolio-canvasflow.css`，执行 `npm run build:canvasflow`。
- 其他详情页与 PDF：参见 `PROJECT-DETAILS.md`。
- 修改主页模块：编辑对应 `tools/` 源码及 `portfolio-*.css`，执行对应 `build:*`。
- 原二维码保留于 `assets/qrcode/`；本地 `.netlify/` 不提交。
- `dev-tools/` 仅供本地可视化反馈，不进入发布目录；截图、备份和依赖也不发布。

## 来源和素材状态

本版仍为基于参考 remake 的原型快照，包含参考 runtime、模型、音频及部分字体。它不是已完成第三方授权清理的版本；原 MIT 声明不覆盖这些第三方内容。保留 `NOTICE.md`、`LICENSE`，后续按原计划替换或核实授权。参考来源：haoqi.design / kingniu666/haoqi-design-remake。
