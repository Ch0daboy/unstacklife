import { Book, BookChapter, SubChapter } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Local Content Service - Alternative to external AI APIs
 * Uses Codex CLI and Claude Code CLI for local content generation
 */

export interface LocalApiKeys {
  codex: boolean; // Indicates if Codex CLI is available
  claudeCode: boolean; // Indicates if Claude Code CLI is available
}

export const researchAndGenerate = async (
  title: string,
  description: string,
  apiKeys: LocalApiKeys,
  isCancelledFn?: () => boolean
): Promise<string> => {
  // Check if cancelled before starting research
  if (isCancelledFn && isCancelledFn()) {
    throw new Error('Generation cancelled');
  }

  let researchData = '';
  let content = '';

  try {
    // First, research the topic using Claude Code
    if (apiKeys.claudeCode) {
      console.log('🔍 Researching topic with Claude Code...');
      if (isBrowser) {
        throw new Error('Claude Code CLI not available in browser environment');
      }
      const claudeService = await import('./claudeCodeService');
      researchData = await claudeService.researchTopic(title, description, isCancelledFn);
    } else {
      console.log('⚠️ Claude Code not available, skipping research phase');
      researchData = 'Research phase skipped - Claude Code CLI not available';
    }
    
    // Check if cancelled after research
    if (isCancelledFn && isCancelledFn()) {
      throw new Error('Generation cancelled');
    }

    // Then generate content based on research using Codex
    const enhancedDescription = `${description}

Research findings:
${researchData}

Use the above research to create comprehensive, well-informed content.`;

    if (apiKeys.codex) {
      console.log('🤖 Generating content with Codex...');
      content = await codexGenerateContent(title, enhancedDescription, isCancelledFn);
    } else if (apiKeys.claudeCode) {
      console.log('🤖 Generating content with Claude Code...');
      content = await claudeGenerateContent(title, enhancedDescription, isCancelledFn);
    } else {
      throw new Error('No local AI services available. Please install Codex CLI or Claude Code CLI.');
    }

    return content;

  } catch (error: any) {
    if (error.message?.includes('cancelled')) {
      throw error;
    }
    console.error('Error in local research and generate:', error);
    throw new Error(`Local content generation failed: ${error.message}`);
  }
};

export const generateAllContent = async (
  book: Book,
  apiKeys: LocalApiKeys,
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
      console.log(`📋 Generating outline for chapter: ${chapter.title}`);
      
      if (apiKeys.codex) {
        const outline = await codexGenerateChapterOutline(chapter.title, chapter.description, isCancelledFn);
        chapter.subChapters = outline;
      } else if (apiKeys.claudeCode) {
        const outline = await claudeGenerateChapterOutline(chapter.title, chapter.description, isCancelledFn);
        chapter.subChapters = outline;
      } else {
        throw new Error('No local AI services available for chapter outline generation.');
      }
      
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
        
        console.log(`✍️ Generating content for: ${subChapter.title}`);
        
        // Generate content
        let content: string;
        if (apiKeys.codex) {
          content = await codexGenerateContent(subChapter.title, subChapter.description, isCancelledFn);
        } else if (apiKeys.claudeCode) {
          content = await claudeGenerateContent(subChapter.title, subChapter.description, isCancelledFn);
        } else {
          throw new Error('No local AI services available for content generation.');
        }
        
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...updatedBook });
        
        // Small delay to prevent overwhelming the system
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
  apiKeys: LocalApiKeys,
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
      console.log(`📋 Generating outline for chapter: ${chapter.title}`);
      
      if (apiKeys.codex) {
        const outline = await codexGenerateChapterOutline(chapter.title, chapter.description, isCancelledFn);
        chapter.subChapters = outline;
      } else if (apiKeys.claudeCode) {
        const outline = await claudeGenerateChapterOutline(chapter.title, chapter.description, isCancelledFn);
        chapter.subChapters = outline;
      } else {
        throw new Error('No local AI services available for chapter outline generation.');
      }
      
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
        
        console.log(`🔍 Researching and generating content for: ${subChapter.title}`);
        
        // Research and generate content
        const content = await researchAndGenerate(subChapter.title, subChapter.description, apiKeys, isCancelledFn);
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...updatedBook });
        
        // Longer delay for research calls
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
  apiKeys: LocalApiKeys,
  onProgress: (book: Book) => void,
  isCancelledFn?: () => boolean
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
        // Check for cancellation at subchapter level
        if (isCancelledFn && isCancelledFn()) {
          throw new Error('Generation cancelled');
        }

        const subChapter = chapter.subChapters[j];
        
        // Update status to generating
        subChapter.status = 'generating';
        onProgress({ ...newBook });
        
        console.log(`💖 Generating ${newHeatLevel} content for: ${subChapter.title}`);
        
        // Generate content with new heat level context
        let content: string;
        if (apiKeys.codex) {
          content = await codexGenerateContentWithHeatLevel(
            subChapter.title, 
            subChapter.description, 
            newHeatLevel,
            originalBook.perspective || '',
            isCancelledFn
          );
        } else if (apiKeys.claudeCode) {
          content = await claudeGenerateContentWithHeatLevel(
            subChapter.title, 
            subChapter.description, 
            newHeatLevel,
            originalBook.perspective || '',
            isCancelledFn
          );
        } else {
          throw new Error('No local AI services available for heat level content generation.');
        }
        
        subChapter.content = content;
        subChapter.status = 'completed';
        
        onProgress({ ...newBook });
        
        // Delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    chapter.status = 'completed';
    onProgress({ ...newBook });
  }

  newBook.status = 'completed';
  return newBook;
};

// Utility function to check which local AI services are available
export const checkLocalAIAvailability = async (): Promise<LocalApiKeys> => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  const availability: LocalApiKeys = {
    codex: false,
    claudeCode: false
  };

  // Check for Codex CLI
  try {
    await execAsync('codex --version', { timeout: 5000 });
    availability.codex = true;
    console.log('✅ Codex CLI is available');
  } catch (error) {
    console.log('❌ Codex CLI not found');
  }

  // Check for Claude Code CLI
  try {
    await execAsync('claude --version', { timeout: 5000 });
    availability.claudeCode = true;
    console.log('✅ Claude Code CLI is available');
  } catch (error) {
    console.log('❌ Claude Code CLI not found');
  }

  if (!availability.codex && !availability.claudeCode) {
    console.warn('⚠️ No local AI services found. Please install Codex CLI or Claude Code CLI for local content generation.');
  }

  return availability;
};

// Generate a simple book outline using local AI
export const generateLocalBookOutline = async (
  title: string,
  description: string,
  genre: string,
  perspective?: string,
  tone?: string,
  apiKeys?: LocalApiKeys,
  isCancelledFn?: () => boolean
): Promise<BookChapter[]> => {
  const availableKeys = apiKeys || await checkLocalAIAvailability();
  
  if (availableKeys.claudeCode) {
    console.log('📚 Generating book outline with Claude Code...');
    const { generateBookOutline } = await import('./claudeCodeService');
    return await generateBookOutline(title, description, genre, perspective, tone, isCancelledFn);
  } else if (availableKeys.codex) {
    console.log('📚 Generating book outline with Codex...');
    const { generateBookOutline } = await import('./codexService');
    return await generateBookOutline(title, description, genre, isCancelledFn);
  } else {
    throw new Error('No local AI services available for book outline generation. Please install Codex CLI or Claude Code CLI.');
  }
};