/**
 * Browser-compatible Codex Service stub
 * This provides the same interface as codexService but throws appropriate errors in browser environments
 */

export const generateBookOutline = async (
  title: string,
  description: string,
  genre: string,
  perspective?: string,
  tone?: string,
  isCancelledFn?: () => boolean
): Promise<any[]> => {
  throw new Error('Codex CLI is not available in browser environments. Please use external API services.');
};

export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  isCancelledFn?: () => boolean
): Promise<any[]> => {
  throw new Error('Codex CLI is not available in browser environments. Please use external API services.');
};

export const generateContent = async (
  sectionTitle: string,
  sectionDescription: string,
  isCancelledFn?: () => boolean
): Promise<string> => {
  throw new Error('Codex CLI is not available in browser environments. Please use external API services.');
};

export const generateContentWithHeatLevel = async (
  content: string,
  heatLevel: string,
  isCancelledFn?: () => boolean
): Promise<string> => {
  throw new Error('Codex CLI is not available in browser environments. Please use external API services.');
};

export const checkCodexAvailability = async (): Promise<boolean> => {
  return false;
};