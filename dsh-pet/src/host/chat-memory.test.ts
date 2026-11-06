/**
 * 对话记忆写入的单元测试 —— 钉住「聊天记录存档」的两类图信息：
 * 带图那一轮 user 消息记下附件引用、配图那一轮 assistant 消息记下表情包名；
 * 不带图那一轮两条消息的字段集合必须与加字段前完全一致（纯增量，不破坏旧格式）。
 * 另覆盖第三方记忆提供者的接线：召回注入、失败降级、接收参数与抛错隔离。
 *
 * 走真实 memory.json 落盘（临时目录隔离），默认配置取仓库内 assets/config.jsonc（与生产同一份，
 * 不手抄第二份）；LLM 用假流驱动、不联网。
 *
 * 跑法：node --experimental-strip-types --test src/host/chat-memory.test.ts
 */
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { createChatMemory, type ChatMemoryInput } from './plugin/chat-memory.ts';
import type { ChatMemoryMessage } from './chat.ts';
import type { ConfigPaths } from './config.ts';
import type { PetImageRef } from './image-attachment.ts';
import { registerChatMemoryProvider, resetChatMemoryProviders } from './chat-memory-provider.ts';

/** 一条已落盘的图片引用：字段与附件服务返回的一致。 */
const IMAGE: PetImageRef = {
  attachmentId: '9f2c4a1b',
  mediaType: 'image/png',
  bytes: 10108,
  width: 257,
  height: 173,
};

/** 一份假 ctx：对话生成只读 agentDefaultModel 与 llm.stream，reply 为模型回的那句。
 *  `captured` 传了就把每次 stream 的 options 收进去（断言提示词注入了哪几段）。 */
function fakeCtx(
  reply: string,
  captured?: Record<string, unknown>[],
  onStream?: (options: Record<string, unknown>) => void,
): unknown {
  return {
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'test-model' }) },
    llm: {
      stream: (options: unknown) => {
        captured?.push(options as Record<string, unknown>);
        onStream?.(options as Record<string, unknown>);
        return (async function* () {
          yield { type: 'text-delta', index: 0, text: reply };
        })();
      },
    },
  };
}

/** 临时工作区：用户配置与记忆目录隔离，默认配置指回仓库里那一份。 */
function tempWorkspace(overlay: Record<string, unknown> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-pet-memory-test-'));
  const configPaths: ConfigPaths = {
    defaultFile: fileURLToPath(new URL('../../assets/config.jsonc', import.meta.url)),
    userFile: join(dir, 'main-config.jsonc'),
    petDir: join(dir, 'pet'), // 不存在 = 无文件宠物
  };
  writeFileSync(configPaths.userFile, JSON.stringify(overlay));
  return { dir, configPaths, memeDir: join(dir, 'memes'), userRoot: join(dir, 'user') };
}

/** 造一份对话记忆；memeDir 缺省 = 没有表情包目录（池为空）。
 *  `collect.writes` 记下每次写气泡叶子的「宠物.叶子」，`collect.records` 连同载荷一起留（断言字段用）。 */
function createMemory(
  reply: string,
  ws: ReturnType<typeof tempWorkspace>,
  memeDir?: string,
  collect?: {
    writes?: string[];
    records?: Array<{ petId: string; leaf: string; data: Record<string, unknown> }>;
  },
  captured?: Record<string, unknown>[],
  onStream?: (options: Record<string, unknown>) => void,
) {
  return createChatMemory({
    ctx: fakeCtx(reply, captured, onStream),
    configPaths: ws.configPaths,
    log: { info: () => {}, warn: () => {}, error: () => {} },
    memeDirsFor: () => (memeDir === undefined ? [] : [memeDir]),
    // 播放回执表只用到 create：编号带宠物与动作名，测试据此断言写进叶子的是哪一个动作
    playback: { create: (petId: string, name: string) => ({ playbackId: 'pb-' + petId + '-' + name }) },
    state: {
      writePet: (petId: string, leaf: string, data: Record<string, unknown>) => {
        collect?.writes?.push(petId + '.' + leaf);
        collect?.records?.push({ petId, leaf, data });
      },
    },
    userRoot: ws.userRoot,
  } as unknown as ChatMemoryInput);
}

/** 从 stream options 里取出本轮 user 正文（最后一条消息的第一个 text 块）。 */
function userTextOf(options: Record<string, unknown> | undefined): string {
  const messages = options?.messages as Array<{ content: Array<{ type: string; text?: string }> }> | undefined;
  const last = messages?.[messages.length - 1];
  return last?.content?.find((block) => block.type === 'text')?.text ?? '';
}

/** Only synthetic request records are read by these regressions. */
function readRequests(userRoot: string): Array<{
  version: number;
  time: number;
  turnTs?: number;
  request: Record<string, unknown>;
}> {
  const buckets: Record<string, Record<string, { requests?: ReturnType<typeof readRequests> }>> = JSON.parse(
    readFileSync(join(userRoot, 'memory.json'), 'utf8'),
  );
  return Object.values(buckets).flatMap((pets) => Object.values(pets).flatMap((pet) => pet.requests ?? []));
}

/** 读回刚落盘的记忆消息（只应有一只宠物一个分桶）。 */
function readMessages(userRoot: string): ChatMemoryMessage[] {
  const mem = JSON.parse(readFileSync(join(userRoot, 'memory.json'), 'utf8')) as Record<
    string,
    Record<string, { messages: ChatMemoryMessage[] }>
  >;
  const buckets = Object.values(mem).flatMap((byPet) => Object.values(byPet));
  const bucket = buckets[0];
  assert.ok(bucket && buckets.length === 1, '应当只写入一只宠物的记忆');
  return bucket.messages;
}

describe('createChatMemory —— 图信息写入记忆文件', () => {
  test('带图的一轮：user 原样记下附件引用，assistant 不凭空多出 meme 字段', async () => {
    const ws = tempWorkspace();
    try {
      const r = await createMemory('好看', ws).chatWithPet('main', '看看这个', IMAGE);
      assert.equal(r.ok, true);
      const messages = readMessages(ws.userRoot);
      assert.equal(messages.length, 2);
      const assistant = messages[1];
      assert.ok(assistant);
      assert.deepEqual(messages[0]?.image, IMAGE, 'user 消息应原样存下附件引用');
      assert.equal('meme' in assistant, false, '这一轮没配图，不得写 meme 字段');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('不带图的一轮：两条消息的字段集合与加字段前逐字节一致', async () => {
    const ws = tempWorkspace();
    try {
      const r = await createMemory('在的', ws).chatWithPet('main', '在吗');
      assert.equal(r.ok, true);
      const messages = readMessages(ws.userRoot);
      assert.equal(messages.length, 2);
      for (const m of messages) {
        assert.deepEqual(Object.keys(m).sort(), ['content', 'role', 'ts'], '不该出现 image / meme 字段');
      }
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('配图的一轮：assistant 记下表情包名，正文里的标记仍被剥离', async () => {
    const ws = tempWorkspace({ chatImageEnabled: true, memes: { 可爱: '卖萌立绘' } });
    mkdirSync(ws.memeDir, { recursive: true });
    writeFileSync(join(ws.memeDir, '可爱.png'), '');
    try {
      const r = await createMemory('你好呀\n[图:可爱]', ws, ws.memeDir).chatWithPet('main', '在吗');
      assert.equal(r.ok, true);
      const assistant = readMessages(ws.userRoot)[1];
      assert.ok(assistant);
      assert.equal(assistant.meme, '可爱', 'assistant 消息应记下配图名');
      assert.equal(assistant.content, '你好呀', '配图标记属于展示层，不得留在记忆正文里');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});

describe('createChatMemory —— 指定配图的碎碎念', () => {
  /** 池里两张图、文件都在；自动配图开关关着，用来验证「点名不受自动开关门控」。 */
  function poolWorkspace() {
    const ws = tempWorkspace({ whisperImageEnabled: false, memes: { 可爱: '卖萌立绘', 生气: '鼓腮帮子' } });
    mkdirSync(ws.memeDir, { recursive: true });
    writeFileSync(join(ws.memeDir, '可爱.png'), '');
    writeFileSync(join(ws.memeDir, '生气.png'), '');
    return ws;
  }

  test('点名池内的图：用这张说话，自动配图开关关着也生效', async () => {
    const ws = poolWorkspace();
    const writes: string[] = [];
    try {
      const r = await createMemory('随便一句', ws, ws.memeDir, { writes }).publishWhisper('main', '生气');
      assert.equal(r.ok, true);
      assert.equal(r.ok === true ? r.image : '', '生气', '必须用点名的那张，不能随机抽');
      assert.deepEqual(writes, ['main.say'], '成功时写一次气泡叶子');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('点名不存在的图：unknown-image，且不写气泡', async () => {
    const ws = poolWorkspace();
    const writes: string[] = [];
    try {
      const r = await createMemory('不该生成', ws, ws.memeDir, { writes }).publishWhisper('main', '查无此图');
      assert.equal(r.ok, false);
      assert.equal(r.ok === false ? r.reason : '', 'unknown-image');
      assert.deepEqual(writes, [], '明确失败时不写叶子，否则等于静默换了一张');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('配置写了但图片文件已删：同样 unknown-image（池判定含文件存在性）', async () => {
    const ws = poolWorkspace();
    rmSync(join(ws.memeDir, '生气.png'));
    try {
      const r = await createMemory('不该生成', ws, ws.memeDir).publishWhisper('main', '生气');
      assert.equal(r.ok === false ? r.reason : '', 'unknown-image');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('不点名：保持原行为（开关关 = 纯文本，不带 image）', async () => {
    const ws = poolWorkspace();
    try {
      const r = await createMemory('纯文本一句', ws, ws.memeDir).publishWhisper('main');
      assert.equal(r.ok, true);
      assert.equal(r.ok === true && 'image' in r, false, '自动配图关闭时不该带图');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('voiceTo：传了就用传的，没传按 display 推导（默认宠物 display=both → desktop）', async () => {
    const ws = poolWorkspace();
    const records: Array<{ petId: string; leaf: string; data: Record<string, unknown> }> = [];
    try {
      await createMemory('随便一句', ws, ws.memeDir, { records }).publishWhisper('main', undefined, 'web');
      assert.equal(records[0]?.data.voiceTo, 'web', '显式传入优先于 display');

      await createMemory('纯文本一句', ws, ws.memeDir, { records }).publishWhisper('main');
      assert.equal(records[1]?.data.voiceTo, 'desktop', '没传时按 display 推导：桌面优先');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
  test('kind=whisper 受 voiceWhisperEnabled 管；手动（缺省 kind）不受它管', async () => {
    const off = poolWorkspace();
    const offRecords: Array<{ petId: string; leaf: string; data: Record<string, unknown> }> = [];
    try {
      await createMemory('一句', off, off.memeDir, { records: offRecords }).publishWhisper(
        'main',
        undefined,
        undefined,
        'whisper',
      );
      assert.equal('voiceTo' in (offRecords[0]?.data ?? {}), false, '开关关着时周期碎碎念不该写 voiceTo');

      await createMemory('一句', off, off.memeDir, { records: offRecords }).publishWhisper('main');
      assert.equal(offRecords[1]?.data.voiceTo, 'desktop', '手动触发不看那个开关，照常按 display 推导');
    } finally {
      rmSync(off.dir, { recursive: true, force: true });
    }

    const on = tempWorkspace({ voiceWhisperEnabled: true });
    const onRecords: Array<{ petId: string; leaf: string; data: Record<string, unknown> }> = [];
    try {
      await createMemory('一句', on, undefined, { records: onRecords }).publishWhisper(
        'main',
        undefined,
        undefined,
        'whisper',
      );
      assert.equal(onRecords[0]?.data.voiceTo, 'desktop', '开关打开后周期碎碎念照常带 voiceTo');
    } finally {
      rmSync(on.dir, { recursive: true, force: true });
    }
  });
});

describe('createChatMemory —— 对话回复的 voiceTo', () => {
  test('回复写叶子时带上该由哪一端念（对话请求没有具体端，按 display 推导）', async () => {
    const ws = tempWorkspace();
    const records: Array<{ petId: string; leaf: string; data: Record<string, unknown> }> = [];
    try {
      const r = await createMemory('在的', ws, undefined, { records }).chatWithPet('main', '在吗');
      assert.equal(r.ok, true);
      assert.equal(records[0]?.data.voiceTo, 'desktop', '默认宠物 display=both，桌面优先');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});

describe('createChatMemory —— 对话动作联动', () => {
  /** 收集一次对话写了哪些叶子与载荷。 */
  type Records = Array<{ petId: string; leaf: string; data: Record<string, unknown> }>;

  test('命中动作：先写 anim 叶子（带 playbackId）、再写气泡 anim:false，记忆记 action 且正文剥标记', async () => {
    const ws = tempWorkspace();
    const records: Records = [];
    try {
      const r = await createMemory('好呀～看我转一圈！\n[动作:优雅女仆舞]', ws, undefined, { records }).chatWithPet(
        'main',
        '跳个舞吧',
      );
      assert.equal(r.ok, true);
      assert.deepEqual(
        records.map((x) => x.leaf),
        ['anim', 'say'],
        '先写动作再写气泡：渲染端先收到动作，气泡不会把它顶掉',
      );
      const anim = records[0];
      assert.equal(anim?.data.name, '优雅女仆舞');
      assert.match(String(anim?.data.playbackId), /^pb-/);
      const say = records[1];
      assert.equal(say?.data.anim, false, '带动作时气泡不联动碎碎念动画');
      assert.equal(say?.data.text, '好呀～看我转一圈！');
      const assistant = readMessages(ws.userRoot)[1];
      assert.equal(assistant?.content, '好呀～看我转一圈！', '记忆正文不得留标记');
      assert.equal(assistant?.action, '优雅女仆舞', '记忆要能还原这一轮演了什么');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('只写标记没有正文：演动作、不写 say（不弹空气泡）', async () => {
    const ws = tempWorkspace();
    const records: Records = [];
    try {
      const r = await createMemory('[动作:原地小憩沉眠]', ws, undefined, { records }).chatWithPet('main', '累了吧');
      assert.equal(r.ok, true);
      assert.deepEqual(
        records.map((x) => x.leaf),
        ['anim'],
      );
      assert.equal(readMessages(ws.userRoot)[1]?.content, '');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('没选动作：不写 anim 叶子，气泡也不带 anim:false（与加功能前一致）', async () => {
    const ws = tempWorkspace();
    const records: Records = [];
    try {
      await createMemory('在的', ws, undefined, { records }).chatWithPet('main', '在吗');
      assert.equal(
        records.some((x) => x.leaf === 'anim'),
        false,
      );
      const say = records.find((x) => x.leaf === 'say');
      assert.equal('anim' in (say?.data ?? {}), false);
      assert.equal('action' in (readMessages(ws.userRoot)[1] ?? {}), false);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('chatAnimationEnabled=false：不注入也不解析，标记原样留在正文里', async () => {
    const ws = tempWorkspace({ chatAnimationEnabled: false });
    const records: Records = [];
    try {
      const r = await createMemory('好的\n[动作:优雅女仆舞]', ws, undefined, { records }).chatWithPet(
        'main',
        '跳个舞吧',
      );
      assert.equal(r.ok, true);
      assert.equal(
        records.some((x) => x.leaf === 'anim'),
        false,
        '关闭时不得写动作叶子',
      );
      assert.equal(r.ok === true ? r.text : '', '好的\n[动作:优雅女仆舞]', '关闭时不解析，标记原样保留');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});

describe('createChatMemory —— 提示词注入（配图 / 动作各自独立）', () => {
  test('两个开关都开：user 正文同时带配图清单与动作清单', async () => {
    const ws = tempWorkspace({ chatImageEnabled: true, memes: { 可爱: '卖萌立绘' } });
    mkdirSync(ws.memeDir, { recursive: true });
    writeFileSync(join(ws.memeDir, '可爱.png'), '');
    const captured: Record<string, unknown>[] = [];
    try {
      await createMemory('在的', ws, ws.memeDir, undefined, captured).chatWithPet('main', '在吗');
      const text = userTextOf(captured[0]);
      assert.ok(text.includes('[配图]'), '应注入配图指令');
      assert.ok(text.includes('[动作]'), '应注入动作指令');
      assert.ok(text.includes('- 可爱：卖萌立绘'), '配图清单要带上描述');
      assert.ok(text.includes('- 优雅女仆舞'), '动作清单要带上名字');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('两个开关都关：user 正文只有用户原话', async () => {
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    const captured: Record<string, unknown>[] = [];
    try {
      await createMemory('在的', ws, undefined, undefined, captured).chatWithPet('main', '在吗');
      assert.equal(userTextOf(captured[0]), '在吗');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});

describe('createChatMemory —— 删除对话记忆', () => {
  /** 预置一份带两轮记忆的文件（时间戳固定，避免依赖真实时钟）。 */
  function seed(userRoot: string): void {
    mkdirSync(userRoot, { recursive: true });
    const messages = [
      { role: 'user', content: '第一问', ts: 1000 },
      { role: 'assistant', content: '第一答', ts: 1000 },
      { role: 'user', content: '第二问', ts: 2000 },
      { role: 'assistant', content: '第二答', ts: 2000 },
    ];
    writeFileSync(join(userRoot, 'memory.json'), JSON.stringify({ main: { main: { messages } } }));
  }

  test('按 ts 删：命中的轮成对移除，其余轮原样保留', async () => {
    const ws = tempWorkspace();
    seed(ws.userRoot);
    try {
      const r = await createMemory('无关', ws).deleteHistory('main', [1000]);
      assert.deepEqual(r, { ok: true, removed: 2 });
      const rest = readMessages(ws.userRoot);
      assert.deepEqual(
        rest.map((m) => m.content),
        ['第二问', '第二答'],
        '只删 ts=1000 的两条，另一轮必须完整留下',
      );
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('不存在的 ts → removed 为 0，文件内容不变（不因空操作重写记忆）', async () => {
    const ws = tempWorkspace();
    seed(ws.userRoot);
    const before = readFileSync(join(ws.userRoot, 'memory.json'), 'utf8');
    try {
      const r = await createMemory('无关', ws).deleteHistory('main', [999]);
      assert.deepEqual(r, { ok: true, removed: 0 });
      assert.equal(readFileSync(join(ws.userRoot, 'memory.json'), 'utf8'), before);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('不带 ts → 清空整只，并把空叶子与空条目一起摘掉', async () => {
    const ws = tempWorkspace();
    seed(ws.userRoot);
    try {
      const r = await createMemory('无关', ws).deleteHistory('main');
      assert.deepEqual(r, { ok: true, removed: 4 });
      const mem = JSON.parse(readFileSync(join(ws.userRoot, 'memory.json'), 'utf8')) as Record<string, unknown>;
      assert.deepEqual(mem, {}, '清空后不应残留空条目或空宠物叶子');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('宠物不存在 → unknown-pet，且不写文件', async () => {
    const ws = tempWorkspace();
    try {
      const r = await createMemory('无关', ws).deleteHistory('nobody');
      assert.equal(r.ok, false);
      assert.equal(r.ok === false ? r.reason : '', 'unknown-pet');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});

describe('createChatMemory —— 第三方记忆提供者', () => {
  beforeEach(() => resetChatMemoryProviders());

  test('未注册：请求与本轮输入不变（没有证据块）', async () => {
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    const captured: Record<string, unknown>[] = [];
    try {
      await createMemory('在的', ws, undefined, undefined, captured).chatWithPet('main', '在吗');
      const messages = captured[0]?.messages as Array<{ content: Array<{ type: string; text?: string }> }>;
      const last = messages[messages.length - 1];
      assert.equal(last?.content.length, 1, '没有召回时本轮只有一个 text 块');
      assert.equal(last?.content[0]?.text, '在吗');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('召回：补丁覆盖 system 与 userText，核心用改后的内容生成', async () => {
    registerChatMemoryProvider({
      id: 'pc',
      recall: async () => ({ system: '改后的人设', userText: '改后的问题' }),
    });
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    const captured: Record<string, unknown>[] = [];
    try {
      await createMemory('记住啦', ws, undefined, undefined, captured).chatWithPet('main', '在吗');
      assert.equal(captured[0]?.system, '改后的人设');
      assert.equal(userTextOf(captured[0]), '改后的问题');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('召回抛错：回复照常，内容不修改', async () => {
    registerChatMemoryProvider({
      id: 'pc',
      recall: async () => {
        throw new Error('服务不可用');
      },
    });
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    const captured: Record<string, unknown>[] = [];
    try {
      const r = await createMemory('在的', ws, undefined, undefined, captured).chatWithPet('main', '在吗');
      assert.equal(r.ok, true);
      assert.equal(userTextOf(captured[0]), '在吗');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('召回超时：1.5s 后按不修改继续，回复照常', async () => {
    registerChatMemoryProvider({ id: 'pc', recall: () => new Promise<undefined>(() => {}) });
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    const captured: Record<string, unknown>[] = [];
    try {
      const r = await createMemory('在的', ws, undefined, undefined, captured).chatWithPet('main', '在吗');
      assert.equal(r.ok, true);
      assert.equal(userTextOf(captured[0]), '在吗');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('接收：落盘后收到本轮问答与 ts，且不含未出现的可选字段', async () => {
    const captured: Array<Record<string, unknown>> = [];
    registerChatMemoryProvider({
      id: 'pc',
      capture: (input) => {
        captured.push(input as unknown as Record<string, unknown>);
      },
    });
    const ws = tempWorkspace();
    try {
      const r = await createMemory('你好呀～', ws).chatWithPet('main', '你好');
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(r.ok, true);
      assert.equal(captured.length, 1);
      const input = captured[0]!;
      assert.equal(input.petId, 'main');
      assert.equal(input.userText, '你好');
      assert.equal(input.replyText, '你好呀～');
      assert.equal(typeof input.ts, 'number');
      assert.equal('action' in input, false);
      assert.equal('image' in input, false);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('接收抛错：不影响回复，也不影响已落盘的记忆', async () => {
    registerChatMemoryProvider({
      id: 'pc',
      capture: () => {
        throw new Error('上传失败');
      },
    });
    const ws = tempWorkspace();
    try {
      const r = await createMemory('在的', ws).chatWithPet('main', '在吗');
      assert.equal(r.ok, true);
      assert.equal(readMessages(ws.userRoot).length, 2);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});

describe('模型实际请求持久化', () => {
  beforeEach(() => resetChatMemoryProviders());

  test('实际请求先落盘再调模型，召回后的三个字段可重建，且不保存 signal 或凭据', async () => {
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    const captured: Record<string, unknown>[] = [];
    registerChatMemoryProvider({
      id: 'synthetic-recall',
      recall: () => ({
        system: 'synthetic effective system',
        userText: 'synthetic effective user',
        history: [{ role: 'user', content: 'synthetic recalled history', ts: 1 }],
      }),
    });
    try {
      const r = await createMemory('synthetic reply', ws, undefined, undefined, captured, (options) => {
        const requests = readRequests(ws.userRoot);
        assert.equal(requests.length, 1, 'request must already be durable at dispatch');
        const { signal, ...visible } = options;
        assert(signal instanceof AbortSignal);
        assert.deepEqual(requests[0]?.request, JSON.parse(JSON.stringify(visible)));
      }).chatWithPet('main', 'synthetic original user');
      assert.equal(r.ok, true);
      const request = readRequests(ws.userRoot)[0];
      assert.equal(request?.version, 1);
      assert.equal(request?.request.system, 'synthetic effective system');
      assert.equal(userTextOf(request?.request), 'synthetic effective user');
      assert(JSON.stringify(request?.request).includes('synthetic recalled history'));
      assert.equal('signal' in (request?.request ?? {}), false);
      assert.equal('headers' in (request?.request ?? {}), false);
      assert.equal('credentials' in (request?.request ?? {}), false);
      assert.equal(readMessages(ws.userRoot)[0]?.content, 'synthetic original user');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('没有召回的旧记忆仍可读取；重新建立 owner 后继续保存实际请求', async () => {
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    try {
      mkdirSync(ws.userRoot, { recursive: true });
      writeFileSync(
        join(ws.userRoot, 'memory.json'),
        JSON.stringify({ main: { main: { messages: [{ role: 'user', content: 'synthetic legacy', ts: 1 }] } } }),
      );
      assert.equal((await createMemory('first', ws).chatWithPet('main', 'one')).ok, true);
      assert.equal((await createMemory('second', ws).chatWithPet('main', 'two')).ok, true);
      assert.equal(readRequests(ws.userRoot).length, 2);
      assert(readMessages(ws.userRoot).some((message) => message.content === 'synthetic legacy'));
      const messages = readMessages(ws.userRoot);
      assert.equal(messages[messages.length - 1]?.content, 'second');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('适配器修改请求对象不会改写已持久化的实际输入', async () => {
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    try {
      const memory = createMemory('reply', ws, undefined, undefined, undefined, (options) => {
        options.system = 'synthetic adapter mutation';
        options.messages = [];
      });
      assert.equal((await memory.chatWithPet('main', 'synthetic original input')).ok, true);
      const request = readRequests(ws.userRoot)[0]?.request;
      assert.notEqual(request?.system, 'synthetic adapter mutation');
      assert.equal(userTextOf(request), 'synthetic original input');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('首个模型失败与回落请求分别先落盘，失败记录不会被成功覆盖', async () => {
    const ws = tempWorkspace({
      chatImageEnabled: false,
      chatAnimationEnabled: false,
      chatModel: { provider: 'synthetic-failed', model: 'first' },
    });
    const calls: string[] = [];
    try {
      const r = await createMemory('fallback', ws, undefined, undefined, undefined, (options) => {
        const requests = readRequests(ws.userRoot);
        calls.push(String(options.provider));
        assert.equal(requests.length, calls.length);
        assert.equal(requests[requests.length - 1]?.request.provider, options.provider);
        if (options.provider === 'synthetic-failed') throw new Error('synthetic model unavailable');
      }).chatWithPet('main', 'retry');
      assert.equal(r.ok, true);
      assert.deepEqual(calls, ['synthetic-failed', 'test']);
      const requests = readRequests(ws.userRoot);
      assert.equal(requests.length, 2);
      assert.equal(requests[0]?.turnTs, readMessages(ws.userRoot)[0]?.ts);
      assert.equal(requests[1]?.turnTs, requests[0]?.turnTs);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('请求保存失败时不调任何候选模型，旧历史原字节保留', async () => {
    const ws = tempWorkspace({
      chatImageEnabled: false,
      chatAnimationEnabled: false,
      chatModel: { provider: 'synthetic-failed', model: 'first' },
    });
    const captured: Record<string, unknown>[] = [];
    try {
      mkdirSync(ws.userRoot, { recursive: true });
      const original = JSON.stringify({ main: { main: { messages: [{ role: 'user', content: 'keep', ts: 1 }] } } });
      writeFileSync(join(ws.userRoot, 'memory.json'), original);
      mkdirSync(join(ws.userRoot, 'memory.json.tmp'));
      const r = await createMemory('unreachable', ws, undefined, undefined, captured).chatWithPet('main', 'blocked');
      assert.equal(r.ok, false);
      assert.equal(captured.length, 0);
      assert.equal(readFileSync(join(ws.userRoot, 'memory.json'), 'utf8'), original);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('模型全失败仍保留请求；清空会移除仅有请求的宠物记录', async () => {
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    try {
      const memory = createMemory('unreachable', ws, undefined, undefined, undefined, () => {
        throw new Error('synthetic unavailable');
      });
      assert.equal((await memory.chatWithPet('main', 'failed')).ok, false);
      assert.equal(readRequests(ws.userRoot).length, 1);
      assert.equal(readMessages(ws.userRoot).length, 0);
      await memory.deleteHistory('main');
      assert.equal(readRequests(ws.userRoot).length, 0);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('删除一轮同时移除该轮全部请求，保留另一轮', async (t) => {
    const ws = tempWorkspace({ chatImageEnabled: false, chatAnimationEnabled: false });
    let now = Date.now();
    t.mock.method(Date, 'now', () => now);
    try {
      const memory = createMemory('reply', ws);
      await memory.chatWithPet('main', 'first');
      const first = readMessages(ws.userRoot)[0]?.ts;
      now += 1;
      await memory.chatWithPet('main', 'second');
      assert.equal(typeof first, 'number');
      await memory.deleteHistory('main', [first!]);
      const requests = readRequests(ws.userRoot);
      assert.equal(requests.length, 1);
      assert.equal(userTextOf(requests[0]?.request), 'second');
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});

/** Exact serialized array bytes at the existing memory.json nesting, including success metadata. */
function requestBudget(records: ReturnType<typeof readRequests>): number {
  const reserved = records.map((record) => ({ ...record, turnTs: Number.MAX_SAFE_INTEGER }));
  return (
    Buffer.byteLength(JSON.stringify({ entry: { pet: { requests: reserved } } }, null, 2), 'utf8') -
    Buffer.byteLength(JSON.stringify({ entry: { pet: { requests: [] } } }, null, 2), 'utf8') +
    2
  );
}

describe('每宠物实际请求字节预算', () => {
  beforeEach(() => {
    resetChatMemoryProviders();
    registerChatMemoryProvider({
      id: 'synthetic-budget',
      recall: () => ({ system: '中文🙂', history: [], userText: '请求🌧' }),
    });
  });

  test('Unicode 按实际 UTF-8 计量，边界可保存，少一字节在调用前拒绝', async () => {
    const overlay = { chatImageEnabled: false, chatAnimationEnabled: false };
    const ws = tempWorkspace(overlay);
    const calls: Record<string, unknown>[] = [];
    try {
      const memory = createMemory('reply', ws, undefined, undefined, calls);
      assert.equal((await memory.chatWithPet('main', 'one')).ok, true);
      const records = readRequests(ws.userRoot);
      const limit = requestBudget(records);
      assert(Buffer.byteLength(JSON.stringify(records), 'utf8') > JSON.stringify(records).length);
      await memory.deleteHistory('main');
      writeFileSync(ws.configPaths.userFile, JSON.stringify({ ...overlay, chatRequestLimitBytes: limit }));
      assert.equal((await memory.chatWithPet('main', 'two')).ok, true);
      const saved = readFileSync(join(ws.userRoot, 'memory.json'), 'utf8');
      const withoutRequests = JSON.parse(saved);
      withoutRequests.main.main.requests = [];
      const actualBytes =
        Buffer.byteLength(saved, 'utf8') - Buffer.byteLength(JSON.stringify(withoutRequests, null, 2), 'utf8') + 2;
      assert(actualBytes <= limit, 'final on-disk array must remain within the configured byte limit');
      await memory.deleteHistory('main');
      writeFileSync(ws.configPaths.userFile, JSON.stringify({ ...overlay, chatRequestLimitBytes: limit - 1 }));
      const before = readFileSync(join(ws.userRoot, 'memory.json'), 'utf8');
      const result = await memory.chatWithPet('main', 'three');
      assert.equal(result.ok, false);
      assert.equal(calls.length, 2);
      assert.equal(result.ok === false && result.message?.includes('chatRequestLimitBytes'), true);
      assert.equal(readFileSync(join(ws.userRoot, 'memory.json'), 'utf8'), before);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('回落前重新检查预算，保留已调用的失败请求，不调用超额的下一模型', async () => {
    const overlay = {
      chatImageEnabled: false,
      chatAnimationEnabled: false,
      chatModel: { provider: 'first', model: 'model' },
    };
    const ws = tempWorkspace(overlay);
    const calls: Record<string, unknown>[] = [];
    try {
      const calibration = createMemory('reply', ws);
      await calibration.chatWithPet('main', 'one');
      const limit = requestBudget(readRequests(ws.userRoot));
      await calibration.deleteHistory('main');
      writeFileSync(ws.configPaths.userFile, JSON.stringify({ ...overlay, chatRequestLimitBytes: limit }));
      const memory = createMemory('unreachable', ws, undefined, undefined, calls, () => {
        throw new Error('synthetic failed model');
      });
      const result = await memory.chatWithPet('main', 'two');
      assert.equal(result.ok, false);
      assert.equal(result.ok === false && result.message?.includes('chatRequestLimitBytes'), true);
      assert.equal(calls.length, 1);
      assert.equal(readRequests(ws.userRoot).length, 1);
      assert.equal(readRequests(ws.userRoot)[0]?.turnTs, undefined);
      assert.equal(readMessages(ws.userRoot).length, 0);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('并发聊天串行计量，其他宠物独立；按轮删除后能继续', async () => {
    const overlay = { chatImageEnabled: false, chatAnimationEnabled: false, pets: [{ id: 'main' }, { id: 'peer' }] };
    const ws = tempWorkspace(overlay);
    const calls: Record<string, unknown>[] = [];
    try {
      const memory = createMemory('reply', ws, undefined, undefined, calls);
      await memory.chatWithPet('main', 'one');
      const limit = requestBudget(readRequests(ws.userRoot));
      await memory.deleteHistory('main');
      writeFileSync(ws.configPaths.userFile, JSON.stringify({ ...overlay, chatRequestLimitBytes: limit }));
      const outcomes = await Promise.all([memory.chatWithPet('main', 'two'), memory.chatWithPet('main', 'three')]);
      assert.deepEqual(
        outcomes.map((outcome) => outcome.ok),
        [true, false],
      );
      assert.equal(calls.length, 2);
      assert.equal((await memory.chatWithPet('peer', 'four')).ok, true);
      const main = (await memory.readMemory()).main.main;
      await memory.deleteHistory('main', [main.messages[0].ts]);
      assert.equal((await memory.chatWithPet('main', 'five')).ok, true);
      const file = await memory.readMemory();
      assert.equal(file.main.main.requests?.length, 1);
      assert.equal(file.main.peer.requests?.length, 1);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });

  test('已有文件超过新预算时原样保留，提高正常配置预算后继续', async () => {
    const overlay = { chatImageEnabled: false, chatAnimationEnabled: false };
    const ws = tempWorkspace(overlay);
    const calls: Record<string, unknown>[] = [];
    try {
      const memory = createMemory('reply', ws, undefined, undefined, calls);
      await memory.chatWithPet('main', 'one');
      const before = readFileSync(join(ws.userRoot, 'memory.json'), 'utf8');
      writeFileSync(ws.configPaths.userFile, JSON.stringify({ ...overlay, chatRequestLimitBytes: 1 }));
      assert.equal((await memory.chatWithPet('main', 'two')).ok, false);
      assert.equal(readFileSync(join(ws.userRoot, 'memory.json'), 'utf8'), before);
      assert.equal(calls.length, 1);
      writeFileSync(ws.configPaths.userFile, JSON.stringify({ ...overlay, chatRequestLimitBytes: 16777216 }));
      assert.equal((await memory.chatWithPet('main', 'three')).ok, true);
      assert.equal(readRequests(ws.userRoot).length, 2);
      assert.equal(readMessages(ws.userRoot).length, 4);
    } finally {
      rmSync(ws.dir, { recursive: true, force: true });
    }
  });
});
