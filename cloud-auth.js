/* Phase 1: Auth and read-only family data. Local learning state is not imported. */
(() => {
  'use strict';
  const config = window.LuoCloudConfig;
  const KEY = 'luo.phase1.auth', IDENTITY_KEY='luo.phase2.identity';
  let session = null, generation = 0;
  const panel = document.createElement('section');
  panel.className = 'panel'; panel.dataset.cloudAuth = 'true';
  panel.innerHTML = '<h2>家長雲端帳號</h2><form><label>Email<input name="email" type="email" autocomplete="username" required></label><label>密碼<input name="password" type="password" autocomplete="current-password" required></label><button>登入</button></form><button id="cloudLogout" hidden>登出</button><button id="cloudReload" hidden>重新讀取家庭</button><p aria-live="polite" id="cloudStatus"></p><div id="cloudFamily"></div><small>本階段僅讀取家庭角色；學習、點數及獎勵仍保留原本本機資料。</small>';
  if(config.phase2?.enabled) panel.querySelector('small').textContent='登入並連結孩子後可同步學習、點數與獎勵；既有本機資料保留，不會自動承接。';
  document.querySelector('main').prepend(panel);
  const $ = s => panel.querySelector(s);
  const status = text => { $('#cloudStatus').textContent = text; };
  function showSession() {
    $('form').hidden = !!session;
    $('#cloudLogout').hidden = !session;
    $('#cloudReload').hidden = !session;
  }
  function clear() {
    session = null;
    window.dispatchEvent(new CustomEvent('luo-cloud-session',{detail:null}));
    try { localStorage.removeItem(KEY); localStorage.removeItem(IDENTITY_KEY); } catch { /* UI is still cleared. */ }
    $('#cloudFamily').replaceChildren();
    $('[name=password]').value = ''; $('[name=email]').value = '';
    showSession();
  }
  async function api(path, options = {}, token) {
    let response;
    try {
      response = await fetch(config.url + path, {
        ...options, headers: { apikey: config.key, 'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        signal: AbortSignal.timeout(15000), cache: 'no-store'
      });
    } catch { throw Object.assign(Error('無法連線，請檢查網路後重試。'),{networkUnavailable:true}); }
    if (!response.ok) {
      const error = Error(response.status === 400 || response.status === 401
        ? '登入或驗證失敗，請檢查帳號密碼，必要時重新登入。'
        : '雲端讀取失敗（' + response.status + '），請稍後再試。');
      error.authInvalid = response.status === 401 || (response.status === 400 && path.startsWith('/auth/'));
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }
  function persist(value) {
    if (!value?.access_token || !value?.refresh_token) throw Error('登入回應不完整，請重新登入。');
    // Password is never persisted; only standard Auth session tokens are saved.
    localStorage.setItem(KEY, JSON.stringify({access_token:value.access_token,refresh_token:value.refresh_token}));
    session = value; showSession();
  }
  const MAP_KEY = 'luo.phase1.roleLinks';
  function linksFor(familyId) {
    try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}')[familyId] || {}; } catch { return {}; }
  }
  function roleFor(child, children, familyId) {
    const aliases = {sister:'luo-sister','luo-sister':'luo-sister',brother:'luo-brother','luo-brother':'luo-brother'};
    const links = linksFor(familyId);
    const role = aliases[child.avatar_key] || aliases[links[child.id]];
    return role && children.filter(c => (aliases[c.avatar_key] || aliases[links[c.id]]) === role).length === 1 ? role : null;
  }
  async function load() {
    const id = ++generation;
    window.dispatchEvent(new CustomEvent('luo-cloud-session',{detail:null}));
    $('#cloudFamily').replaceChildren(); status('讀取家庭中…');
    try {
      if (!session) throw Error('請先登入');
      const fresh = await api('/auth/v1/token?grant_type=refresh_token', {method:'POST', body:JSON.stringify({refresh_token:session.refresh_token})});
      if (id !== generation) return;
      persist(fresh);
      const families = await api('/rest/v1/families?select=id,name', {}, fresh.access_token);
      if (id !== generation) return;
      if (!Array.isArray(families) || families.length !== 1) {
        status(families?.length ? '找到多個家庭，請先確認家庭設定。' : '此帳號尚無家庭資料，未自動新增家庭或孩子。'); return;
      }
      const children = await api('/rest/v1/children?select=id,display_name,grade_level,avatar_key&family_id=eq.' + encodeURIComponent(families[0].id), {}, fresh.access_token);
      if (id !== generation) return;
      if (!Array.isArray(children)) throw Error('孩子資料格式不正確。');
      const identity={familyId:families[0].id,userId:fresh.user?.id||null,roles:Object.fromEntries(children.map(child=>[roleFor(child,children,families[0].id),child.id]).filter(([role])=>role))};
      if(config.phase2?.enabled&&identity.userId)try{localStorage.setItem(IDENTITY_KEY,JSON.stringify(identity))}catch{/* Offline queue remains available for this session. */}
      window.dispatchEvent(new CustomEvent('luo-cloud-session',{detail:{...identity,accessToken:fresh.access_token}}));
      for (const child of children) {
        const button = document.createElement('button'); button.className = 'secondary';
        button.dataset.cloudChildId = child.id;
        button.textContent = child.display_name + '｜' + (child.grade_level === 0 ? '幼兒園' : child.grade_level + '年級');
        const role = roleFor(child, children, families[0].id);
        button.onclick = () => {
          if (id !== generation || !session) return;
          if (role && typeof chooseFamily === 'function') chooseFamily(role);
          else status('此孩子尚未設定唯一固定角色映射，未更動本機角色。');
        };
        $('#cloudFamily').append(button);
        if (!role) {
          const select = document.createElement('select');
          select.setAttribute('aria-label', child.display_name + '連結本機角色');
          select.innerHTML = '<option value="">選擇本機角色</option><option value="luo-sister">姊姊（四年級）</option><option value="luo-brother">弟弟（幼兒園）</option>';
          const link = document.createElement('button'); link.textContent = '確認連結 ' + child.display_name;
          link.onclick = () => {
            if (id !== generation || !session) return;
            const target = select.value;
            if (!['luo-sister','luo-brother'].includes(target)) { status('請選擇要連結的本機角色。'); return; }
            if (children.some(c => c.id !== child.id && roleFor(c, children, families[0].id) === target)) { status('此本機角色已連結其他孩子，未修改連結。'); return; }
            try {
              const all = JSON.parse(localStorage.getItem(MAP_KEY) || '{}');
              all[families[0].id] = {...(all[families[0].id] || {}), [child.id]:target};
              localStorage.setItem(MAP_KEY, JSON.stringify(all));
              load();
            } catch { status('角色連結未儲存，請檢查本機儲存權限。'); }
          };
          $('#cloudFamily').append(select, link);
        }
      }
      status('家庭：' + families[0].name + '；已讀取 ' + children.length + ' 位孩子。' + (!children.length ? '請先確認既有孩子設定。' : ''));
    } catch (error) {
      if (id !== generation) return;
      if (error.authInvalid) clear();
      if(error.networkUnavailable&&session&&config.phase2?.enabled)try{const saved=JSON.parse(localStorage.getItem(IDENTITY_KEY)||'null'),claims=JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(saved?.userId&&saved.userId===claims.sub){window.dispatchEvent(new CustomEvent('luo-cloud-session',{detail:{...saved,accessToken:session.access_token,offline:true}}));status('離線練習：沿用此登入帳號的孩子識別，作答待同步；尚未取得新的伺服器確認。');return}}catch{/* Never guess another account identity. */}
      status(error.message);
    }
  }
  $('form').onsubmit = async event => {
    event.preventDefault(); const button = $('form button'); button.disabled = true;
    const credentials = {email:$('[name=email]').value.trim(),password:$('[name=password]').value};
    clear(); // Drops any prior account's private view before changing account.
    const id = ++generation;
    try {
      if (!credentials) throw Error('請重新輸入帳號密碼。');
      status('登入中…');
      const value = await api('/auth/v1/token?grant_type=password', {method:'POST',body:JSON.stringify(credentials)});
      if (id !== generation) return;
      persist(value); await load();
    } catch (error) { if (id === generation) status(error.message); }
    finally { $('[name=password]').value = ''; button.disabled = false; }
  };
  $('#cloudReload').onclick = load;
  window.addEventListener('online',()=>{if(config.phase2?.enabled&&session)load()});
  $('#cloudLogout').onclick = async () => {
    const token = session?.access_token, id = ++generation;
    clear(); status('已登出此裝置。');
    if (token) try { await api('/auth/v1/logout?scope=local', {method:'POST'}, token); }
    catch { if (id === generation) status('已清除本機登入；伺服器登出尚未確認，請連網後確認。'); }
  };
  window.addEventListener('storage', event => {
    if (event.key !== KEY) return;
    ++generation; $('#cloudFamily').replaceChildren();
    try { session = JSON.parse(event.newValue); } catch { session = null; }
    showSession(); status('其他分頁已變更登入狀態，請重新讀取家庭。');
  });
  try {
    session = JSON.parse(localStorage.getItem(KEY)); showSession();
    if (session?.refresh_token) load(); else { clear(); status('尚未登入'); }
  } catch { clear(); status('登入快取無法讀取，請重新登入。'); }
})();
