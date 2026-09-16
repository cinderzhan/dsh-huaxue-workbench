window.__ModuleLoader__.load({
  id: 'dsh-local-workbenches',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    __CONTROLLER__
    const panelId = 'huaxue-workbench';
    function Navigation({ service }) {
      const state = React.useSyncExternalStore(service.subscribe, service.getSnapshot);
      return h('button', { type: 'button', onClick: async () => {
        try {
          if (!service.available('huaxue')) await service.install('huaxue');
          await service.enter('huaxue');
        } catch (e) { service.report(e); }
      }, style: { font: 'inherit', padding: '10px', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer' } },
      '花少2 · 花学工作台', state.error && h('span', { role: 'alert' }, '：' + state.error));
    }
    function MainPanel({ service }) {
      const state = React.useSyncExternalStore(service.subscribe, service.getSnapshot);
      const sessions = React.useSyncExternalStore(service.runtime.sessions.list.subscribe, service.runtime.sessions.list.getSnapshot);
      const entry = service.entries.get('huaxue');
      const history = sessions.ids.filter(id => state.bindings[id] === 'huaxue');
      return h('section', { 'aria-label': '花学工作台主页面', style: { position: 'relative', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' } },
        h('div', { style: { padding: '6px 16px', flex: 'none' } },
          h('label', null, '花学历史会话 ', h('select', { 'aria-label': '花学历史会话', value: sessions.current || '', onChange: e => { if (e.target.value) service.openSession(e.target.value); } },
            h('option', { value: '' }, '选择已有会话'), history.map(id => h('option', { key: id, value: id }, sessions.byId[id]?.displayTitle || id))))),
        h('div', { style: { position: 'relative', flex: 1, minHeight: 0 } },
          entry && h('div', { className: 'hx-portable-layer', style: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 } }, h(entry.Component, { runtime: service.runtime, workbench: service }))),
        state.error && h('p', { role: 'alert' }, state.error));
    }
    function ConversationSeat({ service, sessionId }) {
      const marker = React.useRef(null);
      React.useLayoutEffect(() => {
        service.setConversationRoot(marker.current?.closest('[data-phase]') || null);
        return () => service.setConversationRoot(null);
      }, [service, sessionId]);
      return h('span', { ref: marker, hidden: true });
    }
    function ConversationSurface({ service, usePanelInfo }) {
      const state = React.useSyncExternalStore(service.subscribe, service.getSnapshot);
      const list = React.useSyncExternalStore(service.runtime.sessions.list.subscribe, service.runtime.sessions.list.getSnapshot);
      const mainPanel = usePanelInfo(info => info.activePanelId);
      const entry = service.entries.get('huaxue');
      if (mainPanel !== null || !state.root || state.activeId !== 'huaxue' || state.bindings[list.current] !== 'huaxue' || !entry) return null;
      return h(entry.Component, { runtime: service.runtime, workbench: service });
    }
    function apply(ctx) {
      const persistence = {
        async read() { const r = await ctx.remote.settings.describe(); if (!r.ok) throw Error(r.error.message); return r.value.namespaces.find(n => n.ns === 'dsh-workbenches').value; },
        async mutate(ops) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const d = await ctx.remote.settings.describe(); if (!d.ok) throw Error(d.error.message);
            const row = d.value.namespaces.find(n => n.ns === 'dsh-workbenches');
            const r = await ctx.remote.settings.mutate('dsh-workbenches', ops, row.revision);
            if (r.ok) return r.value.value;
            if (r.error.code !== 'SETTINGS_CONFLICT' || attempt === 2) throw Error(r.error.message);
          }
        }
      };
      const service = new WorkbenchController(ctx, persistence);
      // Pass an explicit facade to business components instead of a Cordis context
      // which forbids reading services not declared in that plugin's inject list.
      service.runtime = { sessions: ctx.sessions, workspaces: ctx.workspaces, uiWorkspace: ctx.uiWorkspace, remote: ctx.remote, layout: ctx.layout, workbenches: service, emit: (...args) => ctx.emit(...args) };
      ctx.effect(() => ctx.reflect.provide('workbenches', service));
      ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: panelId, inject: () => ({ service }) }, MainPanel));
      ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({ name: 'conversation.input.dock', id: panelId, inject: sessionId => ({ service, sessionId }) }, ConversationSeat));
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: panelId, inject: () => ({ service }) }, ConversationSurface));
      ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({ name: 'sidebar.footer.action', id: panelId, label: '花学工作台', order: 14, inject: () => ({ service }) }, Navigation));
      ctx.effect(() => {
        let last;
        const sync = () => {
          const list = ctx.sessions.list.getSnapshot();
          if (!service.ready || list.phase !== 'ready' || list.current === last) return;
          last = list.current;
          if (last) service.onOpen(last);
        };
        const dispose = ctx.sessions.list.subscribe(sync);
        service.load().then(sync).catch(e => service.report(e));
        return dispose;
      });
    }
    return { apply, inject: ['slots', 'layout', 'sessions', 'workspaces', 'uiWorkspace', 'remote', 'remote.settings', 'remote.agentPresets'] };
  }
});
