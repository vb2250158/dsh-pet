/**
 * 对话历史的时间前缀测试（issue #261）——钉住实际发给模型的 messages 形状：
 *  - user 历史消息超过 30 分钟阈值 → 正文前带 `[月日 时:分]`；
 *  - assistant 历史消息不带：模型会照抄自己那侧的格式，前缀只标在 user 上；
 *  - 阈值内（连续闲聊）不带；本轮用户输入永远不带。
 *
 * 用假 ctx.llm.stream 拦住完整请求参数（不联网），断言的是真实 payload 而不是格式化函数的返回值。
 * 跑法：node --experimental-strip-types --test src/host/chat-history-stamp.test.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { generateChat, type ChatMemoryMessage } from './chat.ts';

const PROVIDER = { provider: 'current', model: 'main-model' };

/** 造一个假 ctx，把每次 stream 的完整参数记进 options。 */
function fakeCtx() {
  const options: Record<string, unknown>[] = [];
  const ctx = {
    agentDefaultModel: { currentSelection: () => PROVIDER },
    llm: {
      resolveModelInfo: async () => ({}),
      stream: (o: unknown) => {
        options.push(o as Record<string, unknown>);
        return (async function* () {
          yield { type: 'text-delta', index: 0, text: '好呀' };
        })();
      },
    },
  };
  return { ctx, options };
}

/** 取第 index 条消息的纯文本（本测试只关心第一个 text 块）。 */
function textOf(sent: Record<string, unknown>, index: number): string {
  const messages = sent.messages as { content: { type: string; text?: string }[] }[];
  return messages[index].content[0].text ?? '';
}

/** 一次对话：history 原样传入，返回实际发给模型的第一条 stream 参数。 */
async function send(history: ChatMemoryMessage[]): Promise<Record<string, unknown>> {
  const { ctx, options } = fakeCtx();
  const result = await generateChat({ ctx, system: '人设', history, userText: '鲸鲸，你今天干了什么？' });
  assert.equal(result.ok, true, '生成应成功，否则说明假 ctx 没接上');
  return options[0];
}

describe('generateChat —— 历史消息的时间前缀', () => {
  test('隔了两天的 user 消息 → 带 [月日 时:分] 前缀', async () => {
    const oldTs = Date.now() - 50 * 60 * 60 * 1000;
    const sent = await send([
      { role: 'user', content: '睡觉了鲸鲸，午安', ts: oldTs },
      { role: 'assistant', content: '晚安～做个好梦', ts: oldTs },
    ]);
    assert.match(textOf(sent, 0), /^\[\d{1,2}月\d{1,2}日 \d{2}:\d{2}\] 睡觉了鲸鲸，午安$/);
  });

  test('assistant 历史消息不带前缀（模型会照抄自己那侧的格式）', async () => {
    const oldTs = Date.now() - 50 * 60 * 60 * 1000;
    const sent = await send([
      { role: 'user', content: '睡觉了鲸鲸，午安', ts: oldTs },
      { role: 'assistant', content: '晚安～做个好梦', ts: oldTs },
    ]);
    assert.equal(textOf(sent, 1), '晚安～做个好梦');
  });

  test('阈值内（30 分钟内）的连续对话 → 不加前缀', async () => {
    const recent = Date.now() - 5 * 60 * 1000;
    const sent = await send([
      { role: 'user', content: '在吗', ts: recent },
      { role: 'assistant', content: '在的', ts: recent },
    ]);
    assert.equal(textOf(sent, 0), '在吗');
    assert.equal(textOf(sent, 1), '在的');
  });

  test('本轮用户输入永不加前缀（它就是“现在”，由【当下】交代）', async () => {
    const oldTs = Date.now() - 50 * 60 * 60 * 1000;
    const sent = await send([{ role: 'assistant', content: '晚安', ts: oldTs }]);
    const messages = sent.messages as { content: { text?: string }[] }[];
    assert.equal(textOf(sent, messages.length - 1), '鲸鲸，你今天干了什么？');
  });

  test('跨年的历史 → 前缀带年份', async () => {
    const year = new Date().getFullYear();
    const lastYearTs = new Date(year - 1, 11, 31, 23, 59).getTime();
    const sent = await send([{ role: 'user', content: '新年快乐', ts: lastYearTs }]);
    assert.ok(
      textOf(sent, 0).startsWith(`[${year - 1}年12月31日 23:59] 新年快乐`),
      `实际：${JSON.stringify(textOf(sent, 0))}`,
    );
  });

  test('assistant 历史只回填动作和配图名称一次，user 附件与标记不回放', async () => {
    const recent = Date.now() - 60_000;
    const history: ChatMemoryMessage[] = [
      {
        role: 'user',
        content: '换一个吧',
        ts: recent,
        action: '用户动作',
        meme: '用户配图',
        image: { attachmentId: 'synthetic-old-image', mediaType: 'image/png', bytes: 12, width: 1, height: 1 },
      },
      { role: 'assistant', content: '好呀', ts: recent, action: '挥手', meme: '开心' },
    ];
    const original = structuredClone(history);
    const sent = await send(history);
    assert.equal(textOf(sent, 0), '换一个吧');
    assert.equal(textOf(sent, 1), '好呀\n[动作:挥手]\n[图:开心]');
    assert.equal(JSON.stringify(sent.messages).includes('synthetic-old-image'), false);
    assert.deepEqual(history, original, '投影模型消息不应改写持久记忆');
  });

  test('没有历史动作或配图时，assistant 正文逐字保留', async () => {
    const recent = Date.now() - 60_000;
    const sent = await send([
      { role: 'assistant', content: '普通历史', ts: recent },
      { role: 'assistant', content: '空标记历史', ts: recent, action: '', meme: '' },
    ]);
    assert.equal(textOf(sent, 0), '普通历史');
    assert.equal(textOf(sent, 1), '空标记历史');
  });
});
