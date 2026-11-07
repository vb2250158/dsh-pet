/** Optional GUI navigation. This module never owns a Session, microphone or model. */
export interface AssistantEntry {
  open(): void;
}
interface OptionalScope {
  dshAssistant?: AssistantEntry;
  effect(setup: () => () => void): void;
}
interface OptionalContext {
  inject(names: string[], callback: (scope: OptionalScope) => void): void;
}
let current: { entry: AssistantEntry } | undefined;

/** Follow a public optional Cordis service through unload and replacement. */
export function installAssistantEntry(ctx: OptionalContext): void {
  ctx.inject(['dshAssistant'], (scope) => {
    if (typeof scope.dshAssistant?.open !== 'function') return;
    const lease = { entry: scope.dshAssistant };
    current = lease;
    scope.effect(() => () => {
      if (current === lease) current = undefined;
    });
  });
}
/** Whether the compatible assistant GUI is currently available in this client. */
export function hasAssistantEntry(): boolean {
  return !!current;
}
/** Navigate only; opening or closing the GUI does not start or stop speech. */
export function openAssistantEntry(): boolean {
  if (!current) return false;
  current.entry.open();
  return true;
}
