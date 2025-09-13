import { generateContent } from '@/services/aiServiceRouter';

// In browser-like environment, Bedrock calls are disabled and should fallback to Gemini
vi.mock('@/services/geminiService', () => ({
  generateContent: vi.fn(async () => 'Gemini content'),
}));
vi.mock('@/services/bedrockService', () => ({
  generateContent: vi.fn(async () => 'Bedrock content'),
}));

describe('aiServiceRouter (browser)', () => {
  it('falls back to Gemini when Bedrock disabled in browser', async () => {
    const { result, usedService } = await generateContent('t', 'd', {});
    expect(result).toBe('Gemini content');
    expect(usedService).toBe('gemini');
  });
});

