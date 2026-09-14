// Local Desktop host contract v1. This is an implemented local API, not an upstream SDK.
export class WorkbenchController {
  constructor(runtime, persistence) {
    this.runtime = runtime;
    this.persistence = persistence;
    this.entries = new Map();
    this.listeners = new Set();
    this.business = new Map();
    this.covered = new Set();
    this.state = { activeId: '', recent: {}, bindings: {}, installed: {}, pinned: [], workspace: {} };
    this.ready = false;
    this.error = '';
    this.root = null;
    this.center = null;
    this.queue = Promise.resolve();
    this.epoch = 0;
    this.protocolVersion = 1;
    this.publish();
  }
  getSnapshot = () => this.snapshot;
  subscribe = fn => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  publish() {
    if (this.root) {
      this.root.inert = !!this.marketOpen || this.covered.has(this.state.activeId);
      this.root.style.visibility = this.root.inert ? 'hidden' : '';
    }
    this.snapshot = { ...this.state, initializingId: this.initializingId, ready: this.ready, error: this.error, entries: [...this.entries.values()], root: this.root, center: this.center };
    for (const fn of this.listeners) fn();
    this.runtime.emit?.('workbenches/change');
  }
  async load() {
    this.state = { ...this.state, ...await this.persistence.read() };
    this.ready = true;
    this.publish();
  }
  report(error) { this.error = error?.message || String(error); this.publish(); }
  update(ops) {
    const job = this.queue.then(async () => {
      this.state = await this.persistence.mutate(ops);
      this.error = '';
      this.publish();
    });
    this.queue = job.catch(error => this.report(error));
    return job;
  }
  set(path, value) { return { op: 'set', path, value }; }
  register(entry) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.id) || this.entries.has(entry.id)) throw Error('工作台标识无效或已注册');
    this.entries.set(entry.id, entry); this.publish();
    return () => { this.entries.delete(entry.id); this.publish(); };
  }
  available(id) { return !!this.entries.has(id) && this.state.installed[id] === true; }
  owner(id) { return this.state.bindings[id]; }
  setSurface(key, node) {
    if (node) { if (this[key] !== node) { this[key] = node; this.publish(); } return; }
    const previous = this[key];
    // React may detach an old ref after attaching the replacement during a session change.
    queueMicrotask(() => { if (this[key] === previous && previous && !previous.isConnected) { this[key] = null; this.publish(); } });
  }
  setConversationRoot = root => this.setSurface('root', root);
  setCenter = center => this.setSurface('center', center);
  coverConversation(id, covered) {
    if (covered) this.covered.add(id); else this.covered.delete(id);
    if (this.root) { this.root.inert = !!this.marketOpen || this.covered.has(this.state.activeId); this.root.style.visibility = this.root.inert ? 'hidden' : ''; }
  }
  async install(id) {
    if (!this.entries.has(id)) throw Error('工作台插件尚未加载');
    await this.update([this.set(['installed', id], true)]);
  }
  async uninstall(id) {
    ++this.epoch;
    await this.update([this.set(['installed', id], false), this.set(['pinned'], this.state.pinned.filter(x => x !== id)), ...(this.state.activeId === id ? [this.set(['activeId'], '')] : [])]);
    if (this.owner(this.runtime.sessions.list.getSnapshot().current) === id) this.runtime.sessions.clear();
  }
  async reorder(id, before) {
    const pinned = this.state.pinned.filter(x => x !== id);
    if (!this.state.pinned.includes(id)) return;
    const index = pinned.indexOf(before);
    pinned.splice(index < 0 ? pinned.length : index, 0, id);
    await this.update([this.set(['pinned'], pinned)]);
  }
  async enter(id, options = {}) {
    if (!this.ready || !this.available(id)) throw Error('工作台尚未安装或正在加载');
    const epoch = ++this.epoch;
    await this.update([this.set(['activeId'], id), ...(!this.state.pinned.includes(id) ? [this.set(['pinned'], [...this.state.pinned, id])] : [])]);
    if (epoch !== this.epoch) return;
    if (this.entries.get(id).entryBehavior === 'picker') {
      this.initializingId = id;
      this.runtime.sessions.clear();
      this.publish();
      return;
    }
    const sid = this.state.recent[id];
    if (sid && this.owner(sid) === id && this.runtime.sessions.list.getSnapshot().byId[sid]) this.runtime.sessions.open(sid);
    else {
      this.runtime.sessions.clear();
      const entry = this.entries.get(id);
      if ((options.initialization || entry.firstOpen?.mode) === 'new-session') {
        await this.create({ workbenchId: id, workspaceId: options.workspaceId || entry.firstOpen?.workspaceId });
      }
    }
  }
  async leave() {
    ++this.epoch;
    await this.update([this.set(['activeId'], '')]);
    this.runtime.sessions.clear();
  }
  // Called by the host's native session-open path, before staging its single composer.
  onOpen(sid) {
    if (!this.ready) return;
    this.initializingId = undefined;
    ++this.epoch;
    const id = this.owner(sid);
    const activeId = this.available(id) ? id : '';
    this.state = { ...this.state, activeId, recent: activeId ? { ...this.state.recent, [activeId]: sid } : this.state.recent };
    this.publish();
    this.update([this.set(['activeId'], activeId), ...(activeId ? [this.set(['recent', activeId], sid)] : [])]).catch(() => {});
    if (id && !activeId) this.report(Error('该会话的工作台已卸载。会话与资料仍保留，可从工作台管理重新加载。'));
  }
  async restore() {
    const epoch = this.epoch;
    if (!this.ready || this.runtime.sessions.list.getSnapshot().phase !== 'ready') return false;
    const id = this.state.activeId;
    if (id && this.available(id)) {
      const sid = this.state.recent[id];
      if (epoch !== this.epoch) return true;
      if (sid && this.owner(sid) === id && this.runtime.sessions.list.getSnapshot().byId[sid]) this.runtime.sessions.open(sid);
      else this.runtime.sessions.clear();
    } else if (id) { await this.update([this.set(['activeId'], '')]); this.runtime.sessions.clear(); }
    return true;
  }
  async create({ workbenchId = this.state.activeId, workspaceId, background = false, initialize } = {}) {
    if (!this.available(workbenchId)) throw Error('请先加载工作台');
    const entry = this.entries.get(workbenchId);
    const epoch = this.epoch;
    const spaces = this.runtime.workspaces.list.getSnapshot().items;
    const current = this.runtime.sessions.list.getSnapshot().current;
    const target = workspaceId || this.state.workspace[workbenchId] || spaces.find(w => w.sessionIds.includes(current))?.workspaceId;
    if (!target || !spaces.some(w => w.workspaceId === target)) throw Error('请先选择工作区');
    const sid = await this.runtime.sessions.create({ workspaceId: target });
    if (entry.defaultPreset) {
      const result = await this.runtime.remote.agentPresets.select(sid, entry.defaultPreset);
      if (!result.ok) throw Error(result.error.message);
    }
    await entry.initialize?.(sid);
    await initialize?.(sid);
    await this.update([this.set(['bindings', sid], workbenchId), this.set(['workspace', workbenchId], target), ...(!background ? [this.set(['recent', workbenchId], sid)] : [])]);
    if (!background && epoch === this.epoch && this.state.activeId === workbenchId) this.runtime.sessions.open(sid);
    return sid;
  }
  newSession(workspaceId) {
    return this.create({ workspaceId }).catch(error => { this.report(error); });
  }
  businessState(id, initial) {
    if (!this.business.has(id)) this.business.set(id, typeof initial === 'function' ? initial() : initial);
    return this.business.get(id);
  }
}
