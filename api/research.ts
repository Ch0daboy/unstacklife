import type { VercelRequest, VercelResponse } from '@vercel/node';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const raw = (req as any).body;
    const body = typeof raw === 'object' && raw !== null ? raw : JSON.parse(raw || '{}');
    const title = body && body.title;
    const description = body && body.description;
    if (!title) return res.status(400).json({ error: 'Missing title' });

    const apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!apiKey) return res.status(500).json({ error: 'Perplexity API key not configured' });

    const prompt = 'Research and provide comprehensive information about: ' + title + '\n\nContext: ' + (description || '') + '\n\nPlease provide:\n1. Key facts and current information\n2. Recent developments or trends\n3. Expert opinions or statistics\n4. Practical applications or examples\n5. Any important considerations or nuances\n\nFocus on providing accurate, up-to-date information that would be valuable for creating educational content on this topic.';

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ research: content });
  } catch (err: any) {
    console.error('research error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}

export const config = { runtime: 'nodejs' };
