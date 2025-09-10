import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Book, BookChapter, SubChapter } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Initialize Bedrock client
const createBedrockClient = (region: string = 'us-east-1') => {
  return new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
    }
  });
};

// Claude model configuration
const CLAUDE_MODEL_ID = 'anthropic.claude-3-5-haiku-20241022-v1:0';
const TITAN_IMAGE_MODEL_ID = 'amazon.titan-image-generator-v2:0';

interface ClaudeResponse {
  completion: string;
}

interface TitanImageResponse {
  images: string[];  // base64 encoded images
  error?: string;
}

const callClaudeModel = async (
  prompt: string, 
  region: string = 'us-east-1',
  isCancelledFn?: () => boolean
): Promise<string> => {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check for cancellation before each attempt
    if (isCancelledFn && isCancelledFn()) {
      throw new Error('Generation cancelled');
    }

    try {
      const client = createBedrockClient(region);
      
      const input = {
        modelId: CLAUDE_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
          max_tokens_to_sample: 4000,
          temperature: 0.7,
          top_p: 1,
          stop_sequences: ["\n\nHuman:"]
        })
      };

      const command = new InvokeModelCommand(input);
      const response = await client.send(command);
      
      if (!response.body) {
        throw new Error('No response body from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (!responseBody.completion) {
        throw new Error('No completion in Bedrock response');
      }
      
      return responseBody.completion.trim();
    } catch (error: any) {
      // If this was our last attempt, re-throw the error
      if (attempt >= maxRetries) {
        console.error('Error calling Bedrock Claude after all retries:', error);
        throw error;
      }
      
      // For throttling errors, wait before retrying
      if (error.name === 'ThrottlingException') {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Bedrock throttling. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      console.error('Error calling Bedrock Claude:', error);
      throw error;
    }
  }
  
  throw new Error('Maximum retries exceeded');
};

const generateImage = async (
  prompt: string,
  region: string = 'us-east-1'
): Promise<string> => {
  try {
    const client = createBedrockClient(region);
    
    const input = {
      modelId: TITAN_IMAGE_MODEL_ID,
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
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.error) {
      throw new Error(`Image generation error: ${responseBody.error}`);
    }
    
    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No images generated');
    }
    
    // Return the first image as base64
    return responseBody.images[0];
  } catch (error: any) {
    console.error('Error generating image with Titan:', error);
    throw error;
  }
};

export const generateBookOutline = async (
  prompt: string, 
  genre: string, 
  subGenre: string,
  targetAudience: string, 
  heatLevel: string,
  perspective: string,
  author: string,
  region: string = 'us-east-1'
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

  const response = await callClaudeModel(fullPrompt, region);
  
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
      author: author || 'Unknown Author',
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
    console.error('Error parsing Claude response:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse book outline from AI response. Please check your AWS credentials and try again.');
  }
};

export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  region: string = 'us-east-1'
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

  const response = await callClaudeModel(prompt, region);
  
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
  region: string = 'us-east-1',
  isCancelledFn?: () => boolean
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

  const response = await callClaudeModel(prompt, region, isCancelledFn);
  return response.trim();
};

export const generateContentWithHeatLevel = async (
  sectionTitle: string,
  sectionDescription: string,
  heatLevel: string,
  perspective: string = '',
  region: string = 'us-east-1'
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

  const response = await callClaudeModel(prompt, region);
  return response.trim();
};

export const generateBookCoverImage = async (
  title: string,
  genre: string,
  description: string,
  region: string = 'us-east-1'
): Promise<string> => {
  const prompt = `Create a professional book cover image for a ${genre} book titled "${title}". ${description}. The cover should be visually appealing, genre-appropriate, and suitable for an ebook. Include the title text in an attractive font that complements the design. The style should be modern and marketable.`;
  
  return await generateImage(prompt, region);
};

export const generateChapterImage = async (
  chapterTitle: string,
  chapterDescription: string,
  genre: string,
  region: string = 'us-east-1'
): Promise<string> => {
  const prompt = `Create an atmospheric illustration for a ${genre} book chapter titled "${chapterTitle}". ${chapterDescription}. The image should capture the mood and theme of this chapter, be visually engaging, and complement the narrative. Style should be artistic and book-appropriate.`;
  
  return await generateImage(prompt, region);
};
