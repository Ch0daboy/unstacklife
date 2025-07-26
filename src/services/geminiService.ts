import { Book, BookChapter, SubChapter } from '../types';
import { v4 as uuidv4 } from 'uuid';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  const maxRetries = 5;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error Response:', errorText);
        
        // Check if it's a quota exhaustion error
        if (response.status === 429) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.status === "RESOURCE_EXHAUSTED") {
              throw new Error('Daily quota exceeded for Gemini API. Please wait 24 hours for quota reset or upgrade your Google Cloud billing plan. Visit https://ai.google.dev/gemini-api/docs/rate-limits for more information.');
            }
          } catch (parseError) {
            // If we can't parse the error, fall through to retry logic
            if (parseError instanceof Error && parseError.message.includes('Daily quota exceeded')) {
              throw parseError;
            }
          }
        
          // For other 429 errors, don't retry if we've already tried multiple times
          if (attempt >= 2) {
            throw new Error('API rate limit exceeded. Please try again later or check your API quota.');
          }
        }
        
        // If it's a rate limit error (429), retry with exponential backoff
        if (response.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(`Rate limit hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('Gemini API Response:', data);
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }
      
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      // If this was our last attempt, re-throw the error
      if (attempt >= maxRetries) {
        console.error('Error calling Gemini API after all retries:', error);
        throw error;
      }
      
      // For network errors and other non-HTTP errors, also retry
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Network error. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Maximum retries exceeded');
};

export const generateBookOutline = async (
  prompt: string, 
  genre: string, 
  subGenre: string,
  targetAudience: string, 
  heatLevel: string,
  perspective: string,
  apiKey: string
): Promise<Book> => {
  let heatLevelPrompt = '';
  if (genre.toLowerCase() === 'romance' && heatLevel) {
    const heatLevelDescriptions = {
      'clean': 'Clean/Wholesome romance with no explicit sexual content, focusing on emotional connection, meaningful glances, hugs, and light kissing.',
      'sweet': 'Sweet romance with closed-door intimate scenes that are implied rather than explicit, focusing on emotional development.',
      'sensual': 'Sensual romance with on-page love scenes using euphemistic language, emphasizing emotional aspects over explicit details.',
      'steamy': 'Steamy romance with explicit sexual content and detailed intimate scenes throughout the story.',
      'spicy': 'Spicy/Erotic romance with heavy emphasis on sexual activity, detailed descriptions, and multiple intimate scenes.',
      'explicit': 'Explicit romance with highly detailed and graphic sexual content, exploring characters\' desires in depth.'
    };
    
    heatLevelPrompt = `\nHeat Level: ${heatLevelDescriptions[heatLevel as keyof typeof heatLevelDescriptions] || heatLevel}`;
  }

  let subGenrePrompt = '';
  if (genre.toLowerCase() === 'romance' && subGenre) {
    subGenrePrompt = `\nSub-Genre: ${subGenre} romance`;
  }

  let perspectivePrompt = '';
  if (perspective) {
    const perspectiveDescriptions = {
      'first': 'Write in first person narrative (using "I" perspective), providing intimate access to the main character\'s thoughts and feelings.',
      'third-limited': 'Write in third person limited narrative (using "he/she" perspective), following one main character\'s viewpoint.',
      'third-omniscient': 'Write in third person omniscient narrative (using "he/she" perspective), with access to multiple characters\' thoughts and perspectives.',
      'second': 'Write in second person narrative (using "you" perspective), addressing the reader directly.'
    };
    
    perspectivePrompt = `\nNarrative Perspective: ${perspectiveDescriptions[perspective as keyof typeof perspectiveDescriptions] || perspective}`;
  }

  const fullPrompt = `
Create a comprehensive book outline based on the following description:

Book Description: ${prompt}
${genre ? `Genre: ${genre}` : ''}
${subGenre ? `Sub-Genre: ${subGenre}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Please provide a response in the following JSON format:
{
  "title": "Book Title",
  "description": "Brief book description",
  "genre": "${genre || 'General'}",
   "subGenre": "${subGenre || ''}",
  "targetAudience": "${targetAudience || 'General readers'}",
  "heatLevel": "${heatLevel || ''}",
  "perspective": "${perspective || ''}",
  "chapters": [
    {
      "title": "Chapter Title",
      "description": "Chapter description (2-3 sentences)"
    }
  ]
}

Generate 8-12 chapters that comprehensively cover the topic. Make sure each chapter has a clear, descriptive title and a detailed description of what it will cover.${subGenrePrompt}${heatLevelPrompt ? ' Ensure the content and pacing align with the specified heat level.' : ''}
${perspectivePrompt ? ' Maintain consistent narrative perspective throughout all content.' : ''}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.
`;

  const response = await callGeminiAPI(fullPrompt, apiKey);
  
  try {
    // Clean the response to extract JSON
    let cleanResponse = response.trim();
    
    // Remove code block markers if present
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    // Find JSON object
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      throw new Error('No valid JSON found in response');
    }
    
    const bookData = JSON.parse(jsonMatch[0]);
    
    return {
      id: uuidv4(),
      title: bookData.title,
      description: bookData.description,
      genre: bookData.genre,
      subGenre: bookData.subGenre,
      tone: bookData.tone,
      heatLevel: bookData.heatLevel,
      perspective: bookData.perspective,
      status: 'draft',
      chapters: bookData.chapters.map((chapter: any, index: number) => ({
        id: uuidv4(),
        title: chapter.title,
        description: chapter.description,
        status: 'pending'
      }))
    };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse book outline from AI response. Please check your API key and try again.');
  }
};

export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKey: string
): Promise<SubChapter[]> => {
  const prompt = `
Create a detailed outline for the following chapter:

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}

Please provide a response in the following JSON format:
{
  "sections": [
    {
      "title": "Section Title",
      "description": "Detailed description of what this section will cover (2-3 sentences)"
    }
  ]
}

Generate 4-8 sections that comprehensively break down this chapter. Each section should be substantial enough to warrant its own content generation.

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.
`;

  const response = await callGeminiAPI(prompt, apiKey);
  
  try {
    // Clean the response to extract JSON
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      throw new Error('No valid JSON found in response');
    }
    
    const outlineData = JSON.parse(jsonMatch[0]);
    
    return outlineData.sections.map((section: any, index: number) => ({
      id: uuidv4(),
      title: section.title,
      description: section.description,
      status: 'pending'
    }));
  } catch (error) {
    console.error('Error parsing chapter outline:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse chapter outline from AI response. Please try again.');
  }
};

export const generateContent = async (
  sectionTitle: string,
  sectionDescription: string,
  apiKey: string
): Promise<string> => {
  const prompt = `
Write comprehensive, high-quality content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Requirements:
- Structure the content with clear paragraphs
- Make it suitable for an eBook format
- Do not include markdown formatting or section headers
Please write the content now:
`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
};

export const generateContentWithHeatLevel = async (
  sectionTitle: string,
  sectionDescription: string,
  heatLevel: string,
  perspective: string = '',
  apiKey: string
): Promise<string> => {
  const heatLevelDescriptions = {
    'clean': 'Clean/Wholesome romance with no explicit sexual content, focusing on emotional connection, meaningful glances, hugs, and light kissing.',
    'sweet': 'Sweet romance with closed-door intimate scenes that are implied rather than explicit, focusing on emotional development.',
    'sensual': 'Sensual romance with on-page love scenes using euphemistic language, emphasizing emotional aspects over explicit details.',
    'steamy': 'Steamy romance with explicit sexual content and detailed intimate scenes throughout the story.',
    'spicy': 'Spicy/Erotic romance with heavy emphasis on sexual activity, detailed descriptions, and multiple intimate scenes.',
    'explicit': 'Explicit romance with highly detailed and graphic sexual content, exploring characters\' desires in depth.'
  };

  const heatLevelPrompt = heatLevelDescriptions[heatLevel as keyof typeof heatLevelDescriptions] || heatLevel;

  let perspectivePrompt = '';
  if (perspective) {
    const perspectiveDescriptions = {
      'first': 'Write in first person narrative (using "I" perspective).',
      'third-limited': 'Write in third person limited narrative (using "he/she" perspective), following one character\'s viewpoint.',
      'third-omniscient': 'Write in third person omniscient narrative (using "he/she" perspective), with access to multiple characters\' thoughts.',
      'second': 'Write in second person narrative (using "you" perspective).'
    };
    
    perspectivePrompt = `\nNarrative Perspective: ${perspectiveDescriptions[perspective as keyof typeof perspectiveDescriptions] || perspective}`;
  }

  const prompt = `
Write comprehensive, high-quality content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Heat Level Guidelines: ${heatLevelPrompt}
${perspectivePrompt}

Requirements:
- Structure the content with clear paragraphs
- Make it suitable for an eBook format
- Adhere to the specified heat level throughout
- Do not include markdown formatting or section headers
Please write the content now:
`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
};