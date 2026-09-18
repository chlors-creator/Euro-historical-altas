# 欧陆纪年｜欧洲历史地图

**版本：v0.1.0** · **时间范围：1816—2026**  
**技术形态：原生 HTML、CSS、JavaScript、SVG；无构建步骤、无后端、无数据库**

这是与 `mena-historical-altas` 使用同一套前端架构的欧洲历史地图册。项目保留中东版本的交互方式：拖动时间轴、播放年份、点击实体查看政体与历史事件、悬浮查看旗帜，并提供疆域和旗帜调试器。变化集中在数据层、欧洲实体、时期口径和来源说明。

## 架构

```text
Euro-historical-altas/
├─ index.html                         页面结构与 SVG 地图骨架
├─ styles.css                         页面、地图、旗帜和调试器样式
├─ app.js                             事件编排与初始化
├─ euro-cshapes-europe-1816-1885.js   NASTAC/CShapes-Europe 1816—1885 正式回溯边界
├─ euro-cshapes-official.js           ETH Zurich CShapes 2.0 1886—2019 正式欧洲边界数据
├─ euro-cshapes-modern-2020-2026.js   2020—2026 CShapes 2.0 正式边界延展层
├─ euro-cshapes.js                    早期、官方和现代正式边界合并层
├─ euro-historical-1816-1885.js       1816—1885 年历史实体索引
├─ euro-historical-1886-1999.js       1886—1999 年历史实体索引
├─ euro-2026.js                       2026 年现代参考实体索引
├─ formal-names.js                    正式国名与时期名称
├─ euro-meta-zh.js                    中文国名、首都和历史实体别名
├─ data/
│  └─ euro-modern-2020-2026.geojson   历史导入缓存（当前地图不加载）
├─ modules/
│  ├─ core.js                         状态、历史资料、颜色和基础渲染
│  ├─ map.js                          时间轴、边界构建和来源标识
│  ├─ flags.js                        旗帜预览、悬浮和调试参数
│  ├─ events.js                       欧洲历史事件目录
│  ├─ lazy-loader.js                  历史数据加载入口
│  └─ boundary-debug.js               SVG/GeoJSON 导入、边界与国名位置调试、保存和导出
├─ assets/                            辅助资源与来源说明
├─ scripts/
│  ├─ import-cshapes-europe.mjs       官方 GeoJSON 转本项目数据的导入工具
│  ├─ shapefile-to-geojson.py          无第三方依赖的 CShapes Shapefile 转换器
│  ├─ sync-dist.ps1                   同步根目录与 dist
│  ├─ import-nastac-cshapes-europe.py NASTAC 矢量瓦片解码与早期边界导入
│  ├─ build-modern-geojson.py          生成现代 GeoJSON 源
│  ├─ import-modern-geojson.py         导入现代 GeoJSON 为前端数据层
│  └─ verify.mjs                      语法、引用和镜像一致性检查
├─ PROJECT_CONTEXT.md                 项目维护约定
└─ dist/                              静态发布副本
```

## CShapes-Europe 数据口径

[ETH Zurich CShapes 官方页面](https://icr.ethz.ch/data/cshapes/)说明：CShapes 2.0 提供独立国家和属地的边界、首都及有效期数据；CShapes-Europe 的时间范围从 1816 年开始，并提供 CSV、制表符文本、GeoJSON、Shapefile、SQL 和 R 等格式。项目使用的字段口径为：

- `gwcode`：实体代码（如果源文件提供）。
- `statename`：源数据名称。
- `startdate` / `enddate`：该边界记录的有效期。
- `status`：政治地位；`1` 表示独立国家，其它值保留为属地、保护关系或上下文记录。
- `capital`：源数据首都字段。
- `geometry`：Polygon 或 MultiPolygon 几何。

当前仓库已经导入 ETH Zurich 官方 CShapes 2.0 Shapefile：`euro-cshapes-official.js` 保存筛选后的正式欧洲 Polygon，覆盖 1886—2019 年。1816—1885 使用 NASTAC 平台实际加载的 CShapes-Europe 矢量瓦片接口 `/martin/cshapesEurope/0/0/0` 解码结果，写入 `euro-cshapes-europe-1816-1885.js`。2020—2026 使用 CShapes 2.0 正式数据中各国最近一期有效 Polygon 延展，不再加载本地 seed 或本地现代 GeoJSON；结果写入 `euro-cshapes-modern-2020-2026.js`，来源仍为 ETH Zurich CShapes 2.0。

`euro-cshapes.js` 保留原架构中的 seed 定义，但当前正式合并层不再加载任何 seed。早期导入脚本会解析 NASTAC/Martin 返回的 Mapbox Vector Tile，保留 `From`、`To`、`Name`、`Status`、`Capital` 和边界几何：

```powershell
python scripts/import-nastac-cshapes-europe.py
```

官方 CShapes 2.0 的 GeoJSON/Shapefile 转换仍使用 `scripts/import-cshapes-europe.mjs`；页面调试器则适合对单个实体和单个年份做局部替换。

历史现代 GeoJSON 的生成与导入流程（仅保留作数据迁移工具，当前地图不加载）为：

```powershell
python scripts/build-modern-geojson.py
python scripts/import-modern-geojson.py
```

## 来源、引用与许可

- [CShapes 官方数据页](https://icr.ethz.ch/data/cshapes/)
- [CShapes 2.0 Shapefile 压缩包](https://icr.ethz.ch/data/cshapes/CShapes-2.0.zip)
- [CShapes 可视化工具](https://cshapes.ethz.ch/)
- [ETH Zurich NASTAC 项目](https://nastac.ethz.ch/)
- [NASTAC WP4：历史边界与 CShapes-Europe 说明](https://icr.ethz.ch/research/nastac/wp4.html)
- [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

CShapes-Europe 官方引用信息见 CShapes 数据页。再分发官方数据时，应保留原始引用、来源链接和 CC BY-NC-SA 4.0 条款；本仓库的代码、近似 SVG、事件文字和外部数据分别按照各自来源处理。地图仅用于历史可视化，不构成现代边界或主权主张。

## 使用

在项目目录启动静态服务器：

```powershell
py -m http.server 8080
```

访问 `http://localhost:8080/`。也可以直接打开 `index.html`，但静态服务器更适合导入 JSON、读取本地配置和使用调试器。

基本交互：

- 拖动时间轴查看 1816—2026 年的边界与政体。
- 点击播放按钮，时间线到 2026 年自动停止。
- 点击实体打开名称、正式国名、统治集团、首都和事件详情。
- 使用“疆域调试”导入 SVG、GeoJSON、JSON 或地图数据 JS；导入结果绑定到当前实体和年份。
- 使用“疆域调试”中的“国名调试”仅平移地图国名；位置按实体＋年份保存，可导出本地 JSON 文件，不提供缩放和旋转。
- 使用“旗帜调试”调整当前实体的旗帜预览参数。

## 维护与验证

修改根目录后同步发布副本：

```powershell
powershell -NoProfile -File .\scripts\sync-dist.ps1
```

运行检查：

```powershell
node scripts/verify.mjs
```

验证脚本检查 JavaScript 语法、HTML 脚本引用，以及根目录与 `dist/` 的 SHA-256 镜像一致性。

## 当前限制

- 1816—1885 使用 NASTAC/CShapes-Europe 回溯矢量瓦片导入；1886—2019 使用 ETH Zurich CShapes 2.0 正式 Polygon；2020—2026 使用 ETH Zurich CShapes 2.0 最近一期正式 Polygon 延展至 2026 年。
- 地区概览地图标签使用中文简称；点击国家后，详情面板按年份显示正式国名和汉化首都。
- 普鲁士王国 1816—1885 作为历史兼容地区层保留；已删除东加里西亚地图要素。
- 旗帜按实体与年份加载 Wikimedia Commons 的真实历史旗帜，并裁切到完整国家边界形状。
- 1816—2026 的政体和事件目录是可扩展的前端资料层，不替代历史学术编纂。
- CShapes 的历史记录、名称、边界和地位字段应结合官方版本说明阅读，不能单凭颜色推断主权、实际控制或国际承认。
