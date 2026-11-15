/** Built-in provider registration follows its successful owner's lifetime. */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { ensureEdgeProvider } from './builtin-edge.ts';
import { ensureDshSpeechProvider } from './builtin-dsh.ts';
import { ensureDeepseekTtsProvider } from './builtin-deepseek-tts.ts';
import { ensureDeepseekAsrProvider } from './builtin-deepseek-asr.ts';
import { registerVoiceProvider, resetVoiceProviders, resolveVoice } from './registry.ts';
import { registerSpeechProvider, resetSpeechProviders, resolveSpeechProvider } from './speech-registry.ts';
afterEach(() => {
  resetVoiceProviders();
  resetSpeechProviders();
});
const cases = [
  {
    name: 'Edge',
    register: () => ensureEdgeProvider(),
    resolve: () => resolveVoice('edge/zh-CN-XiaoyiNeural')?.provider,
  },
  {
    name: 'DSH recognition',
    register: () => ensureDshSpeechProvider({ speechToText: () => undefined }),
    resolve: () => resolveSpeechProvider('dsh'),
  },
  {
    name: 'DeepSeek synthesis',
    register: () => ensureDeepseekTtsProvider({ resolveKey: async () => undefined }),
    resolve: () => resolveVoice('deepseek/stella')?.provider,
  },
  {
    name: 'DeepSeek recognition',
    register: () => ensureDeepseekAsrProvider({ resolveKey: async () => undefined }),
    resolve: () => resolveSpeechProvider('deepseek'),
  },
];
for (const item of cases)
  test(item.name + ' releases its own registration and permits a fresh owner', () => {
    const release = item.register();
    assert.equal(typeof release, 'function');
    assert.equal(item.register(), undefined, 'an existing provider grants no removal authority');
    assert.ok(typeof release === 'function');
    release();
    assert.equal(item.resolve(), undefined);
    const releaseNew = item.register();
    const replacement = item.resolve();
    assert.ok(replacement);
    release();
    assert.equal(item.resolve(), replacement, 'late old cleanup retains the replacement');
    assert.ok(typeof releaseNew === 'function');
    releaseNew();
    assert.equal(item.resolve(), undefined);
  });
test('a reused voice definition survives a repeated old disposer', () => {
  const provider = {
    id: 'synthetic',
    name: 'Synthetic',
    voices: [{ id: 'voice', name: 'Voice' }],
    synthesize: async () => new Uint8Array([1]),
  };
  const old = registerVoiceProvider(provider);
  old();
  const current = registerVoiceProvider(provider);
  old();
  assert.equal(resolveVoice('synthetic/voice')?.provider, provider);
  current();
});
test('a reused speech definition survives a repeated old disposer', () => {
  const provider = { id: 'synthetic', name: 'Synthetic', transcribe: async () => 'synthetic' };
  const old = registerSpeechProvider(provider);
  old();
  const current = registerSpeechProvider(provider);
  old();
  assert.equal(resolveSpeechProvider('synthetic'), provider);
  current();
});
