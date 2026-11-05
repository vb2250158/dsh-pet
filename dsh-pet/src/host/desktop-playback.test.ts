/** Runs the shipped desktop playback script against synthetic video elements. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

class Video {
  src = '';
  loop = false;
  muted = false;
  autoplay = false;
  playsInline = false;
  readyState = 2;
  currentTime = 5;
  playCount = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  style = { transform: '' };
  classList = { add(): void {}, remove(): void {} };
  load(): void {}
  pause(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  play(): Promise<void> {
    this.playCount++;
    return Promise.resolve();
  }
}

class Sprite {
  anim = 'idle';
  once = true;
  pending: { anim: string; once: boolean; gen: number } | null = null;
  gen = 0;
  front = 0;
  videoA = new Video();
  videoB = new Video();
  assetBase = '/synthetic/';
  facing = 'left';
  pet = { id: 'synthetic-pet' };
  pendingSquash = false;
  pendingMove = null;
  playback: string | null = null;
  endedCount = 0;
  reports: string[] = [];
  declare switchTo: (next: string, once: boolean, playbackId?: string, url?: string) => void;
  declare playOnce: (next: string, playbackId?: string, url?: string) => void;
  declare restartLoop: (video: Video) => void;
  handleEnded = (): void => {
    this.endedCount++;
  };
  reportPlayback(id: string, state: string): void {
    this.reports.push(id + ':' + state);
  }
}

runInNewContext(readFileSync(new URL('../../runtime/electron-helper/sprite/playback.js', import.meta.url), 'utf8'), {
  PetSprite: Sprite,
  S: { ANIMATION_EXT: '.webm' },
  window: { setTimeout: (): number => 1, clearTimeout(): void {} },
  console,
});

test('single playback retains once state and finishes through the chain owner', async () => {
  const sprite = new Sprite();
  sprite.playOnce('turn', 'request-1');
  await Promise.resolve();
  assert.equal(sprite.anim, 'turn');
  assert.equal(sprite.once, true);
  assert.equal(sprite.videoB.loop, false);
  assert.deepEqual(sprite.reports, ['request-1:playing']);
  sprite.videoB.onended?.();
  assert.equal(sprite.endedCount, 1);
});

test('a loop ending early restarts the same video without advancing the random chain', async () => {
  const sprite = new Sprite();
  sprite.switchTo('working', false);
  await Promise.resolve();
  assert.equal(sprite.anim, 'working');
  assert.equal(sprite.once, false);
  assert.equal(sprite.videoB.loop, true);
  assert.equal(sprite.videoB.playCount, 1);
  sprite.videoB.onended?.();
  await Promise.resolve();
  assert.equal(sprite.videoB.currentTime, 0);
  assert.equal(sprite.videoB.playCount, 2);
  assert.equal(sprite.endedCount, 0);
  assert.equal(sprite.anim, 'working');
});

test('switching from a loop to a one-shot retains the next animation mode', () => {
  const sprite = new Sprite();
  sprite.switchTo('working', false);
  sprite.playOnce('success');
  assert.equal(sprite.anim, 'success');
  assert.equal(sprite.once, true);
  assert.equal(sprite.videoA.loop, false);
  assert.equal(sprite.videoB.onended, null);
});
