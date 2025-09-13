import { isLocalAIEnabled, getAICredentials } from '../config/aiConfig';
import { Book, BookChapter, SubChapter } from '../types';
import * as bedrockService from './bedrockService';
import * as geminiService from './geminiService';

// Check if we're in a browser environment where Node.js modules are not available
const isBrowser = typeof window !== 'undefined';

/**
 * AI Service Router - Routes calls to appropriate AI service based on configuration
 * Priority: Bedrock > Gemini (fallback) > Local (dev)
 */

export interface AICredentials {
  // Bedrock (primary)
  bedrock?: {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
    modelId?: string;
  };
  // Gemini (fallback)
  gemini?: string;
  // Perplexity (research)
  perplexity?: string;
}

export interface ServiceResult<T> {
  result: T;
  usedService: 'local' | 'bedrock' | 'gemini';
}

const tryBedrock = async <T>(
  operation: () => Promise<T>,
  credentials: AICredentials
): Promise<ServiceResult<T>> => {
  if (!credentials.bedrock?.accessKeyId || !credentials.bedrock?.secretAccessKey) {
    throw new Error('Bedrock credentials not available');
  }
  
  const result = await operation();
  return { result, usedService: 'bedrock' };
};

const fallbackToGemini = async <T>(
  operation: () => Promise<T>,
  credentials: AICredentials,
  originalError: Error
): Promise<ServiceResult<T>> => {
  if (!credentials.gemini) {
    throw new Error(`Bedrock failed: ${originalError.message}. Gemini fallback not available.`);
  }
  
  console.warn('Bedrock failed, falling back to Gemini:', originalError.message);
  const result = await operation();
  return { result, usedService: 'gemini' };
};

// Route to appropriate book outline service
export const generateBookOutline = async (
  prompt: string,
  genre: string,
  subGenre: string,
  targetAudience: string,
  heatLevel: string,
  perspective: string,
  author: string,
  apiKeys?: any,
  isCancelledFn?: () => boolean
): Promise<ServiceResult<Book>> => {
  if (isLocalAIEnabled() && !isBrowser) {
    try {
      // Use local AI services (only available in Node.js environments)
      const { generateLocalBookOutline } = await import('./localContentService');
      const result = await generateLocalBookOutline(prompt, genre, subGenre, targetAudience, heatLevel, perspective, author, apiKeys, isCancelledFn);
      return { result, usedService: 'local' };
    } catch (error) {
      // Fall back to cloud services if local services fail
      console.warn('Local AI services not available, falling back to cloud API:', error);
    }
  }

  // Use cloud API services (Bedrock primary, Gemini fallback)
  const credentials: AICredentials = {
    bedrock: apiKeys?.bedrock,
    gemini: apiKeys?.gemini || apiKeys,
    perplexity: apiKeys?.perplexity
  };

  try {
    return await tryBedrock(
      () => bedrockService.generateBookOutline(
        prompt, genre, subGenre, targetAudience, heatLevel, perspective, author, credentials.bedrock!
      ),
      credentials
    );
  } catch (error) {
    return await fallbackToGemini(
      () => geminiService.generateBookOutline(
        prompt, genre, subGenre, targetAudience, heatLevel, perspective, author, credentials.gemini!
      ),
      credentials,
      error as Error
    );
  }
};

// Route to appropriate chapter outline service
export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  apiKeys?: any,
  isCancelledFn?: () => boolean
): Promise<ServiceResult<SubChapter[]>> => {
  if (isLocalAIEnabled() && !isBrowser) {
    try {
      // Use local AI services (only available in Node.js environments)
      const { checkLocalAIAvailability } = await import('./localContentService');
      const availability = await checkLocalAIAvailability();
      
      if (availability.claudeCode) {
        const { generateChapterOutline: claudeGenerateChapterOutline } = await import('./claudeCodeService');
        const result = await claudeGenerateChapterOutline(chapterTitle, chapterDescription, isCancelledFn);
        return { result, usedService: 'local' };
      } else if (availability.codex) {
        const { generateChapterOutline: codexGenerateChapterOutline } = await import('./codexService');
        const result = await codexGenerateChapterOutline(chapterTitle, chapterDescription, isCancelledFn);
        return { result, usedService: 'local' };
      } else {
        throw new Error('No local AI services available for chapter outline generation.');
      }
    } catch (error) {
      // Fall back to cloud services if local services fail
      console.warn('Local AI services not available, falling back to cloud API:', error);
    }
  }

  // Use cloud API services (Bedrock primary, Gemini fallback)
  const credentials: AICredentials = {
    bedrock: apiKeys?.bedrock,
    gemini: apiKeys?.gemini || apiKeys,
    perplexity: apiKeys?.perplexity
  };

  try {
    return await tryBedrock(
      () => bedrockService.generateChapterOutline(chapterTitle, chapterDescription, credentials.bedrock!),
      credentials
    );
  } catch (error) {
    return await fallbackToGemini(
      () => geminiService.generateChapterOutline(chapterTitle, chapterDescription, credentials.gemini!),
      credentials,
      error as Error
    );
  }
};

// Route to appropriate content generation service
export const generateContent = async (
  sectionTitle: string,
  sectionDescription: string,
  apiKeys?: any,
  isCancelledFn?: () => boolean
): Promise<ServiceResult<string>> => {
  if (isLocalAIEnabled() && !isBrowser) {
    try {
      // Use local AI services (only available in Node.js environments)
      const { checkLocalAIAvailability } = await import('./localContentService');
      const availability = await checkLocalAIAvailability();
      
      if (availability.codex) {
        const { generateContent: codexGenerateContent } = await import('./codexService');
        const result = await codexGenerateContent(sectionTitle, sectionDescription, isCancelledFn);
        return { result, usedService: 'local' };
      } else if (availability.claudeCode) {
        const { generateContent: claudeGenerateContent } = await import('./claudeCodeService');
        const result = await claudeGenerateContent(sectionTitle, sectionDescription, isCancelledFn);
        return { result, usedService: 'local' };
      } else {
        throw new Error('No local AI services available for content generation.');
      }
    } catch (error) {
      // Fall back to cloud services if local services fail
      console.warn('Local AI services not available, falling back to cloud API:', error);
    }
  }

  // Use cloud API services (Bedrock primary, Gemini fallback)
  const credentials: AICredentials = {
    bedrock: apiKeys?.bedrock,
    gemini: apiKeys?.gemini || apiKeys,
    perplexity: apiKeys?.perplexity
  };

  try {
    return await tryBedrock(
      () => bedrockService.generateContent(sectionTitle, sectionDescription, credentials.bedrock!, isCancelledFn),
      credentials
    );
  } catch (error) {
    return await fallbackToGemini(
      () => geminiService.generateContent(sectionTitle, sectionDescription, credentials.gemini!, isCancelledFn),
      credentials,
      error as Error
    );
  }
};

// Route to appropriate research and content generation service
export const researchAndGenerate = async (
  title: string,
  description: string,
  apiKeys: any,
  isCancelledFn?: () => boolean
): Promise<string> => {
  if (isLocalAIEnabled() && !isBrowser) {
    try {
      // Use local AI services (only available in Node.js environments)
      const { researchAndGenerate: localResearchAndGenerate } = await import('./localContentService');
      return await localResearchAndGenerate(title, description, apiKeys, isCancelledFn);
    } catch (error) {
      // Fall back to external API if local services fail (e.g., in browser environment)
      console.warn('Local AI services not available, falling back to external API:', error);
      const { researchAndGenerate: externalResearchAndGenerate } = await import('./contentService');
      return await externalResearchAndGenerate(title, description, apiKeys, isCancelledFn);
    }
  } else {
    // Use external API services
    const { researchAndGenerate: externalResearchAndGenerate } = await import('./contentService');
    return await externalResearchAndGenerate(title, description, apiKeys, isCancelledFn);
  }
};

// Route to appropriate bulk content generation service
export const generateAllContent = async (
  book: Book,
  apiKeys: any,
  onProgress: (book: Book) => void,
  isCancelledFn?: () => boolean
): Promise<Book> => {
  if (isLocalAIEnabled() && !isBrowser) {
    try {
      // Use local AI services (only available in Node.js environments)
      const { generateAllContent: localGenerateAllContent } = await import('./localContentService');
      return await localGenerateAllContent(book, apiKeys, onProgress, isCancelledFn);
    } catch (error) {
      // Fall back to external API if local services fail (e.g., in browser environment)
      console.warn('Local AI services not available, falling back to external API:', error);
      const { generateAllContent: externalGenerateAllContent } = await import('./contentService');
      return await externalGenerateAllContent(book, apiKeys.bedrock || apiKeys.region || 'us-west-2', onProgress, isCancelledFn);
    }
  } else {
    // Use external API services
    const { generateAllContent: externalGenerateAllContent } = await import('./contentService');
    return await externalGenerateAllContent(book, apiKeys.bedrock || apiKeys.region || 'us-west-2', onProgress, isCancelledFn);
  }
};

// Route to appropriate bulk content generation with research service
export const generateAllContentWithResearch = async (
  book: Book,
  apiKeys: any,
  onProgress: (book: Book) => void,
  isCancelledFn?: () => boolean
): Promise<Book> => {
  if (isLocalAIEnabled() && !isBrowser) {
    try {
      // Use local AI services (only available in Node.js environments)
      const { generateAllContentWithResearch: localGenerateAllContentWithResearch } = await import('./localContentService');
      return await localGenerateAllContentWithResearch(book, apiKeys, onProgress, isCancelledFn);
    } catch (error) {
      // Fall back to external API if local services fail (e.g., in browser environment)
      console.warn('Local AI services not available, falling back to external API:', error);
      const { generateAllContentWithResearch: externalGenerateAllContentWithResearch } = await import('./contentService');
      return await externalGenerateAllContentWithResearch(book, apiKeys.bedrock || apiKeys.region || 'us-west-2', onProgress, isCancelledFn);
    }
  } else {
    // Use external API services
    const { generateAllContentWithResearch: externalGenerateAllContentWithResearch } = await import('./contentService');
    return await externalGenerateAllContentWithResearch(book, apiKeys.bedrock || apiKeys.region || 'us-west-2', onProgress, isCancelledFn);
  }
};

// Route to appropriate heat level content generation service
export const convertRomanceHeatLevel = async (
  originalBook: Book,
  newHeatLevel: string,
  apiKeys: any,
  onProgress: (book: Book) => void,
  isCancelledFn?: () => boolean
): Promise<Book> => {
  if (isLocalAIEnabled() && !isBrowser) {
    try {
      // Use local AI services (only available in Node.js environments)
      const { convertRomanceHeatLevel: localConvertRomanceHeatLevel } = await import('./localContentService');
      return await localConvertRomanceHeatLevel(originalBook, newHeatLevel, apiKeys, onProgress, isCancelledFn);
    } catch (error) {
      // Fall back to external API if local services fail (e.g., in browser environment)
      console.warn('Local AI services not available, falling back to external API:', error);
      const { convertRomanceHeatLevel: externalConvertRomanceHeatLevel } = await import('./contentService');
      return await externalConvertRomanceHeatLevel(originalBook, newHeatLevel, apiKeys.bedrock || apiKeys.region || 'us-west-2', onProgress, isCancelledFn);
    }
  } else {
    // Use external API services
    const { convertRomanceHeatLevel: externalConvertRomanceHeatLevel } = await import('./contentService');
    return await externalConvertRomanceHeatLevel(originalBook, newHeatLevel, apiKeys.bedrock || apiKeys.region || 'us-west-2', onProgress, isCancelledFn);
  }
};
