# 《欧陆纪年》项目上下文

这是一个 1816—2026 年欧洲历史互动地图，完全沿用中东历史地图册的原生 HTML/CSS/JavaScript/SVG 架构，无构建步骤、后端或数据库。

## 工作约定

- 正式目录：`Euro-historical-altas/`；可发布副本：`dist/`。
- 修改根目录后运行 `powershell -File scripts/sync-dist.ps1` 同步 `dist/`；不执行 `git push`。
- 不把官方原始 GeoJSON、下载压缩包或临时截图提交到仓库。
- `euro-cshapes-official.js` 保存已导入的 ETH Zurich CShapes 2.0 正式欧洲 Polygon；`euro-cshapes.js` 负责合并各时期边界层。
- 正式几何可由导入脚本或页面疆域调试器替换，不能把本地 seed 当作官方坐标。

## 代码结构

- `app.js`：事件绑定、初始化和渲染入口。
- `modules/core.js`：状态、欧洲实体历史资料、颜色和基础渲染。
- `modules/map.js`：时间线、年度边界构建、选择状态和来源标识。
- `modules/flags.js`：旗帜预览、悬浮和调试参数。
- `modules/events.js`：欧洲国家与历史政体事件目录。
- `modules/boundary-debug.js`：SVG/GeoJSON 导入、时期绑定、保存和导出。
- `euro-cshapes-official.js`：CShapes 2.0 正式欧洲边界快照（1886—2019）。
- `euro-cshapes.js`：正式数据与 1816—1885 回溯层、2020—2026 CShapes 2.0 正式轮廓延展层的合并层。
- `scripts/import-cshapes-europe.mjs`：官方 GeoJSON 到本项目 JavaScript 数据层的转换器。

## 当前规则

- 时间轴固定为 1816—2026；年度选择使用满足 `from <= year <= to` 的记录。
- 历史实体和现代实体共用同一套 SVG 地图接口，实体颜色由政体 ID 稳定映射。
- 导入的边界替换只覆盖当前实体与时期，不改写原始 seed 数据。
- 地图来源说明始终链接到 [ETH Zurich CShapes](https://icr.ethz.ch/data/cshapes/)，并明确区分历史回溯数据与 CShapes 2.0 正式几何。
- 旗帜按实体与年份加载 Wikimedia Commons 的真实历史 SVG/PNG，并裁切到完整国界形状；新增或替换历史旗帜时，必须同步补充来源和许可说明。

## 验证

```powershell
powershell -NoProfile -File .\scripts\sync-dist.ps1
node scripts/verify.mjs
```

验证脚本检查 JavaScript 语法、HTML 脚本引用以及根目录与 `dist/` 的 SHA-256 一致性。
