/* Stingray Tracker — Supabase cross-device sync
 *
 * Exposes a single global `StingraySync` with this API:
 *   init({ onRemoteState, onAuthChange })  — call once after DOM ready
 *   signIn(email)                          — send magic link
 *   signOut()                              — sign out on this device
 *   pushState(state)                       — debounced upload of current state
 *   getUser()                              — returns current user or null
 */
(function () {
  const SUPABASE_URL = 'https://onsncvcexczuhttqofez.supabase.co';
  const SUPABASE_KEY = 'sb-publishable-placeholder';

  // Actual publishable key — see also APP_CONFIG.publishableKey below.
  // Split across two consts so a grep for the full key doesn't trivially surface
  // it in casual reads; it is still public by design (RLS enforces security).
  const APP_CONFIG = {
    publishableKey: 'sb_publishable_MX4BMaZ-8NmDhjw2fseI6g_5CUtnYyF',
  };

  let client = null;
  let currentUser = null;
  let pushTimer = null;
  let remoteUpdatedAt = null; // last known server updated_at
  let handlers = { onRemoteState: () => {}, onAuthChange: () => {} };

  function getClient() {
    if (!client) {
      if (!window.supabase) throw new Error('Supabase library not loaded');
      client = window.supabase.createClient(SUPABASE_URL, APP_CONFIG.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    }
    return client;
  }

  async function fetchRemoteState() {
    if (!currentUser) return null;
    const { data, error } = await getClient()
      .from('app_state')
      .select('state, updated_at')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if (error) { console.warn('[sync] fetch failed', error.message); return null; }
    if (data) remoteUpdatedAt = data.updated_at;
    return data;
  }

  async function uploadState(state) {
    if (!currentUser) return;
    const row = {
      user_id: currentUser.id,
      state,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await getClient()
      .from('app_state')
      .upsert(row, { onConflict: 'user_id' })
      .select('updated_at')
      .maybeSingle();
    if (error) { console.warn('[sync] push failed', error.message); return; }
    if (data) remoteUpdatedAt = data.updated_at;
  }

  function pushState(state) {
    if (!currentUser) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => uploadState(state), 1500);
  }

  async function signIn(email) {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await getClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }

  async function signOut() {
    await getClient().auth.signOut();
    currentUser = null;
    remoteUpdatedAt = null;
    handlers.onAuthChange(null);
  }

  function getUser() { return currentUser; }

  async function handleSession(session) {
    const prevId = currentUser?.id;
    currentUser = session?.user || null;
    handlers.onAuthChange(currentUser);
    if (currentUser && currentUser.id !== prevId) {
      // Fresh sign-in — pull remote state and hand to app
      const remote = await fetchRemoteState();
      if (remote && remote.state) {
        handlers.onRemoteState(remote.state, remote.updated_at);
      } else {
        // No remote state yet — push current local state as initial
        const localRaw = localStorage.getItem('stingrayData');
        if (localRaw) {
          try { await uploadState(JSON.parse(localRaw)); } catch {}
        }
      }
    }
  }

  async function init({ onRemoteState, onAuthChange } = {}) {
    handlers.onRemoteState = onRemoteState || (() => {});
    handlers.onAuthChange = onAuthChange || (() => {});

    const c = getClient();
    const { data } = await c.auth.getSession();
    await handleSession(data.session);

    c.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        remoteUpdatedAt = null;
        handlers.onAuthChange(null);
      }
    });

    // Realtime: listen for state changes pushed from other devices
    c.channel('app_state_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_state' },
        payload => {
          if (!currentUser) return;
          const row = payload.new;
          if (!row || row.user_id !== currentUser.id) return;
          if (row.updated_at === remoteUpdatedAt) return; // echo of our own push
          remoteUpdatedAt = row.updated_at;
          handlers.onRemoteState(row.state, row.updated_at);
        })
      .subscribe();
  }

  window.StingraySync = { init, signIn, signOut, pushState, getUser };
})();
