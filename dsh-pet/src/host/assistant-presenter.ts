/** Public, optional assistant presenter. Native Session/audio remain owned by the assistant. */
import type { PollStateStore } from './state.ts';
import type { HttpRouteHandler } from './plugin/http-route.ts';

/** Display-only payload; never accepts tools, model requests, URLs or speech credentials. */
export interface AssistantPresentation {
  petId: string;
  text: string;
  bubbles: boolean;
  animation: boolean;
}

/** Bind the public display routes, retaining their pet identity and lock checks. */
export function createAssistantPresenter(deps: {
  state: PollStateStore;
  listPets: () => Record<string, unknown>[];
  route: HttpRouteHandler;
}) {
  let active: object | undefined;
  let releaseCurrent: (() => Promise<void>) | undefined;
  let closed = false;
  const entry = () => ({ available: !closed && !!active, protocol: 1, path: '/?voice-assistant=1' });
  return {
    protocol: 1,
    packageVersion: '0.4.5-fork.4',
    entry,
    listPets: () => deps.listPets().map((pet) => ({ id: String(pet.id), name: String(pet.name || pet.id) })),
    attach() {
      if (closed || active) throw new Error('PET_ASSISTANT_OWNER_UNAVAILABLE');
      const owner = {};
      const abort = new AbortController();
      active = owner;
      const written = new Map<string, number>();
      let detached = false;
      const clear = async (petId: string): Promise<void> => {
        const counter = written.get(petId);
        if (counter === undefined) return;
        const result = await deps.route(
          '/dsh-pet-7340/bubble/clear?pet=' + encodeURIComponent(petId),
          'POST',
          JSON.stringify({ expectedCounter: counter }),
        );
        if (result.kind !== 'json' || result.status !== 200 || (result.obj as { ok?: boolean }).ok !== true)
          throw new Error('PET_ASSISTANT_CLEAR_REJECTED');
        if (written.get(petId) === counter) written.delete(petId);
      };
      const lease = {
        async present(value: AssistantPresentation): Promise<void> {
          if (closed || active !== owner) throw new Error('PET_ASSISTANT_DETACHED');
          if (
            typeof value.petId !== 'string' ||
            !value.petId ||
            value.petId.length > 128 ||
            typeof value.text !== 'string' ||
            value.text.length > 16000
          ) {
            throw new Error('PET_ASSISTANT_PRESENTATION_INVALID');
          }
          for (const old of written.keys()) if (old !== value.petId) await clear(old);
          if (closed || active !== owner) throw new Error('PET_ASSISTANT_DETACHED');
          if (!value.text.trim() || (!value.bubbles && !value.animation)) {
            await clear(value.petId);
            return;
          }
          // No surface/voiceTo: the pet must never synthesize a second copy of the assistant's speech.
          const result = await deps.route(
            '/dsh-pet-7340/broadcast?pet=' + encodeURIComponent(value.petId),
            'POST',
            JSON.stringify({
              text: value.text,
              duration: value.bubbles ? 10000 : 0,
              anim: value.animation === true,
            }),
            abort.signal,
          );
          if (result.kind !== 'json' || result.status !== 200 || (result.obj as { ok?: boolean }).ok !== true)
            throw new Error('PET_ASSISTANT_PRESENTATION_REJECTED');
          const counter = (result.obj as { counter?: number }).counter;
          if (!Number.isSafeInteger(counter)) throw new Error('PET_ASSISTANT_RECEIPT_INVALID');
          written.set(value.petId, counter!);
          if (closed || active !== owner) await clear(value.petId);
        },
        async clear(): Promise<void> {
          for (const petId of written.keys()) await clear(petId);
        },
        async dispose(): Promise<void> {
          if (!detached) {
            detached = true;
            abort.abort();
            if (active === owner) active = undefined;
            releaseCurrent = undefined;
          }
          for (const petId of written.keys()) await clear(petId);
        },
      };
      releaseCurrent = lease.dispose;
      return lease;
    },
    async dispose() {
      closed = true;
      await releaseCurrent?.();
    },
  };
}
