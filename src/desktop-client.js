window.__ModuleLoader__.load({
  id: 'dsh-huaxue-workbench',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    // __BUSINESS__
    // __BRIDGE__
    const business = businessDef.factory(require);
    const drafts = new Map();
    const ns = 'huaxue-workbench';
    const css = `
      .hx-desktop{position:relative;isolation:isolate;contain:layout paint;display:flex;flex:1;min-width:0;min-height:0;width:100%;max-width:100%;overflow:hidden;box-sizing:border-box;color:var(--dsw-alias-label-primary,var(--text-primary,#292929));background:var(--dsw-alias-bg-layer-1,#fff)}
      .hx-desktop[hidden]{display:none!important}
      .hx-desktop-business{position:relative;order:2;flex:0 0 320px;min-width:0;overflow:auto;padding:18px 24px 22px;box-sizing:border-box;background:#fbfaf8;border-left:1px solid #dedcd9;scrollbar-width:thin;font-family:'Microsoft YaHei',sans-serif}
      .hx-desktop-picker{position:absolute;inset:0;z-index:8;display:block;overflow:auto;padding:24px clamp(24px,4vw,56px) 40px;border:0;background:#fafaf8}
      .hx-desktop-brand{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 8px}.hx-desktop-brand h2{margin:0;font-size:20px;line-height:32px;letter-spacing:-.01em}.hx-desktop-brand p{margin:0;color:#777;font-size:12px}.hx-desktop-picker .hx-desktop-brand{min-height:52px;border-bottom:1px solid #dedcd9}.hx-desktop-picker .hx-desktop-brand label{margin-left:auto;font-size:12px;color:#555}.hx-desktop-picker .hx-desktop-brand select,.hx-desktop-picker .hx-desktop-brand button{height:32px;padding:4px 10px;border:1px solid #dedcd9;border-radius:4px;background:#fff;color:inherit;font:inherit}
      .hx-picker-heading{max-width:680px;margin:42px auto 30px;text-align:center}.hx-picker-heading p{margin:0 0 10px;color:var(--dsw-alias-label-secondary,#777);font-size:13px}.hx-picker-heading h1{margin:0;font-size:clamp(24px,2.4vw,34px);line-height:1.25;letter-spacing:-.035em;text-wrap:balance}
      .hx-picker-people{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;max-width:820px;margin:0 auto}.hx-picker-people button{min-width:0}
      .hx-desktop-people-title{margin:20px 0 8px;font-size:16px}.hx-desktop-people{display:grid;gap:5px}
      .hx-desktop-person{display:grid;grid-template-columns:48px minmax(0,1fr) 8px;align-items:center;gap:14px;width:100%;min-height:64px;padding:7px 12px 7px 8px;border:0;border-radius:8px;background:transparent;color:#69696d;text-align:left;transition:background .16s ease,color .16s ease}
      .hx-desktop-person:hover:not(:disabled){background:#f1f0ed}.hx-desktop-person[aria-pressed=true]{background:#f5e6e3;color:#272728}.hx-desktop-person:focus-visible{outline:2px solid #d34339;outline-offset:2px}.hx-desktop-person img{width:48px;height:48px;object-fit:contain}.hx-desktop-person span{min-width:0;font-size:15px}.hx-desktop-person[aria-pressed=true] span{font-weight:700}.hx-desktop-person i{width:7px;height:7px;border:1px solid #d6d3d0;border-radius:50%}.hx-desktop-person[aria-pressed=true] i{border-color:#d34339;background:#d34339}.hx-desktop-person small{grid-column:1/-1;color:#777;font-size:11px;line-height:17px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .hx-desktop-picker .hx-desktop-person{display:flex;flex-direction:column;justify-content:flex-start;padding:14px 10px;text-align:center}.hx-desktop-picker .hx-desktop-person img{width:56px;height:64px}.hx-desktop-picker .hx-desktop-person small{display:-webkit-box;min-height:51px}
      .hx-desktop-game{margin:0 0 8px}.hx-desktop-game .hx-game-card{width:100%}.hx-desktop-opening{display:flex;gap:12px;align-items:flex-start;margin:12px 0 0;padding:12px 14px;border-radius:8px;background:#f8efec;color:#666;font-size:12px;line-height:19px}.hx-desktop-opening img{width:34px;height:40px;object-fit:contain;flex:none}
      .hx-secondary-action{width:100%;margin-top:8px;padding:8px 10px;border:0;border-radius:8px;background:rgba(255,255,255,.72);color:inherit;font-weight:550}.hx-secondary-action:hover:not(:disabled){background:#fff}.hx-desktop-disclaimer{display:block;margin-top:auto;padding-top:18px;color:#69696d;font-size:11px}
      .hx-desktop-conversation{position:relative;display:flex;flex:1;flex-direction:column;min-width:0;min-height:0;overflow:hidden}
      .hx-desktop-conversation>div{z-index:1}.hx-desktop-background{position:absolute;inset:58px 0 0;pointer-events:none}
      .hx-desktop-sessionbar{position:relative;z-index:2;display:flex;align-items:center;gap:10px;min-height:58px;padding:7px 18px 7px 24px;border-bottom:1px solid #dedcd9;background:#fafaf8}.hx-desktop-identity{display:flex;align-items:center;gap:9px;margin-right:auto}.hx-desktop-identity img{width:36px;height:42px;object-fit:contain}.hx-desktop-identity b{display:block;font-size:18px;line-height:20px}.hx-desktop-identity small{display:block;color:#777;font-size:10px}.hx-desktop-sessionbar label{display:flex;align-items:center;gap:6px;font-size:12px;color:#555}.hx-desktop-sessionbar select,.hx-desktop-sessionbar button{height:32px;max-width:220px;padding:4px 10px;border:1px solid #dedcd9;border-radius:4px;background:#fff;color:inherit;font:inherit}.hx-desktop-sessionbar select{min-width:160px}.hx-desktop-sessionbar button{white-space:nowrap}.hx-desktop-sessionbar button:disabled{opacity:.45}.hx-desktop-sessionbar select:focus-visible,.hx-desktop-sessionbar button:focus-visible{outline:2px solid #d34339;outline-offset:2px}.hx-desktop-sessionbar .hx-return{border-color:transparent;background:transparent;color:#69696d}
      .hx-desktop .hx-play,.hx-desktop .hx-play.hx-play-detail[open]{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;box-sizing:border-box;z-index:10;margin:0;overflow:auto}
      .hx-desktop .hx-play-footer{position:absolute!important;max-width:100%}
      .hx-desktop .hx-play-layout{min-height:0;max-width:100%}
      .hx-desktop .hx-dialog{position:absolute!important;inset:16px!important;transform:none!important;width:auto!important;height:auto;max-width:calc(100% - 32px)!important;max-height:calc(100% - 32px)!important;margin:auto!important;z-index:11}
      .hx-desktop button,.hx-desktop select{cursor:pointer}.hx-desktop button:disabled{cursor:default}
      @container workbench-conversation (max-width:980px){.hx-picker-people{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:1100px){.hx-desktop-business:not(.hx-desktop-picker){flex-basis:280px}.hx-desktop-sessionbar{flex-wrap:wrap}.hx-desktop-identity{width:100%}.hx-desktop-sessionbar label{flex:1}.hx-desktop-sessionbar select{width:100%;min-width:0}}
      @media(max-width:760px){.hx-desktop{flex-direction:column}.hx-desktop-business:not(.hx-desktop-picker){order:2;flex:0 0 238px;border-left:0;border-top:1px solid #dedcd9;padding:12px 16px}.hx-desktop-picker{padding:20px}.hx-picker-heading{margin:18px auto}.hx-picker-people{grid-template-columns:repeat(2,minmax(0,1fr))}.hx-desktop-people{grid-template-columns:repeat(2,minmax(0,1fr))}.hx-desktop-person{min-height:54px;grid-template-columns:40px minmax(0,1fr) 8px}.hx-desktop-person img{width:40px;height:40px}.hx-desktop-game,.hx-desktop-opening{display:none}.hx-desktop .hx-play-layout{grid-template-columns:minmax(0,1fr)}.hx-desktop .hx-play-sidebar{display:none}}
    `;
    function apply(ctx) {
      const service = ctx.desktopWorkbenches;
      const unwrap = async promise => {
        const result = await promise;
        if (!result.ok) throw Error(result.error?.message || '花学设置读取失败');
        return result.value;
      };
      const api = {
        describe: () => unwrap(ctx.remote.settings.describe()),
        mutate: (namespace, ops, revision) => unwrap(ctx.remote.settings.mutate(namespace, ops, revision)),
        subscribe: cb => ctx.remote.$on('settings/document-updated', changed => { if (changed === ns) cb(); }),
      };
      ctx.effect(business.installStyles);
      ctx.effect(() => {
        const style = document.createElement('style'); style.textContent = css;
        document.head.appendChild(style); return () => style.remove();
      });
      function DesktopPanel({ active, conversation }) {
        const activeRef = React.useRef(active); activeRef.current = active;
        const runtime = React.useMemo(() => createDesktopBridge(ctx, service, () => activeRef.current, drafts), []);
        React.useEffect(() => () => { activeRef.current = false; }, []);
        const host = React.useSyncExternalStore(service.subscribe, service.getSnapshot);
        const sessions = React.useSyncExternalStore(cb => ctx.sessions.list.subscribe(cb), () => ctx.sessions.list.getSnapshot());
        const workspaces = React.useSyncExternalStore(cb => ctx.workspaces.list.subscribe(cb), () => ctx.workspaces.list.getSnapshot());
        const [view, setView] = React.useState(null);
        const [error, setError] = React.useState('');
        const [busy, setBusy] = React.useState(false);
        const busyRef = React.useRef(false);
        const selection = runtime.workbenches.businessState('selection', { workspaceId: '' });
        const defaultWorkspaceId = workspaces.items.find(w => w.sessionIds.includes(sessions.current))?.workspaceId || workspaces.items[0]?.workspaceId || '';
        const [workspaceId, setWorkspaceId] = React.useState(selection.workspaceId || defaultWorkspaceId);
        const [dialog, setDialog] = React.useState(null);
        const gameContext = React.useRef(null);
        const chatRoot = React.useRef(null);
        const owned = host.state.sessionBindings[sessions.current] === 'huaxue' && host.state.added.includes('huaxue');
        const sid = owned ? sessions.current : undefined;
        const record = view?.value.sessions?.[sid];
        const selected = record?.activeMemberId || view?.value.lastMemberId || 'ning';
        const person = business.members.find(m => m.id === selected);
        React.useEffect(() => {
          let live = true;
          const read = () => api.describe().then(data => {
            if (live) setView(data.namespaces.find(row => row.ns === ns));
          }).catch(e => { if (live) setError(e.message); });
          read(); const dispose = api.subscribe(read);
          return () => { live = false; dispose(); };
        }, []);
        React.useEffect(() => {
          if (!active) {
            gameContext.current = null;
            setDialog(null);
            return;
          }
          // Creating a background game session briefly changes current before
          // the bridge restores the parent. Keep the full-screen game mounted
          // across that internal transition; other dialogs still follow the
          // foreground session.
          setDialog(current => current === 'game' ? current : null);
        }, [active, sessions.current]);
        React.useEffect(() => {
          if (workspaceId || !defaultWorkspaceId) return;
          selection.workspaceId = defaultWorkspaceId;
          setWorkspaceId(defaultWorkspaceId);
        }, [workspaceId, defaultWorkspaceId]);
        React.useEffect(() => {
          if (!active || !owned || !chatRoot.current) return;
          const root = chatRoot.current;
          const feed = runtime.sessions.binding(sid)?.session?.eventSource;
          const decorate = () => {
            business.decorateAnalysis(root);
            const identities = { ...(record?.turnMembers || {}) };
            let turn;
            for (const entry of feed?.getSnapshot().entries || []) {
              const event = entry.event;
              if (event.type === 'turn/start') turn = event.data.turn;
              if ((event.type === 'request/header' || event.type === 'system/message') && turn !== undefined) {
                const system = event.type === 'system/message' ? JSON.stringify(event.data.message) : event.data.header?.system;
                const match = typeof system === 'string' && system.match(/\[huaxue:[^:\]]+:(mao|qing|ning|chen|jing|yang|zheng)\]/);
                if (match) identities[turn] = match[1];
              }
            }
            business.decorateThinking(root, identities);
          };
          let frame;
          const observer = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(decorate); });
          observer.observe(root, { childList: true, subtree: true, characterData: true }); decorate();
          const unsubscribe = feed?.subscribe(decorate);
          return () => {
            observer.disconnect(); unsubscribe?.(); cancelAnimationFrame(frame);
            root.querySelectorAll('.hx-analysis-surface,.hx-analysis-part,.hx-persona-thinking').forEach(node => {
              node.classList.remove('hx-analysis-surface', 'hx-analysis-part', 'hx-analysis-first', 'hx-analysis-last', 'hx-persona-thinking');
              node.style.removeProperty('--hx-turn-avatar'); delete node.dataset.hxSpeaker;
            });
          };
        }, [active, owned, sid, record]);
        async function run(action) {
          if (busyRef.current) return;
          busyRef.current = true; setBusy(true); setError('');
          try { runtime.workbenches.assertActive(); await action(); }
          catch (e) { setError(e.message); }
          finally { busyRef.current = false; setBusy(false); }
        }
        async function mutate(ops) {
          const data = await api.describe();
          const row = data.namespaces.find(row => row.ns === ns);
          if (!row) throw Error('花学服务未就绪，请检查 Desktop server 插件和归属服务。');
          const result = await api.mutate(ns, ops, row.revision); setView(result);
        }
        function choose(id) { return run(async () => {
          const stillCurrent = runtime.workbenches.checkpoint();
          const data = await api.describe(); stillCurrent();
          const row = data.namespaces.find(row => row.ns === ns);
          if (!row) throw Error('花学服务未就绪');
          const ops = [{ op: 'set', path: ['lastMemberId'], value: id }];
          if (sid) {
            runtime.workbenches.assertOwned(sid);
            ops.push({ op: 'set', path: ['sessions', sid, 'activeMemberId'], value: id });
          }
          setView(await api.mutate(ns, ops, row.revision));
          stillCurrent();
          if (!sid && workspaceId) await runtime.workbenches.create({ workbenchId: 'huaxue', workspaceId, initialize: newId => mutate([
            { op: 'set', path: ['sessions', newId], value: { activeMemberId: id, initialMemberId: id } },
          ]) });
          else if (!sid) {
            const newId = await service.newWorkspaceSession();
            if (!newId) return;
            const createdWorkspace = ctx.workspaces.list.getSnapshot().items.find(item => item.sessionIds.includes(newId));
            if (createdWorkspace) { selection.workspaceId = createdWorkspace.workspaceId; setWorkspaceId(createdWorkspace.workspaceId); }
            await mutate([{ op: 'set', path: ['sessions', newId], value: { activeMemberId: id, initialMemberId: id } }]);
          }
        }); }
        function create(newWorkspace = false) { return run(async () => {
          if (newWorkspace) {
            const id = await service.newWorkspaceSession();
            if (!id) return;
            const createdWorkspace = ctx.workspaces.list.getSnapshot().items.find(item => item.sessionIds.includes(id));
            if (createdWorkspace) { selection.workspaceId = createdWorkspace.workspaceId; setWorkspaceId(createdWorkspace.workspaceId); }
            await mutate([{ op: 'set', path: ['sessions', id], value: { activeMemberId: selected, initialMemberId: selected } }]);
            return;
          }
          await runtime.workbenches.create({ workbenchId: 'huaxue', workspaceId, initialize: id => mutate([
            { op: 'set', path: ['sessions', id], value: { activeMemberId: selected, initialMemberId: selected } },
          ]) });
        }); }
        return h('section', { className: 'hx-desktop', hidden: !active, 'aria-label': '花学工作台' },
          h('aside', { className: 'hx-desktop-business' + (!owned ? ' hx-desktop-picker' : ''), 'aria-label': owned ? '今日旅伴' : '选择花学旅伴' },
            h('header', { className: 'hx-desktop-brand' }, h('h2', null, owned ? '今日旅伴' : '花少2 · 花学工作台'), owned ? null : h(React.Fragment, null,
              h('label', null, '工作区 ', h('select', { 'aria-label': '花学工作区', value: workspaceId, disabled: busy, onChange: e => { selection.workspaceId = e.target.value; setWorkspaceId(e.target.value); } }, h('option', { value: '' }, '选择已有工作区'), workspaces.items.map(w => h('option', { key: w.workspaceId, value: w.workspaceId }, w.title || w.name || w.path)))),
              h('button', { disabled: busy || !view, onClick: () => create(true) }, '新建工作区并开始对话'))),
            !owned && h('div', { className: 'hx-picker-heading' }, h('p', null, '花学研讨会，今天开麦。'), h('h1', null, '今天，你想和哪位花学老师“创飞”所有人？')),
            owned && h('div', { className: 'hx-desktop-game' }, h('button', { className: 'hx-game-card', disabled: busy || !view, onClick: () => { gameContext.current = { parentSessionId: sid, selected }; setDialog('game'); }, 'aria-label': '打开第八位嘉宾游戏' }, h('div', { className: 'hx-game-screen' }, h('strong', null, '第八位嘉宾'), h('small', null, '7 / 8 READY'), h('span', null, business.members.map(m => h('i', { key: m.id, style: { backgroundImage: 'url(' + JSON.stringify(m.avatar) + ')' } })), h('em', null, '+'))), h('div', { className: 'hx-game-controls' }, h('span', { className: 'hx-dpad', 'aria-hidden': true }, '✚'), h('b', null, '▶ 进入游戏'), h('span', { className: 'hx-ab', 'aria-hidden': true }, 'A　B')))),
            owned && h('h3', { className: 'hx-desktop-people-title' }, '七人成员'),
            h('div', { className: !owned ? 'hx-picker-people' : 'hx-desktop-people' }, business.members.map(m => h('button', { key: m.id, className: 'hx-desktop-person', disabled: busy || !view, 'aria-pressed': selected === m.id, onClick: () => choose(m.id) }, h('img', { src: m.avatar, alt: m.name + '头像' }), h('span', null, m.name), owned && h('i', { 'aria-hidden': true }), !owned && h('small', null, m.quote)))),
            !owned && h('p', { className: 'hx-desktop-opening' }, h('img', { src: person.avatar, alt: person.name + '头像' }), h('span', null, person.opening)),
            !owned && h('p', null, '可先选择旅伴、浏览场景；向 Agent 接话前，请创建花学会话。'),
            error && h('p', { role: 'alert' }, error), h('small', { className: 'hx-desktop-disclaimer' }, '角色化演绎 · 非本人发言')),
          h('section', { className: 'hx-desktop-conversation', ref: chatRoot, 'aria-label': '原生会话' },
            view?.value.skin?.image && h('span', { className: 'hx-desktop-background', style: { backgroundImage: `url(${JSON.stringify(view.value.skin.image)})`, opacity: view.value.skin.opacity, backgroundPosition: view.value.skin.position, backgroundSize: view.value.skin.fit, backgroundRepeat: 'no-repeat' } }),
            h('div', { className: 'hx-desktop-sessionbar' }, h('div', { className: 'hx-desktop-identity' }, h('img', { src: person.avatar, alt: person.name + '头像' }), h('div', null, h('b', null, person.name), h('small', null, '花少2'))),
              h('label', null, '工作区', h('select', { 'aria-label': '花学工作区', value: workspaceId, disabled: busy, onChange: e => { selection.workspaceId = e.target.value; setWorkspaceId(e.target.value); } }, h('option', { value: '' }, '选择已有工作区'), workspaces.items.map(w => h('option', { key: w.workspaceId, value: w.workspaceId }, w.title || w.name || w.path)))),
              h('button', { disabled: busy || !view || !workspaceId, onClick: () => create() }, '新建会话'),
              h('button', { disabled: busy || !view, onClick: () => setDialog('skin') }, '自定义背景'),
              h('button', { className: 'hx-return', disabled: busy, onClick: () => service.home('huaxue') }, '工作台首页'),
              h('button', { className: 'hx-return', onClick: () => service.leave() }, '返回 DSH')),
            conversation),
          active && dialog === 'game' && gameContext.current && h(business.GameExperience, { key: gameContext.current.parentSessionId, runtime, api, parentSessionId: gameContext.current.parentSessionId, selected: gameContext.current.selected, close: () => { gameContext.current = null; setDialog(null); } }),
          active && dialog === 'skin' && h(business.WorkbenchDialog, { kind: 'skin', skin: view?.value.skin, person, draftStore: runtime.workbenches.businessState('skin', {}), close: () => setDialog(null), saveSkin: skin => { runtime.workbenches.assertActive(); return mutate([{ op: 'set', path: ['skin'], value: skin }]); } }));
      }
      ctx.effect(() => service.register({ id: 'huaxue', title: '花少2 · 花学工作台', icon: '花', version: '0.3.5-desktop.1', customFrame: true,
        description: '七位花学旅伴、花学拆解与第八位嘉宾游戏。', audience: '角色化聊天与沟通演练用户', requirements: '使用 Desktop 原生模型配置；需要服务端持久化归属查询。' }, DesktopPanel));
    }
    return { inject: ['desktopWorkbenches', 'sessions', 'workspaces', 'uiWorkspace', 'remote', 'remote.settings'], apply };
  },
});
