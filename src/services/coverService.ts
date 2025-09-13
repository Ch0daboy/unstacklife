import { Book } from '../types';
import { generateBookCoverImage } from './bedrockService';

// Minimal duplication of credentials type for Bedrock image calls
type BedrockCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
  modelId?: string;
};

export const generateBookCoverWithBedrock = async (
  book: Book,
  regionOrCreds: string | BedrockCredentials = 'us-west-2'
): Promise<string> => {
  const base64 = await generateBookCoverImage(
    book.title,
    book.genre,
    book.description || '',
    regionOrCreds
  );
  return `data:image/png;base64,${base64}`;
};

// Alternative: Generate cover using DALL-E (if user has OpenAI API key)
export const generateBookCoverWithDALLE = async (book: Book, apiKey: string): Promise<string> => {
  const authorName = book.writingPersona?.authorName || 'Author Name';
  let prompt = `A professional book cover design for "${book.title}" by ${authorName}, a ${book.genre.toLowerCase()} book`;

  if (book.description) {
    // Take first sentence of description for context
    const firstSentence = book.description.split('.')[0];
    prompt += `. ${firstSentence}`;
  }

  prompt += `. Professional book cover design, high quality, marketable, clean typography with author name "${authorName}" clearly visible.`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1792", // Vertical book cover ratio
        quality: "standard",
        response_format: "url"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DALL-E API Error:', errorText);
      throw new Error(`Cover generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No image generated');
    }
    
    // Convert URL to base64 for storage
    const imageUrl = data.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
  } catch (error) {
    console.error('Error generating book cover with DALL-E:', error);
    throw error;
  }
};