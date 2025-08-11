import { serve } from '@hono/node-server';
import { Hono, type Context } from 'hono';
import { analyze } from '@wooordle/ocr';
import { parseArgs } from 'node:util';
import type { ApiResponse } from './types.ts';
import type { LANGUAGE } from '../../../packages/core/src/types.ts';

export const parsedArgs = parseArgs({
  options: {
    debug: { type: 'boolean', short: 'd', default: false },
  },
});

const app = new Hono();

app.get('/health', ctx => ctx.json({ status: 'ok', timestamp: new Date().toISOString() }));

async function handleAnalysis(ctx: Context, { isSendNotification = Boolean(ctx.req.query('ntfy')) } = {}) {
  try {
    const contentType = ctx.req.header('content-type') || '';
    let imageBuffer: Buffer;

    if (contentType.startsWith('multipart/form-data')) {
      const formData = await ctx.req.formData();
      const image = formData.get('image');

      if (!(image instanceof File)) {
        return ctx.json({ success: false, error: 'No image file provided' }, 400);
      }

      const buffer = await image.arrayBuffer();
      imageBuffer = Buffer.from(buffer);
    } else if (contentType.startsWith('image/')) {
      const arrayBuffer = await ctx.req.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      return ctx.json(
        { success: false, error: 'Unsupported content type. Send image as multipart/form-data or raw image data.' },
        400,
      );
    }

    const analysisResult = await analyze('server-upload.png', imageBuffer, undefined, parsedArgs.values.debug);

    if (isSendNotification) {
      const ntfyTopic = 'wooordle';
      const Title = 'Wooordle advice';
      const Tags = 'capital_abcd';
      const Priority = 'default';

      const url = `https://ntfy.sh/${ntfyTopic}`;
      const options = { method: 'POST', headers: { Title, Priority, Tags } };

      const getFlag = (lang: LANGUAGE) => (lang === 'nl' ? '🇳🇱' : '🇬🇧');

      const messages = [];
      for (const lang of analysisResult.detectedLanguages) {
        const words = (analysisResult.bestWords[lang] || []).slice(0, 3);
        if (words.length > 0) messages.push(`${getFlag(lang)} ${words.join(', ')}`);
      }

      if (analysisResult.detectedLanguages.length > 0 && messages.length === 0) {
        messages.push(`${analysisResult.detectedLanguages.map(getFlag).join(' | ')} Unable to find possible words`);
      }

      if (messages.length > 0) {
        const body = `${messages.join(' | ')} (${analysisResult.guesses.map(g => g.word).join(', ')})`;
        try {
          await fetch(url, { ...options, body });
        } catch {}
      }

      if (messages.length === 0) {
        await fetch(url, { ...options, body: 'Error processing image' });
      }
    }

    const response: ApiResponse = { analysisResult };
    return ctx.json(response);
  } catch (error) {
    console.error(error);
    return ctx.json({ success: false, error: error.message || 'Analysis failed' }, 500);
  }
}

app.post('/api/advice', ctx => handleAnalysis(ctx));
app.post('/api/advice-ntfy', ctx => handleAnalysis(ctx, { isSendNotification: true }));

serve({ fetch: app.fetch, port: 8080 });
console.log('Listening on http://localhost:8080');
