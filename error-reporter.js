(function () {
  const queueKey = 'libby:error-queue:v1';
  const endpoint = '/api/errors/log';
  const maxQueue = 50;

  function clip(value, max) {
    const text = String(value || '').trim();
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  function pageUrl() {
    try {
      const url = new URL(window.location.href);
      return `${url.origin}${url.pathname}`;
    } catch {
      return String(window.location.href || '').split(/[?#]/)[0];
    }
  }

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(queueKey) || '[]');
    } catch {
      return [];
    }
  }

  function writeQueue(items) {
    try {
      localStorage.setItem(queueKey, JSON.stringify(items.slice(-maxQueue)));
    } catch {
      // Never let observability break the actual app.
    }
  }

  function queue(payload) {
    const items = readQueue();
    items.push(payload);
    writeQueue(items);
  }

  function payload(code, message, detail) {
    const error = detail instanceof Error ? detail : null;
    return {
      code: clip(code || 'E000', 32),
      message: clip(message || error?.message || 'Unknown client error', 500),
      page: pageUrl(),
      stack: clip(error?.stack || detail?.stack || '', 2000),
      ts: new Date().toISOString(),
      ua: clip(navigator.userAgent || '', 300),
      detail: error ? null : detail || null,
      source: 'browser',
    };
  }

  async function post(payloadItem) {
    if (navigator.onLine === false) {
      queue(payloadItem);
      return false;
    }
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify(payloadItem),
      });
      if (!response.ok) throw new Error(`error reporter HTTP ${response.status}`);
      return true;
    } catch (error) {
      queue(payloadItem);
      return false;
    }
  }

  async function flush() {
    if (navigator.onLine === false) return;
    const items = readQueue();
    if (!items.length) return;
    const remaining = [];
    for (const item of items) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          keepalive: true,
          body: JSON.stringify(item),
        });
        if (!response.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    if (remaining.length) writeQueue(remaining);
    else localStorage.removeItem(queueKey);
  }

  window.libbyError = function libbyError(code, message, detail) {
    const item = payload(code, message, detail);
    void post(item);
    return item;
  };

  window.addEventListener('error', (event) => {
    window.libbyError('E000', event.message || 'Unhandled browser error', event.error || { filename: event.filename, line: event.lineno, column: event.colno });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    window.libbyError('E000', reason?.message || 'Unhandled promise rejection', reason);
  });

  window.addEventListener('online', flush);
  document.addEventListener?.('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flush();
  });
  void flush();
})();
