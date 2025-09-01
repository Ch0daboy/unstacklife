import { Book, BookChapter, SubChapter } from '../types';
import * as aiRouter from './aiServiceRouter';
import * as bedrockService from './bedrockService';
import { researchTopic } from './perplexityService';
import { v4 as uuidv4 } from 'uuid';

export const researchAndGenerate = async (
  title: string,
  description: string,
  apiKeys: {bedrock?: any; gemini?: string; perplexity?: string},
  isCancelledFn?: () => boolean
): Promise<string> => {
  // Check if cancelled before starting research
  if (isCancelledFn && isCancelledFn()) {
    throw new Error('Generation cancelled');
  }

  // First, research the topic
  const researchData = await researchTopic(title, description, apiKeys.perplexity!);
  
  // Check if cancelled after research
  if (isCancelledFn && isCancelledFn()) {
    throw new Error('Generation cancelled');
  }

  // Then generate content based on research
  const enhancedDescription = `${description}

Research findings:
${researchData}

Use the above research to create comprehensive, well-informed content.`;
  
  const result = await aiRouter.generateContent(title, enhancedDescription, apiKeys, isCancelledFn);
  return result.result;
};

export const generateAllContent = async (
  book: Book,
  apiKeys: any,
  onProgress: (book: Book) => void,
  isCancelledFn?: () => boolean
): Promise<Book> => {
  let updatedBook = { ...book };

  for (let i = 0; i < updatedBook.chapters.length; i++) {
    // Check for cancellation at chapter level
    if (isCancelledFn && isCancelledFn()) {
      throw new Error('Generation cancelled');
    }

    const chapter = updatedBook.chapters[i];
    
    // Generate chapter outline if not exists
    if (!chapter.subChapters) {
      const outlineResult = await aiRouter.generateChapterOutline(chapter.title, chapter.description, apiKeys);
      chapter.subChapters = outlineResult.result;
      onProgress({ ...updatedBook });
    }

    // Generate content for each sub-chapter
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        // Check for cancellation at subchapter level
        if (isCancelledFn && isCancelledFn()) {
          throw new Error('Generation cancelled');
        }

        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...updatedBook });
        
        // Generate content
        const contentResult = await aiRouter.generateContent(subChapter.title, subChapter.description, apiKeys, isCancelledFn);
        subChapter.content = contentResult.result;
        subChapter.status = 'completed';
        
        onProgress({ ...updatedBook });
        
        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    chapter.status = 'completed';
    onProgress({ ...updatedBook });
  }

  return updatedBook;
};

export const generateAllContentWithResearch = async (
  book: Book,
  apiKeys: {bedrock?: any; gemini?: string; perplexity?: string},
  onProgress: (book: Book) => void,
  isCancelledFn?: () => boolean
): Promise<Book> => {
  let updatedBook = { ...book };

  for (let i = 0; i < updatedBook.chapters.length; i++) {
    // Check for cancellation at chapter level
    if (isCancelledFn && isCancelledFn()) {
      throw new Error('Generation cancelled');
    }

    const chapter = updatedBook.chapters[i];
    
    // Generate chapter outline if not exists
    if (!chapter.subChapters) {
      const outlineResult = await aiRouter.generateChapterOutline(chapter.title, chapter.description, apiKeys);
      chapter.subChapters = outlineResult.result;
      onProgress({ ...updatedBook });
    }

    // Generate content for each sub-chapter with research
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        // Check for cancellation at subchapter level
        if (isCancelledFn && isCancelledFn()) {
          throw new Error('Generation cancelled');
        }

        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...updatedBook });
        
        // Research and generate content
        const content = await researchAndGenerate(subChapter.title, subChapter.description, apiKeys, isCancelledFn);
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...updatedBook });
        
        // Longer delay for research calls to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    chapter.status = 'completed';
    onProgress({ ...updatedBook });
  }

  return updatedBook;
};

export const convertRomanceHeatLevel = async (
  originalBook: Book,
  newHeatLevel: string,
  apiKeys: {bedrock?: any; gemini?: string; perplexity?: string},
  onProgress: (book: Book) => void
): Promise<Book> => {
  // Create a new book with updated heat level
  const heatLevelLabels: {[key: string]: string} = {
    'clean': 'Clean',
    'sweet': 'Sweet', 
    'sensual': 'Sensual',
    'steamy': 'Steamy',
    'spicy': 'Spicy',
    'explicit': 'Explicit'
  };

  const newBook: Book = {
    ...originalBook,
    id: uuidv4(),
    title: `${originalBook.title} - ${heatLevelLabels[newHeatLevel]} Version`,
    subGenre: originalBook.subGenre,
    heatLevel: newHeatLevel,
    perspective: originalBook.perspective,
    tone: originalBook.tone,
    status: 'generating',
    chapters: originalBook.chapters.map(chapter => ({
      ...chapter,
      id: uuidv4(),
      status: 'pending',
      subChapters: chapter.subChapters?.map(subChapter => ({
        ...subChapter,
        id: uuidv4(),
        status: 'pending',
        content: undefined // Clear existing content
      }))
    }))
  };

  onProgress(newBook);

  // Regenerate all content with new heat level
  for (let i = 0; i < newBook.chapters.length; i++) {
    const chapter = newBook.chapters[i];
    
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...newBook });
        
        // Generate content with new heat level context using Bedrock or Gemini fallback
        let content: string;
        try {
          if (apiKeys.bedrock?.accessKeyId) {
            content = await bedrockService.generateContentWithHeatLevel(
              subChapter.title,
              subChapter.description,
              newHeatLevel,
              originalBook.perspective || '',
              apiKeys.bedrock
            );
          } else {
            // Import geminiService if Bedrock not available
            const { generateContentWithHeatLevel } = await import('./geminiService');
            content = await generateContentWithHeatLevel(
              subChapter.title,
              subChapter.description,
              newHeatLevel,
              originalBook.perspective || '',
              apiKeys.gemini!
            );
          }
        } catch (error) {
          // Fallback to Gemini if Bedrock fails
          const { generateContentWithHeatLevel } = await import('./geminiService');
          content = await generateContentWithHeatLevel(
            subChapter.title,
            subChapter.description,
            newHeatLevel,
            originalBook.perspective || '',
            apiKeys.gemini!
          );
        }
        
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...newBook });
        
        // Delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    chapter.status = 'completed';
    onProgress({ ...newBook });
  }

  newBook.status = 'completed';
  return newBook;
};
