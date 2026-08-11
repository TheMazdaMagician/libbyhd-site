/**
 * chat-widget.js — Libby floating chat bubble
 * Drop <script src="/chat-widget.js"></script> into any page.
 * - Draggable FAB (like iOS accessibility button) — snaps to nearest edge
 * - Panel scrolls above keyboard on iOS (visualViewport API)
 * - Disclaimer on first response to flag that dates/facts need verification
 */
(function () {
  'use strict';

  const API = (() => {
    const saved   = localStorage.getItem('libby_backend_url') || '';
    const isLocal = location.hostname === 'localhost' ||
                    /^10\.|^192\.168\.|^172\./.test(location.hostname);
    return isLocal ? '' : saved;
  })();

  // ── Styles ───────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
  #lw-fab{position:fixed;bottom:calc(22px + env(safe-area-inset-bottom));right:18px;width:54px;height:54px;border-radius:50%;background:#8ab4f8;border:none;cursor:grab;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.5);z-index:9001;touch-action:none;user-select:none;-webkit-user-select:none}
  #lw-fab:active{cursor:grabbing}
  #lw-fab.open{background:#1e2d4d}
  #lw-panel{position:fixed;left:0;right:0;background:#070b16;border-top:1px solid #1e2d4d;border-radius:20px 20px 0 0;z-index:9000;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);/* height set dynamically */}
  #lw-panel.open{transform:translateY(0)}
  #lw-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid #1e2d4d;flex-shrink:0}
  #lw-header span{font-size:15px;font-weight:700;color:#eef2ff}
  #lw-close{background:none;border:none;color:#6b7799;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1}
  #lw-msgs{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 14px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}
  .lw-msg{max-width:88%;padding:9px 13px;border-radius:14px;font-size:14px;line-height:1.5;word-break:break-word;white-space:pre-wrap}
  .lw-msg.user{align-self:flex-end;background:#1e3a5f;color:#eef2ff;border-radius:14px 14px 4px 14px}
  .lw-msg.assistant{align-self:flex-start;background:#111a2f;border:1px solid #1e2d4d;color:#eef2ff;border-radius:14px 14px 14px 4px}
  .lw-msg.err{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:#f87171}
  .lw-msg.disclaimer{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);color:#fbbf24;font-size:12px;align-self:stretch;border-radius:8px}
  .lw-thinking{color:#6b7799;font-size:13px;font-style:italic;padding:4px 14px}
  #lw-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #1e2d4d;flex-shrink:0;padding-bottom:calc(10px + env(safe-area-inset-bottom))}
  #lw-input{flex:1;background:#0b1020;border:1px solid #1e2d4d;border-radius:12px;color:#eef2ff;font-family:inherit;font-size:16px;padding:9px 12px;outline:none;resize:none;min-height:40px;max-height:120px;-webkit-appearance:none}
  #lw-input:focus{border-color:#8ab4f8}
  #lw-send{background:#8ab4f8;color:#0b1020;border:none;border-radius:12px;font-weight:700;font-size:15px;padding:0 16px;cursor:pointer;flex-shrink:0;min-height:40px}
  #lw-send:disabled{opacity:.4;cursor:default}
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.id = 'lw-fab';
  fab.innerHTML = '💬';
  fab.title = 'Chat with Libby';

  const panel = document.createElement('div');
  panel.id = 'lw-panel';
  panel.innerHTML = `
    <div id="lw-header">
      <span>💬 Libby</span>
      <button id="lw-close" title="Close">✕</button>
    </div>
    <div id="lw-msgs"></div>
    <form id="lw-form" onsubmit="return false">
      <textarea id="lw-input" placeholder="Ask Libby anything…" rows="1"></textarea>
      <button id="lw-send">Send</button>
    </form>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const msgs  = document.getElementById('lw-msgs');
  const input = document.getElementById('lw-input');
  const send  = document.getElementById('lw-send');
  const close = document.getElementById('lw-close');

  // ── Keyboard / viewport handling (iOS fix) ────────────────────────────────────
  // When the keyboard appears, shrink the panel to the visible viewport area
  function positionPanel() {
    const vv = window.visualViewport;
    if (!vv) {
      panel.style.bottom = '0';
      panel.style.top    = 'auto';
      panel.style.height = '72vh';
      return;
    }
    // Distance from bottom of visual viewport to bottom of layout viewport
    const offsetBottom = window.innerHeight - vv.height - vv.offsetTop;
    panel.style.bottom = Math.max(0, offsetBottom) + 'px';
    panel.style.height = Math.min(vv.height * 0.78, 640) + 'px';
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (panel.classList.contains('open')) {
        positionPanel();
        // Scroll messages to bottom so last message is visible above keyboard
        setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 80);
      }
    });
    window.visualViewport.addEventListener('scroll', () => {
      if (panel.classList.contains('open')) positionPanel();
    });
  }

  // ── Draggable FAB ────────────────────────────────────────────────────────────
  let dragging = false;
  let dragStartX, dragStartY, fabStartX, fabStartY;
  let dragMoved = false;

  function fabPos() {
    const r = fab.getBoundingClientRect();
    return { x: r.left, y: r.top };
  }

  function snapFab() {
    // Snap to nearest vertical edge, keep vertical position
    const r    = fab.getBoundingClientRect();
    const cx   = r.left + r.width / 2;
    const mid  = window.innerWidth / 2;
    const pad  = 10;
    const newX = cx < mid
      ? pad
      : window.innerWidth - r.width - pad;
    fab.style.right  = 'auto';
    fab.style.bottom = 'auto';
    fab.style.left   = newX + 'px';
    fab.style.top    = Math.max(pad, Math.min(r.top, window.innerHeight - r.height - pad)) + 'px';
    localStorage.setItem('lw_fab_pos', JSON.stringify({ left: newX, top: fab.getBoundingClientRect().top }));
  }

  function restoreFabPos() {
    try {
      const saved = JSON.parse(localStorage.getItem('lw_fab_pos') || 'null');
      if (!saved) return;
      fab.style.right  = 'auto';
      fab.style.bottom = 'auto';
      fab.style.left   = saved.left + 'px';
      fab.style.top    = Math.max(10, Math.min(saved.top, window.innerHeight - 64)) + 'px';
    } catch {}
  }

  // Touch drag
  fab.addEventListener('touchstart', e => {
    if (panel.classList.contains('open')) return; // don't drag while open
    dragging  = true;
    dragMoved = false;
    const t   = e.touches[0];
    dragStartX = t.clientX;
    dragStartY = t.clientY;
    const pos  = fabPos();
    fabStartX  = pos.x;
    fabStartY  = pos.y;
    fab.style.right  = 'auto';
    fab.style.bottom = 'auto';
    fab.style.transition = 'none';
  }, { passive: true });

  fab.addEventListener('touchmove', e => {
    if (!dragging) return;
    e.preventDefault();
    const t   = e.touches[0];
    const dx  = t.clientX - dragStartX;
    const dy  = t.clientY - dragStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    const newX = Math.max(0, Math.min(window.innerWidth  - 54, fabStartX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 54, fabStartY + dy));
    fab.style.left = newX + 'px';
    fab.style.top  = newY + 'px';
  }, { passive: false });

  fab.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    fab.style.transition = '';
    if (dragMoved) { snapFab(); return; }
    // Tap (no significant drag) → toggle
    panel.classList.contains('open') ? closeW() : open();
  });

  // Mouse drag (desktop)
  fab.addEventListener('mousedown', e => {
    if (panel.classList.contains('open')) return;
    dragging  = true;
    dragMoved = false;
    dragStartX = e.clientX; dragStartY = e.clientY;
    const pos = fabPos(); fabStartX = pos.x; fabStartY = pos.y;
    fab.style.right = 'auto'; fab.style.bottom = 'auto';
    fab.style.transition = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    fab.style.left = Math.max(0, Math.min(window.innerWidth-54,  fabStartX + dx)) + 'px';
    fab.style.top  = Math.max(0, Math.min(window.innerHeight-54, fabStartY + dy)) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    fab.style.transition = '';
    if (dragMoved) snapFab();
  });

  // Click (desktop, no drag)
  fab.addEventListener('click', () => {
    if (dragMoved) { dragMoved = false; return; }
    panel.classList.contains('open') ? closeW() : open();
  });

  restoreFabPos();

  // ── Open / close ─────────────────────────────────────────────────────────────
  function open() {
    positionPanel();
    panel.classList.add('open');
    fab.classList.add('open');
    fab.innerHTML = '✕';
    setTimeout(() => { input.focus(); msgs.scrollTop = msgs.scrollHeight; }, 320);
  }
  function closeW() {
    panel.classList.remove('open');
    fab.classList.remove('open');
    fab.innerHTML = '💬';
  }
  close.addEventListener('click', closeW);

  // ── Auto-grow textarea ────────────────────────────────────────────────────────
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    msgs.scrollTop = msgs.scrollHeight;
  });

  // ── Enter to send (Shift+Enter = newline) ─────────────────────────────────────
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  send.addEventListener('click', sendMsg);

  // ── Bubble helper ─────────────────────────────────────────────────────────────
  function addBubble(role, text) {
    const el = document.createElement('div');
    el.className  = 'lw-msg ' + role;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  // ── History ───────────────────────────────────────────────────────────────────
  let history      = [];
  let msgCount     = 0;
  const DISCLAIMER = 'Libby can make mistakes about specific dates, appointments, and facts. Always verify against MyChart or your records before acting on anything.';

  // ── Send ──────────────────────────────────────────────────────────────────────
  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    send.disabled = true;
    msgCount++;

    addBubble('user', text);
    history.push({ role: 'user', content: text });

    const thinking = document.createElement('div');
    thinking.className   = 'lw-thinking';
    thinking.textContent = 'Libby is thinking…';
    msgs.appendChild(thinking);
    msgs.scrollTop = msgs.scrollHeight;

    const pageCtx = document.title ? `[Page: ${document.title}] ` : '';

    // System prompt: grounded, honest about uncertainty
    const systemMsg = {
      role: 'system',
      content: `You are Libby, a personal health and case management assistant for Matthew Herbert and his partner Kellsie Hnatejko.
Current page: ${document.title || 'Libby'}.
Be helpful and specific. IMPORTANT: If asked about specific appointment dates, provider names, or medical facts that aren't in the conversation, say you don't have that information and suggest checking MyChart directly rather than guessing. Never invent dates or appointment details.`
    };

    try {
      const res = await fetch(API + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            systemMsg,
            ...history.map((m, i) =>
              i === 0 && m.role === 'user'
                ? { ...m, content: pageCtx + m.content }
                : m
            )
          ],
          model: 'fast',
        })
      });

      thinking.remove();
      if (!res.ok) throw new Error('Server returned ' + res.status);
      const data    = await res.json();
      const content = data.content || data.message || data.choices?.[0]?.message?.content || '(no response)';
      addBubble('assistant', content);
      history.push({ role: 'assistant', content });

      // Show disclaimer on first response
      if (msgCount === 1) {
        const disc = document.createElement('div');
        disc.className   = 'lw-msg disclaimer';
        disc.textContent = '⚠ ' + DISCLAIMER;
        msgs.appendChild(disc);
        msgs.scrollTop   = msgs.scrollHeight;
      }

    } catch (err) {
      thinking.remove();
      addBubble('err', 'Libby is offline or unreachable. ' + (API ? '' : 'Set your server URL in Settings → Connection.'));
      history.pop();
    }

    send.disabled = false;
    input.focus();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  window.libbyChat = {
    open,
    close: closeW,
    prime(msg) { history = [{ role: 'system', content: msg }]; },
    send(msg)  { open(); input.value = msg; sendMsg(); },
  };

})();
