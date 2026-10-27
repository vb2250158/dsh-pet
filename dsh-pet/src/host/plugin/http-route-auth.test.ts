/** Session-image routes use the Host's admission before touching attachment storage. */
import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { test } from 'node:test';
import { registerHttpRoute } from './http-route.ts';

for (const rejection of [401, 403, undefined]) {
  test(`attachment admission ${rejection ?? 'accepted'} precedes dispatch`, async () => {
    let handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> = async () => {
      assert.fail('Route was not registered');
    };
    let dispatches = 0;
    let admissions = 0;
    registerHttpRoute(
      {
        effect: (fn: () => void) => fn(),
        webServer: { register: (route: { handler: typeof handler }) => (handler = route.handler) },
        connection: {
          requestRejection: () => {
            admissions++;
            return rejection;
          },
        },
      },
      async () => {
        dispatches++;
        return { kind: 'text', status: 404, body: 'missing fixture image' };
      },
    );
    const req = new IncomingMessage(new Socket());
    req.method = 'GET';
    req.url = '/dsh-pet-7340/%61ttachment?id=sha256:fixture';
    const res = new ServerResponse(req);
    await handler(req, res);
    assert.equal(admissions, 1);
    assert.equal(dispatches, rejection === undefined ? 1 : 0);
    assert.equal(res.statusCode, rejection ?? 404);
    assert.equal(res.writableEnded, true);
    req.destroy();
  });
}
