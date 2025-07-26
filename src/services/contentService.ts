import { Book, BookChapter, SubChapter } from '../types';
import { generateChapterOutline, generateContent, generateContentWithHeatLevel } from './geminiService';
import { researchTopic } from './perplexityService';
import { v4 as uuidv4 } from 'uuid';

export const researchAndGenerate = async (
  title: string,
  description: string,
  apiKeys: {gemini: string; perplexity: string}
): Promise<string> => {
  // First, research the topic
  const researchData = await researchTopic(title, description, apiKeys.perplexity);
  
  // Then generate content based on research
  const enhancedDescription = `${description}

Research findings:
${researchData}

Use the above research to create comprehensive, well-informed content.`;
  
  return await generateContent(title, enhancedDescription, apiKeys.gemini);
};

export const generateAllContent = async (
  book: Book,
  geminiApiKey: string,
  onProgress: (book: Book) => void
): Promise<Book> => {
  let updatedBook = { ...book };

  for (let i = 0; i < updatedBook.chapters.length; i++) {
    const chapter = updatedBook.chapters[i];
    
    // Generate chapter outline if not exists
    if (!chapter.subChapters) {
      const outline = await generateChapterOutline(chapter.title, chapter.description, geminiApiKey);
      chapter.subChapters = outline;
      onProgress({ ...updatedBook });
    }

    // Generate content for each sub-chapter
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...updatedBook });
        
        // Generate content
        const content = await generateContent(subChapter.title, subChapter.description, geminiApiKey);
        subChapter.content = content;
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
  apiKeys: {gemini: string; perplexity: string},
  onProgress: (book: Book) => void
): Promise<Book> => {
  let updatedBook = { ...book };

  for (let i = 0; i < updatedBook.chapters.length; i++) {
    const chapter = updatedBook.chapters[i];
    
    // Generate chapter outline if not exists
    if (!chapter.subChapters) {
      const outline = await generateChapterOutline(chapter.title, chapter.description, apiKeys.gemini);
      chapter.subChapters = outline;
      onProgress({ ...updatedBook });
    }

    // Generate content for each sub-chapter with research
    if (chapter.subChapters) {
      for (let j = 0; j < chapter.subChapters.length; j++) {
        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...updatedBook });
        
        // Research and generate content
        const content = await researchAndGenerate(subChapter.title, subChapter.description, apiKeys);
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
  apiKeys: {gemini: string; perplexity: string},
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
        
        // Generate content with new heat level context
        const content = await generateContentWithHeatLevel(
          subChapter.title, 
          subChapter.description, 
          newHeatLevel,
          originalBook.perspective || '',
          apiKeys.gemini
        );
        
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
