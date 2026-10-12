# 顶部渐变模糊恢复 / 联系弹窗 PDF 查看

## 本次修正

此前 detail-motion-20261013 删除渐变模糊的处理不符合用户要求；本次恢复该效果，取代此前报告中“移除整列模糊”的方案。已接入的 Lenis 缓动保持。

### 四个详情页顶部羽化

- 保留原有 160px 高度、24px blur、深浅主题渐变颜色及向下羽化曲线。
- 模糊层独立于工具栏出现时的 transform，避免 toolbar 位移影响其位置。
- 用两个相交渐变遮罩：原有向下羽化 + 从真实 PDF 顶边起始的 24px 透明过渡。PDF 刚进入时不再把强模糊直接裁成硬边；完全进入后恢复原有顶部模糊强度。
- 跟踪文档实际横向位置、宽度、顶底和进入时的圆角；pointer-events:none。返回、拖尾、PDF 原稿、缩放、布局与滚动引擎保持。
- 通过 mount/unmount 创建与清理，不重复生成遮罩。

### 联系弹窗

- 两个入口统一为「查看简历 PDF」「查看作品集 PDF」，target=_blank，rel=noopener noreferrer，移除强制 download 属性。
- 简历仍使用之前确认的 assets/downloads/you-chengzhang-resume-2026.pdf。
- 新作品集原样复制到 assets/downloads/you-chengzhang-portfolio-2026-10.pdf。
- 来源：E:/SSS-作品集/2026.10.12/不分开合并-总/超级合并_压缩(PPDDFF 1次）.pdf。
- 49 页，46,569,959 字节；源文件和目标 SHA256 均为 5eb748e5364ba904cead34d6cb1cd4c52c523cc2e17e2d8b4d01334ee0f7316e。
- 本地预览服务器增加 application/pdf MIME，避免 application/octet-stream 导致浏览器下载。仍为本站 PDF 地址，无外部 PDF 服务，无新增应用阅读页。

## 修改文件

- tools/project-pdf-reader.js / portfolio-project-pdf.js
- portfolio-project-pdf.css
- tools/contact-runtime.js
- _next/static/chunks/1ed7a178f7acd3df.js（仅 Contact 源码块）
- index.html（仅 Contact SSR footer）
- portfolio-project-contact.js（从共用 Contact 构建）
- tools/preview-selected-works.mjs
- assets/downloads/you-chengzhang-portfolio-2026-10.pdf（新增）

## 实际验证

- 四详情 × 1707×932，PDF top=56 / 28 / 0 / -100：各只有一个模糊层，blur(24px)，双遮罩生效，宽度及横向位置与真实 PDF 匹配。原先的覆盖到 PDF 外部、工具栏 transform 引发的硬切不再出现。
- 四详情放大 110% / 恢复 100%，实际滚轮往返；390×844 无横向溢出。
- 浅色模式检查；没有重做任何主题 Token。
- 四详情的联系弹窗均显示正确两个新标签页入口，没有 download 属性。
- 主站 390×844 弹窗宽364px、scrollWidth364px；两个按钮各155px，无内部溢出。
- 实际点击作品集入口，新标签页为原生 PDF 视图，未触发下载。等待文件解析完成后截图显示首页和 1 / 49 页码。仅核对文件、首页及总页数，未重新审核整本内容。
- 源文件复制完整、哈希一致；JS 构建及 npm run build:production -- --check 通过（378 文件、5 HTML 页面）。未部署。

## 证据（本目录）

- feather-restored-<项目 ID>-edge-1707.png / reading-1707.png / 390.png
- feather-restored-fliggy-light-1707.png
- feather-restored-20261013-results.txt
- contact-pdf-view-20261013-results.txt
- contact-pdf-view-390.png
- portfolio-pdf-20261013-cover.png（原文件首页渲染）
- portfolio-native-pdf-view-ready.png（原生浏览器视图完成加载）

初次原生阅读器截图只有加载中的界面，后续等待解析完成并重新检查，最终以 portfolio-native-pdf-view-ready.png 为准。
