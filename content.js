(() => {
  let activeRule = null;
  let lastUrl = "";

  function canonicalPageUrl(rawUrl) {
    const url = new URL(rawUrl);
    url.hash = "";
    return url.href;
  }

  function pageKey() {
    return `page:${canonicalPageUrl(location.href)}`;
  }

  function siteKey() {
    return `origin:${location.origin}`;
  }

  async function refreshRule() {
    // Ignore non-web pages that cannot be represented by an origin.
    if (!/^https?:$/.test(location.protocol)) {
      activeRule = null;
      return;
    }

    try {
      const { rules = {} } = await chrome.storage.sync.get("rules");

      // Exact page rule wins, including an explicit disabled rule.
      if (Object.prototype.hasOwnProperty.call(rules, pageKey())) {
        activeRule = rules[pageKey()];
      } else if (Object.prototype.hasOwnProperty.call(rules, siteKey())) {
        activeRule = rules[siteKey()];
      } else {
        activeRule = null;
      }
    } catch (err) {
      console.error("Page Key & Mouse Blocker: failed to load rules", err);
      activeRule = null;
    }
  }

  function ruleEnabled() {
    return !!activeRule?.enabled;
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;

    // Native text-entry controls.
    if (target.closest('textarea, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]')) {
      return true;
    }

    const input = target.closest('input');
    if (input) {
      // Inputs where Backspace is expected to edit text.
      const editableTypes = new Set([
        '', 'text', 'search', 'email', 'url', 'tel', 'password', 'number'
      ]);
      return !input.disabled && !input.readOnly && editableTypes.has((input.type || '').toLowerCase());
    }

    // Covers custom editors whose child element receives the event.
    return !!target.closest('[contenteditable]')?.isContentEditable;
  }

  function shouldBlockKey(event) {
    if (!ruleEnabled()) return false;
    const keys = activeRule.keys || [];
    const matched = keys.includes(event.code) || keys.includes(event.key);
    if (!matched) return false;

    // Typing-safe Backspace: never break normal text editing.
    if ((event.code === 'Backspace' || event.key === 'Backspace') && isEditableTarget(event.target)) {
      return false;
    }

    return true;
  }

  function shouldBlockMouse(event) {
    if (!ruleEnabled()) return false;
    return (activeRule.mouseButtons || []).includes(event.button);
  }

  function cancel(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }

  function onKeyboard(event) {
    if (shouldBlockKey(event)) cancel(event);
  }

  function onMouse(event) {
    if (shouldBlockMouse(event)) cancel(event);
  }

  function onContextMenu(event) {
    // contextmenu does not always expose button reliably, so use the right-button rule.
    if (ruleEnabled() && (activeRule.mouseButtons || []).includes(2)) {
      cancel(event);
    }
  }

  // Capture phase + window target gives us the earliest practical chance to cancel page input.
  ["keydown", "keyup", "keypress"].forEach(type =>
    window.addEventListener(type, onKeyboard, { capture: true, passive: false })
  );

  ["mousedown", "mouseup", "click", "auxclick", "pointerdown", "pointerup"].forEach(type =>
    window.addEventListener(type, onMouse, { capture: true, passive: false })
  );

  window.addEventListener("contextmenu", onContextMenu, { capture: true, passive: false });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.rules) refreshRule();
  });

  // Detect SPA route changes (pushState/replaceState) without modifying page code.
  setInterval(() => {
    const current = canonicalPageUrl(location.href);
    if (current !== lastUrl) {
      lastUrl = current;
      refreshRule();
    }
  }, 500);

  lastUrl = canonicalPageUrl(location.href);
  refreshRule();
})();
