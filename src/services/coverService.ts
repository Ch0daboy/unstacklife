import { Book } from '../types';

export const generateBookCover = async (book: Book, geminiApiKey: string): Promise<string> => {
  // Note: This is a placeholder implementation
  // Gemini doesn't currently support image generation via API
  // This function returns a placeholder or could be integrated with other image generation services

  console.warn('Gemini image generation not available. Using placeholder implementation.');

  // Create a detailed prompt based on book information for future use
  let prompt = `Professional book cover design for "${book.title}" by ${book.writingPersona?.authorName || 'Author Name'}, ${book.genre.toLowerCase()} genre`;

  if (book.subGenre) {
    prompt += `, ${book.subGenre.toLowerCase()} style`;
  }

  if (book.tone) {
    prompt += `, ${book.tone.toLowerCase()} tone`;
  }

  // Add genre-specific visual elements
  const genrePrompts: {[key: string]: string} = {
    'romance': 'elegant typography, soft romantic colors, dreamy atmosphere, hearts or roses elements',
    'fantasy': 'magical elements, mystical colors, dragons or castles, enchanted forest',
    'science fiction': 'futuristic design, space elements, technological themes, metallic colors',
    'mystery': 'dark atmospheric design, shadows, mysterious silhouettes, noir style',
    'thriller': 'bold dramatic design, intense colors, suspenseful elements',
    'historical fiction': 'vintage design, period-appropriate elements, classic typography',
    'contemporary fiction': 'modern clean design, realistic elements, contemporary colors',
    'young adult': 'vibrant colors, youthful design, dynamic typography',
    'non-fiction': 'professional clean design, informative layout, authoritative look',
    'self-help': 'inspiring design, motivational colors, uplifting imagery',
    'business': 'professional corporate design, success imagery, clean typography',
    'biography': 'portrait-style design, documentary feel, respectful presentation'
  };

  if (genrePrompts[book.genre.toLowerCase()]) {
    prompt += `, ${genrePrompts[book.genre.toLowerCase()]}`;
  }

  prompt += `, high quality, professional book cover design, clean typography with author name clearly visible, marketable design, 4k resolution`;

  // For now, return a placeholder image or throw an error suggesting to use DALL-E
  throw new Error('Gemini image generation not available. Please use DALL-E option instead.');
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