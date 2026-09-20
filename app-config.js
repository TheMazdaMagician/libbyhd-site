// Safe public frontend config for LibbyHD.
// This file is browser-readable by design. Put ONLY publishable Supabase keys here.
// Never put service_role keys, model API keys, private tokens, or personal evidence here.

window.LIBBY_CONFIG = {
  SUPABASE_URL: "https://mhgqfjcxpdtpzzrzadff.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_q5t-hevjQqW2danKUR9h-w_5edrG3uJ",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_q5t-hevjQqW2danKUR9h-w_5edrG3uJ",
  APP_MODE: "production",
  PUBLIC_BASE_PATH: "/",
  // This site is static (GitHub Pages). Invite-code registration and any
  // other request that needs server logic goes to the API server running on
  // the home system, reachable over the existing Cloudflare Tunnel hostname.
  API_BASE: "https://app.libbyhd.org",
  LIBBY_API_URL: "https://app.libbyhd.org/api/libby/chat",
  ...(window.LIBBY_CONFIG || {})
};
