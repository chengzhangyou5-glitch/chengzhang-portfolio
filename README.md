# 游承樟 · 个人作品集

当前开发版的静态网站快照，包含首页、工作经历、精选项目、About、个人世界及 Contact。CanvasFlow 详情采用最新版四块信息布局。

- 主站：https://youchengzhang.netlify.app/
- 固定 PDF 入口：https://youchengzhang.netlify.app/portfolio
- `/portfolio` 保留 Coming Soon，等待最终整本 PDF；项目详情内的已有 PDF 是旧版，后续需替换。
- GitHub：chengzhangyou5-glitch/chengzhang-portfolio

## 开发和发布

```sh
npm ci
npm run dev
npm run build
npm run preview
```

开发服务器默认 8772，构建预览默认 8776。Netlify 从 main 分支执行 `npm run build`，发布 `dist/`。构建仅打包当前审核文件，不擅自重建各模块。

- 修改 CanvasFlow：`tools/canvasflow-detail-content.mjs`、`portfolio-canvasflow.css`，执行 `npm run build:canvasflow`。
- 其他详情页与 PDF：参见 `PROJECT-DETAILS.md`。
- 修改主页模块：编辑对应 `tools/` 源码及 `portfolio-*.css`，执行对应 `build:*`。
- 原二维码保留于 `assets/qrcode/`；本地 `.netlify/` 不提交。
- `dev-tools/` 仅供本地可视化反馈，不进入发布目录；截图、备份和依赖也不发布。

## 来源和素材状态

本版仍为基于参考 remake 的原型快照，包含参考 runtime、模型、音频及部分字体。它不是已完成第三方授权清理的版本；原 MIT 声明不覆盖这些第三方内容。保留 `NOTICE.md`、`LICENSE`，后续按原计划替换或核实授权。参考来源：haoqi.design / kingniu666/haoqi-design-remake。
