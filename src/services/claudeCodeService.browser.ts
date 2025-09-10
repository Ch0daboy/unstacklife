/**
 * Browser-compatible Claude Code Service stub
 * This provides the same interface as claudeCodeService but throws appropriate errors in browser environments
 */

export const researchTopic = async (
  topic: string,
  description: string,
  isCancelledFn?: () => boolean
): Promise<string> => {
  throw new Error('Claude Code CLI is not available in browser environments. Please use external API services.');
};

export const researchAndAnalyze = async (
  topic: string,
  description: string,
  isCancelledFn?: () => boolean
): Promise<string> => {
  throw new Error('Claude Code CLI is not available in browser environments. Please use external API services.');
};

export const generateContent = async (
  title: string,
  description: string,
  isCancelledFn?: () => boolean
): Promise<string> => {
  throw new Error('Claude Code CLI is not available in browser environments. Please use external API services.');
};

export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  isCancelledFn?: () => boolean
): Promise<any[]> => {
  throw new Error('Claude Code CLI is not available in browser environments. Please use external API services.');
};

export const checkClaudeCodeAvailability = async (): Promise<boolean> => {
  return false;
};