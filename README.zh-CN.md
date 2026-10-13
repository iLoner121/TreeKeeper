# TreeKeeper

[English](README.md)

让每个文件夹笔记末尾的链接 callout 始终井井有条——你的文件夹树会出现在关系图谱里，而你从此不用再手工维护 MOC 链接列表。

## 它能做什么

如果你的仓库按文件夹树组织，并且每个文件夹有一个文件夹笔记（与文件夹同名的 MOC 笔记，或者你喜欢的任意 `{{folder_name}}` 命名模式），TreeKeeper 会让每个文件夹笔记自动链接它的子内容。

每个文件夹笔记的末尾会有这样一个折叠 callout：

```markdown
> [!quote]- 🔗 Links
> [[Books]] · [[Film]] · [[Games]] · [[Music]]
```

![TreeKeeper 效果示意](assets/treekeeper-demo.png)

这些链接是**真实的 wikilink**，按字典序排列，并且是活的：

- 新建笔记 → 立刻链入最近的文件夹笔记
- 删除笔记 → 链接随之消失
- 重命名或移动 → 链接跟着走
- 文件夹笔记自己又链到**它的父级**文件夹笔记，一路通到根

于是整棵树连通了：任何笔记都能顺着 callout 爬回根节点，关系图谱里呈现出一棵与文件夹结构同构的清晰骨架。这里没有任何 dataview 技巧——都是货真价实的 `[[链接]]`，backlinks、出链面板和图谱全都认它们。

![关系图谱中的树](assets/treekeeper-graph.png)

这一切都是自动的：TreeKeeper 用普通 wikilink 把结构组织起来，并随着你新增、删除、移动笔记持续维护。

## 适合谁

- 你在用 [Folder Note](https://github.com/xpgo/obsidian-folder-note) 插件，或总体上采用文件夹笔记约定
- 你按 MOC 树组织知识——域、子域、项目
- 你希望关系图谱真正有意义，而不是一团乱麻

TreeKeeper 和 Folder Note 是天生一对：Folder Note 负责「打开文件夹就是打开它的笔记」，TreeKeeper 负责让这些笔记之间的链接保持鲜活。两者都支持「笔记在文件夹内」和「笔记在文件夹外」两种风格，可以完美对齐。

## 你可以自定义什么

这个块的一切都是你的：

- **图标** —— 标题里的 emoji，默认 `🔗`，可留空
- **标题** —— 图标后的文字（上面例子里的 `Links`）
- **callout 类型** —— quote、note、tip，任何 Obsidian 认识的内置类型
- **默认折叠** —— 折叠、展开、或不可折叠
- **文件夹笔记命名** —— 在文件夹内或文件夹外，用 `MOC_{{folder_name}}` 这样的模板，或纯静态文件名
- **黑名单** —— 内容不参与索引的文件夹（收件箱、日志之类随你）

每个块都在标题里带着一个隐藏署名（`%% tree-keeper %%`）。阅读视图里看不见，但它让插件无论你怎么改样式都能认出自己的块——所以之后改图标、改标题都不会产生孤儿块。

样式修改对**新写入立即生效**；点「应用到全部 callout」按钮则把存量块一次性刷成当前样式。

## 命令

都在命令面板的 "TreeKeeper" 分组下：

- **Fix MOC links (minimal writes)** —— 主力：让整个仓库收敛到正确状态，只改真正需要改的文件
- **Sync all MOC links (rebuild)** —— 同样结果，暴力重建
- **检查重复 / 错链 / 缺链 / 全部检查** —— 只读审计，结果输出到控制台
- **清理黑名单文件夹的 callout**、**移除重复链接** —— 定向清理

关于同步工具的一句提醒：如果你在多台设备上同时开启 TreeKeeper 并使用 Obsidian Sync（或任何文件同步），请注意插件会写文件——两台设备并发编辑时，极少数情况下可能产生同步冲突。TreeKeeper 对此做了适配（检测同步批次并延迟处理、写入是确定性的），但没有任何插件能百分百保证多端写入零冲突。把维护命令固定在一台设备上跑，风险就接近于零。

[Waypoint](https://github.com/IdreesInc/Waypoint) 是思路相似但方向不同的另一个插件——它生成的是文件夹内容的递归清单，而我们维护的是树骨架本身。两者都写真实 wikilink，按你的思维方式选就行。

## 安装

即将上架社区插件目录。在那之前：从 [最新 Release](https://github.com/iLoner121/TreeKeeper/releases) 下载 `main.js` 和 `manifest.json`，放进 `仓库/.obsidian/plugins/tree-keeper/` 即可。

## 许可证

[MIT](LICENSE)
