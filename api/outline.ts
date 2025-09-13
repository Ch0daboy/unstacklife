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
    const prompt = body && body.prompt;
    const genre = body && body.genre;
    const subGenre = body && body.subGenre;
    const targetAudience = body && body.targetAudience;
    const heatLevel = body && body.heatLevel;
    const perspective = body && body.perspective;
    const author = body && body.author;

    if (!prompt || !genre) {
      return res.status(400).json({ error: 'Missing prompt or genre' });
    }

    const heatLevelMap: Record<string, string> = {
      clean: 'Clean/Wholesome romance with no explicit sexual content, focusing on emotional connection, meaningful glances, hugs, and light kissing.',
      sweet: 'Sweet romance with closed-door intimate scenes that are implied rather than explicit, focusing on emotional development.',
      sensual: 'Sensual romance with on-page love scenes using euphemistic language, emphasizing emotional aspects over explicit details.',
      steamy: 'Steamy romance with explicit sexual content and detailed intimate scenes throughout the story.',
      spicy: 'Spicy/Erotic romance with heavy emphasis on sexual activity, detailed descriptions, and multiple intimate scenes.',
      explicit: 'Explicit romance with highly detailed and graphic sexual content, exploring characters\' desires in depth.',
    };

    const perspectiveMap: Record<string, string> = {
      first: 'Write in first person narrative (using "I" perspective), providing intimate access to the main character\'s thoughts and feelings.',
      'third-limited': 'Write in third person limited narrative (using "he/she" perspective), following one main character\'s viewpoint.',
      'third-omniscient': 'Write in third person omniscient narrative (using "he/she" perspective), with access to multiple characters\' thoughts and perspectives.',
      second: 'Write in second person narrative (using "you" perspective), addressing the reader directly.',
    };

    const heatLevelPrompt = (genre.toLowerCase() === 'romance' && heatLevel) ? ('\nHeat Level: ' + (heatLevelMap[heatLevel] || heatLevel)) : '';
    const subGenrePrompt = (genre.toLowerCase() === 'romance' && subGenre) ? ('\nSub-Genre: ' + subGenre + ' romance') : '';
    const perspectivePrompt = perspective ? ('\nNarrative Perspective: ' + (perspectiveMap[perspective] || perspective)) : '';

    const fullPrompt =
      'Create a comprehensive book outline based on the following description:\n\n' +
      'Book Description: ' + prompt + '\n' +
      (genre ? ('Genre: ' + genre + '\n') : '') +
      (subGenre ? ('Sub-Genre: ' + subGenre + '\n') : '') +
      (targetAudience ? ('Target Audience: ' + targetAudience + '\n') : '') +
      '\nPlease provide a response in the following JSON format:\n' +
      '{\n' +
      '  "title": "Book Title",\n' +
      '  "description": "Brief book description",\n' +
      '  "genre": "' + (genre || 'General') + '",\n' +
      '  "subGenre": "' + (subGenre || '') + '",\n' +
      '  "targetAudience": "' + (targetAudience || 'General readers') + '",\n' +
      '  "heatLevel": "' + (heatLevel || '') + '",\n' +
      '  "perspective": "' + (perspective || '') + '",\n' +
      '  "chapters": [\n' +
      '    {\n' +
      '      "title": "Chapter Title",\n' +
      '      "description": "Chapter description (2-3 sentences)"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'Generate 8-12 chapters that comprehensively cover the topic. Make sure each chapter has a clear, descriptive title and a detailed description of what it will cover.' +
      subGenrePrompt +
      (heatLevelPrompt ? ' Ensure the content and pacing align with the specified heat level.' : '') +
      (perspectivePrompt ? ' Maintain consistent narrative perspective throughout all content.' : '') +
      '\n\nIMPORTANT: Return ONLY the JSON object, no additional text or formatting.\n';

    const response = await callClaude(fullPrompt);
    let clean = response.trim().replace(/```json\s*|\s*```/g, '').replace(/```\s*|\s*```/g, '');
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return res.status(502).json({ error: 'No JSON found in model response' });
    const bookData = JSON.parse(match[0]);
    const book = {
      id: uuidv4(),
      title: bookData.title,
      author: author || 'Unknown Author',
      description: bookData.description,
      genre: bookData.genre,
      subGenre: bookData.subGenre,
      tone: bookData.tone,
      heatLevel: bookData.heatLevel,
      perspective: bookData.perspective,
      status: 'draft',
      chapters: (bookData.chapters || []).map((ch: any) => ({ id: uuidv4(), title: ch.title, description: ch.description, status: 'pending' })),
    };
    return res.status(200).json({ book });
  } catch (err: any) {
    console.error('outline error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}

export const config = { runtime: 'nodejs18.x' };

