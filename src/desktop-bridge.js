// Compatibility for the original game's runtime.workbenches calls. Desktop is
// the only owner of bindings and navigation; this adapter uses only the public
// desktopWorkbenches provider API.
export function createDesktopBridge(ctx, service, isActive, drafts = new Map()) {
  const state = () => service.getSnapshot().state;
  const available = () => isActive() && state().active === 'huaxue' && state().added.includes('huaxue');
  const assertActive = () => { if (!available()) throw Error('请先打开花学工作台，再重试。'); };
  const assertOwned = id => {
    assertActive();
    if (state().sessionBindings[id] !== 'huaxue') throw Error('请先创建或打开花学所属会话。');
  };
  const checkpoint = () => {
    const current = ctx.sessions.list.getSnapshot().current;
    return () => {
      assertActive();
      if (current !== ctx.sessions.list.getSnapshot().current) throw Error('会话已切换，请在当前花学会话中重试。');
    };
  };
  const workbenches = {
    assertActive, assertOwned, checkpoint,
    businessState(key, initial) {
      if (!drafts.has(key)) drafts.set(key, initial);
      return drafts.get(key);
    },
    async create({ workbenchId, workspaceId, background = false, initialize }) {
      assertActive();
      if (workbenchId !== 'huaxue') throw Error('不允许创建其他工作台的会话。');
      if (!workspaceId) throw Error('请选择工作区，或新建工作区后重试。');
      const parent = ctx.sessions.list.getSnapshot().current;
      const id = await service.newSession(workspaceId);
      assertOwned(id);
      if (initialize) await initialize(id);
      if (background && parent && state().sessionBindings[parent] === 'huaxue') await service.open('huaxue', parent);
      return id;
    },
  };
  const sessions = { list: ctx.sessions.list };
  sessions.binding = id => {
    const binding = ctx.sessions.binding(id);
    if (!binding?.session) return binding;
    return { ...binding, session: new Proxy(binding.session, {
      get(target, key) {
        const value = Reflect.get(target, key, target);
        if (key === 'prompt' || key === 'cancel') return (...args) => {
          assertOwned(id);
          return value.apply(target, args);
        };
        return typeof value === 'function' ? value.bind(target) : value;
      },
    }) };
  };
  return { workbenches, sessions, workspaces: ctx.workspaces, uiWorkspace: ctx.uiWorkspace, desktop: true };
}
