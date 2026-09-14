window.__ModuleLoader__.load({
  id: 'dsh-local-workbenches',
  factory(require) {
    const React = require('react');
    const { createPortal } = require('react-dom');
    const h = React.createElement;
    __CONTROLLER__
    const ns = 'dsh-workbenches';
    const css = `.dsh-wb-nav{display:flex;flex-direction:column;gap:3px;padding:4px 0 10px;flex:none}.dsh-wb-nav button{font:inherit;color:inherit;background:transparent;border:0;text-align:left;padding:8px 10px;border-radius:8px;cursor:pointer}.dsh-wb-nav button:hover,.dsh-wb-nav button[aria-current=true]{background:var(--dsw-alias-interactive-bg-hover,#e5e4e1)}.dsh-wb-nav button[aria-current=true]{font-weight:600}.dsh-wb-nav small{font-size:11px;padding:8px 10px 2px;color:#85858b}.dsh-wb-layer{position:absolute;inset:0;pointer-events:none;z-index:20}.dsh-wb-layer[hidden]{display:none}.dsh-wb-market{pointer-events:auto;position:absolute;inset:0;overflow:auto;background:var(--dsw-alias-bg-base,#fafaf8);color:var(--dsw-alias-label-primary,#272728);padding:36px;box-sizing:border-box;font:14px 'Microsoft YaHei',sans-serif}.dsh-wb-market header{display:flex;align-items:center;gap:16px}.dsh-wb-market header button{margin-left:auto}.dsh-wb-market article{border:1px solid #dedcd9;border-radius:12px;padding:24px;margin-top:20px;max-width:620px}.dsh-wb-market button{font:inherit;padding:8px 14px;margin-right:8px;border:1px solid #dedcd9;border-radius:6px;background:transparent;color:inherit;cursor:pointer}.dsh-wb-market p{line-height:1.8}.dsh-wb-market img{width:100%;max-height:220px;object-fit:contain}.dsh-wb-error{position:fixed;bottom:20px;left:280px;right:30px;z-index:1000;padding:12px;background:#fff1ed;color:#8d2920;border:1px solid #e0ada5;border-radius:8px;pointer-events:auto}.dsh-wb-error button{float:right}.dsh-wb-placeholder{position:absolute;inset:0;background:var(--dsw-alias-bg-base,#fafaf8);pointer-events:auto;display:grid;place-content:center;text-align:center}`;
    function Navigation({ service, wide = true }) {
      const state = React.useSyncExternalStore(service.subscribe, service.getSnapshot);
      return h('nav', { className: 'dsh-wb-nav', 'aria-label': '工作台导航' },
        h('button', { title: '工作台市场', onClick: () => service.showMarket('market') }, wide ? '▦  工作台' : '▦'),
        wide && state.pinned.length > 0 && h('small', null, '我的工作台'),
        state.pinned.filter(id => service.available(id)).map(id => h('button', {
          key: id, title: service.entries.get(id).name, draggable: true,
          'aria-current': state.activeId === id, onClick: () => service.enter(id).catch(e => service.report(e)),
          onDragStart: e => e.dataTransfer.setData('application/x-dsh-workbench', id),
          onDragOver: e => e.preventDefault(), onDrop: e => { e.preventDefault(); service.reorder(e.dataTransfer.getData('application/x-dsh-workbench'), id).catch(err => service.report(err)); }
        }, wide ? service.entries.get(id).name : '花')),
        state.activeId && h('button', { title: '返回通用聊天', onClick: () => service.leave().catch(e => service.report(e)) }, wide ? '返回通用聊天' : '↩'));
    }
    function Market({ service, tab, close }) {
      const state = React.useSyncExternalStore(service.subscribe, service.getSnapshot);
      const [selectedTab, setTab] = React.useState(tab);
      const [busy, setBusy] = React.useState(false);
      const entries = state.entries.filter(e => selectedTab === 'market' || state.installed[e.id]);
      async function run(fn) { setBusy(true); try { await fn(); } catch(e) { service.report(e); } finally { setBusy(false); } }
      return h('section', { className: 'dsh-wb-market', 'aria-label': '工作台管理' },
        h('header', null, h('h1', null, '工作台'), h('button', { onClick: close, 'aria-label': '关闭工作台管理' }, '关闭')),
        h('nav', null, h('button', { 'aria-pressed': selectedTab === 'market', onClick: () => setTab('market') }, '工作台市场'), h('button', { 'aria-pressed': selectedTab === 'mine', onClick: () => setTab('mine') }, '我的工作台')),
        h('p', null, '本地工作台 · 加载后从侧边栏进入，继续使用原生 Agent 对话。'),
        entries.length === 0 && h('p', null, '暂未添加工作台。'),
        entries.map(entry => h('article', { key: entry.id }, h('h2', null, entry.name), h('p', null, entry.description), entry.preview && h('img', { src: entry.preview, alt: entry.name + '界面预览' }),
          h('p', null, '版本 ' + entry.version + ' · 本机 DSH Desktop 0.8.2'), h('p', null, '首次使用：选择工作区和旅伴；模型沿用 DSH 设置。'),
          !state.installed[entry.id] ? h('button', { disabled: busy, onClick: () => run(() => service.install(entry.id)) }, '添加') : h(React.Fragment, null,
            h('button', { disabled: busy, onClick: () => run(async () => { await service.enter(entry.id); close(); }) }, '加载工作台'),
            h('button', { disabled: busy, onClick: () => run(() => service.uninstall(entry.id)) }, '卸载工作台'),
            h('small', null, '卸载仅停用工作台入口，保留所有会话、配置与文件。')))));
    }
    function Surfaces({ service }) {
      const state = React.useSyncExternalStore(service.subscribe, service.getSnapshot);
      const [market, setMarket] = React.useState(null);
      React.useEffect(() => { service.marketOpen = !!market; service.publish(); return () => { service.marketOpen = false; service.publish(); }; }, [service, market]);
      React.useEffect(() => { service.showMarket = setMarket; return () => { service.showMarket = () => {}; }; }, [service]);
      if (!state.center) return null;
      return createPortal(h(React.Fragment, null,
        state.entries.filter(entry => state.installed[entry.id]).map(entry => h('div', { key: entry.id, className: 'dsh-wb-layer', hidden: state.activeId !== entry.id || !!market, 'data-workbench-id': entry.id }, h(entry.Component, { runtime: service.runtime, workbench: service }))),
        market && h('div', { className: 'dsh-wb-layer' }, h(Market, { service, tab: market, close: () => setMarket(null) })),
        state.error && h('div', { className: 'dsh-wb-error', role: 'alert' }, state.error, h('button', { onClick: () => { service.error = ''; service.publish(); } }, '关闭'))
      ), state.center);
    }
    function apply(ctx) {
      const persistence = {
        async read() { const res = await ctx.remote.settings.describe(); if (!res.ok) throw Error(res.error.message); return res.value.namespaces.find(r => r.ns === ns).value; },
        async mutate(ops) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const desc = await ctx.remote.settings.describe(); if (!desc.ok) throw Error(desc.error.message);
            const row = desc.value.namespaces.find(r => r.ns === ns);
            const res = await ctx.remote.settings.mutate(ns, ops, row.revision);
            if (res.ok) return res.value.value;
            if (res.error.code !== 'SETTINGS_CONFLICT' || attempt === 2) throw Error(res.error.message);
          }
        }
      };
      const service = new WorkbenchController(ctx, persistence);
      service.showMarket = () => {};
      ctx.effect(() => ctx.reflect.provide('workbenches', service));
      ctx.effect(() => { const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); return () => style.remove(); });
      ctx.slots.inject('sidebar.workbenches', () => ctx.slots.register({ name: 'sidebar.workbenches', inject: () => ({ service }) }, Navigation));
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'dsh-workbench-host', inject: () => ({ service }) }, Surfaces));
      // The host patches expose these seats through ref callbacks. Query once to cover late plugin loading.
      service.setCenter(document.querySelector('[data-dsh-workbench-center]'));
      service.setConversationRoot(document.querySelector('[data-phase]'));
      // Desktop can mount/replace its layout after plugin activation, without replaying old refs.
      ctx.effect(() => {
        const refreshSeats = () => {
          service.setCenter(document.querySelector('[data-dsh-workbench-center]'));
          service.setConversationRoot(document.querySelector('[data-dsh-workbench-center] [data-phase="hero"], [data-dsh-workbench-center] [data-phase="chat"]'));
        };
        const observer = new MutationObserver(refreshSeats);
        observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
        refreshSeats();
        return () => observer.disconnect();
      });
      let restored = false;
      const restore = () => { if (!restored && service.ready && ctx.sessions.list.getSnapshot().phase === 'ready') {
        const id = service.state.activeId;
        if (id && service.state.installed[id] && !service.entries.has(id)) return;
        restored = true; service.restore().catch(e => service.report(e));
      } };
      ctx.effect(() => service.subscribe(restore));
      ctx.effect(() => ctx.sessions.list.subscribe(restore));
      service.load().then(() => { queueMicrotask(restore); }).catch(e => service.report(e));
    }
    return { apply, inject: ['slots', 'sessions', 'workspaces', 'uiWorkspace', 'remote', 'remote.settings', 'remote.agentPresets'], WorkbenchController };
  }
});
