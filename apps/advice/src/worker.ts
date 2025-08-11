import { Container, getRandom } from '@cloudflare/containers';
import type { DurableObjectNamespace } from '@cloudflare/workers-types';

const INSTANCE_COUNT = 1;

export class WooordleAdviceContainer extends Container {
  defaultPort = 8080;
  maxInstances = INSTANCE_COUNT;
  sleepAfter = '15m';
}

interface Env {
  OCR_CONTAINER: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const container = await getRandom(env.OCR_CONTAINER, INSTANCE_COUNT);
      return await container.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
