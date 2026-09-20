// Shared session guard for every private LibbyHD page.
// Loaded after supabase-js and app-config.js. Redirects to login.html
// immediately (before the page paints anything) if there's no valid
// Supabase session. Also exposes window.LibbyAuth for pages that need to
// call the authenticated API (app.libbyhd.org) or sign out.
(function () {
  var cfg = window.LIBBY_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    // Config didn't load — fail closed, not open.
    location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
    return;
  }

  var client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  var ready = client.auth.getSession().then(function (result) {
    var session = result.data.session;
    if (!session) {
      location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
      return null;
    }
    return session;
  });

  async function authedFetch(path, options) {
    options = options || {};
    var session = await ready;
    if (!session) throw new Error('Not signed in');
    var headers = Object.assign({}, options.headers, {
      Authorization: 'Bearer ' + session.access_token
    });
    var base = cfg.API_BASE || '';
    return fetch(base + path, Object.assign({}, options, { headers: headers }));
  }

  async function signOut() {
    await client.auth.signOut();
    location.replace('/login.html');
  }

  window.LibbyAuth = {
    client: client,
    ready: ready,
    authedFetch: authedFetch,
    signOut: signOut
  };
})();
