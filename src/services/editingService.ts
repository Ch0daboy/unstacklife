import { Book } from '../types';

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
  const maxRetries = 3;
  
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
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 4096,
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
        
        if (response.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit hit. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }
      
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      if (attempt >= maxRetries) {
        console.error('Error calling Gemini API after all retries:', error);
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Network error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
  
  throw new Error('Maximum retries exceeded');
};

export const editContent = async (
  originalContent: string,
  selectedText: string,
  editPrompt: string,
  apiKey: string
): Promise<string> => {
  const prompt = `
You are an expert editor helping to improve book content. You will be given:
1. The original content of a section
2. A specific portion of text that was selected
3. Instructions on how to edit that selected text

Please modify ONLY the selected text according to the instructions, while preserving the context and flow of the surrounding content.

ORIGINAL CONTENT:
${originalContent}

SELECTED TEXT TO EDIT:
"${selectedText}"

EDIT INSTRUCTIONS:
${editPrompt}

IMPORTANT: Return the COMPLETE modified content with the selected text edited according to the instructions. Do not add any explanations or commentary, just return the updated content.
`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
};

export const editWholeBook = async (
  book: Book,
  editPrompt: string,
  apiKey: string
): Promise<Book> => {
  // For whole book editing, we'll edit each chapter's content
  const updatedChapters = [];
  
  for (const chapter of book.chapters) {
    const updatedSubChapters = [];
    
    if (chapter.subChapters) {
      for (const subChapter of chapter.subChapters) {
        if (subChapter.content) {
          const prompt = `
You are an expert editor helping to improve book content. 

BOOK CONTEXT:
Title: ${book.title}
Genre: ${book.genre}
Chapter: ${chapter.title}
Section: ${subChapter.title}

CURRENT CONTENT:
${subChapter.content}

EDITING INSTRUCTIONS:
${editPrompt}

Please apply the editing instructions to improve this content while maintaining:
- The original meaning and intent
- Consistency with the book's tone and style
- Proper flow and readability
- The section's purpose within the chapter

Return ONLY the improved content, no explanations or commentary.
`;

          try {
            const editedContent = await callGeminiAPI(prompt, apiKey);
            updatedSubChapters.push({
              ...subChapter,
              content: editedContent.trim()
            });
            
            // Add delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error editing section ${subChapter.title}:`, error);
            // Keep original content if editing fails
            updatedSubChapters.push(subChapter);
          }
        } else {
          updatedSubChapters.push(subChapter);
        }
      }
    }
    
    updatedChapters.push({
      ...chapter,
      subChapters: updatedSubChapters
    });
  }
  
  return {
    ...book,
    chapters: updatedChapters
  };
};