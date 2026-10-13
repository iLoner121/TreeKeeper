# TreeKeeper

[English](README.md)

把文件夹结构转化为链接图谱里的文件树
## 它能做什么

如果你的仓库按文件夹树组织，并且使用了文件夹笔记（Folder Note），TreeKeeper 会让每个文件夹笔记自动链接它的子内容。

每个文件夹笔记的末尾会有这样一个折叠 callout：

```markdown
> [!quote]- 🔗 Links
> [[Books]] · [[Film]] · [[Games]] · [[Music]]
```

![TreeKeeper 效果示意](assets/treekeeper-demo.png)

这些链接会在图谱graph view中永久显示，按字典序排列，并且可以动态更新：

- 新建笔记 → 立刻链入最近的文件夹笔记
- 删除笔记 → 链接移除
- 重命名或移动 → 链接移动
- 文件夹笔记自己又链到**它的父级**文件夹笔记，直到笔记库的根结点

任何笔记都能顺着 callout 爬回根节点，关系图谱里呈现出一棵与文件夹结构同构的清晰骨架。所有链接都是真正的双链，backlinks、出链面板和图谱全都认它们。

![关系图谱中的树](assets/treekeeper-graph.png)

这一切都是完全自动：TreeKeeper 用普通 wikilink 把结构组织起来，并随着你新增、删除、移动笔记持续维护。

## 适合谁

- 你在用 [Folder Note](https://github.com/xpgo/obsidian-folder-note) 插件，或总体上采用文件夹笔记的模式
- 你按 MOC 树组织知识——域、子域、项目
- 你希望关系图谱真正有意义，而不是一团乱麻

TreeKeeper 搭配 Folder Note 使用效果会比较理想

## 你可以自定义什么

这个块的外观可以完整自定义：

- **图标** —— 标题里的 emoji，默认 `🔗`，可留空
- **标题** —— 图标后的文字（上面例子里的 `Links`）
- **callout 类型** —— quote、note、tip，任何 Obsidian 认识的内置类型
- **默认折叠** —— 折叠、展开、或不可折叠
- **文件夹笔记命名** —— 在文件夹内或文件夹外，用 `MOC_{{folder_name}}` 这样的模板，或纯静态文件名
- **黑名单** —— 内容不参与索引的文件夹（收件箱、日志之类随你）

样式修改对**新写入立即生效**；点「应用到全部 callout」按钮则把存量块一次性刷成当前样式。

## 命令

都在命令面板的 "TreeKeeper" 分组下：

- **Fix MOC links (minimal writes)** —— 主力：让整个仓库收敛到正确状态，只改真正需要改的文件
- **Sync all MOC links (rebuild)** —— 同样结果，暴力重建
- **检查重复 / 错链 / 缺链 / 全部检查** —— 只读审计，结果输出到控制台
- **清理黑名单文件夹的 callout**、**移除重复链接** —— 定向清理

关于同步工具的一句提醒：如果你在多台设备上同时开启 TreeKeeper 并使用 Obsidian Sync（或任何文件同步），请注意插件会写文件——两台设备并发编辑时，极少数情况下可能产生同步冲突。TreeKeeper 对此做了适配（检测同步批次并延迟处理、写入是确定性的），但没有任何插件能百分百保证多端写入零冲突。把维护命令固定在一台设备上跑，风险就接近于零。

[Waypoint](https://github.com/IdreesInc/Waypoint) 是思路相似但方向不同的另一个插件——它生成的是文件夹内容的递归清单，而我们维护的是树骨架本身。

## 安装

即将上架社区插件目录。在那之前：从 [最新 Release](https://github.com/iLoner121/TreeKeeper/releases) 下载 `main.js` 和 `manifest.json`，放进 `仓库/.obsidian/plugins/tree-keeper/` 即可。

## 许可证

[MIT](LICENSE)
