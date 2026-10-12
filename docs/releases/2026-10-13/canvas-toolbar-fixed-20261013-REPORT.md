# CanvasFlow 阅读工具栏层级修复

- 原因：工具栏的 z-index:45 位于 .canvasflow-detail 的 z-index:1 层级容器中；新增渐变模糊挂在 body 的 z-index:43，盖住整个容器内的工具栏。
- 修改：仅 CanvasFlow 将渐变层挂到 .canvasflow-detail 内，使其与工具栏共用同一层级容器。保持渐变43、工具栏45；其他三页继续挂到 body。
- 文件：tools/project-pdf-reader.js，及其构建产物 portfolio-project-pdf.js。未修改 CSS、布局、渐变参数、文案或其余三页的挂载方式。
- 浏览器验证：1707×932 深色/浅色、390×844 深色，工具栏显示正常；恢复原状按钮中心能正确命中按钮；放大110% / 恢复100%通过；blur(24px)保留。实际截图已查看。
- 三个其他详情验证渐变父级仍为 BODY。
- JS 构建及生产资源检查通过。未部署。
- 证据：canvas-toolbar-fixed-20261013-results.txt、canvas-toolbar-fixed-dark-1707.png、canvas-toolbar-fixed-light-1707.png、canvas-toolbar-fixed-dark-390.png。修复前截图 canvas-toolbar-20261013-before.png。
