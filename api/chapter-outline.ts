import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from './_bedrock';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const raw = (req as any).body;
    const body = typeof raw === 'object' && raw !== null ? raw : JSON.parse(raw || '{}');
    const chapterTitle = body && body.chapterTitle;
    const chapterDescription = body && body.chapterDescription;
    if (!chapterTitle || !chapterDescription) {
      return res.status(400).json({ error: 'Missing chapterTitle or chapterDescription' });
    }

    const prompt =
      'Create a detailed outline for the following chapter:\n\n' +
      'Chapter Title: ' + chapterTitle + '\n' +
      'Chapter Description: ' + chapterDescription + '\n\n' +
      'Please provide a response in the following JSON format:\n' +
      '{\n' +
      '  "sections": [\n' +
      '    {\n' +
      '      "title": "Section Title",\n' +
      '      "description": "Detailed description of what this section will cover (2-3 sentences)"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'Generate 4-8 sections that comprehensively break down this chapter. Each section should be substantial enough to warrant its own content generation.\n\n' +
      'IMPORTANT: Return ONLY the JSON object, no additional text or formatting.\n';

    const response = await callClaude(prompt);
    let clean = response.trim().replace(/```json\s*|\s*```/g, '').replace(/```\s*|\s*```/g, '');
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return res.status(502).json({ error: 'No JSON found in model response' });
    const outlineData = JSON.parse(match[0]);
    const sections = (outlineData.sections || []).map((s: any) => ({ id: uuidv4(), title: s.title, description: s.description, status: 'pending' }));
    return res.status(200).json({ sections });
  } catch (err: any) {
    console.error('chapter-outline error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}

export const config = { runtime: 'nodejs18.x' };

