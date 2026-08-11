// Safe public frontend config for Libby Live.
// This file is browser-readable by design. Put ONLY publishable Supabase keys here.
// Never put service_role keys, model API keys, private tokens, or personal evidence here.

window.LIBBY_CONFIG = {
  SUPABASE_URL: "https://mhgqfjcxpdtpzzrzadff.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_q5t-hevjQqW2danKUR9h-w_5edrG3uJ",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_q5t-hevjQqW2danKUR9h-w_5edrG3uJ",
  APP_MODE: "ipad_tunnel_preview",
  PUBLIC_BASE_PATH: "/libby_live/",
  API_BASE: "",
  LIBBY_API_URL: "/api/chat",
  ENABLE_LOCAL_ADMIN: false,
  ...(window.LIBBY_CONFIG || {})
};

(function installLibbyLaunchControls() {
  const cfg = window.LIBBY_CONFIG || {};
  const isPublicHost = !["localhost", "127.0.0.1", "::1"].includes(location.hostname) && !location.hostname.endsWith(".local");
  const hasCloudConfig = Boolean(
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !String(cfg.SUPABASE_URL).includes("YOUR_PROJECT_REF") &&
    !String(cfg.SUPABASE_ANON_KEY).includes("YOUR_PUBLIC_ANON_KEY")
  );

  function $(id) {
    return document.getElementById(id);
  }

  function saveLocalUser(user, memories) {
    localStorage.setItem("libby_local_user", JSON.stringify(user));
    if (memories) localStorage.setItem("libby_local_memories", JSON.stringify(memories));
    location.reload();
  }

  function localUser({ id, email, displayName, role, verificationStatus, referralCode }) {
    return {
      id,
      email,
      profile: {
        display_name: displayName,
        email,
        role,
        verification_status: verificationStatus,
        referral_code: referralCode
      }
    };
  }

  function readLocalRawInputs() {
    try {
      return JSON.parse(localStorage.getItem("libby_raw_inputs") || "[]");
    } catch (_error) {
      return [];
    }
  }

  function writeLocalRawInputs(items) {
    localStorage.setItem("libby_raw_inputs", JSON.stringify(items));
  }

  function saveRawInputLocally({ title, rawText, channel, tags, privacyLevel }) {
    const now = new Date().toISOString();
    const item = {
      raw_input_id: `raw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: now,
      updated_at: now,
      input_channel: channel || "manual",
      source_system: "libby_live_browser",
      title: title || `Raw input ${now}`,
      raw_text: rawText,
      suggested_tags: tags || "",
      privacy_level: privacyLevel || "private",
      evidence_quality: "raw_user_input",
      processing_status: "unprocessed",
      notes: "Preserved unchanged in this browser's localStorage. This is not cross-device memory. Sync/index later when Supabase/RLS is ready."
    };
    const items = readLocalRawInputs();
    items.unshift(item);
    writeLocalRawInputs(items.slice(0, 1000));

    const memories = JSON.parse(localStorage.getItem("libby_local_memories") || "[]");
    memories.unshift({
      id: item.raw_input_id,
      title: item.title,
      body: item.raw_text,
      created_at: item.created_at,
      confidence: "raw_user_input",
      memory_type: "raw_input",
      privacy_level: item.privacy_level
    });
    localStorage.setItem("libby_local_memories", JSON.stringify(memories.slice(0, 1000)));
    return item;
  }

  async function oauth(provider) {
    if (!hasCloudConfig || !window.supabase) {
      alert("Google/Apple login needs the real Supabase URL plus enabled providers and redirect URLs in Supabase.");
      return;
    }
    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const redirectTo = new URL(cfg.PUBLIC_BASE_PATH || "/libby_live/", location.origin).toString();
    const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) alert(error.message);
  }

  function installLaunchControls() {
    const signin = $("signinForm");
    const signup = $("signupForm");
    if (!signin || !signup || $("launchControls")) return;

    const style = document.createElement("style");
    style.textContent = `
      .launch-controls{display:grid;gap:9px;margin-top:12px}
      .launch-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .launch-note{font-size:12px;color:var(--muted);line-height:1.35;margin:4px 0 0}
      .raw-input-panel{display:grid;gap:10px}
      .raw-input-panel textarea{min-height:220px;border-radius:18px;border:1px solid var(--line);background:rgba(6,12,24,.74);color:var(--text);padding:12px;resize:vertical}
      .raw-input-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .raw-input-list{display:grid;gap:8px;margin-top:12px}
      .raw-input-item{border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.05);padding:10px}
      .raw-input-item b{display:block;margin-bottom:4px}
      .raw-input-item small{display:block;color:var(--muted);margin-bottom:6px}
      .raw-input-item pre{white-space:pre-wrap;max-height:180px;overflow:auto;margin:0;color:var(--text);font-family:inherit;font-size:13px;line-height:1.35}
      @media(max-width:560px){.launch-row,.raw-input-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const controls = document.createElement("div");
    controls.id = "launchControls";
    controls.className = "launch-controls";
    controls.innerHTML = `
      <div class="launch-row">
        <button type="button" class="ghost" id="googleLoginBtn">Continue with Google</button>
        <button type="button" class="ghost" id="appleLoginBtn">Continue with Apple</button>
      </div>
      <button type="button" class="ghost" id="showSignupBtn">Create a new Libby account</button>
      <button type="button" class="ghost" id="safeDemoBtn">Open safe demo mode</button>
      <button type="button" class="ghost" id="localMatthewBtn">Use this device only as Matthew</button>
      <p class="launch-note" id="launchNote"></p>
    `;
    signin.insertAdjacentElement("afterend", controls);

    const legacyLocalButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.toLowerCase().includes("use local matthew")
    );
    if (legacyLocalButton && isPublicHost) legacyLocalButton.style.display = "none";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "ghost";
    back.id = "backToSigninBtn";
    back.style.marginTop = "10px";
    back.style.width = "100%";
    back.textContent = "Back to sign in";
    signup.appendChild(back);

    $("launchNote").textContent = hasCloudConfig
      ? "Cloud login is configured. Google/Apple also require enabled providers and redirect URLs in Supabase."
      : "Supabase publishable key is present. Add the project URL to app-config.js to enable real cloud login/sync.";

    $("googleLoginBtn").addEventListener("click", () => oauth("google"));
    $("appleLoginBtn").addEventListener("click", () => oauth("apple"));
    $("showSignupBtn").addEventListener("click", () => {
      signin.classList.add("hidden");
      controls.classList.add("hidden");
      signup.classList.remove("hidden");
    });
    $("backToSigninBtn").addEventListener("click", () => {
      signup.classList.add("hidden");
      signin.classList.remove("hidden");
      controls.classList.remove("hidden");
    });
    $("safeDemoBtn").addEventListener("click", () => {
      saveLocalUser(
        localUser({
          id: "demo_001",
          email: "demo@libby.local",
          displayName: "Guest Demo",
          role: "demo",
          verificationStatus: "demo_redacted",
          referralCode: "DEMO"
        }),
        [{
          id: "demo-memory-1",
          title: "Demo boundary",
          body: "This is a redacted demo space. It should not expose Matthew private records or local vault evidence.",
          confidence: "demo",
          created_at: new Date().toISOString()
        }]
      );
    });
    $("localMatthewBtn").addEventListener("click", () => {
      if (isPublicHost && cfg.ENABLE_LOCAL_ADMIN !== true) {
        alert("Local Matthew mode is disabled on public hosts. Use safe demo mode or a real Supabase account.");
        return;
      }
      saveLocalUser(localUser({
        id: "local_matthew",
        email: "mattherbert01@gmail.com",
        displayName: "Matthew",
        role: "local_user",
        verificationStatus: "local_device_only",
        referralCode: "LOCAL"
      }));
    });

    signin.addEventListener("submit", (event) => {
      const email = signin.elements.email?.value?.trim();
      const password = signin.elements.password?.value;
      if (email === "000" && password === "admin" && isPublicHost && cfg.ENABLE_LOCAL_ADMIN !== true) {
        event.preventDefault();
        event.stopImmediatePropagation();
        alert("Local admin is disabled on public hosts. Use Demo mode or a real account.");
      }
    }, true);
  }

  function installRawInputPanel() {
    const nav = document.querySelector(".nav");
    const mainPanels = document.querySelector(".main-panels");
    if (!nav || !mainPanels || document.querySelector('[data-tab="raw"]')) return;

    const rawButton = document.createElement("button");
    rawButton.type = "button";
    rawButton.dataset.tab = "raw";
    rawButton.textContent = "Raw Input";
    nav.insertBefore(rawButton, nav.firstChild);

    const panel = document.createElement("section");
    panel.className = "panel hidden raw-input-panel";
    panel.dataset.panel = "raw";
    panel.innerHTML = `
      <h2>Raw Input</h2>
      <p>Paste or type anything here. Libby preserves the raw input unchanged first, then it can be linked to people, agencies, tasks, summaries, emails, slides, or appendices later.</p>
      <div class="raw-input-grid">
        <div class="field"><label>Title</label><input id="rawInputTitle" placeholder="Example: Call note with Rogers / raw hospital note / text from Kellsie"></div>
        <div class="field"><label>Channel</label><select id="rawInputChannel"><option>manual</option><option>sms</option><option>call_note</option><option>voice_memo</option><option>apple_note</option><option>gmail</option><option>document</option><option>photo_note</option><option>other</option></select></div>
      </div>
      <div class="raw-input-grid">
        <div class="field"><label>Tags / keywords</label><input id="rawInputTags" placeholder="ODSP, Rogers, hospital, Kellsie, todo…"></div>
        <div class="field"><label>Privacy</label><select id="rawInputPrivacy"><option>private</option><option>sensitive</option><option>medical</option><option>legal_support</option><option>family</option><option>agency_support</option><option>shareable_redacted</option><option>public_business_info</option></select></div>
      </div>
      <textarea id="rawInputText" placeholder="Raw input goes here. Do not worry about formatting. It will be saved exactly as entered."></textarea>
      <div class="launch-row">
        <button type="button" class="primary" id="saveRawInputBtn">Save raw input</button>
        <button type="button" class="ghost" id="copyRawInputBtn">Copy latest raw input JSON</button>
      </div>
      <p class="micro" id="rawInputStatus">Local raw capture is ready. Cloud sync will use Supabase once configured.</p>
      <div class="raw-input-list" id="rawInputList"></div>
    `;
    mainPanels.insertBefore(panel, mainPanels.firstChild);

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>\"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char]));
    }

    function renderRawInputs() {
      const list = $("rawInputList");
      if (!list) return;
      const items = readLocalRawInputs();
      list.innerHTML = items.length
        ? items.slice(0, 20).map((item) => `
          <article class="raw-input-item">
            <b>${escapeHtml(item.title)}</b>
            <small>${escapeHtml(item.created_at)} · ${escapeHtml(item.input_channel)} · ${escapeHtml(item.privacy_level)} · ${escapeHtml(item.processing_status)}</small>
            <pre>${escapeHtml(item.raw_text)}</pre>
          </article>
        `).join("")
        : `<p class="micro">No raw inputs saved on this device yet.</p>`;
    }

    $("saveRawInputBtn").addEventListener("click", () => {
      const rawText = $("rawInputText").value;
      if (!rawText.trim()) {
        $("rawInputStatus").textContent = "Nothing saved: raw input is empty.";
        return;
      }
      const item = saveRawInputLocally({
        title: $("rawInputTitle").value.trim() || "Untitled raw input",
        rawText,
        channel: $("rawInputChannel").value,
        tags: $("rawInputTags").value.trim(),
        privacyLevel: $("rawInputPrivacy").value
      });
      $("rawInputText").value = "";
      $("rawInputStatus").textContent = `Saved unchanged as ${item.raw_input_id}. It is available in this browser's local Raw Input history, not verified cross-device memory.`;
      renderRawInputs();
      window.dispatchEvent(new CustomEvent("libby:raw-input-saved", { detail: item }));
    });

    $("copyRawInputBtn").addEventListener("click", async () => {
      const item = readLocalRawInputs()[0];
      if (!item) {
        $("rawInputStatus").textContent = "No raw input to copy yet.";
        return;
      }
      await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
      $("rawInputStatus").textContent = "Latest raw input JSON copied.";
    });

    rawButton.addEventListener("click", () => renderRawInputs());
    renderRawInputs();
  }

  function install() {
    installLaunchControls();
    installRawInputPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
