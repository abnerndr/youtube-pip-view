/**
 * Modificador de teclado e rótulos de atalho conforme o SO.
 * No renderer usamos navigator — o preload também expõe process.platform.
 */
export function isMacPlatform(): boolean {
  if (typeof window !== "undefined" && window.electronAPI?.platform) {
    return window.electronAPI.platform === "darwin";
  }
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

/** ⌘ no macOS, Ctrl no Windows/Linux */
export function modKey(): string {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

export function shortcutRestore(): string {
  return `${modKey()}⇧Y`;
}

export function shortcutOpenLink(): string {
  return `${modKey()}L`;
}

export function shortcutQuit(): string {
  return isMacPlatform() ? "⌘Q" : "Alt+F4";
}
