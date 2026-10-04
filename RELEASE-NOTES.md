# 作品集原型 v0.1.0 · 2026-10-04

本版将当前开发原型保存到正式 GitHub 仓库，并发布到已有 Netlify 站点。

- 保留首页、工作经历、精选项目、About、个人世界、Contact 和设置的当前审核版本。
- 合入 CanvasFlow 新详情页：大标题、右上小封面、四块项目信息和连续阅读占位。
- 其他三个项目详情保留现有 PDF 图片阅读；这些 PDF 是旧版，等待用户提供最终资料后替换。
- `/portfolio` 固定入口和四个二维码保持兼容；整本最终 PDF 暂未提供，继续显示 Coming Soon。
- Netlify 从 GitHub `main` 构建 `dist/`；正式仓库不包含本地备份、截图、依赖或账号配置。
- 保留参考 remake 的 NOTICE 和 LICENSE；第三方 runtime、字体、音频、模型的替换与授权核实尚未完成。

## 发布前验证

- `npm ci --ignore-scripts` 和 `npm run build` 成功。
- CanvasFlow 1707×932、390×844：四块信息、原比例封面、背景网格正常，无横向溢出。
- 返回精选项目、About / Contact / Settings 入口和现有精选项目模块保留。
- AIGC、飞猪、乐心详情分别保持 1、5、15 页真实 PDF 内容，首张内容图片加载成功。
- `/portfolio` 直接访问成功；开发反馈脚本不进入发布包。
- 浏览器功能检查没有新增异常或缺失资源；保留原 Three.Clock 弃用提示。
- QR 文件 SHA-256 与迁移前一致；正式 Git 历史与站点关联保留。

## 回退与后续更新

Git 标签 `portfolio-v0.1.0-2026-10-04` 对应本次快照。后续修改通过新提交更新 main；必要时可在 Netlify 发布历史中重新发布本版本，或通过 Git revert 回退变更。

原未提交的 Vite 基础文件已保存在本机 `Documents/portfolio-release-backups/`，未覆盖丢失。
