let currentTab;
let currentUrl;
let capturedKeys = [];
let captureMode = false;

const $ = id => document.getElementById(id);

function canonicalPageUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  return url.href;
}

function getRuleKey() {
  const url = new URL(currentUrl);
  return $("scope").value === "page"
    ? `page:${canonicalPageUrl(currentUrl)}`
    : `origin:${url.origin}`;
}

function prettyScope() {
  const url = new URL(currentUrl);
  return $("scope").value === "page"
    ? canonicalPageUrl(currentUrl)
    : url.origin;
}

function renderKeys() {
  const list = $("keyList");
  list.textContent = "";

  capturedKeys.forEach(code => {
    const chip = document.createElement("span");
    chip.className = "chip";

    const text = document.createElement("span");
    text.textContent = code;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.title = `Remove ${code}`;
    remove.addEventListener("click", () => {
      capturedKeys = capturedKeys.filter(k => k !== code);
      renderKeys();
    });

    chip.append(text, remove);
    list.appendChild(chip);
  });
}

async function loadRule() {
  const { rules = {} } = await chrome.storage.sync.get("rules");
  const rule = rules[getRuleKey()] || { enabled: false, keys: [], mouseButtons: [] };

  $("enabled").checked = !!rule.enabled;
  capturedKeys = [...(rule.keys || [])];
  renderKeys();

  document.querySelectorAll(".mouse").forEach(box => {
    box.checked = (rule.mouseButtons || []).includes(Number(box.value));
  });

  $("pageLabel").textContent = prettyScope();
  $("status").textContent = Object.prototype.hasOwnProperty.call(rules, getRuleKey())
    ? "Rule loaded."
    : "No rule saved for this scope yet.";
}

async function saveRule() {
  const { rules = {} } = await chrome.storage.sync.get("rules");
  const mouseButtons = [...document.querySelectorAll(".mouse:checked")]
    .map(box => Number(box.value));

  rules[getRuleKey()] = {
    enabled: $("enabled").checked,
    keys: capturedKeys,
    mouseButtons
  };

  await chrome.storage.sync.set({ rules });
  $("status").textContent = "Saved.";
}

async function deleteRule() {
  const { rules = {} } = await chrome.storage.sync.get("rules");
  delete rules[getRuleKey()];
  await chrome.storage.sync.set({ rules });
  await loadRule();
  $("status").textContent = "Rule deleted.";
}

$("captureKey").addEventListener("click", () => {
  captureMode = true;
  $("captureHint").textContent = "Press the keyboard key you want to block…";
  $("captureKey").textContent = "Listening…";
});

window.addEventListener("keydown", event => {
  if (!captureMode) return;

  event.preventDefault();
  event.stopPropagation();

  const code = event.code || event.key;
  if (code && !capturedKeys.includes(code)) capturedKeys.push(code);

  captureMode = false;
  $("captureHint").textContent = code ? `Added ${code}.` : "Could not identify that key.";
  $("captureKey").textContent = "Press a key to add";
  renderKeys();
}, true);

$("scope").addEventListener("change", loadRule);
$("save").addEventListener("click", saveRule);
$("deleteRule").addEventListener("click", deleteRule);

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  currentUrl = tab?.url || "";

  if (!/^https?:\/\//.test(currentUrl)) {
    $("pageLabel").textContent = "This extension works on normal http/https web pages.";
    document.querySelectorAll("button, input, select").forEach(el => el.disabled = true);
    return;
  }

  await loadRule();
})();
