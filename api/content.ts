import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from './_bedrock';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const raw = (req as any).body;
    const body = typeof raw === 'object' && raw !== null ? raw : JSON.parse(raw || '{}');
    const sectionTitle = body && body.sectionTitle;
    const sectionDescription = body && body.sectionDescription;
    if (!sectionTitle || !sectionDescription) return res.status(400).json({ error: 'Missing sectionTitle or sectionDescription' });
    const prompt =
      'Write comprehensive, high-quality content for the following section:\n\n' +
      'Section Title: ' + sectionTitle + '\n' +
      'Section Description: ' + sectionDescription + '\n\n' +
      'Requirements:\n- Structure the content with clear paragraphs\n- Make it suitable for an eBook format\n- Do not include markdown formatting or section headers\nPlease write the content now:\n';
    const text = await callClaude(prompt);
    return res.status(200).json({ content: text.trim() });
  } catch (err: any) {
    console.error('content error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}

export const config = { runtime: 'nodejs18.x' };

