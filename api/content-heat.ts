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
    const heatLevel = body && body.heatLevel;
    const perspective = body && body.perspective;
    if (!sectionTitle || !sectionDescription || !heatLevel) return res.status(400).json({ error: 'Missing fields' });

    const heatLevelDescriptions: Record<string, string> = {
      clean: 'Clean/Wholesome romance with no explicit sexual content, focusing on emotional connection, meaningful glances, hugs, and light kissing.',
      sweet: 'Sweet romance with closed-door intimate scenes that are implied rather than explicit, focusing on emotional development.',
      sensual: 'Sensual romance with on-page love scenes using euphemistic language, emphasizing emotional aspects over explicit details.',
      steamy: 'Steamy romance with explicit sexual content and detailed intimate scenes throughout the story.',
      spicy: 'Spicy/Erotic romance with heavy emphasis on sexual activity, detailed descriptions, and multiple intimate scenes.',
      explicit: 'Explicit romance with highly detailed and graphic sexual content, exploring characters\' desires in depth.',
    };
    const perspectiveDesc: Record<string, string> = {
      first: 'Write in first person narrative (using "I" perspective).',
      'third-limited': 'Write in third person limited narrative (using "he/she" perspective), following one character\'s viewpoint.',
      'third-omniscient': 'Write in third person omniscient narrative (using "he/she" perspective), with access to multiple characters\' thoughts.',
      second: 'Write in second person narrative (using "you" perspective).',
    };

    const perspectivePrompt = perspective ? ('\nNarrative Perspective: ' + (perspectiveDesc[perspective] || perspective)) : '';
    const heatLevelPrompt = heatLevelDescriptions[heatLevel] || heatLevel;
    const prompt =
      'Write comprehensive, high-quality content for the following section:\n\n' +
      'Section Title: ' + sectionTitle + '\n' +
      'Section Description: ' + sectionDescription + '\n\n' +
      'Heat Level Guidelines: ' + heatLevelPrompt + '\n' +
      perspectivePrompt + '\n\n' +
      'Requirements:\n- Structure the content with clear paragraphs\n- Make it suitable for an eBook format\n- Adhere to the specified heat level throughout\n- Do not include markdown formatting or section headers\nPlease write the content now:\n';

    const text = await callClaude(prompt);
    return res.status(200).json({ content: text.trim() });
  } catch (err: any) {
    console.error('content-heat error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}

export const config = { runtime: 'nodejs18.x' };

