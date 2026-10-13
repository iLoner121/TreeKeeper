const { Plugin, TFile, TFolder, Notice, PluginSettingTab, Setting, MarkdownRenderer, Modal } = require("obsidian");

// Fixed ownership signature — a hidden %% marker, not user-configurable.
const SIGNATURE = "tree-keeper";

const DEFAULT_SETTINGS = {
  blacklist: [],
  mocPosition: "inside",
  mocPattern: "{{folder_name}}",
  mocIcon: "🔗",
  mocTitle: "",
  mocCalloutType: "quote",
  mocFold: "-",
  autoUpdate: true,
};

// Minimal i18n (English + Chinese), keyed on Obsidian's language setting.
const STR = {
  en: {
    cmdSyncAll: "Sync all MOC links (rebuild)",
    cmdFix: "Fix MOC links (minimal writes)",
    cmdCheckDup: "Check duplicate links",
    cmdCheckWrong: "Check wrong links",
    cmdCheckMissing: "Check missing links",
    cmdCheckAll: "Check all links",
    cmdCleanup: "Clean blacklisted folders' callouts",
    cmdDedupe: "Remove duplicate links",
    busy: "TreeKeeper is busy — wait for the current run to finish.",
    secBehavior: "Behavior",
    nameAutoUpdate: "Update links automatically",
    descAutoUpdate: "Watch the vault and update callout links as notes are created, deleted, renamed or moved. Turn this off to make TreeKeeper fully manual — links then only change when you run the commands.",
    secStyle: "Callout style",
    secFolders: "Folder notes",
    nameType: "Callout type",
    descType: "The callout flavor. 'quote' is a neutral gray; any Obsidian callout type works.",
    nameFold: "Folded by default",
    descFold: "Reading view only. 'Collapsed': just the title bar shows until you click it — the link list is hidden inside. 'Expanded': the links are visible right away. 'Not foldable': always open, no toggle arrow.",
    foldCollapsed: "Collapsed (folded shut)",
    foldExpanded: "Expanded (open)",
    foldNone: "Not foldable",
    nameIcon: "Icon",
    descIcon: "Optional emoji shown at the start of the callout title. Leave empty for none.",
    nameTitle: "Title",
    descTitle: "Optional display text after the icon. Leave empty for none.",
    nameSig: "Signature",
    descSig: "A hidden %% marker (TOKEN) rides at the end of the callout title to identify this plugin's blocks. It is fixed, invisible in reading view, and not user-configurable — style changes never break block recognition.",
    nameApply: "Apply this style to existing callouts",
    descApply: "Style edits only affect new writes. Click here to restyle every recognized callout block at once (links are never touched).",
    btnApply: "Apply to all callouts…",
    namePos: "Folder note position",
    descPos: "Where a folder's note lives. 'Inside' means Folder/Note.md (matches the 'Inside the folder' mode of the Folder Note plugin); 'Outside' means the note sits next to the folder as its sibling.",
    posInside: "Inside the folder",
    posOutside: "Outside, next to the folder",
    namePattern: "Folder note filename",
    descPattern: "The note's filename (without .md). Use {{folder_name}} for the folder's name — e.g. 'MOC_{{folder_name}}' gives MOC_Books.md. Patterns without {{folder_name}} are static names, which only work in 'inside' mode. Changing this only affects future operations: run 'Fix MOC links' to converge the vault.",
    warnStaticOutside: "⚠️ A static filename in 'outside' mode collides: every child folder would map to the same note next to the parent. Use {{folder_name}} in outside mode.",
    nameBlacklist: "Blacklist folders",
    descBlacklist: "One vault-relative folder path per line. Nothing inside these folders is indexed or linked — except each folder's own folder note (per the position + filename settings above), which stays linked in the parent MOC. Changing this list does not re-scan automatically: run 'Fix MOC links' afterwards.",
    modalTitle: "Apply style to existing callouts?",
    modalWarn: "This rewrites the callout header in {blocks} block(s) across {files} file(s) to the currently configured style. Links are never touched. It cannot be undone in bulk (Ctrl+Z undoes only the last file).",
    modalCancel: "Cancel",
    modalApply: "Apply",
    applied: "Style applied: {n} file(s) updated",
  },
  zh: {
    cmdSyncAll: "同步全部 MOC 链接（重建）",
    cmdFix: "修复 MOC 链接（最小写入）",
    cmdCheckDup: "检查重复链接",
    cmdCheckWrong: "检查错误链接",
    cmdCheckMissing: "检查缺失链接",
    cmdCheckAll: "检查全部链接",
    cmdCleanup: "清理黑名单文件夹的 callout",
    cmdDedupe: "移除重复链接",
    busy: "TreeKeeper 正在运行中——请等待当前任务完成。",
    secBehavior: "行为",
    nameAutoUpdate: "自动更新链接",
    descAutoUpdate: "监听仓库，在笔记新建、删除、重命名或移动时自动更新 callout 链接。关闭后 TreeKeeper 变为全手动——只有运行命令时链接才会变化。",
    secStyle: "Callout 样式",
    secFolders: "文件夹笔记",
    nameType: "Callout 类型",
    descType: "callout 的样式基调。'quote' 是中性灰；任意 Obsidian 内置类型均可使用。",
    nameFold: "默认折叠状态",
    descFold: "仅影响阅读视图。'折叠'：默认只显示标题栏，点击才展开链接列表；'展开'：链接直接可见；'不可折叠'：始终展开，无折叠箭头。",
    foldCollapsed: "折叠（收起）",
    foldExpanded: "展开",
    foldNone: "不可折叠",
    nameIcon: "图标",
    descIcon: "callout 标题开头的可选 emoji，留空则不显示。",
    nameTitle: "标题",
    descTitle: "图标之后的可选文字，留空则不显示。",
    nameSig: "署名",
    descSig: "callout 标题末尾有一个隐藏的 %% 标记（TOKEN），用于识别本插件的块。它固定不变、阅读视图不可见、不可修改——样式随便改都不会影响识别。",
    nameApply: "将此样式应用到现有 callout",
    descApply: "样式修改只影响新写入。点击此处把当前样式一次性应用到所有已识别的 callout 块（绝不改动链接）。",
    btnApply: "应用到全部 callout…",
    namePos: "文件夹笔记位置",
    descPos: "文件夹笔记存放的位置。'文件夹内'即 Folder/Note.md（对应 Folder Note 插件的 Inside 模式）；'文件夹外'即笔记作为文件夹的兄弟文件存在。",
    posInside: "文件夹内部",
    posOutside: "文件夹外部（紧邻）",
    namePattern: "文件夹笔记文件名",
    descPattern: "笔记文件名（不含 .md）。用 {{folder_name}} 表示文件夹名——例如 'MOC_{{folder_name}}' 会得到 MOC_Books.md。不含 {{folder_name}} 的模式为静态名，仅在'文件夹内'模式下有效。修改只影响后续操作：运行「修复 MOC 链接」使全库收敛。",
    warnStaticOutside: "⚠️ '文件夹外'模式下使用静态文件名会发生冲突：每个子文件夹都会映射到父目录里的同名笔记。请在外部模式使用 {{folder_name}}。",
    nameBlacklist: "黑名单文件夹",
    descBlacklist: "每行一个仓库相对路径。这些文件夹内的内容不参与索引与链接——但文件夹自己的笔记（按上面的位置与文件名设置）仍会链接到父 MOC。修改后不会自动重扫：请运行「修复 MOC 链接」。",
    modalTitle: "将样式应用到现有 callout？",
    modalWarn: "此操作会把当前样式写入 {blocks} 个 callout 块（分布于 {files} 个文件）的标题行。链接不会被改动。无法批量撤销（Ctrl+Z 只能撤销最后一个文件）。",
    modalCancel: "取消",
    modalApply: "应用",
    applied: "样式已应用：{n} 个文件已更新",
  },
};

// Extract wikilink targets from a line, reduced to basenames.
// Handles [[X]], [[X|alias]], [[P/X]], [[X#h]], [[X^b]], embeds.
function extractLinks(text) {
  const links = [];
  const re = /\[\[([^\]|#^]+)\]\]/g;
  let m;
  while ((m = re.exec(text)) !== null) links.push(m[1].split("/").pop());
  return links;
}

module.exports = class TreeKeeperPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this._busy = false;
    this._pending = [];
    this._syncTimer = null;

    this.addSettingTab(new TreeKeeperSettingTab(this.app, this));

    this.registerEvent(this.app.vault.on("create", (f) => this.onCreated(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.onDeleted(f)));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => this.onRenamed(f, oldPath)));

    // With Obsidian Sync enabled: defer event processing while a sync batch
    // is applying remote changes, then drain once the batch settles.
    try {
      const s = this.app.internalPlugins && this.app.internalPlugins.plugins && this.app.internalPlugins.plugins.sync;
      const core = s && (s.instance || s);
      if (core && typeof core.on === "function") {
        this.registerEvent(core.on("vault-synced", () => this.drainPending()));
        this.registerEvent(core.on("status-change", (st) => { if (st !== "syncing") this.drainPending(); }));
      }
    } catch (e) { /* sync unavailable — events run immediately */ }

    this.addCommand({ id: "sync-all", name: this.t("cmdSyncAll"), callback: () => this.cmdSyncAll(true) });
    this.addCommand({ id: "fix-minimal", name: this.t("cmdFix"), callback: () => this.cmdSyncAll(false) });
    this.addCommand({ id: "check-duplicates", name: this.t("cmdCheckDup"), callback: () => this.cmdCheck("dupes") });
    this.addCommand({ id: "check-wrong-links", name: this.t("cmdCheckWrong"), callback: () => this.cmdCheck("wrong") });
    this.addCommand({ id: "check-missing-links", name: this.t("cmdCheckMissing"), callback: () => this.cmdCheck("missing") });
    this.addCommand({ id: "check-all", name: this.t("cmdCheckAll"), callback: () => this.cmdCheck("all") });
    this.addCommand({ id: "cleanup-blacklist", name: this.t("cmdCleanup"), callback: () => this.cmdCleanupBlacklist() });
    this.addCommand({ id: "remove-duplicates", name: this.t("cmdDedupe"), callback: () => this.cmdRemoveDuplicates() });

    console.log("TreeKeeper v2 loaded.");
  }

  async loadSettings() {
    const raw = (await this.loadData()) || {};
    // v2.4 → v2.5: the old "title" key held the emoji; split into icon + title.
    if (raw.mocIcon === undefined && raw.mocTitle !== undefined) {
      raw.mocIcon = raw.mocTitle;
      raw.mocTitle = "";
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
    await this.saveData(this.settings);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Obsidian stores its language preference in localStorage ("en", "zh", …).
  lang() {
    try {
      return String(localStorage.getItem("language") || "").startsWith("zh") ? "zh" : "en";
    } catch (e) {
      return "en";
    }
  }

  t(key) {
    const table = STR[this.lang()] || STR.en;
    return table[key] || STR.en[key] || key;
  }

  onunload() {
    if (this._syncTimer) clearTimeout(this._syncTimer);
  }

  // ---------- path rules ----------

  // Resolve a folder's note filename from the configured pattern.
  // The only supported dynamic token is {{folder_name}}; a pattern without
  // it (or any other {{...}} text) is treated as a static name.
  resolveMocName(folderName) {
    const pattern = this.settings.mocPattern || "{{folder_name}}";
    return pattern.includes("{{folder_name}}")
      ? pattern.split("{{folder_name}}").join(folderName)
      : pattern;
  }

  // Where a folder's note lives, per position + pattern.
  //   inside:  Folder/Note.md
  //   outside: Note.md next to the folder (sibling in the parent)
  mocPathFor(folderPath) {
    const parts = folderPath.split("/");
    const name = parts[parts.length - 1];
    const fileName = this.resolveMocName(name) + ".md";
    if (this.settings.mocPosition === "outside") {
      const parent = parts.slice(0, -1).join("/");
      return parent ? parent + "/" + fileName : fileName;
    }
    return folderPath + "/" + fileName;
  }

  // Blacklisted: inside a blacklisted subtree, EXCEPT the folder's own
  // folder note (per position + pattern), which stays indexed and linked
  // into the parent MOC.
  isBlacklisted(filePath) {
    return this.settings.blacklist.some((p) => {
      if (filePath !== p && !filePath.startsWith(p + "/")) return false;
      return filePath !== this.mocPathFor(p);
    });
  }

  // Plain subtree membership (landing MOC included) — used by cleanup.
  isUnderPrefix(filePath, prefix) {
    return filePath === prefix || filePath.startsWith(prefix + "/");
  }

  // ---------- indexes ----------

  buildPathIndex() {
    const set = new Set();
    for (const f of this.app.vault.getMarkdownFiles()) set.add(f.path);
    return set;
  }

  // existence: basename -> every file path (dead-link detection)
  // indexed:   basename -> .md paths outside blacklisted subtrees
  buildMaps() {
    const existence = new Map();
    const indexed = new Map();
    for (const f of this.app.vault.getFiles()) {
      const a = existence.get(f.basename) || [];
      a.push(f.path);
      existence.set(f.basename, a);
      if (f.extension === "md" && !this.isBlacklisted(f.path)) {
        const b = indexed.get(f.basename) || [];
        b.push(f.path);
        indexed.set(f.basename, b);
      }
    }
    return { existence, indexed };
  }

  // Nearest ancestor folder whose folder note exists (never the file itself).
  findMoc(filePath, indexPath) {
    const parts = filePath.split("/");
    parts.pop();
    while (parts.length) {
      const moc = this.mocPathFor(parts.join("/"));
      if (moc !== filePath && indexPath.has(moc)) return moc;
      parts.pop();
    }
    return null;
  }

  // For every MOC, the set of basenames whose nearest MOC it is.
  buildIdealIndex() {
    const indexPath = this.buildPathIndex();
    const maps = this.buildMaps();
    const mocSets = new Map();
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (this.isBlacklisted(f.path)) continue;
      const moc = this.findMoc(f.path, indexPath);
      if (!moc) continue;
      const s = mocSets.get(moc) || new Set();
      s.add(f.basename);
      mocSets.set(moc, s);
    }
    // Every folder's note path under the current position + pattern.
    const mocPaths = new Set();
    for (const f of this.app.vault.getAllLoadedFiles()) {
      if (f instanceof TFolder) mocPaths.add(this.mocPathFor(f.path));
    }
    return { indexPath, maps, mocSets, mocPaths };
  }

  // Ideal callout links for a file: non-empty only for folder-note files
  // that actually have indexed children.
  idealLinks(filePath, mocSets, mocPaths) {
    if (this.isBlacklisted(filePath)) return [];
    if (mocPaths.has(filePath)) {
      const set = mocSets.get(filePath);
      return set ? Array.from(set) : [];
    }
    return [];
  }

  // What does a callout link [[target]] refer to?
  //   dead / excluded / ambiguous / resolved
  resolveLink(target, maps) {
    const basename = target.split("/").pop();
    const any = maps.existence.get(basename);
    if (!any || any.length === 0) return { status: "dead" };
    const indexed = maps.indexed.get(basename);
    if (!indexed || indexed.length === 0) return { status: "excluded" };
    if (indexed.length === 1) return { status: "resolved", filePath: indexed[0] };
    if (target.includes("/")) {
      const m = indexed.filter((p) =>
        p === target || p === target + ".md" ||
        p.endsWith("/" + target) || p.endsWith("/" + target + ".md"));
      if (m.length === 1) return { status: "resolved", filePath: m[0] };
    }
    return { status: "ambiguous" };
  }

  // The hidden %% ownership token that rides in the callout title.
  sigToken() {
    return "%% " + SIGNATURE + " %%";
  }

  // The callout header line for the current style settings. Icon and title
  // are pure display (either may be empty); the hidden signature is appended
  // last, rightmost in the title bar.
  sentinel() {
    const type = (this.settings.mocCalloutType || "quote").trim() || "quote";
    const fold = this.settings.mocFold === "none" ? "" : this.settings.mocFold || "-";
    const icon = (this.settings.mocIcon || "").trim();
    const title = (this.settings.mocTitle || "").trim();
    let head = "> [!" + type + "]" + fold;
    if (icon) head += " " + icon;
    if (title) head += " " + title;
    return head + " " + this.sigToken();
  }

  // ---------- callout parsing / rewriting ----------

  // Parse our callout. Returns { start, bodyIndex, links } or null.
  // Recognition is signature-based (style-independent): the signature lives
  // in the title (current form) or, for blocks written by older versions,
  // on the body line. bodyIndex === -1 means a header with no body line yet.
  parseCallout(content) {
    const lines = content.split("\n");
    const sig = SIGNATURE;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("> [!")) continue;
      const bodyOk = i + 1 < lines.length && lines[i + 1].startsWith("> ") && !lines[i + 1].startsWith("> [!");
      if (lines[i].includes(sig)) {
        return bodyOk
          ? { start: i, bodyIndex: i + 1, links: extractLinks(lines[i + 1]), lines }
          : { start: i, bodyIndex: -1, links: [], lines };
      }
      if (bodyOk && lines[i + 1].includes(sig)) {
        return { start: i, bodyIndex: i + 1, links: extractLinks(lines[i + 1]), lines };
      }
    }
    return null;
  }

  // Rewrite the callout to exactly match `links` (unique + dictionary order)
  // and the configured style + signature. Returns null when the file already
  // matches — caller may skip writing.
  applyCallout(content, links) {
    const sorted = Array.from(new Set(links)).sort();
    const body = "> " + sorted.map((b) => "[[" + b + "]]").join(" · ");
    const sentinel = this.sentinel();
    const parsed = this.parseCallout(content);

    if (sorted.length === 0) {
      if (!parsed) return null;
      const lines = parsed.lines.slice();
      const count = parsed.bodyIndex > 0 ? 2 : 1;
      lines.splice(parsed.start, count);
      if (parsed.start > 0 && lines[parsed.start - 1].trim() === "") lines.splice(parsed.start - 1, 1);
      return lines.join("\n");
    }

    if (!parsed) {
      const lines = content.split("\n");
      let last = lines.length - 1;
      while (last >= 0 && lines[last].trim() === "") last--;
      if (last < 0) return sentinel + "\n" + body + "\n";
      const sep = lines[last].trim() === "---" ? "\n" : "\n\n---\n";
      return lines.slice(0, last + 1).join("\n") + sep + sentinel + "\n" + body + "\n";
    }

    if (parsed.bodyIndex > 0) {
      const same =
        parsed.links.join("\u0000") === sorted.join("\u0000") &&
        parsed.lines[parsed.start] === sentinel &&
        parsed.lines[parsed.bodyIndex] === body;
      if (same) return null;
      const lines = parsed.lines.slice();
      lines[parsed.start] = sentinel;
      lines[parsed.bodyIndex] = body;
      return lines.join("\n");
    }

    // Bare sentinel (no body line yet): insert the body after it.
    const lines = parsed.lines.slice();
    lines[parsed.start] = sentinel;
    lines.splice(parsed.start + 1, 0, body);
    return lines.join("\n");
  }

  // ---------- incremental ops (live events) ----------

  async linkOne(filePath) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file) return;
    const indexPath = this.buildPathIndex();
    const moc = this.findMoc(filePath, indexPath);
    if (!moc) return;
    const mocFile = this.app.vault.getAbstractFileByPath(moc);
    if (!mocFile) return;
    let content;
    try {
      content = await this.app.vault.read(mocFile);
    } catch (e) {
      return; // file vanished mid-operation (e.g. rapid deletes)
    }
    const parsed = this.parseCallout(content);
    const probe = parsed ? parsed.links.slice() : [];
    // Fast path: already perfect (link present, sorted, two-line) — skip write.
    if (probe.indexOf(file.basename) !== -1 && this.applyCallout(content, probe) === null) return moc;
    // Re-check existence right before writing: vault.process would resurrect
    // a file that was deleted between our read and the write.
    if (!this.app.vault.getAbstractFileByPath(moc)) return moc;
    try {
      await this.app.vault.process(mocFile, (c) => {
        const p = this.parseCallout(c);
        const links = p ? p.links.slice() : [];
        if (links.indexOf(file.basename) === -1) links.push(file.basename);
        return this.applyCallout(c, links) || c;
      });
    } catch (e) {
      // file vanished mid-operation (e.g. rapid deletes)
    }
    return moc;
  }

  async unlinkOne(filePath) {
    const indexPath = this.buildPathIndex();
    const moc = this.findMoc(filePath, indexPath);
    if (!moc) return;
    const mocFile = this.app.vault.getAbstractFileByPath(moc);
    if (!mocFile) return;
    const basename = filePath.split("/").pop().replace(/\.md$/, "");
    let content;
    try {
      content = await this.app.vault.read(mocFile);
    } catch (e) {
      return; // file vanished mid-operation (e.g. rapid deletes)
    }
    const parsed = this.parseCallout(content);
    if (!parsed || parsed.links.indexOf(basename) === -1) return;
    // Re-check existence right before writing (see linkOne).
    if (!this.app.vault.getAbstractFileByPath(moc)) return moc;
    try {
      await this.app.vault.process(mocFile, (c) => {
        const p = this.parseCallout(c);
        if (!p) return c;
        const links = p.links.filter((b) => b !== basename);
        return this.applyCallout(c, links) || c;
      });
    } catch (e) {
      // file vanished mid-operation (e.g. rapid deletes)
    }
    return moc;
  }

  onCreated(file) {
    if (!this.settings.autoUpdate) return;
    if (!(file instanceof TFile) || file.extension !== "md") return;
    if (this.isBlacklisted(file.path)) return;
    this.dispatch({ type: "add", path: file.path });
  }

  onDeleted(file) {
    if (!this.settings.autoUpdate) return;
    if (!(file instanceof TFile) || file.extension !== "md") return;
    if (this.isBlacklisted(file.path)) return;
    this.dispatch({ type: "remove", path: file.path });
  }

  onRenamed(file, oldPath) {
    if (!this.settings.autoUpdate) return;
    if (file instanceof TFolder) {
      // Folder rename/move: re-anchor its folder note in the parent MOC.
      this.dispatch({ type: "remove", path: this.mocPathFor(oldPath) });
      this.dispatch({ type: "add", path: this.mocPathFor(file.path) });
      return;
    }
    if (!(file instanceof TFile) || file.extension !== "md") return;

    const wasB = this.isBlacklisted(oldPath);
    const isB = this.isBlacklisted(file.path);
    if (wasB && isB) return;
    if (wasB !== isB) {
      this.dispatch(wasB ? { type: "add", path: file.path } : { type: "remove", path: oldPath });
      return;
    }
    const indexPath = this.buildPathIndex();
    const oldMoc = this.findMoc(oldPath, indexPath);
    const newMoc = this.findMoc(file.path, indexPath);
    const oldBase = oldPath.split("/").pop().replace(/\.md$/, "");
    if (oldMoc === newMoc && oldBase === file.basename) return; // nothing changed
    this.dispatch({ type: "remove", path: oldPath });
    this.dispatch({ type: "add", path: file.path });
  }

  // Is Obsidian Sync actively applying remote changes right now?
  // Used to defer events that likely arrived from another device.
  isSyncActive() {
    try {
      const s = this.app.internalPlugins && this.app.internalPlugins.plugins && this.app.internalPlugins.plugins.sync;
      if (!s || !s.enabled) return false;
      const core = s.instance || s;
      if (typeof core.getStatus === "function") return core.getStatus() === "syncing";
      if (typeof s.getSyncStatus === "function") return s.getSyncStatus() === "syncing";
      return false;
    } catch (e) {
      return false;
    }
  }

  dispatch(op) {
    if (this._busy) {
      this._pending.push(op);
      return;
    }
    if (this.isSyncActive()) {
      // Likely a remote change streamed in by sync: defer until the batch
      // settles so we don't race with the synced MOC content.
      this._pending.push(op);
      this.scheduleSyncDrain();
      return;
    }
    this.runOp(op);
  }

  scheduleSyncDrain() {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this._syncTimer = null;
      this.drainPending();
    }, 3000);
  }

  async runOp(op) {
    if (op.type === "add") return await this.linkOne(op.path);
    else return await this.unlinkOne(op.path);
  }

  async drainPending() {
    if (this._busy) return; // long commands drain explicitly at their end
    const touched = new Set();
    while (this._pending.length) {
      const moc = await this.runOp(this._pending.shift());
      if (moc) touched.add(moc);
    }
    // Self-heal: after a (usually sync-driven) burst, re-verify every
    // touched MOC against the ideal computed from the full, current vault.
    // This corrects links that were written while the vault view was still
    // partial mid-sync (e.g. a deep note delivered before its folder note).
    if (touched.size) {
      await this.healMocs(Array.from(touched));
    }
  }

  // Rewrite each given MOC's callout to exactly match its ideal link set.
  async healMocs(mocList) {
    const { mocSets, mocPaths } = this.buildIdealIndex();
    for (const moc of mocList) {
      const f = this.app.vault.getAbstractFileByPath(moc);
      if (!f) continue;
      let content;
      try {
        content = await this.app.vault.read(f);
      } catch (e) {
        continue;
      }
      const ideal = mocPaths.has(moc) && mocSets.has(moc) ? Array.from(mocSets.get(moc)) : [];
      const next = this.applyCallout(content, ideal);
      if (next === null) continue;
      if (!this.app.vault.getAbstractFileByPath(moc)) continue;
      try {
        await this.app.vault.process(f, (c) => this.applyCallout(c, ideal) || c);
      } catch (e) {
        // file vanished mid-operation
      }
    }
  }

  acquire() {
    if (this._busy) {
      new Notice(this.t("busy"));
      return false;
    }
    this._busy = true;
    return true;
  }

  release() {
    this._busy = false;
  }

  // ---------- commands ----------

  async cmdSyncAll(force) {
    if (!this.acquire()) return;
    try {
      const { mocSets, mocPaths } = this.buildIdealIndex();
      const files = this.app.vault.getMarkdownFiles();
      const label = force ? "Sync (rebuild)" : "Fix (minimal)";
      const notice = new Notice(label + ": 0/" + files.length, 0);
      let changed = 0, added = 0, removed = 0;
      for (let i = 0; i < files.length; i++) {
        if (i % 50 === 0) notice.setMessage(label + ": " + i + "/" + files.length);
        const f = files[i];
        const ideal = this.idealLinks(f.path, mocSets, mocPaths);
        const content = await this.app.vault.read(f);
        const next = this.applyCallout(content, ideal);
        if (next === null) {
          const parsed = this.parseCallout(content);
          if (force && (parsed || ideal.length > 0)) {
            await this.app.vault.process(f, (c) => c); // brute force: rewrite anyway
          }
          continue;
        }
        const p = this.parseCallout(content);
        const cur = new Set(p ? p.links : []);
        const idealSet = new Set(ideal);
        for (const b of ideal) if (!cur.has(b)) added++;
        for (const b of cur) if (!idealSet.has(b)) removed++;
        changed++;
        await this.app.vault.process(f, (c) => this.applyCallout(c, ideal) || c);
      }
      notice.hide();
      new Notice(label + " done: " + changed + " files changed, +" + added + " / -" + removed + " links");
      console.log("TreeKeeper: " + label + " done, " + changed + " files changed (+" + added + " / -" + removed + ")");
    } finally {
      this.release();
      await this.drainPending();
    }
  }

  // One read-only scan producing the three check sets.
  async scanAll() {
    const { indexPath, maps, mocSets, mocPaths } = this.buildIdealIndex();
    const files = this.app.vault.getMarkdownFiles();
    const dupes = [];
    const wrong = [];
    const missing = [];
    for (const f of files) {
      const content = await this.app.vault.read(f);
      const parsed = this.parseCallout(content);
      const links = parsed ? parsed.links : [];
      const ideal = new Set(this.idealLinks(f.path, mocSets, mocPaths));
      const seen = new Map();
      for (const target of links) {
        const b = target.split("/").pop();
        seen.set(b, (seen.get(b) || 0) + 1);
        if (ideal.has(b)) continue;
        const d = this.resolveLink(target, maps);
        if (d.status === "ambiguous") continue; // cannot judge
        let reason;
        if (d.status === "dead") reason = "dead link";
        else if (d.status === "excluded") reason = "target is in a blacklisted subtree";
        else reason = "home is " + (this.findMoc(d.filePath, indexPath) || "nowhere");
        wrong.push({ path: f.path, target: b, reason });
      }
      for (const [b, n] of seen) if (n > 1) dupes.push({ path: f.path, basename: b, count: n });
      if (mocSets.has(f.path)) {
        const cur = new Set(links);
        for (const b of mocSets.get(f.path)) if (!cur.has(b)) missing.push({ path: f.path, basename: b });
      }
    }
    return { dupes, wrong, missing };
  }

  async cmdCheck(kind) {
    if (!this.acquire()) return;
    try {
      const notice = new Notice("Checking links...", 0);
      const { dupes, wrong, missing } = await this.scanAll();
      notice.hide();
      const parts = [];
      if (kind === "dupes" || kind === "all") parts.push("duplicates: " + dupes.length);
      if (kind === "wrong" || kind === "all") parts.push("wrong: " + wrong.length);
      if (kind === "missing" || kind === "all") parts.push("missing: " + missing.length);
      new Notice("Check done — " + parts.join(" | ") + " (details in console)", 10000);
      console.log("=== TreeKeeper check (" + kind + ") ===");
      if (kind === "dupes" || kind === "all") {
        console.log("--- duplicates (" + dupes.length + ") ---");
        for (const d of dupes) console.log(d.path + ": [[" + d.basename + "]] x" + d.count);
      }
      if (kind === "wrong" || kind === "all") {
        console.log("--- wrong links (" + wrong.length + ") ---");
        for (const w of wrong) console.log(w.path + ": [[" + w.target + "]] — " + w.reason);
      }
      if (kind === "missing" || kind === "all") {
        console.log("--- missing links (" + missing.length + ") ---");
        for (const m of missing) console.log(m.path + ": [[" + m.basename + "]] missing");
      }
      if (dupes.length + wrong.length + missing.length === 0) console.log("All clean.");
    } finally {
      this.release();
    }
  }

  async cmdCleanupBlacklist() {
    if (!this.acquire()) return;
    try {
      let cleaned = 0;
      for (const prefix of this.settings.blacklist) {
        const files = this.app.vault.getMarkdownFiles().filter((f) => this.isUnderPrefix(f.path, prefix));
        for (const f of files) {
          const content = await this.app.vault.read(f);
          if (!this.parseCallout(content)) continue;
          const next = this.applyCallout(content, []);
          if (next === null) continue;
          await this.app.vault.process(f, (c) => this.applyCallout(c, []) || c);
          cleaned++;
        }
      }
      new Notice("Blacklist cleanup done: " + cleaned + " file(s) cleaned");
      console.log("TreeKeeper: blacklist cleanup done, " + cleaned + " files cleaned");
    } finally {
      this.release();
      await this.drainPending();
    }
  }

  async cmdRemoveDuplicates() {
    if (!this.acquire()) return;
    try {
      let fixed = 0;
      for (const f of this.app.vault.getMarkdownFiles()) {
        const content = await this.app.vault.read(f);
        const parsed = this.parseCallout(content);
        if (!parsed || parsed.links.length === 0) continue;
        if (new Set(parsed.links).size === parsed.links.length) continue;
        await this.app.vault.process(f, (c) => {
          const p = this.parseCallout(c);
          return p ? (this.applyCallout(c, p.links) || c) : c;
        });
        fixed++;
      }
      new Notice("Duplicate removal done: " + fixed + " file(s) fixed");
      console.log("TreeKeeper: duplicate removal done, " + fixed + " files fixed");
    } finally {
      this.release();
    }
  }

  // Count callout blocks carrying the plugin's signature (title form +
  // legacy body-marker form), without modifying anything.
  async countSignature() {
    let blocks = 0;
    let files = 0;
    for (const f of this.app.vault.getMarkdownFiles()) {
      const content = await this.app.vault.read(f);
      if (!content.includes(SIGNATURE)) continue;
      const lines = content.split("\n");
      let fileHit = 0;
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith("> [!")) continue;
        if (lines[i].includes(SIGNATURE)) fileHit++;
        else if (i + 1 < lines.length && lines[i + 1].startsWith("> ") && !lines[i + 1].startsWith("> [!") && lines[i + 1].includes(SIGNATURE)) fileHit++;
      }
      if (fileHit) {
        files++;
        blocks += fileHit;
      }
    }
    return { blocks, files };
  }

  // Restyle every existing callout block to the currently configured
  // header (type/fold/icon/title). Links are never touched. Also migrates
  // legacy forms: strips old body markers and old span-form titles.
  async applyCalloutStyle() {
    const sentinel = this.sentinel();
    const token = this.sigToken();
    let changed = 0;
    for (const f of this.app.vault.getMarkdownFiles()) {
      const content = await this.app.vault.read(f);
      if (!content.includes(SIGNATURE)) continue;
      const lines = content.split("\n");
      let touched = false;
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith("> [!")) continue;
        const hasBody = i + 1 < lines.length && lines[i + 1].startsWith("> ") && !lines[i + 1].startsWith("> [!");
        if (lines[i].includes(SIGNATURE) || (hasBody && lines[i + 1].includes(SIGNATURE))) {
          if (lines[i] !== sentinel) {
            lines[i] = sentinel;
            touched = true;
          }
          if (hasBody && lines[i + 1].includes(token)) {
            const stripped = lines[i + 1].split(token).join("").trimEnd();
            if (stripped !== lines[i + 1]) {
              lines[i + 1] = stripped;
              touched = true;
            }
          }
        }
      }
      if (touched) {
        await this.app.vault.process(f, () => lines.join("\n"));
        changed++;
      }
    }
    return changed;
  }
};

class TreeKeeperSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    const t = (k) => this.plugin.t(k);
    containerEl.empty();
    containerEl.createEl("h2", { text: "TreeKeeper" });

    // Live preview of the callout block as configured right now.
    const previewEl = containerEl.createDiv();
    const renderPreview = () => {
      previewEl.empty();
      MarkdownRenderer.render(
        this.app,
        this.plugin.sentinel() + "\n> [[Alpha]] · [[Beta]]",
        previewEl,
        "",
        this.plugin
      );
    };
    renderPreview();

    new Setting(containerEl).setName(t("secBehavior")).setHeading();

    new Setting(containerEl)
      .setName(t("nameAutoUpdate"))
      .setDesc(t("descAutoUpdate"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.autoUpdate !== false).onChange(async (v) => {
          this.plugin.settings.autoUpdate = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName(t("secStyle")).setHeading();

    new Setting(containerEl)
      .setName(t("nameType"))
      .setDesc(t("descType"))
      .addDropdown((d) => {
        for (const type of ["quote", "note", "abstract", "info", "tip", "success", "question", "warning", "danger", "example"]) {
          d.addOption(type, type);
        }
        d.setValue(this.plugin.settings.mocCalloutType).onChange(async (v) => {
          this.plugin.settings.mocCalloutType = v;
          await this.plugin.saveSettings();
          renderPreview();
        });
      });

    new Setting(containerEl)
      .setName(t("nameFold"))
      .setDesc(t("descFold"))
      .addDropdown((d) =>
        d
          .addOption("-", t("foldCollapsed"))
          .addOption("+", t("foldExpanded"))
          .addOption("none", t("foldNone"))
          .setValue(this.plugin.settings.mocFold)
          .onChange(async (v) => {
            this.plugin.settings.mocFold = v;
            await this.plugin.saveSettings();
            renderPreview();
          })
      );

    new Setting(containerEl)
      .setName(t("nameIcon"))
      .setDesc(t("descIcon"))
      .addText((txt) =>
        txt
          .setPlaceholder("🔗")
          .setValue(this.plugin.settings.mocIcon)
          .onChange(async (v) => {
            this.plugin.settings.mocIcon = v.trim();
            await this.plugin.saveSettings();
            renderPreview();
          })
      );

    new Setting(containerEl)
      .setName(t("nameTitle"))
      .setDesc(t("descTitle"))
      .addText((txt) =>
        txt
          .setPlaceholder("Links")
          .setValue(this.plugin.settings.mocTitle)
          .onChange(async (v) => {
            this.plugin.settings.mocTitle = v.trim();
            await this.plugin.saveSettings();
            renderPreview();
          })
      );

    new Setting(containerEl)
      .setName(t("nameSig"))
      .setDesc(t("descSig").replace("TOKEN", this.plugin.sigToken()));

    new Setting(containerEl)
      .setName(t("nameApply"))
      .setDesc(t("descApply"))
      .addButton((b) =>
        b
          .setButtonText(t("btnApply"))
          .setWarning()
          .onClick(async () => {
            const n = await this.plugin.countSignature();
            new StyleApplyModal(this.app, this.plugin, n).open();
          })
      );

    new Setting(containerEl).setName(t("secFolders")).setHeading();

    new Setting(containerEl)
      .setName(t("namePos"))
      .setDesc(t("descPos"))
      .addDropdown((d) =>
        d
          .addOption("inside", t("posInside"))
          .addOption("outside", t("posOutside"))
          .setValue(this.plugin.settings.mocPosition)
          .onChange(async (v) => {
            this.plugin.settings.mocPosition = v;
            await this.plugin.saveSettings();
            updateWarn();
          })
      );

    new Setting(containerEl)
      .setName(t("namePattern"))
      .setDesc(t("descPattern"))
      .addText((txt) =>
        txt
          .setPlaceholder("{{folder_name}}")
          .setValue(this.plugin.settings.mocPattern)
          .onChange(async (v) => {
            this.plugin.settings.mocPattern = v.trim() || "{{folder_name}}";
            await this.plugin.saveSettings();
            updateWarn();
          })
      );

    const warnEl = containerEl.createEl("p", { cls: "setting-item-description" });
    const updateWarn = () => {
      const bad =
        this.plugin.settings.mocPosition === "outside" &&
        !this.plugin.settings.mocPattern.includes("{{folder_name}}");
      warnEl.setText(bad ? t("warnStaticOutside") : "");
    };
    updateWarn();

    new Setting(containerEl)
      .setName(t("nameBlacklist"))
      .setDesc(t("descBlacklist"))
      .addTextArea((ta) => {
        ta.setPlaceholder("MyFolder/Inbox\nMyFolder/Logbook")
          .setValue(this.plugin.settings.blacklist.join("\n"))
          .onChange(async (v) => {
            this.plugin.settings.blacklist = v
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => s.replace(/^\/+|\/+$/g, ""));
            await this.plugin.saveSettings();
          });
      });
  }
}

class StyleApplyModal extends Modal {
  constructor(app, plugin, count) {
    super(app);
    this.plugin = plugin;
    this.count = count;
  }

  onOpen() {
    const { contentEl } = this;
    const t = (k) => this.plugin.t(k);
    contentEl.createEl("h3", { text: t("modalTitle") });
    const warn = contentEl.createEl("p");
    warn.style.color = "var(--text-error)";
    warn.style.fontWeight = "bold";
    warn.setText(
      t("modalWarn").replace("{blocks}", String(this.count.blocks)).replace("{files}", String(this.count.files))
    );
    const row = contentEl.createDiv({ cls: "modal-button-container" });
    const cancel = row.createEl("button", { text: t("modalCancel") });
    cancel.addEventListener("click", () => this.close());
    const ok = row.createEl("button", { text: t("modalApply"), cls: "mod-warning" });
    ok.addEventListener("click", async () => {
      this.close();
      const n = await this.plugin.applyCalloutStyle();
      new Notice(t("applied").replace("{n}", String(n)));
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

/* nosourcemap */
/* nosourcemap */