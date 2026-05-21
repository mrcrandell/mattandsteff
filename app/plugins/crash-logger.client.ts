type CrashLogEntry = {
  id: string;
  time: string;
  source: "window.error" | "window.unhandledrejection";
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  href: string;
  userAgent: string;
  galleryContext?: unknown;
};

type CrashBreadcrumb = {
  id: string;
  time: string;
  type: string;
  detail?: unknown;
};

const CRASH_LOG_KEY = "client-crash-logs";
const CRASH_BREADCRUMB_KEY = "client-crash-breadcrumbs";
const GALLERY_CRASH_CONTEXT_KEY = "gallery-crash-context";
const CRASH_DEBUG_STORAGE_KEY = "crash-debug-enabled";
const CRASH_DEBUG_QUERY_PARAM = "crashdebug";
const MAX_LOGS = 50;
const MAX_BREADCRUMBS = 120;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string) {
  const encoded = encodeURIComponent(value);
  const maxAge = 60 * 60 * 24 * 2;
  document.cookie =
    `${name}=${encoded}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function readCookie(name: string) {
  const key = `${name}=`;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(key)) {
      return decodeURIComponent(trimmed.slice(key.length));
    }
  }

  return null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function readLogs() {
  const fromLocal = readJson<CrashLogEntry[]>(
    localStorage.getItem(CRASH_LOG_KEY),
  );
  if (fromLocal) {
    return fromLocal;
  }

  const fromCookie = readJson<CrashLogEntry[]>(readCookie(CRASH_LOG_KEY));
  return fromCookie ?? [];
}

function readGalleryContext() {
  return readJson<unknown>(sessionStorage.getItem(GALLERY_CRASH_CONTEXT_KEY));
}

function writeLogs(nextLogs: CrashLogEntry[]) {
  const payload = JSON.stringify(nextLogs.slice(-MAX_LOGS));

  try {
    localStorage.setItem(CRASH_LOG_KEY, payload);
  } catch (error) {
    writeCookie(CRASH_LOG_KEY, payload);
    console.warn(
      "Failed to persist crash logs to localStorage; used cookie fallback",
      error,
    );
  }
}

function readBreadcrumbs() {
  const fromLocal = readJson<CrashBreadcrumb[]>(
    localStorage.getItem(CRASH_BREADCRUMB_KEY),
  );
  if (fromLocal) {
    return fromLocal;
  }

  const fromCookie = readJson<CrashBreadcrumb[]>(
    readCookie(CRASH_BREADCRUMB_KEY),
  );
  return fromCookie ?? [];
}

function writeBreadcrumbs(nextBreadcrumbs: CrashBreadcrumb[]) {
  const payload = JSON.stringify(nextBreadcrumbs.slice(-MAX_BREADCRUMBS));
  try {
    localStorage.setItem(CRASH_BREADCRUMB_KEY, payload);
  } catch {
    writeCookie(CRASH_BREADCRUMB_KEY, payload);
  }
}

function addCrashLog(
  entry: Omit<
    CrashLogEntry,
    "id" | "time" | "href" | "userAgent" | "galleryContext"
  >,
) {
  const nextEntry: CrashLogEntry = {
    id: generateId(),
    time: new Date().toISOString(),
    href: location.href,
    userAgent: navigator.userAgent,
    galleryContext: readGalleryContext(),
    ...entry,
  };

  const logs = readLogs();
  logs.push(nextEntry);
  writeLogs(logs);
}

function addBreadcrumb(type: string, detail?: unknown) {
  const crumbs = readBreadcrumbs();
  crumbs.push({
    id: generateId(),
    time: new Date().toISOString(),
    type,
    detail,
  });
  writeBreadcrumbs(crumbs);
}

function printRecentLogs() {
  const logs = readLogs();
  if (logs.length === 0) {
    return;
  }

  const recent = logs.slice(-5);
  console.groupCollapsed(`[crash-logger] Last ${recent.length} client errors`);
  for (const log of recent) {
    console.log(log);
  }
  console.groupEnd();
}

function printRecentBreadcrumbs() {
  const crumbs = readBreadcrumbs();
  if (crumbs.length === 0) {
    return;
  }

  const recent = crumbs.slice(-12);
  console.groupCollapsed(`[crash-logger] Last ${recent.length} breadcrumbs`);
  for (const crumb of recent) {
    console.log(crumb);
  }
  console.groupEnd();
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return Promise.reject(new Error("Clipboard API unavailable"));
}

function createCrashDebugPanel() {
  if (document.getElementById("crash-debug-toggle")) {
    return;
  }

  const toggle = document.createElement("button");
  toggle.id = "crash-debug-toggle";
  toggle.type = "button";
  toggle.textContent = "Crash Logs";
  toggle.setAttribute(
    "style",
    [
      "position:fixed",
      "bottom:16px",
      "right:16px",
      "z-index:2147483647",
      "padding:10px 12px",
      "border-radius:999px",
      "border:1px solid rgba(0,0,0,0.2)",
      "background:#111827",
      "color:#fff",
      "font:600 12px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
      "box-shadow:0 4px 16px rgba(0,0,0,0.25)",
    ].join(";"),
  );

  const panel = document.createElement("div");
  panel.id = "crash-debug-panel";
  panel.setAttribute(
    "style",
    [
      "position:fixed",
      "inset:16px",
      "z-index:2147483647",
      "display:none",
      "background:#0b1220",
      "color:#e5e7eb",
      "border:1px solid rgba(255,255,255,0.2)",
      "border-radius:12px",
      "padding:12px",
      "overflow:auto",
      "font:500 12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
    ].join(";"),
  );

  const actions = document.createElement("div");
  actions.setAttribute(
    "style",
    "display:flex;gap:8px;position:sticky;top:0;background:#0b1220;padding-bottom:8px;",
  );

  const output = document.createElement("pre");
  output.setAttribute(
    "style",
    "white-space:pre-wrap;word-break:break-word;margin:0;padding-bottom:12px;",
  );

  const buildButton = (label: string, onClick: () => void) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.onclick = onClick;
    button.setAttribute(
      "style",
      [
        "padding:8px 10px",
        "border-radius:8px",
        "border:1px solid rgba(255,255,255,0.25)",
        "background:#1f2937",
        "color:#fff",
      ].join(";"),
    );
    return button;
  };

  const render = () => {
    const logs = readLogs();
    const breadcrumbs = readBreadcrumbs();
    output.textContent = JSON.stringify(
      {
        total: logs.length,
        recent: logs.slice(-20),
        breadcrumbTotal: breadcrumbs.length,
        breadcrumbRecent: breadcrumbs.slice(-40),
      },
      null,
      2,
    );
  };

  const closeButton = buildButton("Close", () => {
    panel.style.display = "none";
  });

  const refreshButton = buildButton("Refresh", () => {
    render();
  });

  const clearButton = buildButton("Clear", () => {
    localStorage.removeItem(CRASH_LOG_KEY);
    localStorage.removeItem(CRASH_BREADCRUMB_KEY);
    clearCookie(CRASH_LOG_KEY);
    clearCookie(CRASH_BREADCRUMB_KEY);
    render();
  });

  const copyButton = buildButton("Copy", async () => {
    try {
      await copyText(output.textContent || "");
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
    } catch {
      alert("Copy failed. Select and copy text manually.");
    }
  });

  actions.append(closeButton, refreshButton, clearButton, copyButton);
  panel.append(actions, output);

  toggle.onclick = () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    if (panel.style.display === "block") {
      render();
    }
  };

  document.body.append(toggle, panel);
}

function enableCrashDebugFromQuery() {
  const url = new URL(location.href);
  const value = url.searchParams.get(CRASH_DEBUG_QUERY_PARAM);
  if (value === null) {
    return;
  }

  if (value === "0" || value === "false") {
    localStorage.removeItem(CRASH_DEBUG_STORAGE_KEY);
  } else {
    localStorage.setItem(CRASH_DEBUG_STORAGE_KEY, "1");
  }

  url.searchParams.delete(CRASH_DEBUG_QUERY_PARAM);
  history.replaceState(history.state, "", url.toString());
}

function isCrashDebugEnabled() {
  return localStorage.getItem(CRASH_DEBUG_STORAGE_KEY) === "1";
}

function isRuntimeCrashDebugEnabled() {
  const runtimeConfig = useRuntimeConfig();
  const value = runtimeConfig.public.enableCrashDebug;
  return value === true || value === "true";
}

declare global {
  interface Window {
    __getCrashLogs?: () => CrashLogEntry[];
    __clearCrashLogs?: () => void;
    __getCrashBreadcrumbs?: () => CrashBreadcrumb[];
    __clearCrashBreadcrumbs?: () => void;
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  enableCrashDebugFromQuery();

  const isDebugActive = isRuntimeCrashDebugEnabled() || isCrashDebugEnabled();
  if (!isDebugActive) {
    return;
  }

  addBreadcrumb("plugin:init", {
    href: location.href,
    visibilityState: document.visibilityState,
  });

  window.__getCrashLogs = () => readLogs();
  window.__clearCrashLogs = () => {
    localStorage.removeItem(CRASH_LOG_KEY);
    clearCookie(CRASH_LOG_KEY);
  };
  window.__getCrashBreadcrumbs = () => readBreadcrumbs();
  window.__clearCrashBreadcrumbs = () => {
    localStorage.removeItem(CRASH_BREADCRUMB_KEY);
    clearCookie(CRASH_BREADCRUMB_KEY);
  };

  printRecentLogs();
  printRecentBreadcrumbs();

  window.addEventListener("beforeunload", () => {
    addBreadcrumb("window:beforeunload", { href: location.href });
  });

  window.addEventListener("pagehide", (event) => {
    addBreadcrumb("window:pagehide", { persisted: event.persisted });
  });

  window.addEventListener("pageshow", (event) => {
    addBreadcrumb("window:pageshow", { persisted: event.persisted });
  });

  document.addEventListener("visibilitychange", () => {
    addBreadcrumb("document:visibilitychange", {
      state: document.visibilityState,
    });
  });

  window.addEventListener("error", (event) => {
    addBreadcrumb("window:error", { message: event.message });
    addCrashLog({
      source: "window.error",
      message: event.message || "Unknown window error",
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error
      ? reason.message
      : typeof reason === "string"
      ? reason
      : "Unhandled promise rejection";

    addBreadcrumb("window:unhandledrejection", { message });
    addCrashLog({
      source: "window.unhandledrejection",
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  nuxtApp.hook("app:created", () => {
    addBreadcrumb("nuxt:app:created");
  });
  nuxtApp.hook("app:mounted", () => {
    addBreadcrumb("nuxt:app:mounted");
  });
  nuxtApp.hook("page:start", () => {
    addBreadcrumb("nuxt:page:start", { href: location.href });
  });
  nuxtApp.hook("page:finish", () => {
    addBreadcrumb("nuxt:page:finish", { href: location.href });
  });
  nuxtApp.hook("app:error", (error) => {
    const normalized = error instanceof Error
      ? error
      : new Error(String(error));
    addBreadcrumb("nuxt:app:error", { message: normalized.message });
    addCrashLog({
      source: "window.error",
      message: `Nuxt app:error: ${normalized.message}`,
      stack: normalized.stack,
    });
  });
  nuxtApp.hook("vue:error", (error, instance, info) => {
    const normalized = error instanceof Error
      ? error
      : new Error(String(error));
    addBreadcrumb("nuxt:vue:error", {
      message: normalized.message,
      info,
      component: instance?.$options?.name || "anonymous",
    });
    addCrashLog({
      source: "window.error",
      message: `Vue error: ${normalized.message} (${info})`,
      stack: normalized.stack,
    });
  });

  if (isCrashDebugEnabled()) {
    createCrashDebugPanel();
  }
});
