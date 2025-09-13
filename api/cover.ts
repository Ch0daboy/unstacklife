import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, genre, description } = typeof req.body === 'object' && req.body !== null
      ? (req.body as any)
      : JSON.parse((req as any).body || '{}');

    if (!title || !genre) {
      return res.status(400).json({ error: 'Missing required fields: title, genre' });
    }

    const region = process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-west-2';
    const modelId = process.env.TITAN_IMAGE_MODEL_ID || 'amazon.titan-image-generator-v2:0';

    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    });

    const prompt = 'Create a professional book cover image for a ' + genre + ' book titled "' + title + '". ' + (description || '') + '. The cover should be visually appealing, genre-appropriate, and suitable for an ebook. Include the title text in an attractive font that complements the design. The style should be modern and marketable.';

    const input = {
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: prompt,
          negativeText: 'blurry, low quality, distorted, watermark',
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          quality: 'premium',
          height: 1024,
          width: 1024,
          cfgScale: 7.5,
          seed: Math.floor(Math.random() * 1000000),
        },
      }),
    } as const;

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    if (!response.body) {
      return res.status(502).json({ error: 'No response body from Bedrock' });
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body as any));
    if (responseBody.error) {
      return res.status(502).json({ error: responseBody.error });
    }
    if (!responseBody.images || responseBody.images.length === 0) {
      return res.status(502).json({ error: 'No images generated' });
    }

    const base64: string = responseBody.images[0];
    return res.status(200).json({ dataUrl: 'data:image/png;base64,' + base64 });
  } catch (err: any) {
    console.error('Cover generation error:', err);
    const message = err?.message || 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

export const config = {
  runtime: 'nodejs',
};
