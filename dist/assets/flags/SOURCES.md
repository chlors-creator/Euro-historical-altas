# 欧洲历史旗帜资源说明

地图悬浮旗帜不再使用程序化色块。`modules/flags.js` 按实体 ID 和观察年份选择 Wikimedia Commons 的真实历史旗帜，并将旗帜图像裁切到该年的完整国界路径；如果历史文件无法加载，才回退到该实体的通用旗帜文件。

已接入的历史来源示例：

- [普鲁士王国旗（1892—1918）](https://commons.wikimedia.org/wiki/File:Flag_of_Prussia_(1892-1918).svg)
- [德意志帝国旗](https://commons.wikimedia.org/wiki/File:Flag_of_the_German_Empire.svg)
- [奥斯曼帝国旗（1844—1922）](https://commons.wikimedia.org/wiki/File:Flag_of_the_Ottoman_Empire.svg)
- [俄罗斯帝国旗（1858—1896）](https://commons.wikimedia.org/wiki/File:Flag_of_Russia_(1858%E2%80%931896).svg)
- [苏联国旗（1922—1923）](https://commons.wikimedia.org/wiki/File:Flag_of_the_Soviet_Union_(1922%E2%80%931923).svg)
- [俄罗斯苏维埃联邦社会主义共和国旗（1937—1954）](https://commons.wikimedia.org/wiki/File:Flag_of_the_Russian_Soviet_Federative_Socialist_Republic_(1937%E2%80%931954).svg)
- [奥地利联邦国旗（1934—1938）](https://commons.wikimedia.org/wiki/File:State_flag_of_Austria_(1934%E2%80%931938).svg)
- [奥地利国旗（1230—1934、1945—2000）](https://commons.wikimedia.org/wiki/File:Flag_of_Austria_(1230%E2%80%931934,_1945%E2%80%932000).svg)
- [奥匈帝国旗（1867—1918）](https://commons.wikimedia.org/wiki/File:Flag_of_Austria-Hungary_(1867-1918).svg)
- [意大利王国旗](https://commons.wikimedia.org/wiki/File:Flag_of_Kingdom_of_Italy.png)
- [Wikimedia Commons 历史旗帜分类](https://commons.wikimedia.org/wiki/Category:Historical_flags)

文件名、实体 ID、有效年份与备用文件均记录在 `modules/flags.js` 的共享 `FLAG_PERIODS` 表中；同一历史时段的起止年份和旗帜文件只定义一次。由于旗帜使用 Commons 的正式 SVG/PNG 资源，直接打开本地 HTML 时需要浏览器允许网络资源；通过本地 HTTP 服务器运行地图即可正常加载。

边界来源与历史数据来源见项目根目录 [`README.md`](../../README.md)；CShapes-Europe 官方数据页为 [ETH Zurich CShapes](https://icr.ethz.ch/data/cshapes/)。
