/** Desktop entry checks Host capability before opening the same assistant GUI. */
export async function openResidentAssistant(options: {
  baseUrl: string;
  open: (path: string) => void;
  fetcher?: typeof fetch;
}): Promise<boolean> {
  const response = await (options.fetcher ?? fetch)(options.baseUrl + '/assistant-entry', {
    signal: AbortSignal.timeout(5000),
  });
  // Older pet versions do not expose this route; retain their original standalone chat.
  if (response.status === 400 || response.status === 404) return false;
  if (!response.ok) throw new Error('ASSISTANT_ENTRY_UNAVAILABLE');
  const entry = (await response.json()) as { available?: boolean; protocol?: number; path?: string };
  if (entry.available === false) return false;
  if (entry.available !== true || entry.protocol !== 1 || entry.path !== '/?voice-assistant=1')
    throw new Error('ASSISTANT_ENTRY_INCOMPATIBLE');
  options.open(entry.path);
  return true;
}
